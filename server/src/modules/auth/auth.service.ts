import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 微信小程序登录
   * 通过 code 换取 openid，创建或查找用户，返回 JWT
   */
  async wxLogin(code: string) {
    const openid = await this.code2openid(code);

    let user = await this.prisma.user.findUnique({ where: { openid } });

    if (!user) {
      user = await this.prisma.user.create({
        data: { openid },
      });
    }

    const token = this.jwtService.sign({
      sub: Number(user.id),
      openid: user.openid,
      type: 'user',
    });

    return { token, user: this.sanitizeUser(user) };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('用户不存在');
    return this.sanitizeUser(user);
  }

  async updateProfile(
    userId: number,
    data: { nickname?: string; avatar?: string; phone?: string },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.sanitizeUser(user);
  }

  private async code2openid(code: string): Promise<string> {
    const appid = this.configService.get('WX_APPID');
    const secret = this.configService.get('WX_SECRET');
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.errcode) {
      throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
    }

    return data.openid;
  }

  private sanitizeUser(user: any) {
    return {
      id: Number(user.id),
      nickname: user.nickname,
      avatar: user.avatar,
      phone: user.phone,
    };
  }
}

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private hashPwd(pwd: string) {
    return crypto.createHash('sha256').update(pwd).digest('hex');
  }

  /** PC 端注册 */
  async register(phone: string, password: string, nickname?: string) {
    if (!phone || !password) throw new BadRequestException('手机号和密码不能为空');
    if (password.length < 6) throw new BadRequestException('密码至少 6 位');

    const existing = await this.prisma.user.findFirst({ where: { phone } });
    if (existing) throw new BadRequestException('该手机号已注册');

    const user = await this.prisma.user.create({
      data: {
        phone,
        password: this.hashPwd(password),
        nickname: nickname || `用户${phone.slice(-4)}`,
      },
    });

    const token = this.jwtService.sign({
      sub: Number(user.id),
      phone: user.phone,
      type: 'user',
    });
    return { token, user: this.sanitizeUser(user) };
  }

  /** PC 端手机号登录 */
  async loginByPhone(phone: string, password: string) {
    if (!phone || !password) throw new BadRequestException('手机号和密码不能为空');

    const user = await this.prisma.user.findFirst({ where: { phone } });
    if (!user || !user.password) throw new UnauthorizedException('用户不存在或密码未设置');
    if (user.password !== this.hashPwd(password)) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const token = this.jwtService.sign({
      sub: Number(user.id),
      phone: user.phone,
      type: 'user',
    });
    return { token, user: this.sanitizeUser(user) };
  }

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

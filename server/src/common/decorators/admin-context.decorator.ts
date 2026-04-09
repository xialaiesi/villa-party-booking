import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 获取当前登录的管理员上下文
 * { id, role, merchantId }
 */
export const AdminCtx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return {
      id: user?.sub,
      role: user?.role,
      merchantId: user?.merchantId,
    };
  },
);

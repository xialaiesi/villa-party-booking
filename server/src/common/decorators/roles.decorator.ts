import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** 限制只有指定角色可访问该接口 */
export const Roles = (...roles: ('platform' | 'merchant')[]) =>
  SetMetadata(ROLES_KEY, roles);

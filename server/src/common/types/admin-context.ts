/** 登录的管理员上下文 */
export interface AdminContext {
  id: number;
  role: 'platform' | 'merchant';
  merchantId: number | null;
}

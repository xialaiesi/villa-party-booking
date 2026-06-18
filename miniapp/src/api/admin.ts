import { request, BASE_URL } from '../utils/request';

// ==================== 认证 ====================
export function adminLogin(username: string, password: string) {
  return request<{ token: string; admin: any }>({
    url: '/api/admin/auth/login',
    method: 'POST',
    data: { username, password },
  });
}

// ==================== 数据看板 ====================
export function getDashboardStats() {
  return request<any>({ url: '/api/admin/dashboard/stats' });
}

export function getDashboardTrend() {
  return request<any>({ url: '/api/admin/dashboard/trend' });
}

export function getDashboardOrderStatus() {
  return request<any>({ url: '/api/admin/dashboard/order-status' });
}

export function getDashboardHotVillas() {
  return request<any>({ url: '/api/admin/dashboard/hot-villas' });
}

export function getDashboardRecentOrders() {
  return request<any>({ url: '/api/admin/dashboard/recent-orders' });
}

// ==================== 别墅管理 ====================
export function getAdminVillas(params?: any) {
  return request<any>({ url: '/api/admin/villas', params });
}

export function createVilla(data: any) {
  return request<any>({ url: '/api/admin/villas', method: 'POST', data });
}

export function updateVilla(id: number, data: any) {
  return request<any>({ url: `/api/admin/villas/${id}`, method: 'PUT', data });
}

export function updateVillaStatus(id: number, status: number) {
  return request<any>({ url: `/api/admin/villas/${id}/status`, method: 'PUT', data: { status } });
}

export function getAdminCalendar(id: number, year: number, month: number) {
  return request<any>({ url: `/api/admin/villas/${id}/calendar`, params: { year, month } });
}

export function setAdminCalendar(id: number, dates: any[]) {
  return request<any>({ url: `/api/admin/villas/${id}/calendar`, method: 'PUT', data: { dates } });
}

export function getAdminVillaSlots(id: number) {
  return request<any[]>({ url: `/api/admin/villas/${id}/slots` });
}

export function setAdminVillaSlots(id: number, slots: any[]) {
  return request<any>({ url: `/api/admin/villas/${id}/slots`, method: 'PUT', data: { slots } });
}

// ==================== 实时管家会话 ====================
export function getAdminChats() {
  return request<any>({ url: '/api/admin/chat' });
}

export function getAdminChatUnread() {
  return request<any>({ url: '/api/admin/chat/unread-count' });
}

export function getAdminChatFaq() {
  return request<any>({ url: '/api/admin/chat/faq' });
}

export function getAdminChatMessages(chatId: number) {
  return request<any>({ url: `/api/admin/chat/${chatId}/messages` });
}

export function sendAdminChatMessage(chatId: number, content: string, type = 'text') {
  return request<any>({ url: `/api/admin/chat/${chatId}/messages`, method: 'POST', data: { content, type } });
}

// ==================== 订单管理 ====================
export function getAdminOrders(params?: any) {
  return request<any>({ url: '/api/admin/orders', params });
}

export function confirmDepositPaid(id: number) {
  return request<any>({ url: `/api/admin/orders/${id}/deposit-paid`, method: 'POST' });
}

export function confirmOrder(id: number) {
  return request<any>({ url: `/api/admin/orders/${id}/confirm`, method: 'POST' });
}

export function rejectOrder(id: number, reason?: string) {
  return request<any>({ url: `/api/admin/orders/${id}/reject`, method: 'POST', data: { reason } });
}

export function confirmFinalPaid(id: number) {
  return request<any>({ url: `/api/admin/orders/${id}/final-paid`, method: 'POST' });
}

export function markCheckIn(id: number, code: string) {
  return request<any>({ url: `/api/admin/orders/${id}/check-in`, method: 'POST', data: { code } });
}

export function markComplete(id: number) {
  return request<any>({ url: `/api/admin/orders/${id}/complete`, method: 'POST' });
}

// ==================== 套餐管理 ====================
export function getAdminPackages(params?: any) {
  return request<any>({ url: '/api/admin/packages', params });
}

export function createPackage(data: any) {
  return request<any>({ url: '/api/admin/packages', method: 'POST', data });
}

export function updatePackage(id: number, data: any) {
  return request<any>({ url: `/api/admin/packages/${id}`, method: 'PUT', data });
}

export function deletePackage(id: number) {
  return request<any>({ url: `/api/admin/packages/${id}`, method: 'DELETE' });
}

// ==================== 设施管理 ====================
export function getAdminFacilities() {
  return request<any>({ url: '/api/admin/facilities' });
}

export function createFacility(data: any) {
  return request<any>({ url: '/api/admin/facilities', method: 'POST', data });
}

export function updateFacility(id: number, data: any) {
  return request<any>({ url: `/api/admin/facilities/${id}`, method: 'PUT', data });
}

export function deleteFacility(id: number) {
  return request<any>({ url: `/api/admin/facilities/${id}`, method: 'DELETE' });
}

// ==================== 活动方案管理 ====================
export function getAdminActivityPlans(params?: any) {
  return request<any>({ url: '/api/admin/activity-plans', params });
}

export function createActivityPlan(data: any) {
  return request<any>({ url: '/api/admin/activity-plans', method: 'POST', data });
}

export function updateActivityPlan(id: number, data: any) {
  return request<any>({ url: `/api/admin/activity-plans/${id}`, method: 'PUT', data });
}

export function deleteActivityPlan(id: number) {
  return request<any>({ url: `/api/admin/activity-plans/${id}`, method: 'DELETE' });
}

// ==================== 氛围包管理 ====================
export function getAdminThemePacks(params?: any) {
  return request<any>({ url: '/api/admin/theme-packs', params });
}

export function createThemePack(data: any) {
  return request<any>({ url: '/api/admin/theme-packs', method: 'POST', data });
}

export function updateThemePack(id: number, data: any) {
  return request<any>({ url: `/api/admin/theme-packs/${id}`, method: 'PUT', data });
}

export function deleteThemePack(id: number) {
  return request<any>({ url: `/api/admin/theme-packs/${id}`, method: 'DELETE' });
}

// ==================== 周边服务管理 ====================
export function getAdminLocalServices(params?: any) {
  return request<any>({ url: '/api/admin/local-services', params });
}

export function createLocalService(data: any) {
  return request<any>({ url: '/api/admin/local-services', method: 'POST', data });
}

export function updateLocalService(id: number, data: any) {
  return request<any>({ url: `/api/admin/local-services/${id}`, method: 'PUT', data });
}

export function deleteLocalService(id: number) {
  return request<any>({ url: `/api/admin/local-services/${id}`, method: 'DELETE' });
}

// ==================== 限定活动管理 ====================
export function getAdminSeasonalEvents(params?: any) {
  return request<any>({ url: '/api/admin/seasonal-events', params });
}

export function createSeasonalEvent(data: any) {
  return request<any>({ url: '/api/admin/seasonal-events', method: 'POST', data });
}

export function updateSeasonalEvent(id: number, data: any) {
  return request<any>({ url: `/api/admin/seasonal-events/${id}`, method: 'PUT', data });
}

export function deleteSeasonalEvent(id: number) {
  return request<any>({ url: `/api/admin/seasonal-events/${id}`, method: 'DELETE' });
}

// ==================== 评价管理 ====================
export function getAdminReviews(params?: any) {
  return request<any>({ url: '/api/admin/reviews', params });
}

export function getPendingVideos() {
  return request<any>({ url: '/api/admin/reviews/pending-videos' });
}

export function videoReview(id: number, data: { approved: boolean; reason?: string }) {
  return request<any>({ url: `/api/admin/reviews/${id}/video-review`, method: 'POST', data });
}

export function replyReview(id: number, reply: string) {
  return request<any>({ url: `/api/admin/reviews/${id}/reply`, method: 'POST', data: { reply } });
}

export function deleteReview(id: number) {
  return request<any>({ url: `/api/admin/reviews/${id}`, method: 'DELETE' });
}

// ==================== 相册管理 ====================
export function getAdminAlbums(params?: any) {
  return request<any>({ url: '/api/admin/albums', params });
}

export function getAdminAlbumDetail(id: number) {
  return request<any>({ url: `/api/admin/albums/${id}` });
}

export function updateAlbumStatus(id: number, status: number) {
  return request<any>({ url: `/api/admin/albums/${id}/status`, method: 'PUT', data: { status } });
}

// ==================== 商家管理 ====================
export function getAdminMerchants(params?: any) {
  return request<any>({ url: '/api/admin/merchants', params });
}

export function createMerchant(data: any) {
  return request<any>({ url: '/api/admin/merchants', method: 'POST', data });
}

export function updateMerchant(id: number, data: any) {
  return request<any>({ url: `/api/admin/merchants/${id}`, method: 'PUT', data });
}

export function deleteMerchant(id: number) {
  return request<any>({ url: `/api/admin/merchants/${id}`, method: 'DELETE' });
}

export function getMyFinance() {
  return request<any>({ url: '/api/admin/merchants/my/finance' });
}

export function getMySettlements(params?: any) {
  return request<any>({ url: '/api/admin/merchants/my/settlements', params });
}

export function markSettled(id: number) {
  return request<any>({ url: `/api/admin/merchants/settlements/${id}/mark-settled`, method: 'POST' });
}

// ==================== 站点配置 ====================
export function getAdminSiteConfig() {
  return request<any>({ url: '/api/admin/site-config' });
}

export function saveAdminSiteConfig(data: any) {
  return request<any>({ url: '/api/admin/site-config', method: 'PUT', data });
}

// ==================== 流量分析 ====================
export function getAnalyticsOverview(params?: any) {
  return request<any>({ url: '/api/analytics/admin/overview', params });
}

// ==================== 消息 ====================
export function getAdminMessages(params?: any) {
  return request<any>({ url: '/api/admin/messages', params });
}

export function getAdminUnreadCount() {
  return request<any>({ url: '/api/admin/messages/unread-count' });
}

export function readAdminMessage(id: number) {
  return request<any>({ url: `/api/admin/messages/${id}/read`, method: 'POST' });
}

export function readAllAdminMessages() {
  return request<any>({ url: '/api/admin/messages/read-all', method: 'POST' });
}

// ==================== 上传 ====================
export function uploadImage(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${BASE_URL}/api/upload`,
      filePath,
      name: 'file',
      header: { Authorization: `Bearer ${uni.getStorageSync('admin_token')}` },
      success: (res: any) => {
        const data = JSON.parse(res.data);
        if (data.code === 0) resolve(data.data);
        else reject(new Error(data.message));
      },
      fail: reject,
    });
  });
}

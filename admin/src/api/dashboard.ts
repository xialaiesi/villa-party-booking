import request from '../utils/request';

export function getStats() { return request.get('/api/admin/dashboard/stats'); }
export function getTrend() { return request.get('/api/admin/dashboard/trend'); }
export function getOrderStatus() { return request.get('/api/admin/dashboard/order-status'); }
export function getHotVillas() { return request.get('/api/admin/dashboard/hot-villas'); }
export function getRecentOrders() { return request.get('/api/admin/dashboard/recent-orders'); }

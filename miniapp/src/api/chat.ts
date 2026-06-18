import { request } from '../utils/request';

/** C 端：进入/创建订单会话 */
export function getOrderChat(orderId: number) {
  return request<any>({ url: `/api/chat/order/${orderId}` });
}

/** C 端：拉取消息 */
export function getChatMessages(orderId: number) {
  return request<any>({ url: `/api/chat/order/${orderId}/messages` });
}

/** C 端：发送消息 */
export function sendChatMessage(orderId: number, content: string, type = 'text') {
  return request<any>({
    url: `/api/chat/order/${orderId}/messages`,
    method: 'POST',
    data: { content, type },
  });
}

/** C 端：未读数 */
export function getChatUnread(orderId: number) {
  return request<any>({ url: `/api/chat/order/${orderId}/unread` });
}

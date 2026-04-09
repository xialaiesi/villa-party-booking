import { request } from '../utils/request';

export function createSession() {
  return request<any>({ url: '/api/ai-planner/sessions', method: 'POST' });
}
export function getSessions() {
  return request<any[]>({ url: '/api/ai-planner/sessions' });
}
export function getMessages(sessionId: number) {
  return request<any[]>({ url: `/api/ai-planner/sessions/${sessionId}/messages` });
}
export function chat(sessionId: number, message: string) {
  return request<{ reply: string; recommendation: any }>({
    url: `/api/ai-planner/sessions/${sessionId}/chat`,
    method: 'POST',
    data: { message },
  });
}

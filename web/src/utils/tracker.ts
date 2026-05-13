import request from './request';

/** 生成或获取 session ID */
function getSessionId(): string {
  let sid = sessionStorage.getItem('_tracker_sid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('_tracker_sid', sid);
  }
  return sid;
}

/** 从 URL 中提取 UTM 参数并缓存到 sessionStorage */
function getUtmParams(): { utmSource?: string; utmCampaign?: string; utmMedium?: string } {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source');
  const campaign = params.get('utm_campaign');
  const medium = params.get('utm_medium');

  // 有新 UTM 参数时更新缓存
  if (source) sessionStorage.setItem('_utm_source', source);
  if (campaign) sessionStorage.setItem('_utm_campaign', campaign);
  if (medium) sessionStorage.setItem('_utm_medium', medium);

  return {
    utmSource: sessionStorage.getItem('_utm_source') || undefined,
    utmCampaign: sessionStorage.getItem('_utm_campaign') || undefined,
    utmMedium: sessionStorage.getItem('_utm_medium') || undefined,
  };
}

/** 记录页面浏览 */
export function trackPageView() {
  const utm = getUtmParams();
  request.post('/api/analytics/pageview', {
    url: window.location.pathname + window.location.search,
    referrer: document.referrer || undefined,
    sessionId: getSessionId(),
    ...utm,
  }).catch(() => {}); // 埋点失败不影响用户体验
}

/** 记录用户行为事件 */
export function trackEvent(
  eventType: string,
  opts?: { targetId?: number; targetType?: string; metadata?: any },
) {
  const utm = getUtmParams();
  request.post('/api/analytics/event', {
    eventType,
    targetId: opts?.targetId,
    targetType: opts?.targetType,
    sessionId: getSessionId(),
    metadata: opts?.metadata,
    ...utm,
  }).catch(() => {});
}

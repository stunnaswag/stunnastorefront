const SESSION_KEY = 'stunna_analytics_session';

function getSessionId() {
  try {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return undefined;
  }
}

export function trackEvent(eventType, details = {}) {
  if (!['page_view', 'click'].includes(eventType)) return;

  const payload = {
    event_type: eventType,
    path: window.location.pathname,
    session_id: getSessionId(),
    ...details,
  };

  fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt the storefront experience.
  });
}

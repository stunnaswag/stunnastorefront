import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../analytics';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      trackEvent('page_view');
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target.closest('[data-analytics-click]');
      if (!target) return;

      trackEvent('click', {
        target: target.getAttribute('data-analytics-click'),
        product_id: target.getAttribute('data-product-id') || undefined,
        product_slug: target.getAttribute('data-product-slug') || undefined,
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}

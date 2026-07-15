import { useEffect, useState } from 'react';

export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
    }
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia ? window.matchMedia(`(max-width: ${breakpoint - 1}px)`) : null;
    const update = () => {
      if (mediaQuery) {
        setIsMobile(mediaQuery.matches);
      } else {
        setIsMobile(window.innerWidth < breakpoint);
      }
    };

    update();
    mediaQuery?.addEventListener?.('change', update);

    return () => mediaQuery?.removeEventListener?.('change', update);
  }, [breakpoint]);

  return isMobile;
}

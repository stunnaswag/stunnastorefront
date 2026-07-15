import React, { createContext, useContext, useState, useMemo, useCallback, useRef, useEffect } from 'react';

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  // 'BOOTSTRAPPING' | 'IDLE' | 'SYSTEM_ERROR'
  const [loadingStatus, setLoadingStatus] = useState('BOOTSTRAPPING');
  const [requestCount, setRequestCount] = useState(0);

  const isInitialBoot = useRef(true);
  const mountTime = useRef(Date.now());
  const failSafeTimer = useRef(null);

  const triggerLoading = useCallback(() => {
    mountTime.current = Date.now();
    setLoadingStatus('BOOTSTRAPPING');
  }, []);

  const registerRequest = useCallback(() => {
    mountTime.current = Date.now();
    setRequestCount((currentRequestCount) => currentRequestCount + 1);
    setLoadingStatus('BOOTSTRAPPING');

    // 10-second fail-safe to prevent deadlock
    if (failSafeTimer.current) clearTimeout(failSafeTimer.current);
    failSafeTimer.current = setTimeout(() => {
      setLoadingStatus('IDLE');
      setRequestCount(0);
    }, 10000);
  }, []);

  const resolveRequest = useCallback(() => {
    setRequestCount((currentRequestCount) => {
      const nextRequestCount = Math.max(currentRequestCount - 1, 0);

      if (nextRequestCount === 0) {
        if (failSafeTimer.current) clearTimeout(failSafeTimer.current);

        if (isInitialBoot.current && window.location.pathname === '/') {
          const elapsed = Date.now() - mountTime.current;
          if (elapsed < 3000) {
            setTimeout(() => {
              setLoadingStatus('IDLE');
            }, 3000 - elapsed);
          } else {
            setLoadingStatus('IDLE');
          }
          isInitialBoot.current = false;
        } else {
          setLoadingStatus('IDLE');
        }
      }

      return nextRequestCount;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (failSafeTimer.current) clearTimeout(failSafeTimer.current);
    };
  }, []);

  const contextValue = useMemo(() => ({
    loadingStatus,
    requestCount,
    triggerLoading,
    registerRequest,
    resolveRequest,
  }), [loadingStatus, requestCount, triggerLoading, registerRequest, resolveRequest]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}

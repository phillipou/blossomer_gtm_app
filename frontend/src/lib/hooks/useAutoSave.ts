import { useEffect, useRef, useCallback } from 'react';

const useAutoSave = <T,>(
  callback: (data: T) => Promise<void>,
  data: T,
  delay = 1000
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialRenderRef = useRef(true);

  const debouncedCallback = useCallback(callback, []);

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      debouncedCallback(data);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debouncedCallback, delay]);
};

export default useAutoSave;

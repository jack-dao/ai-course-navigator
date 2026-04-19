import { useState, useCallback, useRef } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState(null);
  const timerRef = useRef(null);

  const showNotification = useCallback((message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(null);
    setTimeout(() => { setNotification({ message, type }); }, 10);
    timerRef.current = setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 3000);
  }, []);

  return { notification, showNotification };
};

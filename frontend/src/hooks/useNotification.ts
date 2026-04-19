import { useState, useCallback, useRef } from 'react';
import type { Notification } from '../types';

export const useNotification = () => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((message: string, type: Notification['type'] = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(null);
    setTimeout(() => { setNotification({ message, type }); }, 10);
    timerRef.current = setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 3000);
  }, []);

  return { notification, showNotification };
};

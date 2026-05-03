import { AlertCircle, CheckCircle } from 'lucide-react';
import type { Notification } from '../../types';

interface ToastProps {
  notification: Notification;
  className?: string;
}

const Toast = ({ notification, className = '' }: ToastProps) => (
  <div
    role="status"
    aria-live="polite"
    className={`px-8 py-4 rounded-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border animate-in slide-in-from-bottom-10 ${notification.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-ucsc-blue border-ucsc-gold'} ${className}`}
  >
    {notification.type === 'error' ? (
      <AlertCircle className="w-5 h-5" />
    ) : (
      <CheckCircle className="w-5 h-5 text-ucsc-gold" />
    )}
    <span className="font-bold text-xs tracking-tight">{notification.message}</span>
  </div>
);

export default Toast;

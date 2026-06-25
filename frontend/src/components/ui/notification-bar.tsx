'use client';

import { useEffect, useState } from 'react';
import { Bell, X, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: number;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  link?: string;
  linkText?: string;
}

export function NotificationBar() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  useEffect(() => {
    // دریافت اعلان‌ها از API (موقتاً از داده‌های mock استفاده می‌کنیم)
    const fetchNotifications = async () => {
      try {
        // TODO: بعداً این را با API واقعی جایگزین کنید
        const mockNotifications: Notification[] = [
          {
            id: 1,
            message: '۵ دارایی در انتظار ارزیابی هستند',
            type: 'info',
            link: '/dashboard/intangible/valuation/list',
            linkText: 'مشاهده'
          },
          {
            id: 2,
            message: '۲ دارایی نیاز به بازبینی دارند',
            type: 'warning',
            link: '/dashboard/intangible/screening/list',
            linkText: 'مشاهده'
          },
          {
            id: 3,
            message: 'امتیاز ارزیابی کلی: ۷۸%',
            type: 'success',
          },
        ];
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const dismissNotification = (id: number) => {
    setDismissedIds(prev => [...prev, id]);
  };

  const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  if (visibleNotifications.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'urgent': return <Bell className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'urgent': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-700';
      case 'warning': return 'text-amber-700';
      case 'urgent': return 'text-red-700';
      default: return 'text-blue-700';
    }
  };

  return (
    <div className="space-y-2">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            flex items-center justify-between gap-4 p-3 rounded-xl border
            ${getBgColor(notification.type)}
            transition-all duration-300 hover:shadow-sm
          `}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <p className={`text-sm font-medium ${getTextColor(notification.type)}`}>
              {notification.message}
            </p>
            {notification.link && (
              <Link
                href={notification.link}
                className={`text-xs font-medium underline-offset-2 hover:underline ${getTextColor(notification.type)}`}
              >
                {notification.linkText || 'مشاهده'}
              </Link>
            )}
          </div>
          <button
            onClick={() => dismissNotification(notification.id)}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      ))}
    </div>
  );
}

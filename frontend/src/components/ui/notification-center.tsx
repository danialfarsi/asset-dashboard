'use client';

import { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Clock, TrendingUp, Building2, Package, Eye, CheckCheck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  message: string;
  description?: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  link?: string;
  linkText?: string;
  time?: string;
  read?: boolean;
  icon?: any;
}

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // دریافت اعلان‌ها (mock)
    const fetchNotifications = async () => {
      try {
        // TODO: بعداً با API واقعی جایگزین کنید
        const mockNotifications: Notification[] = [
          {
            id: 1,
            message: '۵ دارایی در انتظار ارزیابی',
            description: 'دارایی‌های جدید نیاز به ارزیابی دارند',
            type: 'info',
            link: '/dashboard/intangible/valuation/list',
            linkText: 'مشاهده',
            time: '۵ دقیقه پیش',
            read: false,
            icon: Package,
          },
          {
            id: 2,
            message: '۲ دارایی نیاز به بازبینی دارند',
            description: 'بررسی مجدد این دارایی‌ها توصیه می‌شود',
            type: 'warning',
            link: '/dashboard/intangible/screening/list',
            linkText: 'مشاهده',
            time: '۱ ساعت پیش',
            read: false,
            icon: AlertCircle,
          },
          {
            id: 3,
            message: 'امتیاز ارزیابی کلی: ۷۸٪',
            description: 'نرخ تأیید دارایی‌ها در وضعیت مطلوب است',
            type: 'success',
            time: '۲ ساعت پیش',
            read: true,
            icon: TrendingUp,
          },
          {
            id: 4,
            message: 'دارایی جدید غربالگری شد',
            description: 'برند ثبت‌شده جدید به لیست اضافه شد',
            type: 'success',
            link: '/dashboard/intangible/assets',
            linkText: 'مشاهده',
            time: '۳ ساعت پیش',
            read: true,
            icon: CheckCircle,
          },
          {
            id: 5,
            message: 'یادآوری: ارزیابی مرحله ۳',
            description: 'مرحله ارزیابی دارایی‌ها را تکمیل کنید',
            type: 'urgent',
            link: '/dashboard/intangible/valuation/list',
            linkText: 'شروع ارزیابی',
            time: '۵ ساعت پیش',
            read: false,
            icon: Clock,
          },
        ];
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
    setIsOpen(false);
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' };
      case 'warning':
        return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' };
      case 'urgent':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' };
      default:
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'success': return 'موفقیت';
      case 'warning': return 'هشدار';
      case 'urgent': return 'فوری';
      default: return 'اطلاعیه';
    }
  };

  return (
    <div className="relative">
      {/* دکمه زنگوله */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* منو */}
          <div className="absolute left-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-dark-green" />
                <span className="font-bold text-gray-900">اعلانات</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {unreadCount} جدید
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    همه را خوانده‌شده علامت بزن
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* لیست اعلان‌ها */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">هیچ اعلانی وجود ندارد</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const styles = getTypeStyles(notification.type);
                  const Icon = notification.icon || Bell;
                  const isUnread = !notification.read;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`
                        relative flex items-start gap-3 p-4 border-b border-gray-50 cursor-pointer
                        hover:bg-gray-50 transition-all
                        ${isUnread ? 'bg-blue-50/30' : ''}
                      `}
                    >
                      {/* نشانگر نخوانده */}
                      {isUnread && (
                        <div className="absolute top-4 left-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      )}

                      {/* آیکون */}
                      <div className={`flex-shrink-0 p-2 rounded-full ${styles.bg} ${styles.icon}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* محتوا */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${styles.bg} ${styles.text}`}>
                            {getTypeLabel(notification.type)}
                          </span>
                        </div>
                        {notification.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-400">
                            {notification.time || 'اکنون'}
                          </span>
                          {notification.linkText && (
                            <span className="text-xs text-dark-green font-medium hover:underline flex items-center gap-0.5">
                              {notification.linkText}
                              <ChevronLeft className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/50">
              <Link
                href="/dashboard/notifications"
                className="block text-center text-xs text-gray-500 hover:text-dark-green transition-colors font-medium"
              >
                مشاهده همه اعلان‌ها
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

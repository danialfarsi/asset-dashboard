'use client';

import { useEffect, useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Clock, TrendingUp, Building2, Package, Eye, CheckCheck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  description?: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  link?: string;
  link_text?: string;
  time?: string;
  is_read?: boolean;
  created_at: string;
  icon?: any;
}

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // هر ۳۰ ثانیه یک بار چک کن
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/intangible/notifications/');
      const items = data.results || data || [];
      
      // تبدیل داده‌ها به فرمت مورد نیاز
      const formatted = items.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        description: n.message,
        type: n.type || 'info',
        link: n.link,
        link_text: n.link_text,
        is_read: n.is_read,
        created_at: n.created_at,
        icon: getIconByType(n.type),
      }));
      
      setNotifications(formatted);
      const unread = formatted.filter((n: Notification) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // در صورت خطا، از داده‌های استاتیک استفاده کن
      setNotifications(getStaticNotifications());
    } finally {
      setLoading(false);
    }
  };

  const getIconByType = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'urgent': return Clock;
      case 'info': return Bell;
      default: return Bell;
    }
  };

  const getStaticNotifications = (): Notification[] => {
    return [
      {
        id: 1,
        title: '۵ دارایی در انتظار ارزیابی',
        message: 'دارایی‌های جدید نیاز به ارزیابی دارند',
        type: 'info',
        link: '/dashboard/intangible/valuation/list',
        link_text: 'مشاهده',
        is_read: false,
        created_at: new Date(Date.now() - 300000).toISOString(),
        icon: Package,
      },
      {
        id: 2,
        title: '۲ دارایی نیاز به بازبینی دارند',
        message: 'بررسی مجدد این دارایی‌ها توصیه می‌شود',
        type: 'warning',
        link: '/dashboard/intangible/screening/list',
        link_text: 'مشاهده',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        icon: AlertCircle,
      },
      {
        id: 3,
        title: 'امتیاز ارزیابی کلی: ۷۸٪',
        message: 'نرخ تأیید دارایی‌ها در وضعیت مطلوب است',
        type: 'success',
        is_read: true,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        icon: TrendingUp,
      },
    ];
  };

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/intangible/notifications/${id}/mark_read/`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/intangible/notifications/mark_all_read/');
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diff < 1) return 'لحظاتی پیش';
    if (diff < 60) return `${diff} دقیقه پیش`;
    if (diff < 1440) return `${Math.floor(diff / 60)} ساعت پیش`;
    return `${Math.floor(diff / 1440)} روز پیش`;
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
              {loading ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-green mx-auto mb-3" />
                  <p className="text-sm">در حال بارگذاری...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">هیچ اعلانی وجود ندارد</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const styles = getTypeStyles(notification.type);
                  const Icon = notification.icon || Bell;
                  const isUnread = !notification.is_read;

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
                            {notification.title || notification.message}
                          </p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${styles.bg} ${styles.text}`}>
                            {getTypeLabel(notification.type)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-400">
                            {formatDate(notification.created_at)}
                          </span>
                          {notification.link_text && (
                            <span className="text-xs text-dark-green font-medium hover:underline flex items-center gap-0.5">
                              {notification.link_text}
                              <ChevronLeft className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>

                      {isUnread && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      )}
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
                onClick={() => setIsOpen(false)}
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

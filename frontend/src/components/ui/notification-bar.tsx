// components/ui/notification-bar.tsx

'use client';

import { useEffect, useState } from 'react';
import { Bell, X, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  link?: string;
  link_text?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBarProps {
  limit?: number;  // تعداد نوتیفیکیشن‌های نمایش داده شده
  types?: string[]; // فیلتر بر اساس نوع
  showTitle?: boolean; // نمایش عنوان
  showAllLink?: boolean; // نمایش لینک "مشاهده همه"
}

export function NotificationBar({ 
  limit = 5, 
  types = [], 
  showTitle = false,
  showAllLink = false 
}: NotificationBarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 🔥 فقط نوتیفیکیشن‌های خوانده نشده
      const { data } = await api.get('/intangible/notifications/?is_read=false');
      const items = data.results || data || [];
      
      // فیلتر بر اساس نوع (اگر مشخص شده باشد)
      let filteredItems = items;
      if (types.length > 0) {
        filteredItems = items.filter((item: any) => types.includes(item.type));
      }
      
      // محدود کردن تعداد
      const limitedItems = filteredItems.slice(0, limit);
      
      const formattedNotifications: Notification[] = limitedItems.map((item: any) => ({
        id: item.id,
        title: item.title || '',
        message: item.message || '',
        type: item.type || 'info',
        link: item.link || undefined,
        link_text: item.link_text || 'مشاهده',
        is_read: item.is_read || false,
        created_at: item.created_at || new Date().toISOString(),
      }));
      
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('خطا در دریافت اعلان‌ها');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = async (id: number) => {
    try {
      await api.post(`/intangible/notifications/${id}/mark_read/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error dismissing notification:', error);
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/intangible/notifications/mark_all_read/');
      setNotifications([]);
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications([]);
    }
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      info: 'اطلاعات',
      warning: 'هشدار',
      success: 'موفقیت',
      urgent: 'فوری',
    };
    return labels[type] || type;
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-3">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
          <div className="w-32 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return null;
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* عنوان */}
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-dark-green">اعلان‌ها</h3>
          {showAllLink && (
            <Link href="/dashboard/notifications" className="text-xs text-dark-green hover:underline">
              مشاهده همه
            </Link>
          )}
        </div>
      )}
      
      {/* دکمه علامت‌گذاری همه به عنوان خوانده شده */}
      {notifications.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={markAllAsRead}
            className="text-xs text-dark-green hover:text-medium-green font-medium transition-colors"
          >
            همه را خوانده شد علامت بزن
          </button>
        </div>
      )}
      
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            flex items-center justify-between gap-4 p-3 rounded-xl border
            ${getBgColor(notification.type)}
            transition-all duration-300 hover:shadow-sm
          `}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getBgColor(notification.type)} ${getTextColor(notification.type)}`}>
                  {getTypeLabel(notification.type)}
                </span>
                {notification.title && (
                  <span className="text-sm font-medium text-gray-800">
                    {notification.title}
                  </span>
                )}
              </div>
              <p className={`text-sm font-medium ${getTextColor(notification.type)}`}>
                {notification.message}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {notification.link && (
                  <Link
                    href={notification.link}
                    className={`text-xs font-medium underline-offset-2 hover:underline ${getTextColor(notification.type)}`}
                  >
                    {notification.link_text || 'مشاهده'}
                  </Link>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(notification.created_at).toLocaleDateString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => dismissNotification(notification.id)}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      ))}
    </div>
  );
}
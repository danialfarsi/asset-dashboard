'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';

interface Step2SponsorProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

export function Step2Sponsor({ onComplete, initialData }: Step2SponsorProps) {
  const { user } = useAuthStore();
  const [sponsor, setSponsor] = useState(initialData?.sponsor || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/auth/users/');
        const allUsers = response.data.results || response.data || [];
        // فقط کاربران با نقش org_admin و super_admin
        const admins = allUsers.filter((u: any) => 
          ['org_admin', 'super_admin'].includes(u.role)
        );
        setUsers(admins);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = () => {
    if (!sponsor) {
      alert('لطفاً حامی اجرایی را انتخاب کنید');
      return;
    }
    onComplete({ sponsor, notes, completed: true });
  };

  if (loading) {
    return <div className="text-center py-4">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۲:</strong> حامی اجرایی را انتخاب کنید. حامی باید از بین مدیران ارشد (org_admin یا super_admin) باشد.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          حامی اجرایی <span className="text-red-500">*</span>
        </label>
        <select
          value={sponsor}
          onChange={(e) => setSponsor(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">انتخاب حامی...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name || u.username} {u.last_name} ({u.role === 'super_admin' ? 'ادمین کل' : 'مدیر شرکت'})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          یادداشت
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="یادداشت‌های مربوط به تعیین حامی..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
          rows={2}
        />
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
      >
        تأیید و ادامه
      </button>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Step7ManagerProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

export function Step7Manager({ onComplete, initialData }: Step7ManagerProps) {
  const [manager, setManager] = useState(initialData?.manager || '');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/auth/users/');
        const allUsers = response.data.results || response.data || [];
        setUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = () => {
    if (!manager) {
      alert('لطفاً مدیر IAM را انتخاب کنید');
      return;
    }
    onComplete({ manager, completed: true });
  };

  if (loading) {
    return <div className="text-center py-4">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۷:</strong> مدیر واحد مجازی IAM را تعیین کنید.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          مدیر IAM <span className="text-red-500">*</span>
        </label>
        <select
          value={manager}
          onChange={(e) => setManager(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">انتخاب مدیر...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name || u.username} {u.last_name} ({u.role === 'super_admin' ? 'ادمین کل' : 'مدیر شرکت'})
            </option>
          ))}
        </select>
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

'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Step8RepresentativesProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

export function Step8Representatives({ onComplete, initialData }: Step8RepresentativesProps) {
  const [selectedUsers, setSelectedUsers] = useState<number[]>(initialData?.representatives || []);
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

  const toggleUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (selectedUsers.length === 0) {
      alert('لطفاً حداقل یک نماینده انتخاب کنید');
      return;
    }
    onComplete({ representatives: selectedUsers, completed: true });
  };

  if (loading) {
    return <div className="text-center py-4">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۸:</strong> نمایندگان IAM را برای هر واحد انتخاب کنید. این افراد مسئول کشف، ثبت و ارزش‌گذاری دارایی‌ها در واحد خود هستند.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {users.map((u) => (
          <div
            key={u.id}
            onClick={() => toggleUser(u.id)}
            className={`p-3 border-2 rounded-lg cursor-pointer transition ${
              selectedUsers.includes(u.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedUsers.includes(u.id)}
                onChange={() => toggleUser(u.id)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-800">
                  {u.first_name || u.username} {u.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {u.role === 'super_admin' ? 'ادمین کل' : u.role === 'org_admin' ? 'مدیر شرکت' : 'مدیر واحد'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500">
        {selectedUsers.length} نماینده انتخاب شده
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

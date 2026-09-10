'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Step6CommitteeProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

export function Step6Committee({ onComplete, initialData }: Step6CommitteeProps) {
  const [committeeName, setCommitteeName] = useState(initialData?.committeeName || '');
  const [chair, setChair] = useState(initialData?.chair || '');
  const [secretary, setSecretary] = useState(initialData?.secretary || '');
  const [members, setMembers] = useState<number[]>(initialData?.members || []);
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

  const toggleMember = (userId: number) => {
    setMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (!committeeName.trim()) {
      alert('لطفاً نام کمیته را وارد کنید');
      return;
    }
    if (!chair) {
      alert('لطفاً رئیس کمیته را انتخاب کنید');
      return;
    }
    if (!secretary) {
      alert('لطفاً دبیر کمیته را انتخاب کنید');
      return;
    }
    onComplete({ committeeName, chair, secretary, members, completed: true });
  };

  if (loading) {
    return <div className="text-center py-4">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۶:</strong> کمیته IAM را تشکیل دهید. اعضای کلیدی را انتخاب کنید.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">نام کمیته <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={committeeName}
          onChange={(e) => setCommitteeName(e.target.value)}
          placeholder="مثال: کمیته IAM شرکت فولاد"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رئیس کمیته <span className="text-red-500">*</span></label>
          <select
            value={chair}
            onChange={(e) => setChair(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">انتخاب رئیس...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.first_name || u.username} {u.last_name} ({u.role === 'super_admin' ? 'ادمین کل' : 'مدیر شرکت'})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">دبیر کمیته <span className="text-red-500">*</span></label>
          <select
            value={secretary}
            onChange={(e) => setSecretary(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">انتخاب دبیر...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.first_name || u.username} {u.last_name} ({u.role === 'super_admin' ? 'ادمین کل' : 'مدیر شرکت'})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">اعضای کمیته</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => toggleMember(u.id)}
              className={`p-2 border-2 rounded-lg cursor-pointer transition text-sm ${
                members.includes(u.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={members.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>{u.first_name || u.username} {u.last_name}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-500 mt-1">{members.length} عضو انتخاب شده</div>
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

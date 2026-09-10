'use client';

import { useEffect, useState } from 'react';
import { viamApi } from '@/services/viam/api';

interface StrategicPlan {
  id: number;
  title: string;
  status: 'draft' | 'approved' | 'active';
  vision: string;
  mission: string;
  strategic_goals: string[];
  start_date: string | null;
  end_date: string | null;
  created_by: number;
  created_at: string;
}

export default function StrategicPlanPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    vision: '',
    mission: '',
    strategic_goals: [''],
    start_date: '',
    end_date: '',
  });
  const [newGoal, setNewGoal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await viamApi.getStrategicPlans();
        setPlans(response.data.results || []);
      } catch (error) {
        console.error('Error fetching strategic plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const canManage = user?.role === 'super_admin' || user?.role === 'org_admin';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setFormData({ ...formData, strategic_goals: [...formData.strategic_goals, newGoal.trim()] });
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData({ ...formData, strategic_goals: formData.strategic_goals.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const goals = formData.strategic_goals.filter(g => g.trim() !== '');
    
    try {
      const payload = {
        title: formData.title,
        vision: formData.vision,
        mission: formData.mission,
        strategic_goals: goals,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };
      
      const response = await viamApi.createStrategicPlan(payload);
      setPlans([...plans, response.data]);
      setSuccess(true);
      setShowForm(false);
      setFormData({
        title: '',
        vision: '',
        mission: '',
        strategic_goals: [''],
        start_date: '',
        end_date: '',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error creating strategic plan:', err);
      setError(err.response?.data?.message || 'خطا در ایجاد برنامه استراتژیک');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'approved': 'bg-yellow-100 text-yellow-800',
      'active': 'bg-green-100 text-green-800',
    };
    const labels: { [key: string]: string } = {
      'draft': 'پیش‌نویس',
      'approved': 'تأیید شده',
      'active': 'فعال',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 rtl max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">برنامه استراتژیک IAM</h1>
          <p className="text-gray-600 text-sm mt-1">{plans.length} برنامه</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            {showForm ? 'انصراف' : '+ برنامه جدید'}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">برنامه جدید</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">✅ برنامه ایجاد شد!</div>}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="برنامه استراتژیک IAM ۱۴۰۴" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">چشم‌انداز *</label>
              <textarea name="vision" value={formData.vision} onChange={handleChange} required rows={2} placeholder="چشم‌انداز سازمان..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">رسالت *</label>
              <textarea name="mission" value={formData.mission} onChange={handleChange} required rows={2} placeholder="رسالت سازمان..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">اهداف</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="هدف جدید..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())} />
                <button type="button" onClick={addGoal} className="bg-blue-600 text-white px-4 py-2 rounded-lg">+</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.strategic_goals.map((goal, index) => (
                  goal.trim() && (
                    <span key={index} className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {goal}
                      <button type="button" onClick={() => removeGoal(index)} className="text-green-500 hover:text-red-500">×</button>
                    </span>
                  )
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ شروع</label>
                <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان</label>
                <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition disabled:opacity-50">
              {loading ? 'در حال ثبت...' : 'ایجاد برنامه'}
            </button>
          </form>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">هیچ برنامه‌ای وجود ندارد</p>
          {canManage && (
            <button onClick={() => setShowForm(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">ایجاد اولین برنامه</button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow p-6 border-r-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{plan.title}</h3>
                  <p className="text-sm text-gray-500">#{plan.id}</p>
                </div>
                {getStatusBadge(plan.status)}
              </div>
              <div className="mt-4 space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">چشم‌انداز:</span>
                  <p className="text-sm text-gray-700 mt-1">{plan.vision}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">رسالت:</span>
                  <p className="text-sm text-gray-700 mt-1">{plan.mission}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">اهداف:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {plan.strategic_goals.map((goal, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">{goal}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

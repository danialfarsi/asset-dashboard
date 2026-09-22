'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, DollarSign, Save, RefreshCw, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { JalaliDatePicker } from '@/components/ui/jalali-date-picker';
import { toJalali } from '@/lib/date-utils';

interface UnitBudget {
  id: number;
  department: number;
  department_name: string;
  department_code: string;
  start_date: string;
  end_date: string;
  period_display: string;
  amount: string;
  description: string;
  created_by_name: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export function UnitBudgetPanel() {
  const [budgets, setBudgets] = useState<UnitBudget[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // فرم
  const [deptId, setDeptId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [b, d] = await Promise.all([
        api.get('/intangible/engine/asset-development/unit-budgets/'),
        api.get('/auth/departments/'),
      ]);
      setBudgets(b.data.results || b.data || []);
      setDepartments(d.data.results || d.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!deptId || !startDate || !endDate || !amount) {
      showToast('همه فیلدها الزامی هستند', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.post('/intangible/engine/asset-development/unit-budgets/', {
        department: deptId,
        start_date: startDate,
        end_date: endDate,
        amount: parseFloat(amount),
        description,
      });
      showToast('✅ بودجه ثبت شد');
      setDeptId('');
      setStartDate('');
      setEndDate('');
      setAmount('');
      setDescription('');
      await load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'خطا در ثبت بودجه', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('این بودجه حذف شود؟')) return;
    try {
      await api.delete(`/intangible/engine/asset-development/unit-budgets/${id}/`);
      showToast('حذف شد');
      await load();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'خطا', 'error');
    }
  };

  const formatDate = (s: string | null | undefined) => {
    if (!s) return '—';
    try {
      return toJalali(s);
    } catch {
      return s;
    }
  };

  const formatMoney = (v: string | number) => {
    const n = parseFloat(String(v)) || 0;
    if (n >= 1e9) return `${(n / 1e9).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد ریال`;
    if (n >= 1e6) return `${(n / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون ریال`;
    return `${n.toLocaleString('fa-IR')} ریال`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#04241D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-6 py-3 rounded-xl shadow-lg border-2 ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {toast.msg}
          </div>
        </div>
      )}

      {/* فرم تعریف بودجه */}
      <Card className="border border-gray-200">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            تعریف بودجه برای یک واحد
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Building2 className="w-3 h-3 inline ml-1" /> واحد سازمانی
              </label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none text-sm"
              >
                <option value="">— انتخاب کنید —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                مقدار بودجه (ریال)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="مثلاً 50000000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none text-sm"
              />
              {amount && (
                <p className="text-[10px] text-gray-500 mt-1">{formatMoney(amount)}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar className="w-3 h-3 inline ml-1" /> تاریخ شروع
              </label>
              <JalaliDatePicker
                value={startDate}
                onChange={(v) => setStartDate(v)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar className="w-3 h-3 inline ml-1" /> تاریخ پایان
              </label>
              <JalaliDatePicker
                value={endDate}
                onChange={(v) => setEndDate(v)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                توضیحات (اختیاری)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none text-sm"
                placeholder="توضیح اختیاری..."
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#04241D] hover:bg-[#063028] text-white"
            >
              <Save className="w-4 h-4 ml-1" />
              {saving ? 'در حال ثبت...' : 'ثبت بودجه'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول بودجه‌ها */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">
            بودجه‌های تعریف‌شده ({budgets.length})
          </h3>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-3 h-3 ml-1" /> بروزرسانی
          </Button>
        </div>

        {budgets.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">هیچ بودجه‌ای تعریف نشده</p>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((b) => (
              <Card key={b.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-gray-800">{b.department_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                          {b.department_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                        <span>📅 {formatDate(b.start_date)} تا {formatDate(b.end_date)}</span>
                        <span>|</span>
                        <span>💰 {formatMoney(b.amount)}</span>
                      </div>
                      {b.description && (
                        <p className="text-[10px] text-gray-500 mt-1">{b.description}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(b.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 ml-1" /> حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Link2, Copy, Check, X, Building2, Mail } from 'lucide-react';

interface Step8RepresentativesProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

interface Department {
  id?: number;
  name: string;
  code: string;
  invite_token?: string;
  invite_used?: boolean;
  isNew?: boolean;
}

export function Step8Representatives({ onComplete, initialData }: Step8RepresentativesProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState<number | null>(null);

  // ═══════════════════════════════════════════════════════
  // بارگذاری واحدهای سازمان
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/auth/departments/');
        const all = res.data.results || res.data || [];
        setDepartments(
          all.map((d: any) => ({
            id: d.id,
            name: d.name,
            code: d.code,
            invite_token: d.invite_token,
            invite_used: d.invite_used,
          }))
        );
      } catch (err) {
        console.error('Load departments error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ═══════════════════════════════════════════════════════
  // افزودن واحد جدید
  // ═══════════════════════════════════════════════════════
  const addDepartment = () => {
    setDepartments([
      ...departments,
      { name: '', code: '', isNew: true },
    ]);
  };

  const updateDepartment = (index: number, field: keyof Department, value: string) => {
    const updated = [...departments];
    updated[index] = { ...updated[index], [field]: value };
    setDepartments(updated);
  };

  const removeDepartment = (index: number) => {
    const dept = departments[index];
    if (dept.id) {
      if (!confirm(`آیا مطمئنید که می‌خواهید واحد «${dept.name}» را حذف کنید؟`)) return;
    }
    setDepartments(departments.filter((_, i) => i !== index));
  };

  // ═══════════════════════════════════════════════════════
  // ذخیره واحد جدید (اولین بار)
  // ═══════════════════════════════════════════════════════
  const saveDepartment = async (index: number) => {
    const dept = departments[index];
    if (!dept.name.trim() || !dept.code.trim()) {
      alert('نام و کد واحد الزامی است');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/auth/departments/', {
        name: dept.name,
        code: dept.code,
      });

      const updated = [...departments];
      updated[index] = {
        id: res.data.id,
        name: res.data.name,
        code: res.data.code,
        invite_token: res.data.invite_token,
        invite_used: res.data.invite_used,
        isNew: false,
      };
      setDepartments(updated);
      console.log('✅ Department saved:', res.data);
    } catch (err: any) {
      console.error('Save department error:', err);
      alert(err.response?.data?.error || 'خطا در ذخیره واحد');
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // تولید لینک دعوت
  // ═══════════════════════════════════════════════════════
  const generateInvite = async (index: number) => {
    const dept = departments[index];
    if (!dept.id) {
      alert('اول واحد را ذخیره کنید');
      return;
    }

    setGeneratingInvite(dept.id);
    try {
      const res = await api.post(`/auth/departments/${dept.id}/generate-invite/`);

      const updated = [...departments];
      updated[index] = {
        ...dept,
        invite_token: res.data.invite_token,
      };
      setDepartments(updated);
      console.log('✅ Invite generated:', res.data.invite_token);
    } catch (err: any) {
      console.error('Generate invite error:', err);
      alert(err.response?.data?.error || 'خطا در تولید لینک');
    } finally {
      setGeneratingInvite(null);
    }
  };

  // ═══════════════════════════════════════════════════════
  // کپی لینک
  // ═══════════════════════════════════════════════════════
  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // ═══════════════════════════════════════════════════════
  // ارسال
  // ═══════════════════════════════════════════════════════
  const handleSubmit = () => {
    // چک کن همه واحدها ذخیره شدن
    const unsaved = departments.find(d => d.isNew);
    if (unsaved) {
      alert('لطفاً همه واحدها را ذخیره کنید');
      return;
    }

    if (departments.length === 0) {
      alert('لطفاً حداقل یک واحد تعریف کنید');
      return;
    }

    onComplete({
      departments: departments.map(d => ({ id: d.id, name: d.name, code: d.code })),
      completed: true,
    });
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۸:</strong> واحدهای سازمان خود را تعریف کنید و برای هر واحد لینک دعوت بسازید
          تا مدیران واحدها بتوانند ثبت‌نام کنند.
        </p>
      </div>

      {/* Departments List */}
      <div className="space-y-3">
        {departments.map((dept, index) => (
          <div
            key={index}
            className={`border-2 rounded-xl p-4 ${
              dept.isNew ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" />
                <span className="text-xs text-gray-500">
                  واحد {index + 1}
                  {dept.isNew && <span className="mr-2 text-yellow-600">(ذخیره نشده)</span>}
                  {!dept.isNew && dept.invite_used && (
                    <span className="mr-2 text-green-600">✅ ثبت‌نام شده</span>
                  )}
                </span>
              </div>
              <button
                onClick={() => removeDepartment(index)}
                className="text-red-500 hover:text-red-700 p-1"
                title="حذف واحد"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  نام واحد *
                </label>
                <input
                  type="text"
                  value={dept.name}
                  onChange={(e) => updateDepartment(index, 'name', e.target.value)}
                  placeholder="مثال: واحد ذوب و پالایش"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={!dept.isNew}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  کد واحد *
                </label>
                <input
                  type="text"
                  value={dept.code}
                  onChange={(e) => updateDepartment(index, 'code', e.target.value.toUpperCase())}
                  placeholder="مثال: NICICO-SMR"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  disabled={!dept.isNew}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {dept.isNew ? (
                <button
                  onClick={() => saveDepartment(index)}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                >
                  {saving ? 'در حال ذخیره...' : '💾 ذخیره واحد'}
                </button>
              ) : (
                <>
                  {!dept.invite_token || dept.invite_used ? (
                    <button
                      onClick={() => generateInvite(index)}
                      disabled={generatingInvite === dept.id || dept.invite_used}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                    >
                      <Link2 size={14} />
                      {generatingInvite === dept.id ? 'در حال تولید...' : '🔗 تولید لینک دعوت'}
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <code className="flex-1 text-xs text-gray-600 truncate">
                        {window.location.origin}/invite/{dept.invite_token?.slice(0, 16)}...
                      </code>
                      <button
                        onClick={() => copyInviteLink(dept.invite_token!)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition"
                      >
                        {copiedToken === dept.invite_token ? (
                          <>
                            <Check size={12} />
                            کپی شد!
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            کپی لینک
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      <button
        onClick={addDepartment}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
      >
        <Plus size={16} />
        افزودن واحد جدید
      </button>

      {/* Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
        💡 <strong>راهنما:</strong>
        <ul className="mt-1 space-y-0.5 mr-4 list-disc">
          <li>هر واحد یک کد منحصر بفرد دارد</li>
          <li>پس از ذخیره واحد، می‌توانید لینک دعوت بسازید</li>
          <li>لینک دعوت را به مدیر واحد بفرستید تا ثبت‌نام کند</li>
          <li>هر لینک فقط یکبار قابل استفاده است</li>
        </ul>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={departments.length === 0 || departments.some(d => d.isNew)}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition"
      >
        {departments.some(d => d.isNew)
          ? '⚠️ ابتدا واحدهای جدید را ذخیره کنید'
          : '✅ تأیید و ادامه'}
      </button>
    </div>
  );
}

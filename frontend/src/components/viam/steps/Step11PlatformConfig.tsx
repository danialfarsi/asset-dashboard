'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Step11PlatformConfigProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

const ALL_MODULES = [
  'VIAM-01 (استقرار و حکمرانی)',
  'VIAM-02 (برنامه‌ریزی استراتژیک)',
  'VIAM-03 (جریان‌سازی و فرهنگ‌سازی)',
  'VIAM-04 (توانمندسازی و گواهی)',
  'VIAM-05 (مالکیت و RACI)',
  'VIAM-06 (گردش‌کار و پرونده)',
  'VIAM-07 (کمیته و تصمیم‌گیری)',
  'VIAM-08 (استخراج دانش)',
  'VIAM-09 (ریسک و انطباق)',
  'VIAM-10 (عملکرد و بلوغ)',
  'VIAM-11 (اتصال به موتورها)',
];

const DEFAULT_MODULES = [
  'VIAM-01 (استقرار و حکمرانی)',
  'VIAM-02 (برنامه‌ریزی استراتژیک)',
  'VIAM-03 (جریان‌سازی و فرهنگ‌سازی)',
];

export function Step11PlatformConfig({ onComplete, initialData }: Step11PlatformConfigProps) {
  const [tenantName, setTenantName] = useState('');
  const [modules, setModules] = useState<string[]>(DEFAULT_MODULES);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🎯 بارگذاری از API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/intangible/viam/tenant-config/my/');
        const config = res.data.config;
        if (config) {
          setTenantName(config.tenant_name || '');
          setModules(config.enabled_modules || DEFAULT_MODULES);
          setNotes(config.notes || '');
          console.log('📥 Loaded from API');
        } else {
          console.log('📥 No config in API — using defaults');
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleModule = (module: string) => {
    setModules(prev =>
      prev.includes(module)
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  const selectAll = () => setModules(ALL_MODULES);
  const clearAll = () => setModules([]);

  const handleSubmit = async () => {
    if (!tenantName.trim()) {
      alert('لطفاً نام Tenant را وارد کنید');
      return;
    }

    setSaving(true);
    try {
      console.log('📤 Saving to DB...', {
        tenant_name: tenantName,
        enabled_modules: modules.length,
      });

      const res = await api.post('/intangible/viam/tenant-config/save/', {
        tenant_name: tenantName,
        enabled_modules: modules,
        notes: notes,
      });

      console.log('✅ Saved:', res.data);

      onComplete({
        tenantName,
        modules,
        notes,
        configId: res.data.config.id,
        completed: true,
      });
    } catch (err: any) {
      console.error('❌ Save error:', err);
      alert(err.response?.data?.error || 'خطا در ذخیره پیکربندی');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-6 text-gray-500">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۱۱:</strong> واحد IAM را در پلتفرم متا پیکربندی کنید.
        </p>
      </div>

      {/* نام Tenant */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          نام Tenant <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          placeholder="مثال: شرکت فولاد - IAM"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* ماژول‌ها */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            ماژول‌های فعال ({modules.length} از {ALL_MODULES.length})
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              انتخاب همه
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              پاک کردن
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ALL_MODULES.map((module) => (
            <div
              key={module}
              onClick={() => toggleModule(module)}
              className={`p-2 border-2 rounded-lg cursor-pointer transition text-sm ${
                modules.includes(module)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modules.includes(module)}
                  onChange={() => toggleModule(module)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>{module}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* یادداشت */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          یادداشت‌های پیکربندی
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="نکات و تنظیمات خاص پیکربندی..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
          rows={3}
        />
      </div>

      {/* دکمه ذخیره */}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition"
      >
        {saving ? 'در حال ذخیره...' : '💾 ذخیره پیکربندی در پایگاه داده و ادامه'}
      </button>
    </div>
  );
}

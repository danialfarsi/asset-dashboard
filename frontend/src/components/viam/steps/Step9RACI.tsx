'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  ACTIVITIES,
  RACI_OPTIONS,
  getRolesByBusinessType,
  DEFAULT_MATRIX_MANUFACTURING,
  type Role,
} from '@/services/viam/raci-data';

interface Step9RACIProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

interface OrgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username: string;
  role: string;
  role_display?: string;
  department_id?: number | null;
  department_name?: string | null;
}

// 🎯 نقش‌های چندکاربری (واحد-محور) — چک‌باکس
const MULTI_USER_ROLES = ['own', 'cus'];

// 🎯 حداقل تعداد activity که «کامل» حساب میشه
const MIN_COMPLETE_MATRIX = 10;

export function Step9RACI({ onComplete, initialData }: Step9RACIProps) {
  const [businessType, setBusinessType] = useState<string>('manufacturing');
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<OrgUser[]>([]);

  // 🎯 state اولیه: اولویت با initialData (localStorage)، بعد DEFAULT
  const [matrix, setMatrix] = useState<Record<string, Record<string, string>>>(() => {
    if (initialData?.matrix && Object.keys(initialData.matrix).length > 5) {
      console.log('📥 useState: Using matrix from initialData:', Object.keys(initialData.matrix).length);
      return initialData.matrix;
    }
    console.log('📥 useState: Using DEFAULT matrix (20 activities)');
    return DEFAULT_MATRIX_MANUFACTURING;
  });

  const [roleAssignments, setRoleAssignments] = useState<Record<string, any>>(() => {
    if (initialData?.roleAssignments && Object.keys(initialData.roleAssignments).length > 0) {
      return initialData.roleAssignments;
    }
    return {};
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ═══════════════════════════════════════════════════════
  // 🎯 وقتی initialData از localStorage لود شد، state رو آپدیت کن
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (initialData?.matrix && Object.keys(initialData.matrix).length > 5) {
      console.log('📥 useEffect[initialData]: Updating matrix:', Object.keys(initialData.matrix).length);
      setMatrix(initialData.matrix);
    }
    if (initialData?.roleAssignments && Object.keys(initialData.roleAssignments).length > 0) {
      console.log('📥 useEffect[initialData]: Updating assignments');
      setRoleAssignments(initialData.roleAssignments);
    }
  }, [initialData]);

  // ═══════════════════════════════════════════════════════
  // بارگذاری: API + کاربران
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. RACI template (فقط برای business_type و assignments)
        const tmplRes = await api.get('/intangible/viam/ownership/raci-template/my/');
        const tmpl = tmplRes.data.template;

        if (tmpl) {
          setBusinessType(tmpl.business_type || 'manufacturing');

          // 🎯 ماتریس API رو فقط اگه کامل بود استفاده کن
          const apiMatrixCount = tmpl.matrix ? Object.keys(tmpl.matrix).length : 0;
          if (apiMatrixCount >= MIN_COMPLETE_MATRIX) {
            console.log('📥 API: Using complete matrix from API:', apiMatrixCount);
            setMatrix(tmpl.matrix);
          } else {
            console.log('📥 API: matrix ناقص (' + apiMatrixCount + ' فعالیت). از state فعلی استفاده می‌کنم.');
          }

          // 🎯 role_assignments
          const apiRoleCount = tmpl.role_assignments ? Object.keys(tmpl.role_assignments).length : 0;
          if (apiRoleCount > 0 && (!initialData?.roleAssignments || Object.keys(initialData.roleAssignments).length === 0)) {
            console.log('📥 API: Using assignments from API');
            setRoleAssignments(tmpl.role_assignments);
          }
        }

        // 2. کاربران سازمان
        const usersRes = await api.get('/auth/users/');
        const allUsers = usersRes.data.results || usersRes.data || [];
        setUsers(allUsers);
      } catch (err) {
        console.error('Error loading RACI data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // نقش‌ها بر اساس نوع کسب‌وکار
  useEffect(() => {
    setRoles(getRolesByBusinessType(businessType));
  }, [businessType]);

  // ═══════════════════════════════════════════════════════
  // آپدیت ماتریس
  // ═══════════════════════════════════════════════════════
  const updateCell = (activity: string, role: string, value: string) => {
    setMatrix((prev) => ({
      ...prev,
      [activity]: {
        ...(prev[activity] || {}),
        [role]: value,
      },
    }));
  };

  // ═══════════════════════════════════════════════════════
  // آپدیت تخصیص — تک‌کاربری
  // ═══════════════════════════════════════════════════════
  const updateAssignment = (role: string, userId: number | '') => {
    setRoleAssignments((prev) => {
      const next = { ...prev };
      if (userId === '') {
        delete next[role];
      } else {
        next[role] = userId as number;
      }
      return next;
    });
  };

  // ═══════════════════════════════════════════════════════
  // آپدیت تخصیص — چندکاربری
  // ═══════════════════════════════════════════════════════
  const toggleMultiUser = (role: string, userId: number) => {
    setRoleAssignments((prev) => {
      const current = Array.isArray(prev[role]) ? prev[role] : [];
      const next = current.includes(userId)
        ? current.filter((id: number) => id !== userId)
        : [...current, userId];
      return { ...prev, [role]: next };
    });
  };

  // ═══════════════════════════════════════════════════════
  // ذخیره
  // ═══════════════════════════════════════════════════════
  const handleSubmit = async () => {
    // 🎯 DEBUG
    console.log('📊 State before save:', {
      matrixKeys: Object.keys(matrix).length,
      matrixSample: matrix['t1a'],
      roleKeys: Object.keys(roleAssignments).length,
      assignments: roleAssignments,
    });

    // اعتبارسنجی: نقش‌های تک‌کاربری
    const singleRoles = roles.filter((r) => !MULTI_USER_ROLES.includes(r.code));
    const missingSingle = singleRoles.filter((r) => !roleAssignments[r.code]);
    if (missingSingle.length > 0) {
      const names = missingSingle.map((r) => r.name).join('، ');
      if (!confirm(`این نقش‌ها کاربر ندارند:\n${names}\n\nادامه بدهم؟`)) return;
    }

    // اعتبارسنجی: نقش‌های چندکاربری
    const multiRoles = roles.filter((r) => MULTI_USER_ROLES.includes(r.code));
    const missingMulti = multiRoles.filter(
      (r) => !Array.isArray(roleAssignments[r.code]) || roleAssignments[r.code].length === 0
    );
    if (missingMulti.length > 0) {
      const names = missingMulti.map((r) => r.name).join('، ');
      if (!confirm(`این نقش‌ها حداقل یک کاربر ندارند:\n${names}\n\nادامه بدهم؟`)) return;
    }

    // 🎯 اعتبارسنجی ماتریس
    if (Object.keys(matrix).length < MIN_COMPLETE_MATRIX) {
      alert(`⚠️ ماتریس RACI ناقص است (${Object.keys(matrix).length} فعالیت). لطفاً صفحه را refresh کنید.`);
      return;
    }

    setSaving(true);
    try {
      const tmplRes = await api.get('/intangible/viam/ownership/raci-template/my/');
      const tmplId = tmplRes.data.template.id;

      console.log('📤 Sending matrix:', Object.keys(matrix).length, 'activities');

      await api.post(`/intangible/viam/ownership/raci-template/${tmplId}/update_matrix/`, {
        matrix,
        role_assignments: roleAssignments,
        business_type: businessType,
      });

      console.log('✅ Save successful');

      onComplete({
        businessType,
        matrix,
        roleAssignments,
        completed: true,
      });
    } catch (err: any) {
      console.error('❌ Save error:', err);
      alert(err.response?.data?.error || 'خطا در ذخیره RACI');
    } finally {
      setSaving(false);
    }
  };

  const getUserLabel = (u: OrgUser) => {
    const name = `${u.first_name || u.username} ${u.last_name || ''}`.trim();
    let role = '';
    if (u.role === 'org_admin') role = ' — مدیرعامل';
    else if (u.role === 'org_user' && u.department_name) role = ` — ${u.department_name}`;
    else if (u.role === 'org_user') role = ' — کارشناس';
    return name + role;
  };

  if (loading) {
    return <div className="text-center py-6 text-gray-500">در حال بارگذاری...</div>;
  }

  const singleRoles = roles.filter((r) => !MULTI_USER_ROLES.includes(r.code));
  const multiRoles = roles.filter((r) => MULTI_USER_ROLES.includes(r.code));
  const matrixCount = Object.keys(matrix).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۹:</strong> ماتریس RACI سازمانی را تعریف کنید.
          این ماتریس <strong>یک بار</strong> تنظیم می‌شود و برای همه دارایی‌های سازمان استفاده می‌شود.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          ماتریس فعلی: <strong>{matrixCount}</strong> از {ACTIVITIES.length} فعالیت
          {matrixCount < MIN_COMPLETE_MATRIX && (
            <span className="text-red-600 mr-2">⚠️ ناقص — لطفاً refresh کنید</span>
          )}
        </p>
      </div>

      {/* نوع کسب‌وکار */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">نوع کسب‌وکار</label>
        <select
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="manufacturing">تولیدی</option>
          <option value="service">خدماتی</option>
          <option value="rto">پژوهش و فناوری</option>
          <option value="holding">هلدینگ اقتصادی</option>
        </select>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* بخش ۱: نقش‌های سازمانی */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
          <h3 className="font-semibold text-gray-800">۱. نقش‌های سازمانی</h3>
          <p className="text-xs text-gray-500 mt-1">
            برای هر نقش، <strong>یک نفر</strong> را از کل سازمان انتخاب کنید.
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {singleRoles.map((role) => (
            <div key={role.code} className="flex items-center gap-3">
              <div className="w-20 flex-shrink-0">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                  {role.abbr}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-600 mb-1 truncate">{role.name}</div>
                <select
                  value={roleAssignments[role.code] || ''}
                  onChange={(e) =>
                    updateAssignment(role.code, e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">— انتخاب کاربر —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {getUserLabel(u)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* بخش ۲: نقش‌های واحدی */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
          <h3 className="font-semibold text-gray-800">۲. نقش‌های واحدی (چند نفر)</h3>
          <p className="text-xs text-gray-500 mt-1">
            این نقش‌ها می‌توانند <strong>چند نفر</strong> از واحدهای مختلف باشند.
          </p>
        </div>
        <div className="p-4 space-y-4">
          {multiRoles.map((role) => {
            const current = Array.isArray(roleAssignments[role.code])
              ? roleAssignments[role.code]
              : [];
            return (
              <div key={role.code}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                    {role.abbr}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{role.name}</span>
                  <span className="text-xs text-gray-500">({current.length} نفر انتخاب شده)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mr-8">
                  {users.map((u) => {
                    const checked = current.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition text-sm ${
                          checked
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMultiUser(role.code, u.id)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-xs">{getUserLabel(u)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* بخش ۳: ماتریس RACI */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
          <h3 className="font-semibold text-gray-800">۳. ماتریس RACI</h3>
          <p className="text-xs text-gray-500 mt-1">
            طبق اکسل RACI_IAM_Matrix. می‌توانید هر خانه را تغییر دهید.
          </p>
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            {RACI_OPTIONS.map((o) => (
              <span key={o.value} className={`px-2 py-0.5 rounded ${o.color}`}>
                <strong>{o.label}</strong> = {o.desc}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 p-2 text-right sticky right-0 bg-gray-100 z-10 min-w-[180px]">
                  فعالیت
                </th>
                <th className="border border-gray-200 p-2 text-center text-gray-500 min-w-[70px]">
                  موتور
                </th>
                {roles.map((role) => (
                  <th
                    key={role.code}
                    className={`border border-gray-200 p-2 text-center min-w-[60px] ${
                      MULTI_USER_ROLES.includes(role.code) ? 'bg-purple-50' : ''
                    }`}
                    title={role.name}
                  >
                    <div className="text-[10px] font-bold">{role.abbr}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACTIVITIES.map((activity) => (
                <tr key={activity.code} className="hover:bg-gray-50">
                  <td className="border border-gray-200 p-2 font-medium sticky right-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {activity.code.toUpperCase()}
                      </span>
                      <span>{activity.name}</span>
                    </div>
                  </td>
                  <td className="border border-gray-200 p-2 text-center text-[10px] text-gray-500">
                    {activity.engine}
                  </td>
                  {roles.map((role) => {
                    const val = matrix[activity.code]?.[role.code] || '';
                    return (
                      <td key={role.code} className="border border-gray-200 p-1 text-center">
                        <select
                          value={val}
                          onChange={(e) => updateCell(activity.code, role.code, e.target.value)}
                          className={`w-full px-1 py-0.5 text-xs border rounded text-center font-bold ${
                            val === 'R' ? 'bg-blue-50 border-blue-200 text-blue-800'
                            : val === 'A' ? 'bg-red-50 border-red-200 text-red-800'
                            : val === 'C' ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            : val === 'I' ? 'bg-gray-50 border-gray-200 text-gray-700'
                            : 'border-gray-200'
                          }`}
                        >
                          <option value="">—</option>
                          <option value="R">R</option>
                          <option value="A">A</option>
                          <option value="C">C</option>
                          <option value="I">I</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* دکمه ذخیره */}
      <button
        onClick={handleSubmit}
        disabled={saving || matrixCount < MIN_COMPLETE_MATRIX}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition"
      >
        {saving
          ? 'در حال ذخیره...'
          : matrixCount < MIN_COMPLETE_MATRIX
          ? `⚠️ ماتریس ناقص است (${matrixCount}/${ACTIVITIES.length})`
          : '💾 ذخیره RACI سازمانی و ادامه'}
      </button>
    </div>
  );
}

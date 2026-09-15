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
  department_id?: number | null;
  department_name?: string | null;
}

interface Department {
  id: number;
  name: string;
  code: string;
  manager?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

// 🎯 نقش‌های چندکاربری (واحد-محور)
const MULTI_USER_ROLES = ['own', 'cus'];

const MIN_COMPLETE_MATRIX = 10;

export function Step9RACI({ onComplete, initialData }: Step9RACIProps) {
  const [businessType, setBusinessType] = useState<string>('manufacturing');
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [matrix, setMatrix] = useState<Record<string, Record<string, string>>>(() => {
    if (initialData?.matrix && Object.keys(initialData.matrix).length > 5) {
      return initialData.matrix;
    }
    return DEFAULT_MATRIX_MANUFACTURING;
  });

  // 🎯 roleAssignments: 
  // - نقش‌های تک‌کاربری: { sc: 11, iam: 12 }
  // - نقش‌های واحدی: { own: { 1: 11, 2: 12 }, cus: { 1: 11, 2: 12 } }
  const [roleAssignments, setRoleAssignments] = useState<Record<string, any>>(
    initialData?.roleAssignments || {}
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ═══════════════════════════════════════════════════════
  // بارگذاری
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. RACI template
        const tmplRes = await api.get('/intangible/viam/ownership/raci-template/my/');
        const tmpl = tmplRes.data.template;
        if (tmpl) {
          setBusinessType(tmpl.business_type || 'manufacturing');
          const apiMatrixCount = tmpl.matrix ? Object.keys(tmpl.matrix).length : 0;
          if (apiMatrixCount >= MIN_COMPLETE_MATRIX) {
            setMatrix(tmpl.matrix);
          }
          const apiRoleCount = tmpl.role_assignments ? Object.keys(tmpl.role_assignments).length : 0;
          if (apiRoleCount > 0) {
            setRoleAssignments(tmpl.role_assignments);
          }
        }

        // 2. کاربران
        const usersRes = await api.get('/auth/users/');
        setUsers(usersRes.data.results || usersRes.data || []);

        // 3. واحدها (از API جدید)
        const deptsRes = await api.get('/auth/departments/my/');
        setDepartments(deptsRes.data.departments || []);
      } catch (err) {
        console.error('Error loading RACI data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setRoles(getRolesByBusinessType(businessType));
  }, [businessType]);

  // 🎯 پر کردن خودکار OWN و CUS از مدیران واحدها
  useEffect(() => {
    if (departments.length === 0) return;

    setRoleAssignments((prev) => {
      const next = { ...prev };

      MULTI_USER_ROLES.forEach((roleCode) => {
        const current = (typeof next[roleCode] === 'object' && next[roleCode] !== null)
          ? { ...next[roleCode] }
          : {};

        departments.forEach((dept) => {
          if (!current[dept.id] && dept.manager?.id) {
            current[dept.id] = dept.manager.id;
          }
        });

        next[roleCode] = current;
      });

      return next;
    });
  }, [departments]);

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
  const updateSingleAssignment = (role: string, userId: number | '') => {
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
  // آپدیت تخصیص — چندکاربری (واحدی)
  // ═══════════════════════════════════════════════════════
  const updateMultiAssignment = (role: string, deptId: number, userId: number | '') => {
    setRoleAssignments((prev) => {
      const next = { ...prev };
      const current = (typeof next[role] === 'object' && next[role] !== null) ? { ...next[role] } : {};
      if (userId === '') {
        delete current[deptId];
      } else {
        current[deptId] = userId as number;
      }
      next[role] = current;
      return next;
    });
  };

  // ═══════════════════════════════════════════════════════
  // اعتبارسنجی + ذخیره
  // ═══════════════════════════════════════════════════════
  const handleSubmit = async () => {
    // اعتبارسنجی ماتریس
    if (Object.keys(matrix).length < MIN_COMPLETE_MATRIX) {
      alert(`⚠️ ماتریس RACI ناقص است (${Object.keys(matrix).length} فعالیت)`);
      return;
    }

    // اعتبارسنجی نقش‌های تک‌کاربری
    const singleRoles = roles.filter((r) => !MULTI_USER_ROLES.includes(r.code));
    const missingSingle = singleRoles.filter((r) => !roleAssignments[r.code]);
    if (missingSingle.length > 0) {
      const names = missingSingle.map((r) => r.name).join('، ');
      if (!confirm(`این نقش‌ها کاربر ندارند:\n${names}\n\nادامه بدهم؟`)) return;
    }

    // اعتبارسنجی نقش‌های واحدی
    const multiRoles = roles.filter((r) => MULTI_USER_ROLES.includes(r.code));
    const missingMulti = multiRoles.filter((r) => {
      const assignments = roleAssignments[r.code];
      if (!assignments || typeof assignments !== 'object') return true;
      return departments.some(d => !assignments[d.id]);
    });
    if (missingMulti.length > 0) {
      const names = missingMulti.map((r) => r.name).join('، ');
      if (!confirm(`این نقش‌ها برای بعضی واحدها کاربر ندارند:\n${names}\n\nادامه بدهم؟`)) return;
    }

    setSaving(true);
    try {
      const tmplRes = await api.get('/intangible/viam/ownership/raci-template/my/');
      const tmplId = tmplRes.data.template.id;

      console.log('📤 Saving RACI:', {
        matrix: Object.keys(matrix).length,
        assignments: roleAssignments,
      });

      await api.post(`/intangible/viam/ownership/raci-template/${tmplId}/update_matrix/`, {
        matrix,
        role_assignments: roleAssignments,
        business_type: businessType,
      });

      onComplete({
        businessType,
        matrix,
        roleAssignments,
        completed: true,
      });
    } catch (err: any) {
      console.error('Save error:', err);
      alert(err.response?.data?.error || 'خطا در ذخیره RACI');
    } finally {
      setSaving(false);
    }
  };

  const getUserLabel = (u: OrgUser) => {
    const name = `${u.first_name || u.username} ${u.last_name || ''}`.trim();
    if (u.role === 'org_admin') return `${name} — مدیرعامل`;
    if (u.role === 'org_user' && u.department_name) return `${name} — ${u.department_name}`;
    if (u.role === 'org_user') return `${name} — کارشناس`;
    return name;
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
        </p>
      </div>

      {/* نوع کسب‌وکار */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">نوع کسب‌وکار</label>
        <select
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="manufacturing">تولیدی</option>
          <option value="service">خدماتی</option>
          <option value="rto">پژوهش و فناوری</option>
          <option value="holding">هلدینگ اقتصادی</option>
        </select>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* بخش ۱: نقش‌های سازمانی (تک‌کاربری) */}
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
                    updateSingleAssignment(role.code, e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
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
      {/* بخش ۲: نقش‌های واحدی (خودکار از واحدها) */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="bg-gradient-to-l from-purple-50 to-blue-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
          <h3 className="font-semibold text-gray-800">۲. نقش‌های واحدی</h3>
          <p className="text-xs text-gray-500 mt-1">
            برای هر واحد، یک نفر را انتخاب کنید. این نقش‌ها <strong>واحد-محور</strong> هستند.
          </p>
        </div>
        <div className="p-4 space-y-6">
          {multiRoles.map((role) => {
            const assignments = (typeof roleAssignments[role.code] === 'object' && roleAssignments[role.code] !== null)
              ? roleAssignments[role.code]
              : {};

            return (
              <div key={role.code}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                    {role.abbr}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{role.name}</span>
                </div>

                {departments.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                    ⚠️ هنوز واحدی تعریف نشده. ابتدا در گام ۸ واحدها را تعریف کنید.
                  </div>
                ) : (
                  <div className="space-y-2 mr-6">
                    {departments.map((dept) => (
                      <div
                        key={dept.id}
                        className={`flex items-center gap-3 p-2 border rounded-lg transition ${
                          dept.manager?.id && assignments[dept.id] === dept.manager.id
                            ? 'border-green-200 bg-green-50/30'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-800 text-sm">{dept.name}</span>
                            <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                              {dept.code}
                            </span>
                            {dept.manager?.id && assignments[dept.id] === dept.manager.id && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                ✅ خودکار از مدیر واحد
                              </span>
                            )}
                          </div>
                          {dept.manager && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              مدیر واحد: {dept.manager.name}
                            </p>
                          )}
                        </div>
                        <select
                          value={assignments[dept.id] || ''}
                          onChange={(e) =>
                            updateMultiAssignment(
                              role.code,
                              dept.id,
                              e.target.value ? Number(e.target.value) : ''
                            )
                          }
                          className="w-52 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                        >
                          <option value="">— انتخاب کاربر —</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {getUserLabel(u)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
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
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition"
      >
        {saving
          ? 'در حال ذخیره...'
          : matrixCount < MIN_COMPLETE_MATRIX
          ? `⚠️ ماتریس ناقص (${matrixCount}/${ACTIVITIES.length})`
          : '💾 ذخیره RACI سازمانی و ادامه'}
      </button>
    </div>
  );
}

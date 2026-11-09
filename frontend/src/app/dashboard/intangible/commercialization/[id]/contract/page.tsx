"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, FileText, CheckCircle, AlertTriangle, XCircle,
  Save, AlertCircle, Shield, Pen, ChevronDown, ChevronUp,
  Calendar, DollarSign, TrendingUp, Award, Info,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const toFa = (num: any): string => {
  if (num === null || num === undefined) return "—";
  return String(num).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

const MANDATORY_CLAUSES = [
  { key: "party_capacity", label: "اهلیت طرفین" },
  { key: "asset_scope", label: "دامنه دارایی" },
  { key: "exclusivity", label: "انحصار/غیرانحصار" },
  { key: "territory", label: "قلمرو" },
  { key: "duration", label: "مدت" },
  { key: "financial_structure", label: "ساختار مالی" },
  { key: "audit_right", label: "حق حسابرسی" },
  { key: "confidentiality", label: "محرمانگی" },
  { key: "improvements_ownership", label: "مالکیت بهبودها" },
  { key: "warranties", label: "تضمین‌ها" },
  { key: "termination", label: "خاتمه" },
  { key: "dispute_resolution", label: "حل اختلاف" },
  { key: "governing_law", label: "قانون حاکم" },
  { key: "force_majeure", label: "قوه قاهره" },
];

interface Contract {
  id: number;
  case: number;
  partner: number;
  partner_name: string;
  partner_detail?: any;
  status: string;
  status_display: string;
  terms: any;
  legal_checklist: Record<string, boolean>;
  legal_checklist_complete: boolean;
  negotiation_log: any[];
  signed_at: string | null;
  signed_by_name: string;
  clm_reference: string;
  warnings: string[];
  needs_exception_approval: boolean;
  exception_approved_by: string;
}

interface ShortlistPartner {
  partner_id: number;
  name: string;
  weighted_score: number;
  rank: number;
  country: string;
}

interface PaymentScheduleItem {
  id: number;
  title: string;
  due_date: string;
  amount_expected: string;
  amount_paid: string;
  status: string;
  status_display: string;
}

export default function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = use(params);
  const cid = parseInt(caseId);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [shortlistPartners, setShortlistPartners] = useState<ShortlistPartner[]>([]);
  const [shortlistApproved, setShortlistApproved] = useState(false);
  const [schedules, setSchedules] = useState<PaymentScheduleItem[]>([]);
  const [editableSchedules, setEditableSchedules] = useState<any[]>([]);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [savingSchedules, setSavingSchedules] = useState(false);

  // فرم ایجاد قرارداد
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [terms, setTerms] = useState<any>({
    royalty_rate: 5,
    duration_years: 5,
    territory: "national",
    exclusivity: true,
    total_amount: 5000000000,
    start_date: new Date().toISOString().split("T")[0],
  });

  // چک‌لیست
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [showChecklist, setShowChecklist] = useState(false);

  // امضا
  const [signedByName, setSignedByName] = useState("");
  const [clmReference, setClmReference] = useState("");

  useEffect(() => {
    fetchData();
  }, [cid]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // ۱. بارگذاری Shortlist
      const shortlistRes = await api.get(
        "/intangible/engine/commercialization/shortlists/",
        { params: { case: cid } }
      );
      const shortlistResults = shortlistRes.data.results || shortlistRes.data;
      if (shortlistResults.length > 0) {
        const sl = shortlistResults[0];
        setShortlistApproved(sl.approved_by_committee);
        const partners = (sl.partners_data || []).map((p: any) => ({
          ...p,
          rank: p.rank || 0,
        }));
        setShortlistPartners(partners.sort((a: any, b: any) => a.rank - b.rank));
        if (partners.length > 0 && !selectedPartnerId) {
          setSelectedPartnerId(partners[0].partner_id);
        }
      }

      // ۲. بارگذاری قرارداد فعلی
      const contractRes = await api.get(
        "/intangible/engine/commercialization/contracts/",
        { params: { case: cid } }
      );
      const contractResults = contractRes.data.results || contractRes.data;
      if (contractResults.length > 0) {
        const c = contractResults[0];
        setContract(c);
        setTerms(c.terms || {});
        setChecklist(c.legal_checklist || {});
        setSignedByName(c.signed_by_name || "");
        setClmReference(c.clm_reference || "");
        setSelectedPartnerId(c.partner);

        // بارگذاری PaymentSchedule
        const schRes = await api.get(
          "/intangible/engine/commercialization/payment-schedules/",
          { params: { contract: c.id } }
        );
        setSchedules(schRes.data.results || schRes.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!selectedPartnerId) {
      toast.error("لطفاً یک شریک انتخاب کنید");
      return;
    }
    if (!shortlistApproved) {
      toast.error("ابتدا Shortlist را در گام ۳ تصویب کنید");
      return;
    }
    try {
      setSaving(true);
      const { data } = await api.post(
        "/intangible/engine/commercialization/contracts/create-draft/",
        {
          case_id: cid,
          partner_id: selectedPartnerId,
          terms: terms,
        }
      );
      setContract(data);
      setChecklist(data.legal_checklist || {});
      toast.success("پیش‌نویس قرارداد ایجاد شد");
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error?.response?.data?.non_field_errors?.[0] || "خطا";
      toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setSaving(false);
    }
  };

  const toggleChecklistItem = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdateChecklist = async () => {
    if (!contract) return;
    try {
      setSaving(true);
      const { data } = await api.post(
        `/intangible/engine/commercialization/contracts/${contract.id}/update-checklist/`,
        { legal_checklist: checklist }
      );
      setContract(data);
      if (data.legal_checklist_complete) {
        toast.success("چک‌لیست کامل شد! آماده امضا");
      } else {
        toast.success("چک‌لیست به‌روزرسانی شد");
      }
    } catch {
      toast.error("خطا");
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    if (!contract) return;
    if (!contract.legal_checklist_complete) {
      toast.error("ابتدا چک‌لیست حقوقی را کامل کنید");
      return;
    }
    if (!signedByName.trim()) {
      toast.error("نام امضاکننده الزامی است");
      return;
    }
    try {
      setSaving(true);
      const { data } = await api.post(
        `/intangible/engine/commercialization/contracts/${contract.id}/sign/`,
        { signed_by_name: signedByName, clm_reference: clmReference }
      );
      setContract(data);
      toast.success("قرارداد امضا شد!");
    } catch (error: any) {
      const detail = error?.response?.data?.detail || "خطا";
      toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!contract) return;
    try {
      const { data } = await api.post(
        `/intangible/engine/commercialization/contracts/${contract.id}/generate-payment-schedule/`
      );
      toast.success(data.detail || "تقویم پرداخت ایجاد شد");
      // دوباره بارگذاری
      const schRes = await api.get(
        "/intangible/engine/commercialization/payment-schedules/",
        { params: { contract: contract.id } }
      );
      setSchedules(schRes.data.results || schRes.data || []);
    } catch {
      toast.error("خطا در تولید تقویم");
    }
  };

  const openScheduleEditor = () => {
    // ساخت تقویم پیش‌فرض برای ویرایش (۳ قسط)
    if (schedules.length > 0) {
      setEditableSchedules(schedules.map((s) => ({
        title: s.title,
        due_date: s.due_date,
        amount_expected: parseFloat(s.amount_expected),
      })));
    } else {
      const total = parseFloat(terms.total_amount) || 0;
      const count = terms.duration_years || 3;
      const perPayment = total / count;
      const today = new Date();
      const initial = [];
      for (let i = 0; i < count; i++) {
        const futureDate = new Date(today);
        futureDate.setFullYear(today.getFullYear() + i + 1);
        initial.push({
          title: `قسط ${i + 1}`,
          due_date: futureDate.toISOString().split("T")[0],
          amount_expected: perPayment,
        });
      }
      setEditableSchedules(initial);
    }
    setShowScheduleEditor(true);
  };

  const addScheduleItem = () => {
    const total = parseFloat(terms.total_amount) || 0;
    const lastItem = editableSchedules[editableSchedules.length - 1];
    const lastDate = lastItem ? new Date(lastItem.due_date) : new Date();
    const newDate = new Date(lastDate);
    newDate.setFullYear(lastDate.getFullYear() + 1);
    setEditableSchedules([
      ...editableSchedules,
      {
        title: `قسط ${editableSchedules.length + 1}`,
        due_date: newDate.toISOString().split("T")[0],
        amount_expected: 0,
      },
    ]);
  };

  const removeScheduleItem = (idx: number) => {
    setEditableSchedules(editableSchedules.filter((_, i) => i !== idx));
  };

  const updateScheduleItem = (idx: number, field: string, value: any) => {
    setEditableSchedules(editableSchedules.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  // محاسبه مبلغ باقیمانده
  const totalContractAmount = parseFloat(terms.total_amount) || 0;
  const totalScheduledAmount = editableSchedules.reduce(
    (sum, s) => sum + (parseFloat(s.amount_expected) || 0),
    0
  );
  const remainingAmount = totalContractAmount - totalScheduledAmount;
  const isBalanced = Math.abs(remainingAmount) < 1; // دقت ۱ ریال
  const isOver = remainingAmount < -1;
  const isUnder = remainingAmount > 1;

  const distributeRemaining = () => {
    if (editableSchedules.length === 0 || remainingAmount === 0) return;
    const perItem = remainingAmount / editableSchedules.length;
    setEditableSchedules(
      editableSchedules.map((item) => ({
        ...item,
        amount_expected: (parseFloat(item.amount_expected) || 0) + perItem,
      }))
    );
    toast.success(`مبلغ باقیمانده (${toFa(Math.abs(remainingAmount).toLocaleString())} ریال) بین ${editableSchedules.length} قسط تقسیم شد`);
  };

  const handleSaveSchedules = async () => {
    if (!contract) return;
    if (editableSchedules.length === 0) {
      toast.error("حداقل یک قسط اضافه کنید");
      return;
    }
    if (editableSchedules.some((s) => !s.due_date || s.amount_expected <= 0)) {
      toast.error("همه اقساط باید تاریخ و مبلغ داشته باشند");
      return;
    }

    try {
      setSavingSchedules(true);
      // حذف قبلی
      for (const sch of schedules) {
        await api.delete(`/intangible/engine/commercialization/payment-schedules/${sch.id}/`);
      }
      // ایجاد جدید
      const created = [];
      for (const item of editableSchedules) {
        const { data } = await api.post(
          "/intangible/engine/commercialization/payment-schedules/",
          {
            contract: contract.id,
            title: item.title,
            due_date: item.due_date,
            amount_expected: item.amount_expected,
            status: "pending",
          }
        );
        created.push(data);
      }
      setSchedules(created);
      setShowScheduleEditor(false);
      toast.success(`${created.length} قسط ذخیره شد`);
    } catch (error: any) {
      const detail = error?.response?.data?.detail || "خطا";
      toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setSavingSchedules(false);
    }
  };

  const handleAutoGenerate = () => {
    const total = parseFloat(terms.total_amount) || 0;
    const count = terms.duration_years || 3;
    if (total <= 0 || count <= 0) {
      toast.error("ابتدا مبلغ کل و مدت را در قرارداد تنظیم کنید");
      return;
    }
    const perPayment = total / count;
    const today = new Date();
    const generated = [];
    for (let i = 0; i < count; i++) {
      const futureDate = new Date(today);
      futureDate.setFullYear(today.getFullYear() + i + 1);
      generated.push({
        title: `قسط ${i + 1}`,
        due_date: futureDate.toISOString().split("T")[0],
        amount_expected: perPayment,
      });
    }
    setEditableSchedules(generated);
    setShowScheduleEditor(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // اگه Shortlist تصویب نشده
  if (!shortlistApproved || shortlistPartners.length === 0) {
    return (
      <div
        className="p-6 space-y-6"
        style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/intangible/commercialization/${cid}`)}
            className="p-2 hover:bg-gray-100 rounded-lg bg-white shadow-sm"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">گام ۴ — مذاکره و قرارداد</h1>
          </div>
        </div>

        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-600 mb-3" />
            <h3 className="font-bold text-lg">Shortlist آماده نیست</h3>
            <p className="text-sm text-gray-600 mt-2">
              برای شروع مذاکره، ابتدا باید Shortlist شرکا در گام ۳ تصویب شود.
            </p>
            <Button
              onClick={() => router.push(`/dashboard/intangible/commercialization/${cid}/partners`)}
              className="mt-4"
            >
              رفتن به گام ۳
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 bg-gray-50/50 min-h-screen"
      style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif" }}
    >

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/dashboard/intangible/commercialization/${cid}`)}
          className="p-2 hover:bg-gray-100 rounded-lg bg-white shadow-sm"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">گام ۴ — مذاکره و قرارداد</h1>
          <p className="text-sm text-gray-500 mt-1">
            {contract ? `قرارداد با ${contract.partner_name}` : "ایجاد پیش‌نویس قرارداد"}
          </p>
        </div>
        {contract && (
          <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium">
            {contract.status_display}
          </div>
        )}
      </div>

      {/* هشدارها */}
      {contract?.warnings && contract.warnings.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-amber-800">هشدارهای سیستم</h4>
                <ul className="text-xs text-amber-700 mt-1 space-y-1">
                  {contract.warnings.map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
                {contract.needs_exception_approval && (
                  <div className="text-xs mt-2 p-2 bg-amber-200 rounded">
                    ⚠️ نیاز به تصویب استثنا دارد
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* فرم قرارداد */}
      {!contract ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4" />
              ایجاد پیش‌نویس قرارداد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* انتخاب شریک */}
            <div>
              <label className="text-sm font-medium block mb-2">
                انتخاب شریک (از Shortlist)
              </label>
              <div className="space-y-2">
                {shortlistPartners.map((p) => (
                  <div
                    key={p.partner_id}
                    onClick={() => setSelectedPartnerId(p.partner_id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPartnerId === p.partner_id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                          #{toFa(p.rank)}
                        </span>
                        <span className="font-bold text-sm">{p.name}</span>
                        <span className="text-xs text-gray-500">{p.country}</span>
                      </div>
                      <div className="text-sm font-bold">{toFa(p.weighted_score.toFixed(0))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* شرایط قرارداد */}
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">
                  نرخ رویالتی (%)
                </label>
                <input
                  type="number"
                  value={terms.royalty_rate || 5}
                  onChange={(e) => setTerms({ ...terms, royalty_rate: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  min="0"
                  max="50"
                  step="0.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  حد مطلق: ۲۵٪ (بالاتر نیاز به تصویب استثنا)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">مدت (سال)</label>
                <input
                  type="number"
                  value={terms.duration_years || 5}
                  onChange={(e) => setTerms({ ...terms, duration_years: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  مبلغ کل قرارداد (ریال)
                </label>
                <input
                  type="number"
                  value={terms.total_amount || 5000000000}
                  onChange={(e) => setTerms({ ...terms, total_amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  min="0"
                  step="1000000"
                  dir="ltr"
                  
                />
                <p className="text-xs text-gray-500 mt-1">
                  مبلغ کل قرارداد برای تقسیم به اقساط
                </p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">قلمرو</label>
                <select
                  value={terms.territory || "national"}
                  onChange={(e) => setTerms({ ...terms, territory: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="national">ملی</option>
                  <option value="regional">منطقه‌ای</option>
                  <option value="global">جهانی</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">انحصار</label>
                <select
                  value={terms.exclusivity ? "yes" : "no"}
                  onChange={(e) => setTerms({ ...terms, exclusivity: e.target.value === "yes" })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="yes">انحصاری</option>
                  <option value="no">غیرانحصاری</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                onClick={handleCreateDraft}
                disabled={saving || !selectedPartnerId}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "در حال ایجاد..." : "ایجاد پیش‌نویس"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* شرایط قرارداد فعلی */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4" />
                شرایط قرارداد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-lg font-bold">{toFa(terms.royalty_rate || 0)}%</div>
                  <div className="text-xs text-gray-500 mt-1">نرخ رویالتی</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-lg font-bold">{toFa(terms.duration_years || 0)} سال</div>
                  <div className="text-xs text-gray-500 mt-1">مدت</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-lg font-bold">
                    {terms.territory === "national" ? "ملی" : terms.territory === "regional" ? "منطقه‌ای" : "جهانی"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">قلمرو</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-lg font-bold">
                    {terms.exclusivity ? "انحصاری" : "غیرانحصاری"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">انحصار</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* چک‌لیست ۱۴ بندی */}
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => setShowChecklist(!showChecklist)}
            >
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  چک‌لیست ۱۴ بندی حقوقی
                  {contract.legal_checklist_complete && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </span>
                <span className="text-sm font-normal text-gray-500">
                  {toFa(Object.values(checklist).filter(Boolean).length)} از ۱۴
                  {showChecklist ? <ChevronUp className="w-4 h-4 inline ml-2" /> : <ChevronDown className="w-4 h-4 inline ml-2" />}
                </span>
              </CardTitle>
            </CardHeader>
            {showChecklist && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {MANDATORY_CLAUSES.map((clause) => (
                    <label
                      key={clause.key}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        checklist[clause.key] ? "bg-green-50" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checklist[clause.key] || false}
                        onChange={() => toggleChecklistItem(clause.key)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{clause.label}</span>
                      {checklist[clause.key] && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </label>
                  ))}
                </div>

                <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
                  <Button
                    onClick={handleUpdateChecklist}
                    disabled={saving}
                    variant="outline"
                  >
                    ذخیره چک‌لیست
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* امضا */}
          {contract.legal_checklist_complete && contract.status !== "signed" && (
            <Card className="border-green-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-green-700">
                  <Pen className="w-4 h-4" />
                  آماده امضا
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      نام امضاکننده *
                    </label>
                    <input
                      type="text"
                      value={signedByName}
                      onChange={(e) => setSignedByName(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="نام و نام خانوادگی"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      شناسه CLM (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={clmReference}
                      onChange={(e) => setClmReference(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="مثلاً CLM-2024-001"
                      
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSign}
                  disabled={saving || !signedByName.trim()}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Pen className="w-4 h-4" />
                  {saving ? "در حال امضا..." : "امضای قرارداد"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* قرارداد امضا شده */}
          {contract.status === "signed" && (
            <Card className="border-green-500 border-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <div className="font-bold">قرارداد امضا شده</div>
                    <div className="text-xs text-gray-600 mt-1">
                      امضاکننده: {contract.signed_by_name}
                      {contract.clm_reference && ` • CLM: ${contract.clm_reference}`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* تقویم پرداخت */}
          {contract.status === "signed" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    تقویم پرداخت
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAutoGenerate}
                      className="text-xs"
                    >
                      🪄 پیشنهاد خودکار
                    </Button>
                    <Button
                      size="sm"
                      onClick={openScheduleEditor}
                      className="text-xs gap-1"
                    >
                      {schedules.length === 0 ? "➕ افزودن اقساط" : "✏️ ویرایش"}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showScheduleEditor ? (
                  <div className="space-y-3">
                    <div className="p-2 bg-blue-50 rounded text-xs text-blue-800 flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        تاریخ و مبلغ هر قسط را تعیین کنید. اگر با شرایط مالی تفاهم‌نامه فرق داره، اینجا ویرایش کنید.
                      </div>
                    </div>
                    <div className="space-y-2">
                      {editableSchedules.map((s, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-2 border rounded bg-white">
                          <div className="md:col-span-4">
                            <label className="text-xs text-gray-600 block mb-1">عنوان</label>
                            <input
                              type="text"
                              value={s.title}
                              onChange={(e) => updateScheduleItem(idx, "title", e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="text-xs text-gray-600 block mb-1">تاریخ سررسید</label>
                            <input
                              type="date"
                              value={s.due_date}
                              onChange={(e) => updateScheduleItem(idx, "due_date", e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm"
                              
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="text-xs text-gray-600 block mb-1">مبلغ (ریال)</label>
                            <input
                              type="number"
                              value={s.amount_expected}
                              onChange={(e) => updateScheduleItem(idx, "amount_expected", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border rounded text-sm"
                              
                            />
                          </div>
                          <div className="md:col-span-1">
                            <button
                              onClick={() => removeScheduleItem(idx)}
                              className="text-red-600 hover:bg-red-50 p-1 rounded w-full"
                              title="حذف"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* خلاصه مالی */}
                    <div className="space-y-2">
                      {/* مبلغ کل قرارداد */}
                      <div className="p-2 bg-blue-50 rounded text-sm flex justify-between">
                        <span className="text-blue-800">مبلغ کل قرارداد:</span>
                        <span className="font-bold text-blue-900">
                          {toFa(totalContractAmount.toLocaleString())} ریال
                        </span>
                      </div>

                      {/* مجموع اقساط */}
                      <div className="p-2 bg-gray-50 rounded text-sm flex justify-between">
                        <span>مجموع اقساط فعلی:</span>
                        <span className="font-bold">
                          {toFa(totalScheduledAmount.toLocaleString())} ریال
                        </span>
                      </div>

                      {/* مبلغ باقیمانده */}
                      <div className={`p-3 rounded border-2 ${
                        isBalanced ? 'bg-green-50 border-green-300' :
                        isOver ? 'bg-red-50 border-red-300' :
                        'bg-amber-50 border-amber-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isBalanced && <span className="text-green-700 text-lg">✅</span>}
                            {isOver && <span className="text-red-700 text-lg">❌</span>}
                            {isUnder && <span className="text-amber-700 text-lg">⚠️</span>}
                            <span className={`font-bold ${
                              isBalanced ? 'text-green-800' :
                              isOver ? 'text-red-800' :
                              'text-amber-800'
                            }`}>
                              {isBalanced ? 'تعادل کامل' :
                               isOver ? `اضافه: ${toFa(Math.abs(remainingAmount).toLocaleString())} ریال` :
                               `باقیمانده: ${toFa(remainingAmount.toLocaleString())} ریال`}
                            </span>
                          </div>
                          {!isBalanced && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={distributeRemaining}
                              className="text-xs"
                            >
                              {isUnder ? 'تقسیم باقیمانده' : 'کسر اضافه'}
                            </Button>
                          )}
                        </div>

                        {/* نوار پیشرفت */}
                        <div className="mt-2 w-full bg-white rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              isBalanced ? 'bg-green-500' :
                              isOver ? 'bg-red-500' : 'bg-amber-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (totalScheduledAmount / (totalContractAmount || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 mt-1 text-center">
                          {toFa(Math.round((totalScheduledAmount / (totalContractAmount || 1)) * 100))}٪ از مبلغ کل تخصیص یافته
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={addScheduleItem}>
                        ➕ افزودن قسط
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowScheduleEditor(false)}>
                        انصراف
                      </Button>
                      <Button size="sm" onClick={handleSaveSchedules} disabled={savingSchedules} className="ml-auto">
                        {savingSchedules ? "در حال ذخیره..." : "💾 ذخیره اقساط"}
                      </Button>
                    </div>
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">هنوز تقویم پرداختی تعریف نشده</p>
                    <p className="text-xs mt-1">از دکمه بالا برای افزودن اقساط استفاده کنید</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {schedules.map((sch) => (
                      <div
                        key={sch.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded text-sm hover:bg-gray-100"
                      >
                        <div>
                          <div className="font-medium">{sch.title}</div>
                          <div className="text-xs text-gray-500">
                            سررسید: {new Date(sch.due_date).toLocaleDateString("fa-IR")}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold">
                            {toFa(parseFloat(sch.amount_expected).toLocaleString())} ریال
                          </div>
                          <div className={`text-xs ${
                            sch.status === "paid" ? "text-green-600" :
                            sch.status === "overdue" ? "text-red-600" :
                            "text-gray-500"
                          }`}>
                            {sch.status_display}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 border-t text-sm flex justify-between">
                      <span className="text-gray-600">مجموع:</span>
                      <span className="font-bold">
                        {toFa(schedules.reduce((sum, s) => sum + parseFloat(s.amount_expected), 0).toLocaleString())} ریال
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

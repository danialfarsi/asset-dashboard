"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, DollarSign, AlertTriangle, CheckCircle, Clock,
  TrendingUp, TrendingDown, Plus, Save, X, Filter, Activity,
  FileText, Calendar, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const toFa = (num: any): string => {
  if (num === null || num === undefined) return "—";
  return String(num).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

interface RevenueRecord {
  id: number;
  contract: number;
  contract_partner_name: string;
  period_label: string;
  period_start: string;
  period_end: string;
  reported_revenue: string;
  calculated_revenue: string;
  variance: string;
  variance_percent: string;
  has_significant_variance: boolean;
  collected_amount: string;
  collected_at: string | null;
  bank_reference: string;
  status: string;
  status_display: string;
  extra_data: any;
  created_at: string;
}

interface Contract {
  id: number;
  partner_name: string;
  terms: any;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  calculated: "bg-blue-100 text-blue-700",
  disputed: "bg-red-100 text-red-700",
  collected: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  calculated: Activity,
  disputed: AlertTriangle,
  collected: CheckCircle,
  partial: AlertTriangle,
};

export default function RevenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = use(params);
  const cid = parseInt(caseId);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<Contract | null>(null);
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCollect, setShowCollect] = useState<RevenueRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // فرم ثبت درآمد
  const [form, setForm] = useState({
    period_label: "",
    period_start: "",
    period_end: "",
    reported_revenue: 0,
  });

  // فرم وصول
  const [collectForm, setCollectForm] = useState({
    collected_amount: 0,
    bank_reference: "",
  });

  useEffect(() => {
    fetchData();
  }, [cid]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // بارگذاری قرارداد
      const contractRes = await api.get(
        "/intangible/engine/commercialization/contracts/",
        { params: { case: cid } }
      );
      const contractResults = contractRes.data.results || contractRes.data;
      if (contractResults.length === 0) {
        setContract(null);
        setLoading(false);
        return;
      }
      const c = contractResults[0];
      setContract(c);

      // بارگذاری درآمدها
      const recordsRes = await api.get(
        "/intangible/engine/commercialization/revenue/",
        { params: { contract: c.id } }
      );
      setRecords(recordsRes.data.results || recordsRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error("خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!contract) return;
    if (!form.period_label || !form.period_start || !form.period_end) {
      toast.error("دوره، تاریخ شروع و پایان الزامی است");
      return;
    }
    if (form.reported_revenue <= 0) {
      toast.error("درآمد اعلامی باید بزرگ‌تر از صفر باشد");
      return;
    }

    try {
      setSaving(true);
      await api.post(
        "/intangible/engine/commercialization/revenue/record/",
        {
          contract_id: contract.id,
          period_label: form.period_label,
          period_start: form.period_start,
          period_end: form.period_end,
          reported_revenue: form.reported_revenue,
          extra_data: {},
        }
      );
      toast.success("درآمد ثبت شد و محاسبه مستقل انجام گرفت");
      setShowForm(false);
      setForm({ period_label: "", period_start: "", period_end: "", reported_revenue: 0 });
      fetchData();
    } catch (error: any) {
      const detail = error?.response?.data?.detail || "خطا";
      toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setSaving(false);
    }
  };

  const handleCollect = async () => {
    if (!showCollect) return;
    if (collectForm.collected_amount <= 0) {
      toast.error("مبلغ وصول‌شده باید بزرگ‌تر از صفر باشد");
      return;
    }

    try {
      setSaving(true);
      await api.post(
        `/intangible/engine/commercialization/revenue/${showCollect.id}/collect/`,
        collectForm
      );
      toast.success("وصول ثبت شد");
      setShowCollect(null);
      setCollectForm({ collected_amount: 0, bank_reference: "" });
      fetchData();
    } catch (error: any) {
      const detail = error?.response?.data?.detail || "خطا";
      toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // اگه قرارداد نیست
  if (!contract) {
    return (
      <div className="p-6 space-y-6" style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/intangible/commercialization/${cid}`)}
            className="p-2 hover:bg-gray-100 rounded-lg bg-white shadow-sm"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">گام ۵ — وصول درآمد</h1>
        </div>
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-600 mb-3" />
            <h3 className="font-bold text-lg">قرارداد امضا نشده</h3>
            <p className="text-sm text-gray-600 mt-2">
              برای ثبت درآمد، ابتدا باید قرارداد در گام ۴ امضا شود.
            </p>
            <Button
              onClick={() => router.push(`/dashboard/intangible/commercialization/${cid}/contract`)}
              className="mt-4"
            >
              رفتن به گام ۴
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // محاسبه آمار
  const totalReported = records.reduce((s, r) => s + parseFloat(r.reported_revenue), 0);
  const totalCalculated = records.reduce((s, r) => s + parseFloat(r.calculated_revenue), 0);
  const totalCollected = records.reduce((s, r) => s + parseFloat(r.collected_amount), 0);
  const collectionRate = totalCalculated > 0 ? (totalCollected / totalCalculated * 100) : 0;
  const disputedCount = records.filter((r) => r.status === "disputed").length;

  // ارزش کل قرارداد (از پیش‌بینی)
  const expectedTotal = parseFloat(contract.terms.total_amount) || 0;

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
          <h1 className="text-2xl font-bold">گام ۵ — وصول درآمد</h1>
          <p className="text-sm text-gray-500 mt-1">
            قرارداد با {contract.partner_name} • رویالتی {toFa(contract.terms.royalty_rate)}٪
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          ثبت درآمد دوره
        </Button>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <FileText className="w-4 h-4" />
              ارزش کل قرارداد
            </div>
            <div className="font-bold mt-1 text-sm">
              {toFa(expectedTotal.toLocaleString())} ریال
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <DollarSign className="w-4 h-4" />
              درآمد محاسبه‌شده
            </div>
            <div className="font-bold mt-1 text-sm">
              {toFa(totalCalculated.toLocaleString())} ریال
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <CheckCircle className="w-4 h-4" />
              وصول‌شده
            </div>
            <div className="font-bold mt-1 text-sm text-green-600">
              {toFa(totalCollected.toLocaleString())} ریال
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              {collectionRate >= 90 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              نرخ وصول
            </div>
            <div className={`font-bold mt-1 text-sm ${
              collectionRate >= 90 ? "text-green-600" :
              collectionRate >= 70 ? "text-amber-600" : "text-red-600"
            }`}>
              {toFa(collectionRate.toFixed(1))}٪
            </div>
          </CardContent>
        </Card>
      </div>

      {/* هشدار مغایرت */}
      {disputedCount > 0 && (
        <Card className="border-red-300 bg-red-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-red-800">
                {toFa(disputedCount)} مغایرت معنادار
              </div>
              <div className="text-xs text-red-700 mt-1">
                درآمد اعلامی شریک با محاسبه مستقل سیستم تفاوت زیاد دارد. لطفاً بررسی کنید.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* فرم ثبت درآمد */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                ثبت درآمد دوره
              </span>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2 bg-blue-50 rounded text-xs text-blue-800">
              💡 سیستم به صورت خودکار رویالتی رو محاسبه می‌کنه و با اعلام شریک مقایسه می‌کنه.
              نرخ رویالتی: {toFa(contract.terms.royalty_rate)}٪
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">عنوان دوره *</label>
                <input
                  type="text"
                  placeholder="مثلاً ۱۴۰۳-Q۱"
                  value={form.period_label}
                  onChange={(e) => setForm({ ...form, period_label: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">تاریخ شروع *</label>
                <input
                  type="date"
                  value={form.period_start}
                  onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">تاریخ پایان *</label>
                <input
                  type="date"
                  value={form.period_end}
                  onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                درآمد اعلامی شریک (ریال) *
              </label>
              <input
                type="number"
                value={form.reported_revenue}
                onChange={(e) => setForm({ ...form, reported_revenue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded"
                min="0"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                مبلغی که شریک اعلام کرده. سیستم به‌طور مستقل رویالتی رو محاسبه می‌کند.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>انصراف</Button>
              <Button onClick={handleAddRecord} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? "در حال ثبت..." : "ثبت و محاسبه"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* فرم وصول */}
      {showCollect && (
        <Card className="border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                ثبت وصول — {showCollect.period_label}
              </span>
              <button onClick={() => setShowCollect(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">
                  مبلغ وصول‌شده (ریال) *
                </label>
                <input
                  type="number"
                  value={collectForm.collected_amount}
                  onChange={(e) => setCollectForm({ ...collectForm, collected_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded"
                  min="0"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1">
                  محاسبه‌شده: {toFa(parseFloat(showCollect.calculated_revenue).toLocaleString())} ریال
                </p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">مرجع بانکی</label>
                <input
                  type="text"
                  value={collectForm.bank_reference}
                  onChange={(e) => setCollectForm({ ...collectForm, bank_reference: e.target.value })}
                  placeholder="شماره تراکنش، تاریخ"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCollect(null)}>انصراف</Button>
              <Button onClick={handleCollect} disabled={saving} className="gap-2 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4" />
                {saving ? "در حال ثبت..." : "ثبت وصول"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* لیست درآمدها */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              درآمدهای دوره‌ای ({toFa(records.length)})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>هنوز درآمدی ثبت نشده</p>
              <Button onClick={() => setShowForm(true)} className="mt-3 gap-2" size="sm">
                <Plus className="w-4 h-4" />
                ثبت اولین درآمد
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r) => {
                const StatusIcon = STATUS_ICONS[r.status] || Clock;
                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-lg border ${
                      r.has_significant_variance ? "bg-red-50 border-red-300" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{r.period_label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${STATUS_COLORS[r.status]}`}>
                            <StatusIcon className="w-3 h-3" />
                            {r.status_display}
                          </span>
                          {r.has_significant_variance && (
                            <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">
                              ⚠️ مغایرت
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(r.period_start).toLocaleDateString("fa-IR")} تا{" "}
                          {new Date(r.period_end).toLocaleDateString("fa-IR")}
                        </div>
                      </div>
                      {r.status !== "collected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowCollect(r);
                            setCollectForm({
                              collected_amount: parseFloat(r.calculated_revenue),
                              bank_reference: "",
                            });
                          }}
                          className="text-xs gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          ثبت وصول
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-500">اعلامی شریک</div>
                        <div className="font-bold">{toFa(parseFloat(r.reported_revenue).toLocaleString())}</div>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <div className="text-xs text-gray-500">محاسبه سیستم</div>
                        <div className="font-bold text-blue-700">{toFa(parseFloat(r.calculated_revenue).toLocaleString())}</div>
                      </div>
                      <div className={`p-2 rounded ${r.has_significant_variance ? "bg-red-100" : "bg-gray-50"}`}>
                        <div className="text-xs text-gray-500">مغایرت</div>
                        <div className={`font-bold ${r.has_significant_variance ? "text-red-700" : ""}`}>
                          {toFa(parseFloat(r.variance).toLocaleString())}
                          {r.variance_percent && (
                            <span className="text-xs mr-1">({toFa(parseFloat(r.variance_percent).toFixed(1))}٪)</span>
                          )}
                        </div>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <div className="text-xs text-gray-500">وصول‌شده</div>
                        <div className="font-bold text-green-700">{toFa(parseFloat(r.collected_amount).toLocaleString())}</div>
                        {r.bank_reference && (
                          <div className="text-[10px] text-gray-500 mt-0.5">{r.bank_reference}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

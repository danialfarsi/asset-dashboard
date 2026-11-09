"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Search, Users, CheckCircle, XCircle, AlertTriangle,
  FileSignature, Award, Ban, Filter, Star, ShieldCheck, X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const toFa = (num: any): string => {
  if (num === null || num === undefined) return "—";
  return String(num).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
};

const PARTNER_TYPES = [
  { value: "", label: "همه انواع" },
  { value: "licensee", label: "مجوزگیرنده" },
  { value: "jv", label: "شریک JV" },
  { value: "acquirer", label: "خریدار کامل" },
  { value: "franchisee", label: "فرنچایزگیرنده" },
  { value: "service_consumer", label: "مصرف‌کننده خدمات" },
];

interface PartnerCandidate {
  partner_id: number;
  name: string;
  partner_type: string;
  weighted_score: number;
  country: string;
  rank?: number;
}

interface RejectedPartner {
  partner_id: number;
  name: string;
  reasons: string[];
}

interface ShortlistState {
  id?: number;
  case: number;
  partners_data: PartnerCandidate[];
  rejected_partners: RejectedPartner[];
  nda_required: boolean;
  nda_signed: boolean;
  nda_signed_at: string | null;
  nda_signed_with: number[];
  approved_by_committee: boolean;
  approved_at: string | null;
}

export default function PartnersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = use(params);
  const cid = parseInt(caseId);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shortlist, setShortlist] = useState<ShortlistState | null>(null);

  // فرم جستجو
  const [partnerType, setPartnerType] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [minScore, setMinScore] = useState(60);

  // نتایج
  const [candidates, setCandidates] = useState<PartnerCandidate[]>([]);
  const [rejected, setRejected] = useState<RejectedPartner[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showRejected, setShowRejected] = useState(false);

  useEffect(() => {
    loadShortlist();
  }, [cid]);

  const loadShortlist = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        "/intangible/engine/commercialization/shortlists/",
        { params: { case: cid } }
      );
      const results = data.results || data;
      if (results.length > 0) {
        const sl = results[0];
        setShortlist(sl);
        setCandidates(sl.partners_data || []);
        setRejected(sl.rejected_partners || []);
        if (sl.partners_data) {
          setSelected(new Set(sl.partners_data.map((p: PartnerCandidate) => p.partner_id)));
        }
      } else {
        setShortlist({
          case: cid,
          partners_data: [],
          rejected_partners: [],
          nda_required: true,
          nda_signed: false,
          nda_signed_at: null,
          nda_signed_with: [],
          approved_by_committee: false,
          approved_at: null,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("خطا در بارگذاری Shortlist");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      const { data } = await api.post(
        "/intangible/engine/commercialization/shortlists/search/",
        {
          partner_type: partnerType,
          country,
          industry,
          min_score: minScore,
        }
      );
      setCandidates(data.candidates || []);
      setRejected(data.rejected || []);
      // پاک کردن انتخاب‌های قبلی
      setSelected(new Set());
      toast.success(`${(data.candidates || []).length} شریک واجد شرایط یافت شد`);
    } catch (error: any) {
      console.error(error);
      toast.error("خطا در جستجو");
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (partnerId: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(partnerId)) {
      newSelected.delete(partnerId);
    } else {
      if (newSelected.size >= 7) {
        toast.error("حداکثر ۷ شریک در Shortlist");
        return;
      }
      newSelected.add(partnerId);
    }
    setSelected(newSelected);
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      toast.error("حداقل یک شریک انتخاب کنید");
      return;
    }

    try {
      setSaving(true);
      const selectedPartners = candidates
        .filter((c) => selected.has(c.partner_id))
        .map((c, idx) => ({ ...c, rank: idx + 1 }));

      const { data } = await api.post(
        "/intangible/engine/commercialization/shortlists/save/",
        {
          case_id: cid,
          partners_data: selectedPartners,
          rejected: rejected,
        }
      );
      setShortlist(data);
      toast.success(`Shortlist با ${selectedPartners.length} شریک ذخیره شد`);
    } catch (error: any) {
      console.error(error);
      const detail = error?.response?.data?.detail || "خطا";
      toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!shortlist?.id) {
      toast.error("ابتدا Shortlist را ذخیره کنید");
      return;
    }
    if (!confirm("Shortlist توسط کمیته تصویب شود؟")) return;

    try {
      await api.post(
        `/intangible/engine/commercialization/shortlists/${shortlist.id}/approve/`
      );
      toast.success("Shortlist تصویب شد");
      loadShortlist();
    } catch {
      toast.error("خطا در تصویب");
    }
  };

  const handleSignNDA = async (partnerId: number) => {
    if (!shortlist?.id) {
      toast.error("ابتدا Shortlist را ذخیره کنید");
      return;
    }
    try {
      await api.post(
        `/intangible/engine/commercialization/shortlists/${shortlist.id}/sign-nda/`,
        { partner_id: partnerId }
      );
      toast.success("NDA ثبت شد");
      loadShortlist();
    } catch (error: any) {
      const detail = error?.response?.data?.detail || "خطا";
      toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isSaved = !!shortlist?.id && shortlist.partners_data?.length > 0;

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
          <h1 className="text-2xl font-bold">گام ۳ — شناسایی و ارزیابی شرکا</h1>
          <p className="text-sm text-gray-500 mt-1">
            جستجو در پایگاه، امتیازدهی، فیلتر blacklist، ذخیره Shortlist
          </p>
        </div>
        {shortlist?.approved_by_committee && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4" />
            تصویب‌شده توسط کمیته
          </div>
        )}
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4" />
            جستجو در پایگاه شرکا
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                نوع شریک
              </label>
              <select
                value={partnerType}
                onChange={(e) => setPartnerType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {PARTNER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                کشور
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="مثلاً: ایران"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                صنعت
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="مثلاً: فناوری"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1 flex items-center justify-between">
                <span>حداقل امتیاز</span>
                <span className="text-blue-600 font-bold">{toFa(minScore)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              {searching ? "در حال جستجو..." : "جستجو"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rejected Partners (Blacklist) */}
      {rejected.length > 0 && (
        <Card className="border-red-200">
          <CardHeader
            className="cursor-pointer hover:bg-red-50"
            onClick={() => setShowRejected(!showRejected)}
          >
            <CardTitle className="flex items-center gap-2 text-base text-red-700">
              <Ban className="w-4 h-4" />
              شرکای حذف‌شده ({toFa(rejected.length)})
            </CardTitle>
          </CardHeader>
          {showRejected && (
            <CardContent>
              <div className="space-y-2">
                {rejected.map((r) => (
                  <div
                    key={r.partner_id}
                    className="flex items-center justify-between p-2 bg-red-50 rounded text-sm"
                  >
                    <span>{r.name}</span>
                    <div className="flex gap-1">
                      {r.reasons.map((reason, i) => (
                        <span
                          key={i}
                          className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Candidates */}
      {candidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                شرکای واجد شرایط ({toFa(candidates.length)})
              </span>
              <span className="text-sm font-normal text-gray-500">
                انتخاب‌شده: {toFa(selected.size)} از حداکثر ۷
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {candidates.map((c) => {
                const isSelected = selected.has(c.partner_id);
                return (
                  <div
                    key={c.partner_id}
                    onClick={() => toggleSelect(c.partner_id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {c.rank && (
                            <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                              #{toFa(c.rank)}
                            </span>
                          )}
                          <span className="font-bold text-sm">{c.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {PARTNER_TYPES.find((t) => t.value === c.partner_type)?.label || c.partner_type}
                          {c.country && ` • ${c.country}`}
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-xl font-bold ${
                            c.weighted_score >= 80
                              ? "text-green-600"
                              : c.weighted_score >= 60
                              ? "text-amber-600"
                              : "text-gray-500"
                          }`}
                        >
                          {toFa(c.weighted_score.toFixed(0))}
                        </div>
                        <div className="text-[10px] text-gray-500">امتیاز</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t flex items-center gap-1 text-xs text-blue-600">
                        <CheckCircle className="w-3 h-3" />
                        در Shortlist
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelected(new Set())}>
                پاک کردن انتخاب
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || selected.size === 0}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {saving ? "در حال ذخیره..." : `ذخیره Shortlist (${toFa(selected.size)})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shortlist ذخیره‌شده */}
      {isSaved && shortlist && (
        <Card className="border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" />
                Shortlist ذخیره‌شده ({toFa(shortlist.partners_data.length)})
              </span>
              {!shortlist.approved_by_committee && (
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="gap-1 bg-green-600 hover:bg-green-700"
                >
                  <Award className="w-3 h-3" />
                  تصویب کمیته
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shortlist.partners_data.map((p) => {
                const hasNDA = shortlist.nda_signed_with?.includes(p.partner_id);
                return (
                  <div
                    key={p.partner_id}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs bg-white px-2 py-0.5 rounded font-bold">
                        #{toFa(p.rank || 0)}
                      </span>
                      <div>
                        <div className="font-bold text-sm">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.country}</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold">{toFa(p.weighted_score.toFixed(0))}</div>
                      <div className="text-[10px] text-gray-500">امتیاز</div>
                    </div>
                    <div>
                      {hasNDA ? (
                        <div className="flex items-center gap-1 text-xs text-green-700">
                          <ShieldCheck className="w-4 h-4" />
                          NDA امضا شده
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSignNDA(p.partner_id)}
                          className="text-xs gap-1"
                        >
                          <FileSignature className="w-3 h-3" />
                          ثبت NDA
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {candidates.length === 0 && !isSaved && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>برای شروع، فیلترها را تنظیم کنید و روی «جستجو» بزنید</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

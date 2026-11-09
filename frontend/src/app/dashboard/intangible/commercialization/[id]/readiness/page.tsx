'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Check, ChevronDown, ChevronUp, AlertTriangle,
  FileText, Info, Save, RotateCcw, Award, TrendingDown, TrendingUp,
  Upload, Trash2, Paperclip, X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  configApi, readinessApi, evidenceApi,
  ReadinessCriterion, LikertScale, EvidenceFactor,
  ReadinessDimension, AssetFamily, ReadinessAssessment,
  CriterionEvidenceFile,
} from '@/lib/engine06-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const toFa = (num: any): string => {
  if (num === null || num === undefined) return '—';
  return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

interface ResponseData {
  criterion_id: number;
  likert_level: number | null;
  evidence_level: string;
  evidence_description: string;
  is_blocker: boolean;
  is_irrelevant: boolean;
  irrelevant_reason: string;
}

export default function ReadinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = use(params);
  const router = useRouter();
  const cid = parseInt(caseId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessment, setAssessment] = useState<ReadinessAssessment | null>(null);
  const [criteria, setCriteria] = useState<ReadinessCriterion[]>([]);
  const [dimensions, setDimensions] = useState<ReadinessDimension[]>([]);
  const [likertScale, setLikertScale] = useState<LikertScale[]>([]);
  const [evidenceFactors, setEvidenceFactors] = useState<EvidenceFactor[]>([]);
  const [responses, setResponses] = useState<Record<number, ResponseData>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    core: true, family: true, business: true,
  });

  useEffect(() => {
    init();
  }, [cid]);

  const init = async () => {
    try {
      setLoading(true);
      // ۱. Config پایه
      const [dims, likert, evid] = await Promise.all([
        configApi.dimensions(),
        configApi.likertScale(),
        configApi.evidenceFactors(),
      ]);
      setDimensions(dims);
      setLikertScale(likert);
      setEvidenceFactors(evid);

      // ۲. بررسی وجود assessment قبلی
      let existing = await readinessApi.getByCase(cid);
      if (!existing) {
        existing = await readinessApi.initialize(cid, undefined, 'external');
      }

      console.log('🔍 Assessment loaded:', {
        id: existing.id,
        business_type: existing.business_type,
        asset_family: existing.asset_family,
        responses_count: existing.responses?.length || 0,
      });
      console.log('🔍 Sample responses:', existing.responses?.slice(0, 3));

      setAssessment(existing);

      // ۳. استخراج criterion_id های مربوط به این assessment
      const responseCriterionIds = (existing.responses || []).map(
        (r: any) => r.criterion
      );
      console.log('🔍 Applicable criterion IDs:', responseCriterionIds.length, responseCriterionIds.slice(0, 5));

      if (responseCriterionIds.length === 0) {
        toast.error('هیچ گویه‌ای برای این ارزیابی تعریف نشده است. لطفاً صفحه را رفرش کنید.');
        setLoading(false);
        return;
      }

      // ۴. حالا همه گویه‌ها رو بگیر و فیلتر کن
      const [coreCrit, famCrit, bizCrit] = await Promise.all([
        configApi.criteria('core'),
        configApi.criteria('family'),
        configApi.criteria('business'),
      ]);

      console.log('🔍 All criteria loaded:', {
        core: coreCrit.length,
        family: famCrit.length,
        business: bizCrit.length,
      });

      // ۵. فیلتر بر اساس responseCriterionIds
      const idSet = new Set(responseCriterionIds);
      const allCriteria = [...coreCrit, ...famCrit, ...bizCrit].filter(
        (c: any) => idSet.has(c.id)
      );

      console.log('🔍 Filtered criteria:', {
        total: allCriteria.length,
        core: allCriteria.filter((c) => c.section === 'core').length,
        family: allCriteria.filter((c) => c.section === 'family').length,
        business: allCriteria.filter((c) => c.section === 'business').length,
      });

      setCriteria(allCriteria);

      // ۶. پر کردن پاسخ‌ها
      const initialResponses: Record<number, ResponseData> = {};
      existing.responses?.forEach((r) => {
        initialResponses[r.criterion] = {
          criterion_id: r.criterion,
          likert_level: r.likert_level,
          evidence_level: r.evidence_level || '',
          evidence_description: r.evidence_description || '',
          is_blocker: r.is_blocker || false,
          is_irrelevant: r.is_irrelevant || false,
          irrelevant_reason: r.irrelevant_reason || '',
        };
      });
      setResponses(initialResponses);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail || 'خطا در بارگذاری');
    } finally {
      setLoading(false);
    }
  };

  const updateResponse = (criterionId: number, field: keyof ResponseData, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [criterionId]: {
        ...(prev[criterionId] || {
          criterion_id: criterionId,
          likert_level: null,
          evidence_level: '',
          evidence_description: '',
          is_blocker: false,
          is_irrelevant: false,
          irrelevant_reason: '',
        }),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    // چک: همه گویه‌های الزامی پاسخ داده شده؟
    const unanswered = criteria.filter((c) => {
      const r = responses[c.id];
      if (!r) return true;
      if (r.is_irrelevant) return false;
      return r.likert_level === null && !r.is_irrelevant;
    });

    if (unanswered.length > 0) {
      toast.error(`لطفاً به ${unanswered.length} گویه پاسخ دهید`, {
        description: unanswered.slice(0, 3).map((c) => c.code).join('، '),
      });
      return;
    }

    // چک: برای هر گویه لیکرت‌دار، شاهد انتخاب شده؟
    const noEvidence = criteria.filter((c) => {
      const r = responses[c.id];
      if (!r || r.is_irrelevant) return false;
      return r.likert_level !== null && !r.evidence_level;
    });

    if (noEvidence.length > 0) {
      toast.error(`برای ${noEvidence.length} گویه سطح شاهد انتخاب نشده`);
      return;
    }

    try {
      setSaving(true);
      const payload = Object.values(responses).map((r) => ({
        criterion_id: r.criterion_id,
        likert_level: r.likert_level,
        evidence_level: r.evidence_level || '',
        evidence_description: r.evidence_description || '',
        is_blocker: r.is_blocker,
        is_irrelevant: r.is_irrelevant,
        irrelevant_reason: r.irrelevant_reason || '',
      }));

      const result = await readinessApi.bulkSubmit(assessment.id, payload);
      setAssessment(result);
      toast.success(`ارزیابی ثبت شد — توصیه: ${result.recommendation_display}`);
      // اسکرول به بالای صفحه برای دیدن نتیجه
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error(error);
      const detail = error?.response?.data?.responses || error?.response?.data?.detail || 'خطا در ثبت';
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSaving(false);
    }
  };

  const getBySection = (section: string) => criteria.filter((c) => c.section === section);
  const getByDimension = (dimCode: string) =>
    criteria.filter((c) => c.section === 'core' && c.dimension_code === dimCode);

  const answeredCount = criteria.filter((c) => {
    const r = responses[c.id];
    if (!r) return false;
    return r.likert_level !== null || r.is_irrelevant;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const showResult = assessment && assessment.recommendation !== 'pending';

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen" style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/intangible/commercialization')}
            className="p-2 hover:bg-gray-100 rounded-lg bg-white shadow-sm"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">گام ۱ — ارزیابی آمادگی تجاری‌سازی</h1>
            <p className="text-sm text-gray-500 mt-1">
              {assessment?.business_type_name || 'نوع کسب‌وکار نامشخص'} • {assessment?.asset_family_name || 'خانواده نامشخص'}
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {toFa(answeredCount)} از {toFa(criteria.length)} گویه پاسخ داده شده
        </div>
      </div>

      {/* Result Card (اگر ارزیابی شده) */}
      {showResult && (
        <Card className={
          assessment.recommendation === 'go' ? 'border-green-500 border-2' :
          assessment.recommendation === 'develop' ? 'border-amber-500 border-2' :
          'border-red-500 border-2'
        }>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {assessment.recommendation === 'go' && <Check className="w-5 h-5 text-green-600" />}
              {assessment.recommendation === 'develop' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {assessment.recommendation === 'no_go' && <AlertTriangle className="w-5 h-5 text-red-600" />}
              نتیجه ارزیابی: {assessment.recommendation_display}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{toFa(Number(assessment.final_score).toFixed(1))}</div>
                <div className="text-xs text-gray-500 mt-1">امتیاز نهایی</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{toFa(assessment.confidence_level)}</div>
                <div className="text-xs text-gray-500 mt-1">اطمینان</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{toFa(Number(assessment.core_score).toFixed(1))}</div>
                <div className="text-xs text-gray-500 mt-1">نمره هسته</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{assessment.sub_state_fa || '—'}</div>
                <div className="text-xs text-gray-500 mt-1">زیرحالت</div>
              </div>
            </div>

            {assessment.recommendation_message && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <Info className="w-4 h-4 inline text-blue-600 mr-1" />
                {assessment.recommendation_message}
              </div>
            )}

            {assessment.top_strengths.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-600" /> نقاط قوت
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {assessment.top_strengths.map((s) => (
                    <span key={s.code} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                      {s.name}: {toFa(s.score.toFixed(1))}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {assessment.top_weaknesses.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-red-600" /> نقاط ضعف
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {assessment.top_weaknesses.map((s) => (
                    <span key={s.code} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded">
                      {s.name}: {toFa(s.score.toFixed(1))}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {assessment.routing_destination && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <strong>مقصد ارجاع:</strong> {assessment.routing_destination}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Criteria Sections */}
      <SectionCard
        title="الف — گویه‌های هسته (۹ بعد × ۴ گویه)"
        section="core"
        expanded={expandedSections.core}
        onToggle={() => setExpandedSections((p) => ({ ...p, core: !p.core }))}
        count={getBySection('core').length}
      >
        {dimensions.map((dim) => {
          const dimCriteria = getByDimension(dim.code);
          if (dimCriteria.length === 0) return null;
          return (
            <div key={dim.code} className="mb-6">
              <h4 className="font-bold text-sm bg-gray-100 px-3 py-2 rounded mb-3">
                {dim.code} — {dim.name_fa}
              </h4>
              <div className="space-y-3">
                {dimCriteria.map((c) => {
                  const resp = assessment?.responses?.find((r) => r.criterion === c.id);
                  return (
                    <CriterionCard
                      key={c.id}
                      criterion={c}
                      response={responses[c.id]}
                      likertScale={likertScale}
                      evidenceFactors={evidenceFactors}
                      path={assessment?.path || 'external'}
                      onChange={(field, value) => updateResponse(c.id, field, value)}
                      responseId={resp?.id}
                      evidenceFiles={resp?.evidence_files}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </SectionCard>

      <SectionCard
        title="ب — گویه‌های خانواده دارایی"
        section="family"
        expanded={expandedSections.family}
        onToggle={() => setExpandedSections((p) => ({ ...p, family: !p.family }))}
        count={getBySection('family').length}
      >
        <div className="space-y-3">
          {getBySection('family').map((c) => {
            const resp = assessment?.responses?.find((r) => r.criterion === c.id);
            return (
              <CriterionCard
                key={c.id}
                criterion={c}
                response={responses[c.id]}
                likertScale={likertScale}
                evidenceFactors={evidenceFactors}
                path={assessment?.path || 'external'}
                onChange={(field, value) => updateResponse(c.id, field, value)}
                responseId={resp?.id}
                evidenceFiles={resp?.evidence_files}
              />
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="ج — گویه‌های نوع کسب‌وکار"
        section="business"
        expanded={expandedSections.business}
        onToggle={() => setExpandedSections((p) => ({ ...p, business: !p.business }))}
        count={getBySection('business').length}
      >
        <div className="space-y-3">
          {getBySection('business').map((c) => {
            const resp = assessment?.responses?.find((r) => r.criterion === c.id);
            return (
              <CriterionCard
                key={c.id}
                criterion={c}
                response={responses[c.id]}
                likertScale={likertScale}
                evidenceFactors={evidenceFactors}
                path={assessment?.path || 'external'}
                onChange={(field, value) => updateResponse(c.id, field, value)}
                responseId={resp?.id}
                evidenceFiles={resp?.evidence_files}
              />
            );
          })}
        </div>
      </SectionCard>

      {/* Submit */}
      <div className="sticky bottom-4 flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/intangible/commercialization')}
        >
          انصراف
        </Button>
        <Button onClick={handleSubmit} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'در حال محاسبه...' : 'ثبت و محاسبه'}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Component: SectionCard
// ============================================================
function SectionCard({
  title, expanded, onToggle, count, children,
}: {
  title: string;
  section: string;
  expanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {title}
            <span className="text-sm font-normal text-gray-500">({toFa(count)} گویه)</span>
          </span>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </CardTitle>
      </CardHeader>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}

// ============================================================
// Component: CriterionCard
// ============================================================
function CriterionCard({
  criterion, response, likertScale, evidenceFactors, path, onChange,
  responseId, evidenceFiles,
}: {
  criterion: ReadinessCriterion;
  response: ResponseData | undefined;
  likertScale: LikertScale[];
  evidenceFactors: EvidenceFactor[];
  path: 'external' | 'internal';
  onChange: (field: keyof ResponseData, value: any) => void;
  responseId?: number;
  evidenceFiles?: CriterionEvidenceFile[];
}) {
  const current = response || {
    criterion_id: criterion.id,
    likert_level: null,
    evidence_level: '',
    evidence_description: '',
    is_blocker: false,
    is_irrelevant: false,
    irrelevant_reason: '',
  };

  const displayText = path === 'internal' && criterion.text_internal_fa
    ? criterion.text_internal_fa
    : criterion.text_fa;

  return (
    <div className={`p-4 rounded-lg border ${
      current.is_irrelevant ? 'bg-gray-50 border-gray-200 opacity-60' :
      criterion.is_critical ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500">{criterion.code}</span>
            {criterion.is_critical && (
              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">K بحرانی</span>
            )}
            {criterion.is_required_evidence && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">★ شاهد الزامی</span>
            )}
          </div>
          <p className="text-sm text-gray-800">{displayText}</p>
          {criterion.suggested_evidence && (
            <p className="text-xs text-gray-500 mt-1 italic">
              شاهد پیشنهادی: {criterion.suggested_evidence}
            </p>
          )}
        </div>
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={current.is_irrelevant}
            onChange={(e) => onChange('is_irrelevant', e.target.checked)}
          />
          نامربوط
        </label>
      </div>

      {/* Irrelevant */}
      {current.is_irrelevant ? (
        <div className="mt-2">
          <input
            type="text"
            placeholder="دلیل نامربوط بودن (الزامی)"
            value={current.irrelevant_reason}
            onChange={(e) => onChange('irrelevant_reason', e.target.value)}
            className="w-full text-sm px-2 py-1 border rounded"
          />
        </div>
      ) : (
        <>
          {/* Likert */}
          <div className="grid grid-cols-5 gap-1 mb-2">
            {likertScale.map((l) => (
              <button
                key={l.level}
                onClick={() => onChange('likert_level', l.level)}
                className={`p-2 text-xs rounded border transition-colors ${
                  current.likert_level === l.level
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }`}
                title={l.meaning_fa}
              >
                <div className="font-bold">{l.level}</div>
                <div className="text-[10px]">{l.label_fa}</div>
              </button>
            ))}
          </div>

          {/* Evidence */}
          {current.likert_level !== null && (
            <div className="grid grid-cols-4 gap-1">
              {evidenceFactors.map((e) => (
                <button
                  key={e.code}
                  onClick={() => onChange('evidence_level', e.code)}
                  className={`p-1.5 text-xs rounded border transition-colors ${
                    current.evidence_level === e.code
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <span className="font-mono">{e.code}</span> — {e.label_fa}
                </button>
              ))}
            </div>
          )}

          {/* Evidence Description + Blocker */}
          {current.likert_level !== null && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="توضیح شاهد..."
                value={current.evidence_description}
                onChange={(e) => onChange('evidence_description', e.target.value)}
                className="flex-1 text-xs px-2 py-1 border rounded"
              />
              {criterion.is_critical && (
                <label className="flex items-center gap-1 text-xs text-red-600 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={current.is_blocker}
                    onChange={(e) => onChange('is_blocker', e.target.checked)}
                  />
                  مانع قطعی
                </label>
              )}
            </div>
          )}

          {/* Upload Evidence */}
          {responseId && current.likert_level !== null && (
            <EvidenceUploader
              responseId={responseId}
              initialFiles={evidenceFiles}
            />
          )}
        </>
      )}
    </div>
  );
}


// ============================================================
// Component: EvidenceUploader
// ============================================================
function EvidenceUploader({
  responseId,
  initialFiles,
}: {
  responseId: number;
  initialFiles?: CriterionEvidenceFile[];
}) {
  const [files, setFiles] = useState<CriterionEvidenceFile[]>(initialFiles || []);
  const [uploading, setUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      setUploading(true);
      const newFiles: CriterionEvidenceFile[] = [];
      for (const file of Array.from(fileList)) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name}: حجم فایل بیشتر از ۲۰ مگابایت است`);
          continue;
        }
        const uploaded = await evidenceApi.upload(responseId, file, file.name);
        newFiles.push(uploaded);
      }
      setFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} فایل آپلود شد`);
    } catch (error: any) {
      console.error(error);
      const detail = error?.response?.data?.detail || error?.response?.data?.non_field_errors?.[0] || 'خطا در آپلود';
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleAddLink = async () => {
    if (!linkValue.trim()) {
      toast.error('لطفاً لینک را وارد کنید');
      return;
    }
    try {
      // چک ساده URL
      if (!linkValue.match(/^https?:\/\//i)) {
        toast.error('لینک باید با http:// یا https:// شروع شود');
        return;
      }
      const uploaded = await evidenceApi.addLink(responseId, linkValue, linkTitle);
      setFiles((prev) => [...prev, uploaded]);
      setLinkValue('');
      setLinkTitle('');
      setShowLinkInput(false);
      toast.success('لینک اضافه شد');
    } catch (error: any) {
      console.error(error);
      const detail = error?.response?.data?.detail || error?.response?.data?.external_link?.[0] || 'خطا در ثبت لینک';
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف مدرک؟')) return;
    try {
      await evidenceApi.delete(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success('حذف شد');
    } catch {
      toast.error('خطا در حذف');
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Paperclip className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-600">
          مدارک ({files.length})
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center gap-1 disabled:opacity-50"
        >
          <Upload className="w-3 h-3" />
          {uploading ? 'در حال آپلود...' : 'آپلود فایل'}
        </button>
        <button
          type="button"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 flex items-center gap-1"
        >
          🔗 لینک
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.zip,.txt,.csv,.json,.xml"
        />
      </div>

      {showLinkInput && (
        <div className="bg-purple-50 border border-purple-200 rounded p-2 mb-2 space-y-1">
          <input
            type="url"
            placeholder="https://drive.google.com/... یا لینک سند"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            className="w-full text-xs px-2 py-1 border rounded"
          />
          <input
            type="text"
            placeholder="عنوان (اختیاری)"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            className="w-full text-xs px-2 py-1 border rounded"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddLink}
              className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              ثبت لینک
            </button>
            <button
              onClick={() => { setShowLinkInput(false); setLinkValue(''); setLinkTitle(''); }}
              className="text-xs px-2 py-1 bg-gray-200 rounded"
            >
              انصراف
            </button>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-2 text-xs bg-white border border-gray-200 rounded px-2 py-1"
            >
              {f.file_url ? (
                <a
                  href={f.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex-1"
                  title={f.title || f.file || ''}
                >
                  📄 {f.title || (f.file || '').split('/').pop()}
                </a>
              ) : f.external_link ? (
                <a
                  href={f.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline truncate flex-1"
                  title={f.title || f.external_link}
                >
                  🔗 {f.title || f.external_link}
                </a>
              ) : (
                <span className="text-gray-500 truncate flex-1">(بدون محتوا)</span>
              )}
              {f.file_size > 0 && (
                <span className="text-gray-400 whitespace-nowrap">
                  {formatSize(f.file_size)}
                </span>
              )}
              {f.is_independently_verified && (
                <span className="text-green-600" title="تأیید مستقل">✓</span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(f.id)}
                className="text-red-500 hover:text-red-700"
                title="حذف"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  FileText,
  Shield,
  Users,
  Database,
  Calendar,
  Lock,
  Printer,
  Award,
  Clock,
  UserCheck,
  TrendingUp,
  FileCheck,
  Globe,
  Building2,
  DollarSign,
  Percent,
  Calendar as CalendarIcon,
} from 'lucide-react';
import api from '@/lib/api';
import * as XLSX from 'xlsx';

interface Step7Props {
  onPrev: () => void;
  valuationCaseId?: number;
  methodId?: string;
  assetId?: number;
  selectedMethod?: string;
  methods?: any[];
  formData?: any;
  onComplete?: (data: any) => void;
}

interface ApprovalLevel {
  level: number;
  role: string;
  role_fa: string;
  status: 'pending' | 'signed' | 'waiting' | 'rejected';
  date?: string;
  signer?: string;
}

interface ReportData {
  certificate_no: string;
  final_value: number;
  token_value?: number;
  value_range_low: number;
  value_range_high: number;
  confidence_level: number;
  qc_score: number;
  method_id: string;
  method_name: string;
  effective_date: string;
  next_revaluation_date: string;
  case_status: string;
  sensitivity_rating: string;
  valuation_basis: string;
  registration_status: {
    pushed_to_registry: boolean;
    portfolio_updated: boolean;
    alerts_configured: boolean;
    archive_complete: boolean;
  };
  method_specific_data: any;
  asset_name?: string;
  asset_uid?: string;
  organization_name?: string;
}

// نقش‌های فارسی برای سطوح تأیید
const APPROVAL_ROLES: Record<number, { role: string; role_fa: string }> = {
  1: { role: 'Analyst', role_fa: 'تحلیلگر' },
  2: { role: 'Lead Reviewer', role_fa: 'بازبین ارشد' },
  3: { role: 'IA Manager', role_fa: 'مدیر دارایی‌های نامشهود' },
  4: { role: 'Valuation Committee', role_fa: 'کمیته ارزش‌گذاری' },
};

// ============================================
// توابع کمکی
// ============================================
const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const str = String(num);
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const formatCurrency = (value: number) => {
  if (!value || value === 0) return '۰';
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  let formatted: string;
  if (absValue >= 1e12) formatted = (absValue / 1e12).toFixed(1) + 'T';
  else if (absValue >= 1e9) formatted = (absValue / 1e9).toFixed(1) + 'B';
  else if (absValue >= 1e6) formatted = (absValue / 1e6).toFixed(1) + 'M';
  else formatted = absValue.toFixed(0);
  const result = isNegative ? `-${formatted}` : formatted;
  return result.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

const formatPercent = (value: number) => {
  if (value === undefined || value === null || value === 0) return '۰%';
  const num = value <= 1 ? value * 100 : value;
  return toPersianNumber(Math.round(num)) + '%';
};

const calculateConfidenceRange = (confidence: number, baseValue: number) => {
  const rangePercent = confidence > 0.85 ? 0.15 : 0.30;
  return {
    low: baseValue * (1 - rangePercent),
    high: baseValue * (1 + rangePercent),
  };
};

// ============================================
// کامپوننت کارت خلاصه ارزش‌گذاری
// ============================================
const ValuationSummaryCard = ({ 
  finalValue, 
  tokenValue,
  confidence, 
  methodName, 
  assetName, 
  methodId,
  certificateNo,
  effectiveDate 
}: { 
  finalValue: number; 
  tokenValue?: number;
  confidence: number; 
  methodName: string; 
  assetName: string;
  methodId: string;
  certificateNo: string;
  effectiveDate: string;
}) => {
  const displayValue = formatCurrency(finalValue);
  const displayToken = tokenValue ? formatCurrency(tokenValue) : '۰';
  const displayConfidence = formatPercent(confidence);
  const confidenceColor = confidence >= 0.85 ? 'text-green-400' : 
                          confidence >= 0.70 ? 'text-yellow-400' : 'text-red-400';

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-dark-green to-medium-green text-white overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400" />
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs opacity-70 font-[family-name:var(--font-vazir)]">
                Executive Valuation Summary
              </p>
              <p className="text-sm font-bold font-[family-name:var(--font-vazir)]">
                {assetName}
              </p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 font-[family-name:var(--font-vazir)]">
            {methodId}
          </Badge>
        </div>

        <div className="text-center py-4">
          <p className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-vazir)] tracking-tight">
            {displayValue}
          </p>
          <p className="text-sm opacity-70 mt-1 font-[family-name:var(--font-vazir)]">
            Final Valuation Summary
          </p>
        </div>

        <div className="relative my-4">
          <div className="border-t border-white/20 border-dashed" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dark-green flex items-center justify-center">
            <Award className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-2">
          <div className="text-center p-3 bg-white/10 rounded-xl">
            <p className="text-[10px] opacity-60 font-[family-name:var(--font-vazir)]">
              Confidence Level
            </p>
            <p className={`text-xl font-bold font-[family-name:var(--font-vazir)] ${confidenceColor}`}>
              {displayConfidence}
            </p>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-xl">
            <p className="text-[10px] opacity-60 font-[family-name:var(--font-vazir)]">
              Token Value
            </p>
            <p className="text-xl font-bold font-[family-name:var(--font-vazir)] text-yellow-300">
              {displayToken}
            </p>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-xl">
            <p className="text-[10px] opacity-60 font-[family-name:var(--font-vazir)]">
              Method Used
            </p>
            <p className="text-sm font-bold font-[family-name:var(--font-vazir)] truncate">
              {methodName.length > 20 ? methodName.substring(0, 20) + '...' : methodName}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-[10px] opacity-50">
          <span className="font-[family-name:var(--font-vazir)]">
            Effective: {effectiveDate ? new Date(effectiveDate).toLocaleDateString('fa-IR') : '—'}
          </span>
          <span className="font-[family-name:var(--font-vazir)]">
            Certificate: {certificateNo || '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// کامپوننت اصلی
// ============================================
export function Step7_Report({
  onPrev,
  valuationCaseId,
  methodId,
  assetId,
  selectedMethod,
  methods,
  formData,
  onComplete,
}: Step7Props) {
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [approvals, setApprovals] = useState<ApprovalLevel[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<number | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [reportsGenerated, setReportsGenerated] = useState({
    executive_summary: false,
    full_report: false,
    value_certificate: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (valuationCaseId) {
      loadReportData();
    } else {
      setLoading(false);
    }
  }, [valuationCaseId]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const step4Res = await api.get(`/intangible/valuation-step4/?valuation_case=${valuationCaseId}`);
      const step4Items = step4Res.data.results || step4Res.data || [];
      const step4 = step4Items[0];

      const sensitivityRes = await api.get(`/intangible/sensitivity/?valuation_case=${valuationCaseId}`);
      const sensitivityItems = sensitivityRes.data.results || sensitivityRes.data || [];
      const sensitivity = sensitivityItems[0];

      const qcRes = await api.get(`/intangible/valuation-qc/?valuation_case=${valuationCaseId}`);
      const qcItems = qcRes.data.results || qcRes.data || [];
      const qc = qcItems[0];

      const step3Res = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const step3Items = step3Res.data.results || step3Res.data || [];
      const step3 = step3Items[0];

      // دریافت اطلاعات دارایی
      let assetName = formData?.name || 'دارایی';
      let assetUid = formData?.assetId || '';
      let organizationName = '';
      
      if (assetId) {
        try {
          const assetRes = await api.get(`/intangible/screened-assets/${assetId}/`);
          assetName = assetRes.data.asset_name || assetName;
          assetUid = assetRes.data.asset_uid || assetUid;
          organizationName = assetRes.data.organization_name || '';
        } catch (e) {
          console.error('Error fetching asset:', e);
        }
      }

      const methodName = methods?.find((m) => m.id === methodId)?.name || methodId || 'M-01';
      const confidence = sensitivity?.confidence_level || step4?.confidence_level || 0.82;
      const baseValue = step4?.final_value || 0;
      const tokenValue = step4?.token_value || 0;
      const range = calculateConfidenceRange(confidence, baseValue);

      const report: ReportData = {
        certificate_no: `VAL-CERT-1405-${String(valuationCaseId).padStart(5, '0')}`,
        final_value: baseValue,
        token_value: tokenValue,
        value_range_low: sensitivity?.min_value || range.low,
        value_range_high: sensitivity?.max_value || range.high,
        confidence_level: confidence,
        qc_score: qc?.completeness_score || step4?.qc_score || 82,
        method_id: methodId || 'M-01',
        method_name: methodName,
        effective_date: new Date().toISOString().split('T')[0],
        next_revaluation_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          .toISOString()
          .split('T')[0],
        case_status: 'PENDING_FINAL_APPROVAL',
        sensitivity_rating: sensitivity?.sensitivity_rating || 'MEDIUM',
        valuation_basis: 'Fair Value / Going Concern',
        registration_status: {
          pushed_to_registry: false,
          portfolio_updated: false,
          alerts_configured: false,
          archive_complete: false,
        },
        method_specific_data: step3?.method_inputs || {},
        asset_name: assetName,
        asset_uid: assetUid,
        organization_name: organizationName,
      };

      setReportData(report);

      const finalValue = step4?.final_value || 0;
      let maxLevel = 2;
      if (finalValue > 100_000_000_000) maxLevel = 4;
      else if (finalValue > 10_000_000_000) maxLevel = 3;

      const approvalLevels: ApprovalLevel[] = [];
      for (let i = 1; i <= maxLevel; i++) {
        const role = APPROVAL_ROLES[i];
        approvalLevels.push({
          level: i,
          role: role.role,
          role_fa: role.role_fa,
          status: i <= 2 ? 'signed' : 'pending',
          date: i <= 2 ? '۱۴۰۵/۰۴/۱۳' : undefined,
          signer: i <= 2 ? ['دانیال فارسی', 'رضا تنهایی'][i - 1] : undefined,
        });
      }
      setApprovals(approvalLevels);

      setLoading(false);
    } catch (error) {
      console.error('Error loading report data:', error);
      setError('خطا در بارگذاری داده‌های گزارش');
      setLoading(false);
    }
  };

  // ============================================
  // تولید گزارش Excel - با اطلاعات کامل دارایی
  // ============================================
  const generateExcelReport = (type: 'executive_summary' | 'full_report' | 'value_certificate') => {
    try {
      const fileName = `${type}_${reportData?.certificate_no || 'report'}_${new Date().toISOString().split('T')[0]}`;
      
      const rows: any[][] = [
        ['META Platform - Valuation Engine'],
        [''],
        ['گزارش ارزش‌گذاری'],
        [''],
        ['شناسه:', reportData?.certificate_no || '—'],
        ['دارایی:', reportData?.asset_name || '—'],
        ['شناسه دارایی:', reportData?.asset_uid || '—'],
        ['سازمان:', reportData?.organization_name || '—'],
        ['روش:', methodId || '—'],
        ['تاریخ:', new Date().toLocaleDateString('fa-IR')],
        [''],
        ['خلاصه ارزش‌گذاری'],
        ['ارزش نهایی:', formatCurrency(reportData?.final_value || 0)],
        ['ارزش بر حسب تک توکن:', formatCurrency(reportData?.token_value || 0)],
        ['بازه اطمینان (کم):', formatCurrency(reportData?.value_range_low || 0)],
        ['بازه اطمینان (زیاد):', formatCurrency(reportData?.value_range_high || 0)],
        ['سطح اطمینان:', formatPercent(reportData?.confidence_level || 0)],
        ['امتیاز کیفی:', reportData?.qc_score || 0],
        [''],
        ['پارامترهای کلیدی:'],
      ];

      const methodData = renderMethodSpecificData();
      for (const item of methodData) {
        rows.push([item.label, item.value]);
      }

      rows.push(['']);
      rows.push(['تاریخ بازنگری بعدی:', reportData?.next_revaluation_date ? new Date(reportData.next_revaluation_date).toLocaleDateString('fa-IR') : '—']);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 30 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Valuation_Report');
      XLSX.writeFile(wb, `${fileName}.xlsx`);

      setReportsGenerated((prev) => ({ ...prev, [type]: true }));
      console.log(`✅ ${type} report generated successfully`);
    } catch (error) {
      console.error('Error generating Excel report:', error);
      alert('خطا در تولید گزارش. لطفاً دوباره تلاش کنید.');
    }
  };

  const renderMethodSpecificData = () => {
    const data = reportData?.method_specific_data || {};

    const fieldMap: Record<string, { label: string; format: (v: any) => string }> = {
      royalty_rate: {
        label: 'نرخ حق‌الامتیاز',
        format: (v) => formatPercent(v / 100),
      },
      tax_rate: {
        label: 'نرخ مالیات',
        format: (v) => formatPercent(v > 1 ? v : v * 100),
      },
      discount_rate: {
        label: 'نرخ تنزیل',
        format: (v) => formatPercent(v > 1 ? v : v * 100),
      },
      forecast_horizon: {
        label: 'افق پیش‌بینی',
        format: (v) => toPersianNumber(v) + ' سال',
      },
      current_revenue: {
        label: 'درآمد جاری',
        format: (v) => formatCurrency(v),
      },
      useful_life: {
        label: 'عمر مفید',
        format: (v) => toPersianNumber(v) + ' سال',
      },
      revenue_attribution: {
        label: 'تخصیص درآمد',
        format: (v) => formatPercent(v),
      },
      quality_multiplier: {
        label: 'ضریب کیفیت',
        format: (v) => v.toFixed(2),
      },
      terminal_growth_rate: {
        label: 'نرخ رشد پایانی',
        format: (v) => formatPercent(v > 1 ? v : v * 100),
      },
    };

    const keys = [
      'royalty_rate',
      'tax_rate',
      'discount_rate',
      'forecast_horizon',
      'current_revenue',
      'useful_life',
      'revenue_attribution',
      'quality_multiplier',
      'terminal_growth_rate',
    ];

    return keys
      .map((key) => {
        const value = data[key];
        if (value === undefined || value === null) return null;
        const mapping = fieldMap[key];
        if (!mapping) return null;
        return {
          key,
          label: mapping.label,
          value: mapping.format(value),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  const handleApprove = (level: number) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.level === level
          ? {
              ...a,
              status: 'signed',
              date: new Date().toLocaleDateString('fa-IR'),
              signer: 'کاربر جاری',
            }
          : a
      )
    );
    setSelectedApproval(null);
    setApprovalComment('');
  };

  const handleReject = (level: number) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.level === level ? { ...a, status: 'rejected' } : a
      )
    );
    setSelectedApproval(null);
    setApprovalComment('');
  };

  const handleFinalize = async () => {
    try {
      setFinalizing(true);
      setValidationErrors([]);

      const payload = {
        case_id: `VAL-1405-${String(valuationCaseId).padStart(5, '0')}`,
        asset_id: assetId,
        method_id: methodId,
        final_value: reportData?.final_value,
        token_value: reportData?.token_value || 0,
        value_range: {
          low: reportData?.value_range_low,
          high: reportData?.value_range_high,
        },
        confidence_level: reportData?.confidence_level,
        qc_score: reportData?.qc_score,
        sensitivity_rating: reportData?.sensitivity_rating,
        valuation_basis: reportData?.valuation_basis,
        effective_date: reportData?.effective_date,
        certificate_no: reportData?.certificate_no,
        reports_generated: Object.keys(reportsGenerated).filter(
          (k) => reportsGenerated[k as keyof typeof reportsGenerated]
        ),
        approval_workflow: approvals,
        registration: {
          pushed_to_registry: true,
          portfolio_updated: true,
          next_revaluation_date: reportData?.next_revaluation_date,
          alerts_configured: true,
        },
        audit_trail_complete: true,
        case_status: 'REGISTERED',
      };

      await api.post('/intangible/valuation-cases/finalize/', payload);

      if (onComplete) {
        onComplete(payload);
      }

      setReportData((prev) =>
        prev
          ? {
              ...prev,
              case_status: 'REGISTERED',
              registration_status: {
                pushed_to_registry: true,
                portfolio_updated: true,
                alerts_configured: true,
                archive_complete: true,
              },
            }
          : null
      );

      setFinalizing(false);
    } catch (error) {
      console.error('Error finalizing case:', error);
      setError('خطا در نهایی‌سازی و ثبت');
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-dark-green" />
        <span className="mr-3 text-gray-500 font-[family-name:var(--font-vazir)]">
          در حال بارگذاری گزارش...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700 font-[family-name:var(--font-vazir)]">{error}</p>
          <Button onClick={loadReportData} className="mt-4 font-[family-name:var(--font-vazir)]">
            تلاش مجدد
          </Button>
        </CardContent>
      </Card>
    );
  }

  const methodLabel = methods?.find((m) => m.id === methodId)?.name || methodId || 'M-01';
  const allApprovalsComplete = approvals.every((a) => a.status === 'signed');

  const methodData = renderMethodSpecificData();

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold font-[family-name:var(--font-vazir)]">
          ۷
        </span>
        <span className="font-[family-name:var(--font-vazir)]">
          مرحله ۷ از ۷ - گزارش و تأیید نهایی
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            گزارش و تأیید نهایی
          </h2>
          <p className="text-sm text-gray-500 font-[family-name:var(--font-vazir)]">
            شناسه:{' '}
            <span className="font-mono text-xs">{reportData?.certificate_no || '—'}</span>
            {reportData?.case_status === 'REGISTERED' && (
              <Badge className="mr-2 bg-green-100 text-green-700 font-[family-name:var(--font-vazir)]">
                ✅ ثبت شده
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700 font-[family-name:var(--font-vazir)]">
            {methodId} - {methodLabel}
          </Badge>
        </div>
      </div>

      {/* A. کارت خلاصه ارزش‌گذاری */}
      <ValuationSummaryCard
        finalValue={reportData?.final_value || 0}
        tokenValue={reportData?.token_value || 0}
        confidence={reportData?.confidence_level || 0}
        methodName={methodLabel}
        assetName={reportData?.asset_name || 'دارایی'}
        methodId={methodId || 'M-01'}
        certificateNo={reportData?.certificate_no || '—'}
        effectiveDate={reportData?.effective_date || ''}
      />

      {/* B. گزارش اختصاصی روش */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">
            📊 گزارش اختصاصی روش {methodId}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {methodData.map((item) => (
              <div key={item.key} className="p-2 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">
                  {item.label}
                </p>
                <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* C. گردش تأیید */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
              <Users className="w-4 h-4 inline ml-1" />
              گردش تأیید
            </h3>
            <Badge
              className={
                allApprovalsComplete
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }
            >
              {allApprovalsComplete ? '✅ کامل' : '⏳ در انتظار'}
            </Badge>
          </div>

          <div className="space-y-3">
            {approvals.map((approval) => (
              <div
                key={approval.level}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-dark-green/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-dark-green">{approval.level}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium font-[family-name:var(--font-vazir)]">
                      {approval.role_fa}
                    </p>
                    <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">
                      {approval.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {approval.status === 'signed' ? (
                    <Badge className="bg-green-100 text-green-700 font-[family-name:var(--font-vazir)]">
                      ✅ امضا شده
                      {approval.signer && (
                        <span className="mr-1 text-xs">({approval.signer})</span>
                      )}
                    </Badge>
                  ) : approval.status === 'rejected' ? (
                    <Badge className="bg-red-100 text-red-700 font-[family-name:var(--font-vazir)]">
                      ❌ رد شده
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-700 font-[family-name:var(--font-vazir)]">
                        ⏳ در انتظار
                      </Badge>
                      {selectedApproval === approval.level && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-green-600 hover:text-green-800"
                            onClick={() => handleApprove(approval.level)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-red-600 hover:text-red-800"
                            onClick={() => handleReject(approval.level)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {selectedApproval !== approval.level && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 font-[family-name:var(--font-vazir)]"
                          onClick={() => setSelectedApproval(approval.level)}
                        >
                          اقدام
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedApproval && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="نظر خود را وارد کنید..."
                className="min-h-[60px] text-sm font-[family-name:var(--font-vazir)]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* D. گواهی ارزش و تولید گزارش */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">
              <Award className="w-4 h-4 inline ml-1" />
              گواهی ارزش
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-[family-name:var(--font-vazir)]">
                  شماره گواهی:
                </span>
                <span className="font-bold font-[family-name:var(--font-vazir)]">
                  {reportData?.certificate_no}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-[family-name:var(--font-vazir)]">
                  ارزش منصفانه:
                </span>
                <span className="font-bold text-dark-green font-[family-name:var(--font-vazir)]">
                  {formatCurrency(reportData?.final_value || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-[family-name:var(--font-vazir)]">
                  تک توکن:
                </span>
                <span className="font-bold text-amber-600 font-[family-name:var(--font-vazir)]">
                  {formatCurrency(reportData?.token_value || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-[family-name:var(--font-vazir)]">
                  تاریخ مبنا:
                </span>
                <span className="font-bold font-[family-name:var(--font-vazir)]">
                  {reportData?.effective_date
                    ? new Date(reportData.effective_date).toLocaleDateString('fa-IR')
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-[family-name:var(--font-vazir)]">
                  بازنگری بعدی:
                </span>
                <span className="font-bold font-[family-name:var(--font-vazir)]">
                  {reportData?.next_revaluation_date
                    ? new Date(reportData.next_revaluation_date).toLocaleDateString('fa-IR')
                    : '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">
              <FileText className="w-4 h-4 inline ml-1" />
              تولید گزارش
            </h3>
            <div className="space-y-2">
              <Button
                variant={reportsGenerated.executive_summary ? 'default' : 'outline'}
                className={`w-full justify-start font-[family-name:var(--font-vazir)] ${
                  reportsGenerated.executive_summary
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : ''
                }`}
                onClick={() => generateExcelReport('executive_summary')}
              >
                {reportsGenerated.executive_summary ? (
                  <CheckCircle className="w-4 h-4 ml-2" />
                ) : (
                  <FileText className="w-4 h-4 ml-2" />
                )}
                گزارش اجرایی
              </Button>
              <Button
                variant={reportsGenerated.full_report ? 'default' : 'outline'}
                className={`w-full justify-start font-[family-name:var(--font-vazir)] ${
                  reportsGenerated.full_report ? 'bg-green-600 hover:bg-green-700 text-white' : ''
                }`}
                onClick={() => generateExcelReport('full_report')}
              >
                {reportsGenerated.full_report ? (
                  <CheckCircle className="w-4 h-4 ml-2" />
                ) : (
                  <FileText className="w-4 h-4 ml-2" />
                )}
                گزارش کامل ارزش‌گذاری
              </Button>
              <Button
                variant={reportsGenerated.value_certificate ? 'default' : 'outline'}
                className={`w-full justify-start font-[family-name:var(--font-vazir)] ${
                  reportsGenerated.value_certificate
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : ''
                }`}
                onClick={() => generateExcelReport('value_certificate')}
              >
                {reportsGenerated.value_certificate ? (
                  <CheckCircle className="w-4 h-4 ml-2" />
                ) : (
                  <FileText className="w-4 h-4 ml-2" />
                )}
                گواهی ارزش
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* E. ثبت در سیستم */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">
            <Database className="w-4 h-4 inline ml-1" />
            ثبت در سیستم
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              {reportData?.registration_status.pushed_to_registry ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-600" />
              )}
              <span className="text-xs font-[family-name:var(--font-vazir)]">
                ثبت در شناسنامه
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              {reportData?.registration_status.portfolio_updated ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-600" />
              )}
              <span className="text-xs font-[family-name:var(--font-vazir)]">
                بروزرسانی پورتفولیو
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              {reportData?.registration_status.alerts_configured ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-600" />
              )}
              <span className="text-xs font-[family-name:var(--font-vazir)]">
                هشدارهای نظارتی
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              {reportData?.registration_status.archive_complete ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-600" />
              )}
              <span className="text-xs font-[family-name:var(--font-vazir)]">
                بایگانی مستندات
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* دکمه‌ها */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={onPrev}
          className="flex items-center gap-1 font-[family-name:var(--font-vazir)]"
        >
          <ChevronLeft className="w-4 h-4" />
          بازگشت به مرحله ۶
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-1 font-[family-name:var(--font-vazir)]"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            چاپ
          </Button>

          <Button
            className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1 font-[family-name:var(--font-vazir)]"
            onClick={handleFinalize}
            disabled={finalizing || reportData?.case_status === 'REGISTERED'}
          >
            {finalizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                در حال ثبت...
              </>
            ) : reportData?.case_status === 'REGISTERED' ? (
              <>
                <CheckCircle className="w-4 h-4 ml-2" />
                ثبت شده
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 ml-2" />
                نهایی‌سازی و ثبت
              </>
            )}
          </Button>
        </div>
      </div>

      {reportData?.case_status === 'REGISTERED' && (
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-bold font-[family-name:var(--font-vazir)]">
            ✅ ارزش‌گذاری با موفقیت ثبت شد!
          </p>
          <p className="text-xs text-green-600 font-[family-name:var(--font-vazir)]">
            شماره گواهی: {reportData.certificate_no}
          </p>
        </div>
      )}
    </div>
  );
}

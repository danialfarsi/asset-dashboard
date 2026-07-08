'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Calendar, 
  User, 
  FileText,
  Upload,
  Download,
  X,
  Eye,
  PieChart,
  TrendingUp,
  Target,
  Shield,
  BarChart3,
  Activity,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  FolderOpen
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import api from '@/lib/api';
import { fetchAllValuations } from '@/lib/api-utils';

interface Step2Props {
  formData: {
    assetId: string;
    name: string;
    description: string;
    developmentStage: string;
    initialRelease: string;
    usefulLife: string;
    jurisdiction: string;
    associatedCosts: string;
    stakeholders: string;
  };
  onInputChange: (field: string, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  selectedAsset?: any;
  valuationData?: any;
  assetId?: number;
  onFormDataUpdate?: (data: any) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  file_url?: string;
  file_type_label?: string;
  valuation_id?: number;
  valuation_score?: number;
  file?: File;
}

const DEVELOPMENT_STAGES = [
  'ایده / مفهومی',
  'در حال توسعه',
  'بالغ / در حال استفاده',
  'پایدار / بلوغ',
  'در حال افول',
];

const JURISDICTIONS = [
  'ایران',
  'ایالات متحده',
  'اروپا',
  'چین',
  'جهانی',
  'سایر',
];

const DIMENSION_ICONS = {
  strategic: { icon: Target, color: '#3B82F6', bg: 'bg-blue-50', text: 'text-blue-600', label: 'استراتژیک' },
  technical: { icon: Shield, color: '#8B5CF6', bg: 'bg-purple-50', text: 'text-purple-600', label: 'فنی و بلوغ' },
  operational: { icon: Activity, color: '#F59E0B', bg: 'bg-amber-50', text: 'text-amber-600', label: 'عملیاتی' },
  market: { icon: TrendingUp, color: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'بازار' },
  risk: { icon: AlertCircle, color: '#EF4444', bg: 'bg-red-50', text: 'text-red-600', label: 'ریسک' },
};

const FILE_TYPE_ICONS = {
  interview: { icon: User, label: 'مصاحبه', color: 'text-purple-600', bg: 'bg-purple-50' },
  document: { icon: FileText, label: 'سند', color: 'text-blue-600', bg: 'bg-blue-50' },
  process: { icon: Layers, label: 'فرآیند', color: 'text-amber-600', bg: 'bg-amber-50' },
  database: { icon: FolderOpen, label: 'پایگاه داده', color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

export function Step2_InputData({ 
  formData, 
  onInputChange, 
  onNext, 
  onPrev,
  selectedAsset,
  valuationData,
  assetId,
  onFormDataUpdate
}: Step2Props) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 🔥 State برای ورودی‌های پنل - داخل کامپوننت
  const [baseInputs, setBaseInputs] = useState({
    taxRate: '25',
    discountRate: '18',
    forecastHorizon: '5',
    terminalGrowth: '5',
  });

  useEffect(() => {
    if (assetId) {
      fetchEvidenceFiles();
      loadSavedInputs();
    }
  }, [assetId]);

  // 🔥 بارگذاری ورودی‌های ذخیره شده
  const loadSavedInputs = async () => {
    try {
      const saved = localStorage.getItem(`valuation_inputs_${assetId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setBaseInputs(parsed);
      }
    } catch (error) {
      console.error('Error loading saved inputs:', error);
    }
  };

  // 🔥 ذخیره ورودی‌ها
  const saveInputs = () => {
    try {
      localStorage.setItem(`valuation_inputs_${assetId}`, JSON.stringify(baseInputs));
      if (onFormDataUpdate) {
        onFormDataUpdate({ baseInputs });
      }
    } catch (error) {
      console.error('Error saving inputs:', error);
    }
  };

  // 🔥 وقتی ورودی تغییر میکنه، ذخیره کن
  const handleBaseInputChange = (field: string, value: string) => {
    setBaseInputs(prev => ({ ...prev, [field]: value }));
    clearTimeout((window as any)._saveTimeout);
    (window as any)._saveTimeout = setTimeout(saveInputs, 500);
  };

  const fetchEvidenceFiles = async () => {
    try {
      setLoadingFiles(true);
      
      const allValuations = await fetchAllValuations();
      const assetValuations = allValuations.filter((v: any) => v.asset === assetId && v.status === 'completed');
      
      if (assetValuations.length === 0) {
        setUploadedFiles([]);
        return;
      }

      const allFiles: UploadedFile[] = [];

      for (const v of assetValuations) {
        try {
          const { data: valData } = await api.get(`/intangible/asset-valuations/${v.id}/`);
          const answers = valData.answers || [];
          
          answers.forEach((answer: any) => {
            const types = [
              { key: 'interview', label: 'مصاحبه', url: answer.evidence_interview },
              { key: 'document', label: 'سند', url: answer.evidence_document },
              { key: 'process', label: 'فرآیند', url: answer.evidence_process },
              { key: 'database', label: 'پایگاه داده', url: answer.evidence_database },
            ];
            
            types.forEach(({ key, label, url }) => {
              if (url) {
                allFiles.push({
                  id: `evidence-${answer.id}-${key}`,
                  name: url.split('/').pop() || 'فایل',
                  size: '—',
                  type: key,
                  uploadedAt: new Date(answer.updated_at).toLocaleDateString('fa-IR'),
                  file_url: url,
                  file_type_label: label,
                  valuation_id: v.id,
                  valuation_score: v.final_score || 0,
                });
              }
            });
          });
        } catch (e) {
          console.error(`Error fetching valuation ${v.id}:`, e);
        }
      }

      setUploadedFiles(allFiles);
    } catch (error) {
      console.error('Error fetching evidence files:', error);
      setUploadedFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  // 🔥 آپلود فایل جدید
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !assetId) return;
    
    setIsUploading(true);
    try {
      const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
        id: `new-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type.split('/')[0] || 'document',
        uploadedAt: new Date().toLocaleDateString('fa-IR'),
        file: file,
      }));
      
      setUploadedFiles(prev => [...newFiles, ...prev]);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('خطا در آپلود فایل');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = async (id: string) => {
    if (id.startsWith('new-')) {
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
      return;
    }
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const getDimensionAverage = (score: number, dimension: string) => {
    const counts = {
      strategic: 6,
      technical: 4,
      operational: 4,
      market: 5,
      risk: 4,
    };
    const count = counts[dimension as keyof typeof counts] || 4;
    return count > 0 ? score / count : 0;
  };

  const radarData = valuationData ? [
    { dimension: 'استراتژیک', value: getDimensionAverage(valuationData.strategic_score || 0, 'strategic'), fullMark: 5 },
    { dimension: 'فنی و بلوغ', value: getDimensionAverage(valuationData.technical_score || 0, 'technical'), fullMark: 5 },
    { dimension: 'عملیاتی', value: getDimensionAverage(valuationData.operational_score || 0, 'operational'), fullMark: 5 },
    { dimension: 'بازار', value: getDimensionAverage(valuationData.market_score || 0, 'market'), fullMark: 5 },
    { dimension: 'ریسک', value: getDimensionAverage(valuationData.risk_score || 0, 'risk'), fullMark: 5 },
  ] : [];

  const overallScore = valuationData?.weighted_score || 
    (radarData.length > 0 ? radarData.reduce((acc, item) => acc + item.value, 0) / radarData.length : 0);

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-amber-600';
    if (score >= 2) return 'text-orange-500';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 4) return 'bg-emerald-50 border-emerald-200';
    if (score >= 3) return 'bg-amber-50 border-amber-200';
    if (score >= 2) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getStatusLabel = (score: number) => {
    if (score >= 4) return '🌟🌟 عالی';
    if (score >= 3) return '👍 خوب';
    if (score >= 2) return '📊 متوسط';
    return '⚠️ ضعیف';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getFileTypeIcon = (type: string) => {
    return FILE_TYPE_ICONS[type as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.document;
  };

  const handleNext = () => {
    saveInputs();
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* هدر مرحله */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold">۲</span>
        <span>مرحله ۲ از ۷</span>
      </div>
      <h2 className="text-xl font-bold text-dark-green">داده پایه</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* بلاک ۱: Asset Base Profile */}
        <Card className="border-2 border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-dark-green to-dark-green/80 px-5 py-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-white/80" />
              <h3 className="text-sm font-bold text-white">پروفایل اطلاعات پایه محصول</h3>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">شناسه مورد</p>
                <p className="text-base font-bold text-dark-green">{formData.assetId || '—'}</p>
              </div>
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">صنعت</p>
                <p className="text-base font-medium text-gray-700">فناوری / نرم‌افزار</p>
              </div>
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">تاریخ ارزش‌گذاری</p>
                <p className="text-base font-medium text-gray-700">{new Date().toLocaleDateString('fa-IR')}</p>
              </div>
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">وضعیت</p>
                <span className="inline-flex items-center gap-1 text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  در حال انجام
                </span>
              </div>
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100 col-span-2">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">نام دارایی</p>
                <p className="text-base font-medium text-gray-700">{formData.name || 'نامشخص'}</p>
              </div>
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100 col-span-2">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">مالک</p>
                <p className="text-base font-medium text-gray-700">{selectedAsset?.created_by_name || 'نامشخص'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* بلاک ۲: Quality Engine Integration */}
        <Card className="border-2 border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-dark-green to-dark-green/80 px-5 py-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-white/80" />
              <h3 className="text-sm font-bold text-white">امتیازات کیفی</h3>
            </div>
          </div>
          <CardContent className="p-5">
            {radarData.length > 0 ? (
              <>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#E5E7EB" strokeWidth={0.5} />
                      <PolarAngleAxis 
                        dataKey="dimension" 
                        tick={{ fill: '#4B5563', fontSize: 9, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 5]} 
                        tick={{ fill: '#9CA3AF', fontSize: 8 }}
                        axisLine={false}
                      />
                      <Radar
                        name="امتیاز"
                        dataKey="value"
                        stroke="#015345"
                        strokeWidth={2}
                        fill="#015345"
                        fillOpacity={0.15}
                        animationDuration={1000}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 rounded-xl shadow-xl border text-xs">
                                <p className="font-bold text-dark-green">{payload[0].payload.dimension}</p>
                                <p className="text-lg font-bold text-dark-green">
                                  {payload[0].value?.toFixed(2)}
                                </p>
                                <p className="text-gray-400">از ۵</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  {Object.entries(DIMENSION_ICONS).map(([key, config]) => {
                    const data = radarData.find(d => d.dimension === config.label);
                    const value = data?.value || 0;
                    const Icon = config.icon;
                    
                    return (
                      <div key={key} className={`p-2 rounded-xl text-center ${config.bg} border border-gray-100`}>
                        <Icon className={`w-4 h-4 mx-auto mb-0.5 ${config.text}`} />
                        <p className="text-[8px] text-gray-500 truncate">{config.label}</p>
                        <p className={`text-sm font-bold ${getScoreColor(value)}`}>
                          {value.toFixed(1)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-dark-green/10 rounded-lg">
                      <Award className="w-4 h-4 text-dark-green" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">امتیاز کلی</p>
                      <p className="text-base font-bold text-dark-green">{overallScore.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreBg(overallScore)}`}>
                    {getStatusLabel(overallScore)}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <PieChart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">هنوز ارزیابی انجام نشده است</p>
                <p className="text-xs mt-1">پس از تکمیل ارزیابی، نمودار نمایش داده می‌شود</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* بلاک ۳: Base Inputs Panel - با قابلیت ویرایش */}
        <Card className="border-2 border-gray-200 shadow-lg lg:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-r from-dark-green to-dark-green/80 px-5 py-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-white/80" />
              <h3 className="text-sm font-bold text-white">پنل ورودی‌های پایه</h3>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">نرخ مالیات</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Input
                    type="number"
                    value={baseInputs.taxRate}
                    onChange={(e) => handleBaseInputChange('taxRate', e.target.value)}
                    className="h-8 text-base font-bold text-gray-800 border-0 bg-transparent px-0 focus-visible:ring-0"
                    placeholder="۲۵"
                  />
                  <span className="text-sm font-medium text-gray-400">%</span>
                </div>
              </div>
              <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">نرخ تنزیل (WACC)</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Input
                    type="number"
                    value={baseInputs.discountRate}
                    onChange={(e) => handleBaseInputChange('discountRate', e.target.value)}
                    className="h-8 text-base font-bold text-gray-800 border-0 bg-transparent px-0 focus-visible:ring-0"
                    placeholder="۱۸"
                  />
                  <span className="text-sm font-medium text-gray-400">%</span>
                </div>
              </div>
              <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">افق پیش‌بینی</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Input
                    type="number"
                    value={baseInputs.forecastHorizon}
                    onChange={(e) => handleBaseInputChange('forecastHorizon', e.target.value)}
                    className="h-8 text-base font-bold text-gray-800 border-0 bg-transparent px-0 focus-visible:ring-0"
                    placeholder="۵"
                  />
                  <span className="text-sm font-medium text-gray-400">سال</span>
                </div>
              </div>
              <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">نرخ رشد نهایی</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Input
                    type="number"
                    value={baseInputs.terminalGrowth}
                    onChange={(e) => handleBaseInputChange('terminalGrowth', e.target.value)}
                    className="h-8 text-base font-bold text-gray-800 border-0 bg-transparent px-0 focus-visible:ring-0"
                    placeholder="۵"
                  />
                  <span className="text-sm font-medium text-gray-400">%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* بلاک ۴: Evidence & Attachments - با قابلیت آپلود */}
        <Card className="border-2 border-gray-200 shadow-lg lg:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-r from-dark-green to-dark-green/80 px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-white/80" />
                <h3 className="text-sm font-bold text-white">شواهد و پیوست‌ها</h3>
              </div>
              {uploadedFiles.length > 0 && (
                <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                  {uploadedFiles.length} فایل
                </span>
              )}
            </div>
          </div>
          <CardContent className="p-5">
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive ? 'border-dark-green bg-dark-green/5' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-dark-green/10 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5 text-dark-green/60" />
                </div>
                <p className="text-sm text-gray-500">فایل‌ها را اینجا بکشید و رها کنید</p>
                <p className="text-xs text-gray-400 mt-0.5">یا</p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-dark-green/30 text-dark-green hover:bg-dark-green/5"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'در حال آپلود...' : 'انتخاب فایل'}
                </Button>
              </div>
            </div>

            {loadingFiles ? (
              <div className="text-center py-4 text-gray-400 text-sm">در حال بارگذاری شواهد...</div>
            ) : uploadedFiles.length > 0 ? (
              <div className="space-y-2 mt-4">
                {uploadedFiles.map((file) => {
                  const fileType = getFileTypeIcon(file.type);
                  const FileIcon = fileType.icon;
                  const isNew = file.id.startsWith('new-');
                  
                  return (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${fileType.bg} flex-shrink-0`}>
                          <FileIcon className={`w-4 h-4 ${fileType.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {file.file_type_label || 'فایل'}
                            </span>
                            <span>•</span>
                            <span>{file.uploadedAt}</span>
                            {file.valuation_score !== undefined && !isNew && (
                              <>
                                <span>•</span>
                                <span className="text-dark-green font-medium">امتیاز: {file.valuation_score}</span>
                              </>
                            )}
                            {isNew && (
                              <span className="text-amber-500 font-medium">جدید</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.file_url && (
                          <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                              <Eye className="w-4 h-4 text-gray-400 hover:text-dark-green" />
                            </Button>
                          </a>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50" onClick={() => removeFile(file.id)}>
                          <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 mt-2">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">هیچ شواهدی برای این دارایی ثبت نشده است</p>
                <p className="text-xs text-gray-300">پس از ارزیابی، فایل‌های شواهد در اینجا نمایش داده می‌شوند</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* دکمه‌های ناوبری */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrev} className="flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          قبلی
        </Button>
        <Button className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1" onClick={handleNext}>
          ادامه
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

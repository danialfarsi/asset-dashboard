'use client';

import { useState, useEffect } from 'react';
import { 
  File, 
  Download, 
  Search, 
  Filter, 
  Mic, 
  FileText, 
  GitBranch, 
  Database,
  Eye,
  ChevronDown,
  ChevronUp,
  Award,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface EvidenceItem {
  id: number;
  question_id: number;
  question_code: string;
  question_text: string;
  dimension: string;
  score: number;
  type: 'interview' | 'document' | 'process' | 'database';
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

interface AssetEvidenceProps {
  assetId: number;
  valuationId: number;
}

const EVIDENCE_ICONS = {
  interview: { icon: Mic, label: 'مصاحبه', color: 'text-purple-600', bg: 'bg-purple-50' },
  document: { icon: FileText, label: 'سند', color: 'text-blue-600', bg: 'bg-blue-50' },
  process: { icon: GitBranch, label: 'فرآیند', color: 'text-amber-600', bg: 'bg-amber-50' },
  database: { icon: Database, label: 'پایگاه داده', color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

const EVIDENCE_TYPES = [
  { key: 'all', label: 'همه', icon: null },
  { key: 'interview', label: 'مصاحبه', icon: Mic },
  { key: 'document', label: 'سند', icon: FileText },
  { key: 'process', label: 'فرآیند', icon: GitBranch },
  { key: 'database', label: 'پایگاه داده', icon: Database },
];

export function AssetEvidence({ assetId, valuationId }: AssetEvidenceProps) {
  const [evidences, setEvidences] = useState<EvidenceItem[]>([]);
  const [filteredEvidences, setFilteredEvidences] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchEvidences();
  }, [assetId, valuationId]);

  useEffect(() => {
    filterEvidences();
  }, [evidences, searchTerm, selectedType]);

  const fetchEvidences = async () => {
    try {
      setLoading(true);
      
      const { data } = await api.get(`/intangible/asset-valuations/${valuationId}/`);
      const answers = data.answers || [];
      
      const evidenceList: EvidenceItem[] = [];
      
      answers.forEach((answer: any) => {
        const types = [
          { key: 'interview', url: answer.evidence_interview },
          { key: 'document', url: answer.evidence_document },
          { key: 'process', url: answer.evidence_process },
          { key: 'database', url: answer.evidence_database },
        ];
        
        types.forEach(({ key, url }) => {
          if (url) {
            evidenceList.push({
              id: answer.id,
              question_id: answer.question,
              question_code: answer.question_code || 'نامشخص',
              question_text: answer.question_text || 'سوال بدون متن',
              dimension: answer.dimension_name || 'نامشخص',
              score: answer.score || 0,
              type: key as any,
              file_url: url,
              file_name: url.split('/').pop() || 'فایل',
              uploaded_at: answer.updated_at || new Date().toISOString(),
            });
          }
        });
      });
      
      setEvidences(evidenceList);
      setFilteredEvidences(evidenceList);
    } catch (error) {
      console.error('Error fetching evidences:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvidences = () => {
    let filtered = [...evidences];
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(e => e.type === selectedType);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.question_code.toLowerCase().includes(term) ||
        e.question_text.toLowerCase().includes(term) ||
        e.dimension.toLowerCase().includes(term) ||
        e.file_name.toLowerCase().includes(term)
      );
    }
    
    setFilteredEvidences(filtered);
  };

  const toggleExpand = (id: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTypeInfo = (type: string) => {
    return EVIDENCE_ICONS[type as keyof typeof EVIDENCE_ICONS] || EVIDENCE_ICONS.document;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getScoreBadge = (score: number) => {
    const colors = {
      5: 'bg-emerald-100 text-emerald-800',
      4: 'bg-green-100 text-green-800',
      3: 'bg-amber-100 text-amber-800',
      2: 'bg-orange-100 text-orange-800',
      1: 'bg-red-100 text-red-800',
    };
    const labels = {
      5: '🌟 عالی',
      4: '👍 خوب',
      3: '📊 متوسط',
      2: '⚠️ ضعیف',
      1: '❌ نیاز به بهبود',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[score as keyof typeof colors] || colors[3]}`}>
        {labels[score as keyof typeof labels] || score}
      </span>
    );
  };

  const totalFiles = evidences.length;
  const uniqueQuestions = new Set(evidences.map(e => e.question_id)).size;
  const typeCounts = evidences.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-green"></div>
            <span className="mr-3 text-gray-500">در حال بارگذاری شواهد...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (evidences.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">هیچ شواهدی برای این دارایی ثبت نشده است</p>
          <p className="text-xs text-gray-400 mt-1">پس از ارزیابی، فایل‌های شواهد در اینجا نمایش داده می‌شوند</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardContent className="p-6 space-y-4">
        {/* هدر */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <File className="w-5 h-5 text-dark-green" />
            <div>
              <h3 className="text-lg font-bold text-dark-green">شواهد ارزیابی</h3>
              <p className="text-sm text-gray-500">
                {totalFiles} فایل شواهد از {uniqueQuestions} سوال مختلف
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {Object.entries(typeCounts).map(([type, count]) => {
              const info = getTypeInfo(type);
              const Icon = info.icon;
              return (
                <span key={type} className="flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {count}
                </span>
              );
            })}
          </div>
        </div>

        {/* فیلترها */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در شواهد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {EVIDENCE_TYPES.map((type) => {
              const isActive = selectedType === type.key;
              const Icon = type.icon;
              return (
                <button
                  key={type.key}
                  onClick={() => setSelectedType(type.key)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5
                    ${isActive 
                      ? 'bg-dark-green text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* لیست شواهد */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredEvidences.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p>هیچ شواهدی با این فیلتر یافت نشد</p>
            </div>
          ) : (
            filteredEvidences.map((evidence) => {
              const typeInfo = getTypeInfo(evidence.type);
              const Icon = typeInfo.icon;
              const isExpanded = expandedItems.has(evidence.id);

              return (
                <div
                  key={`${evidence.id}-${evidence.type}`}
                  className="border rounded-lg hover:shadow-md transition-all"
                >
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExpand(evidence.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-full ${typeInfo.bg} ${typeInfo.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {evidence.question_code}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {evidence.dimension}
                          </span>
                          {getScoreBadge(evidence.score)}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {evidence.question_text}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {typeInfo.label}
                      </span>
                      <a
                        href={evidence.file_url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                      </a>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* جزئیات باز شده */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">نام فایل</p>
                          <p className="font-mono text-xs truncate">{evidence.file_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">تاریخ آپلود</p>
                          <p className="text-xs">{formatDate(evidence.uploaded_at)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-400">متن سوال</p>
                          <p className="text-xs text-gray-700">{evidence.question_text}</p>
                        </div>
                        <div className="md:col-span-2 flex gap-3">
                          <a
                            href={evidence.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-dark-green hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            مشاهده فایل
                          </a>
                          <a
                            href={evidence.file_url}
                            download
                            className="text-xs text-dark-green hover:underline flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            دانلود فایل
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* فوتر */}
        {filteredEvidences.length > 0 && (
          <div className="pt-3 border-t flex items-center justify-between text-xs text-gray-400">
            <span>
              نمایش {filteredEvidences.length} از {totalFiles} فایل
            </span>
            <span>
              {new Set(filteredEvidences.map(e => e.type)).size} نوع شواهد مختلف
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

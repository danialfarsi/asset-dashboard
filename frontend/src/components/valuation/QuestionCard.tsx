'use client';

import { useState } from 'react';
import { ValuationQuestion } from '@/lib/valuation-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Info, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface QuestionCardProps {
  question: ValuationQuestion;
  selectedScore: number | null;
  onScoreSelect: (score: number) => void;
  disabled?: boolean;
}

export function QuestionCard({ question, selectedScore, onScoreSelect, disabled = false }: QuestionCardProps) {
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);

  const sortedGuides = [...(question.score_guides || [])].sort((a, b) => a.score - b.score);

  const toggleGuide = (score: number) => {
    setExpandedGuide(expandedGuide === score ? null : score);
  };

  const handleSelect = (score: number) => {
    if (!disabled) {
      onScoreSelect(score);
      // وقتی گزینه انتخاب می‌شه، راهنماش باز بشه
      setExpandedGuide(score);
    }
  };

  return (
    <Card className="border-r-4 border-r-dark-green hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-dark-green bg-dark-green/10 px-2 py-0.5 rounded-full">
              {question.code}
            </span>
            <span className="text-xs text-gray-400">{question.dimension_name}</span>
          </div>
        </div>
        <CardTitle className="text-sm font-medium text-gray-800 mt-1">
          {question.question_text}
        </CardTitle>
        {question.hint && (
          <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-start gap-2">
            <HelpCircle className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
            <span>{question.hint}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-xs text-gray-500">گزینه مورد نظر را انتخاب کنید:</p>
        
        <div className="space-y-2">
          {sortedGuides.map((guide) => {
            const isSelected = selectedScore === guide.score;
            const isExpanded = expandedGuide === guide.score;

            return (
              <div
                key={guide.score}
                className={`
                  border-2 rounded-lg overflow-hidden transition-all
                  ${isSelected ? 'border-dark-green shadow-sm' : 'border-gray-200'}
                `}
              >
                {/* گزینه */}
                <button
                  onClick={() => handleSelect(guide.score)}
                  disabled={disabled}
                  className={`
                    w-full text-right px-4 py-3 transition-all text-sm flex items-center gap-3
                    ${isSelected ? 'bg-dark-green/5' : 'hover:bg-gray-50'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className={`font-bold min-w-6 ${isSelected ? 'text-dark-green' : 'text-gray-400'}`}>
                    {guide.score}
                  </span>
                  <span className={`flex-1 text-right ${isSelected ? 'text-dark-green font-medium' : 'text-gray-700'}`}>
                    {guide.condition}
                  </span>
                  {isSelected && (
                    <span className="text-dark-green text-xs">✓</span>
                  )}
                </button>

                {/* دکمه مشاهده/بستن راهنما */}
                <button
                  onClick={() => toggleGuide(guide.score)}
                  className={`
                    w-full text-right px-4 py-1.5 text-xs transition-colors flex items-center justify-between gap-1 border-t
                    ${isExpanded ? 'bg-blue-50 text-blue-700' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'}
                  `}
                >
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {isExpanded ? 'بستن راهنما' : 'مشاهده شواهد لازم'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {/* شواهد لازم - فقط وقتی باز باشه */}
                {isExpanded && guide.evidence_required && (
                  <div className={`px-4 py-3 ${isSelected ? 'bg-dark-green/5' : 'bg-blue-50'} border-t border-blue-100`}>
                    <p className="text-xs font-medium text-gray-700 mb-2">📎 شواهد لازم:</p>
                    <div className="bg-white rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap border border-blue-200 leading-relaxed">
                      {guide.evidence_required}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedScore !== null && (
          <div className="flex items-center justify-center gap-2 text-xs text-green-600 border-t pt-2 mt-2">
            <CheckCircle className="w-3 h-3" />
            <span>گزینه {selectedScore} انتخاب شد</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { Label } from '@/components/ui/label';
import { C_QUESTIONS, DiscoveryAnswers } from '@/types/discovery.types';

interface Step3Props {
  answers: DiscoveryAnswers;
  setAnswers: (answers: DiscoveryAnswers) => void;
}

export function Step3_Controllability({ answers, setAnswers }: Step3Props) {
  const handleChange = (id: keyof DiscoveryAnswers, value: boolean) => {
    setAnswers({ ...answers, [id]: value });
  };

  const cStrong = [answers.c1, answers.c2, answers.c3, answers.c4, answers.c5];
  const cStatus = cStrong.some(Boolean) ? 'PASS' : (answers.c6 ? 'CONDITIONAL' : 'FAIL');
  const cScore = [answers.c1, answers.c2, answers.c3, answers.c4, answers.c5, answers.c6, answers.c7].filter(Boolean).length;

  const getStatusColor = () => {
    switch (cStatus) {
      case 'PASS': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'CONDITIONAL': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusText = () => {
    switch (cStatus) {
      case 'PASS': return '✅ شرط کنترل منافع احراز شد (حداقل یکی از C1 تا C5 برقرار است)';
      case 'CONDITIONAL': return '⚠️ کنترل دارایی صرفاً موقعیتی است (فقط C6) - نیاز به رسمی‌سازی قراردادی';
      default: return '❌ شرط کنترل منافع احراز نشد - هیچ مکانیزم کنترلی وجود ندارد';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-green">شرط ۳: کنترل منافع</h2>
          <p className="text-sm text-gray-500 mt-1">
            دارایی باید قابل کنترل باشد. حداقل یکی از <span className="font-bold">C1 تا C5</span> باید برقرار باشد.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">امتیاز:</span>
          <span className={`text-lg font-bold ${cStatus === 'PASS' ? 'text-emerald-600' : cStatus === 'CONDITIONAL' ? 'text-amber-600' : 'text-red-500'}`}>
            {cScore}/7
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {C_QUESTIONS.map((q) => {
          const isStrong = q.id === 'c1' || q.id === 'c2' || q.id === 'c3' || q.id === 'c4' || q.id === 'c5';
          return (
            <div key={q.id} className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
              isStrong ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50'
            } hover:border-dark-green/30`}>
              <div className="flex-1">
                <Label className={`text-sm font-medium ${isStrong ? 'text-blue-700' : 'text-gray-800'}`}>
                  {q.label}
                  {isStrong && <span className="mr-2 text-xs text-blue-500 font-normal">(قوی)</span>}
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">{q.description}</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <button
                  onClick={() => handleChange(q.id as keyof DiscoveryAnswers, true)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    answers[q.id as keyof DiscoveryAnswers] === true
                      ? 'bg-dark-green text-white shadow-sm'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  بله
                </button>
                <button
                  onClick={() => handleChange(q.id as keyof DiscoveryAnswers, false)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    answers[q.id as keyof DiscoveryAnswers] === false
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  خیر
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <p className="text-sm font-medium">{getStatusText()}</p>
        {cStatus === 'CONDITIONAL' && (
          <p className="text-xs text-amber-600 mt-1">
            💡 پیشنهاد: کنترل دارایی از طریق انعقاد قرارداد، ثبت کپی‌رایت یا افزودن بند محرمانگی تقویت شود.
          </p>
        )}
      </div>
    </div>
  );
}

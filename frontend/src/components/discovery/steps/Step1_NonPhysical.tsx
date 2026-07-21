'use client';

import { Label } from '@/components/ui/label';
import { N_QUESTIONS, DiscoveryAnswers } from '@/types/discovery.types';

interface Step1Props {
  answers: DiscoveryAnswers;
  setAnswers: (answers: DiscoveryAnswers) => void;
}

export function Step1_NonPhysical({ answers, setAnswers }: Step1Props) {
  const handleChange = (id: keyof DiscoveryAnswers, value: boolean) => {
    setAnswers({ ...answers, [id]: value });
  };

  const nScore = [answers.n1, answers.n2, answers.n3, answers.n4, answers.n5, answers.n6].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-green">شرط ۱: غیرفیزیکی بودن</h2>
          <p className="text-sm text-gray-500 mt-1">
            دارایی باید ماهیت غیرفیزیکی داشته باشد. حداقل ۲ از ۶ مولفه باید برقرار باشد.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">امتیاز:</span>
          <span className={`text-lg font-bold ${nScore >= 2 ? 'text-emerald-600' : 'text-red-500'}`}>
            {nScore}/6
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {N_QUESTIONS.map((q) => (
          <div key={q.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-dark-green/30 transition-colors">
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-800">{q.label}</Label>
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
        ))}
      </div>

      <div className={`p-4 rounded-lg border ${nScore >= 2 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <p className="text-sm font-medium">
          {nScore >= 2 ? (
            <span className="text-emerald-700">✅ شرط غیرفیزیکی بودن احراز شد ({nScore}/6)</span>
          ) : (
            <span className="text-amber-700">⚠️ حداقل ۲ مولفه باید برقرار باشد. فعلاً {nScore} مورد برقرار است.</span>
          )}
        </p>
      </div>
    </div>
  );
}

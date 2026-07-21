'use client';

import { Label } from '@/components/ui/label';
import { V_QUESTIONS, DiscoveryAnswers } from '@/types/discovery.types';

interface Step4Props {
  answers: DiscoveryAnswers;
  setAnswers: (answers: DiscoveryAnswers) => void;
}

export function Step4_ValueCreation({ answers, setAnswers }: Step4Props) {
  const handleChange = (id: keyof DiscoveryAnswers, value: boolean) => {
    setAnswers({ ...answers, [id]: value });
  };

  const vScore = [answers.v1, answers.v2, answers.v3, answers.v4, answers.v5, answers.v6, answers.v7, answers.v8, answers.v9].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-green">شرط ۴: ارزش‌آفرینی</h2>
          <p className="text-sm text-gray-500 mt-1">
            دارایی باید حداقل یک مسیر ارزش‌آفرینی مشخص داشته باشد. هرچه تعداد مسیرها بیشتر باشد، اولویت ارزش‌گذاری بالاتر است.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">امتیاز:</span>
          <span className={`text-lg font-bold ${vScore >= 1 ? 'text-emerald-600' : 'text-red-500'}`}>
            {vScore}/9
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {V_QUESTIONS.map((q) => (
          <div key={q.id} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-dark-green/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-800">{q.label}</Label>
                <p className="text-xs text-gray-500 mt-0.5">{q.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                <button
                  onClick={() => handleChange(q.id as keyof DiscoveryAnswers, true)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    answers[q.id as keyof DiscoveryAnswers] === true
                      ? 'bg-dark-green text-white shadow-sm'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  بله
                </button>
                <button
                  onClick={() => handleChange(q.id as keyof DiscoveryAnswers, false)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    answers[q.id as keyof DiscoveryAnswers] === false
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  خیر
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`p-4 rounded-lg border ${vScore >= 1 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <p className="text-sm font-medium">
          {vScore >= 1 ? (
            <span className="text-emerald-700">✅ شرط ارزش‌آفرینی احراز شد ({vScore} مسیر ارزش‌آفرینی شناسایی شد)</span>
          ) : (
            <span className="text-red-700">❌ شرط ارزش‌آفرینی احراز نشد - دارایی فاقد توجیه اقتصادی است</span>
          )}
        </p>
        {vScore >= 5 && (
          <p className="text-xs text-emerald-600 mt-1">🌟 اولویت بالای ارزش‌گذاری - دارایی دارای {vScore} مسیر ارزش‌آفرینی است</p>
        )}
      </div>
    </div>
  );
}

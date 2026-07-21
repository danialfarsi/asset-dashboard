'use client';

import { Label } from '@/components/ui/label';
import { I_QUESTIONS, DiscoveryAnswers } from '@/types/discovery.types';

interface Step2Props {
  answers: DiscoveryAnswers;
  setAnswers: (answers: DiscoveryAnswers) => void;
}

export function Step2_Identifiability({ answers, setAnswers }: Step2Props) {
  const handleChange = (id: keyof DiscoveryAnswers, value: boolean) => {
    setAnswers({ ...answers, [id]: value });
  };

  const iStatus = answers.i1 || answers.i2 || answers.i4;
  const iScore = [answers.i1, answers.i2, answers.i3, answers.i4, answers.i5, answers.i6, answers.i7].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-green">شرط ۲: شناسایی‌پذیری</h2>
          <p className="text-sm text-gray-500 mt-1">
            دارایی باید قابل شناسایی و تفکیک باشد. <span className="font-bold">I1</span> یا <span className="font-bold">I2</span> یا <span className="font-bold">I4</span> باید برقرار باشد.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">امتیاز:</span>
          <span className={`text-lg font-bold ${iStatus ? 'text-emerald-600' : 'text-red-500'}`}>
            {iScore}/7
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {I_QUESTIONS.map((q) => {
          const isKey = q.id === 'i1' || q.id === 'i2' || q.id === 'i4';
          return (
            <div key={q.id} className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
              isKey ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50'
            } hover:border-dark-green/30`}>
              <div className="flex-1">
                <Label className={`text-sm font-medium ${isKey ? 'text-blue-700' : 'text-gray-800'}`}>
                  {q.label}
                  {isKey && <span className="mr-2 text-xs text-blue-500 font-normal">(کلیدی)</span>}
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

      <div className={`p-4 rounded-lg border ${iStatus ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <p className="text-sm font-medium">
          {iStatus ? (
            <span className="text-emerald-700">✅ شرط شناسایی‌پذیری احراز شد (I1 یا I2 یا I4 برقرار است)</span>
          ) : (
            <span className="text-red-700">❌ شرط شناسایی‌پذیری احراز نشد. I1، I2 و I4 هیچ‌کدام برقرار نیستند.</span>
          )}
        </p>
      </div>
    </div>
  );
}

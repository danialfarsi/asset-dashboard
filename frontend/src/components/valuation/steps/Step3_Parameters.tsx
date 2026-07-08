'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface Step3Props {
  selectedMethod: string;
  isMethodConfirmed: boolean;
  onMethodConfirm: (confirmed: boolean) => void;
  onMethodSelect: (methodId: string) => void;
  onNext: () => void;
  onPrev: () => void;
  methods: { id: string; name: string; description: string }[];
}

export function Step3_Parameters({
  selectedMethod,
  isMethodConfirmed,
  onMethodConfirm,
  onMethodSelect,
  onNext,
  onPrev,
  methods,
}: Step3Props) {
  const getMethodById = (id: string) => methods.find(m => m.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold">۳</span>
        <span>مرحله ۳ از ۷</span>
      </div>
      <h2 className="text-xl font-bold text-dark-green">پارامترهای اختصاصی</h2>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-dark-green/10 rounded-full">
            <AlertCircle className="w-5 h-5 text-dark-green" />
          </div>
          <div>
            <p className="text-sm font-medium text-dark-green">
              روش انتخاب شده: {getMethodById(selectedMethod)?.id} - {getMethodById(selectedMethod)?.name}
            </p>
            <p className="text-sm text-gray-600 mt-1">{getMethodById(selectedMethod)?.description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>تأیید انتخاب روش</Label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onMethodConfirm(true)}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              isMethodConfirmed
                ? 'border-dark-green bg-dark-green/10 text-dark-green'
                : 'border-gray-300 hover:border-dark-green'
            }`}
          >
            ✅ تأیید روش پیشنهادی
          </button>
          <button
            onClick={() => onMethodConfirm(false)}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              !isMethodConfirmed
                ? 'border-amber-400 bg-amber-50 text-amber-600'
                : 'border-gray-300 hover:border-amber-400'
            }`}
          >
            انتخاب روش جایگزین
          </button>
        </div>
      </div>

      {!isMethodConfirmed && (
        <div className="space-y-2">
          <Label>روش جایگزین</Label>
          <Select value={selectedMethod} onValueChange={onMethodSelect}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {methods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {method.id} - {method.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 ml-1" />
          قبلی
        </Button>
        <Button className="bg-dark-green hover:bg-dark-green/90" onClick={onNext}>
          ادامه
          <ChevronRight className="w-4 h-4 mr-1" />
        </Button>
      </div>
    </div>
  );
}

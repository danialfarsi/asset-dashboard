'use client';

import { useState } from 'react';

interface Step10OperationalModelProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

export function Step10OperationalModel({ onComplete, initialData }: Step10OperationalModelProps) {
  const [processes, setProcesses] = useState<string[]>(initialData?.processes || ['']);
  const [workflows, setWorkflows] = useState<string[]>(initialData?.workflows || ['']);
  const [kpis, setKpis] = useState<string[]>(initialData?.kpis || ['']);

  const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string[] = ['']) => {
    setter([...value, '']);
  };

  const removeField = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string[]) => {
    if (value.length > 1) {
      setter(value.filter((_, i) => i !== index));
    }
  };

  const updateField = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    newValue: string,
    value: string[]
  ) => {
    const updated = [...value];
    updated[index] = newValue;
    setter(updated);
  };

  const handleSubmit = () => {
    const filteredProcesses = processes.filter(p => p.trim());
    const filteredWorkflows = workflows.filter(w => w.trim());
    const filteredKpis = kpis.filter(k => k.trim());

    if (filteredProcesses.length === 0) {
      alert('لطفاً حداقل یک فرآیند وارد کنید');
      return;
    }

    onComplete({
      processes: filteredProcesses,
      workflows: filteredWorkflows,
      kpis: filteredKpis,
      completed: true
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۱۰:</strong> مدل عملیاتی IAM را تعریف کنید. فرآیندها، گردش‌کارها و KPIهای کلیدی را مشخص کنید.
        </p>
      </div>

      {/* فرآیندها */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          فرآیندهای اصلی <span className="text-red-500">*</span>
        </label>
        {processes.map((process, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={process}
              onChange={(e) => updateField(setProcesses, index, e.target.value, processes)}
              placeholder={`فرآیند ${index + 1}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="button"
              onClick={() => removeField(setProcesses, index, processes)}
              className="px-3 py-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addField(setProcesses, processes)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + افزودن فرآیند
        </button>
      </div>

      {/* گردش‌کارها */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          گردش‌کارها
        </label>
        {workflows.map((workflow, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={workflow}
              onChange={(e) => updateField(setWorkflows, index, e.target.value, workflows)}
              placeholder={`گردش‌کار ${index + 1}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="button"
              onClick={() => removeField(setWorkflows, index, workflows)}
              className="px-3 py-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addField(setWorkflows, workflows)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + افزودن گردش‌کار
        </button>
      </div>

      {/* KPIها */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          KPIهای کلیدی
        </label>
        {kpis.map((kpi, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={kpi}
              onChange={(e) => updateField(setKpis, index, e.target.value, kpis)}
              placeholder={`KPI ${index + 1}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="button"
              onClick={() => removeField(setKpis, index, kpis)}
              className="px-3 py-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addField(setKpis, kpis)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + افزودن KPI
        </button>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
      >
        تأیید و ادامه
      </button>
    </div>
  );
}

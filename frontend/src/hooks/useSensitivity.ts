import { useState, useCallback } from 'react';
import sensitivityService, { SensitivityResult } from '@/services/sensitivity.service';

export function useSensitivity() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SensitivityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (valuationCaseId: number, methodId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await sensitivityService.calculate(valuationCaseId, methodId);
      setResults(data);
      return data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'خطا در محاسبه تحلیل حساسیت';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResults = useCallback(async (valuationCaseId: number, methodId: string) => {
    try {
      const data = await sensitivityService.getResults(valuationCaseId, methodId);
      if (data) {
        setResults(data);
      }
      return data;
    } catch (err) {
      console.error('Error loading results:', err);
      return null;
    }
  }, []);

  return {
    results,
    loading,
    error,
    calculate,
    loadResults
  };
}

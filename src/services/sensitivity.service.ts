import api from '@/lib/api';

export async function calculateSensitivity(valuationCaseId: number, methodId: string, drivers?: any[]) {
  try {
    // 🔥 حتماً / در انتهای آدرس باشد
    const response = await api.post('/intangible/sensitivity/calculate/', {
      valuation_case_id: valuationCaseId,
      method_id: methodId,
      drivers: drivers || []
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating sensitivity:', error);
    throw error;
  }
}

export async function getSensitivityResults(valuationCaseId: number, methodId: string) {
  try {
    const response = await api.get('/intangible/sensitivity/', {
      params: {
        valuation_case: valuationCaseId,
        method_id: methodId
      }
    });
    return response.data.results || [];
  } catch (error) {
    console.error('Error getting sensitivity results:', error);
    return [];
  }
}

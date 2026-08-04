import api from '@/lib/api';

export interface SensitivityResult {
  status: string;
  step6_status: string;
  sensitivity_dashboard: {
    pessimistic_value: number;
    base_value: number;
    optimistic_value: number;
    pessimistic_change_percent: number;
    optimistic_change_percent: number;
  };
  key_drivers: Array<{
    driver_id: string;
    driver_name: string;
    base_value: number;
    low_range: number;
    high_range: number;
    impact_percent: number;
    sensitivity_results: Array<{
      driver_value: number;
      result_value: number;
    }>;
    low_result: number;
    high_result: number;
  }>;
  tornado_ranking: Array<{
    driver_id: string;
    driver_name: string;
    impact_percent: number;
  }>;
  scenarios: Record<string, {
    id: string;
    label_fa: string;
    label_en?: string;
    color: string;
    value: number;
    change_percent: number;
    description_fa?: string;
  }>;
  confidence_band: {
    low: number;
    base: number;
    high: number;
    confidence_level_percent: number;
    range_percent: number;
  };
  sensitivity_id: number;
}

class SensitivityService {
  // توجه: اینجا فقط مسیر رو می‌دیم، چون api.ts قبلاً baseURL رو داره
  private readonly baseUrl = '/intangible/sensitivity';

  async calculate(valuationCaseId: number, methodId: string): Promise<SensitivityResult> {
    try {
      console.log('📤 Sending request:', { valuation_case_id: valuationCaseId, method_id: methodId });
      
      const response = await api.post(`${this.baseUrl}/calculate/`, {
        valuation_case_id: valuationCaseId,
        method_id: methodId
      });
      
      console.log('📥 Response received:', response.status);
      return response.data;
    } catch (error: any) {
      console.error('❌ API Error:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        throw new Error(error.response.data?.error || `خطای ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        console.error('No response received');
        throw new Error('سرور پاسخ نمی‌دهد. لطفاً اتصال خود را بررسی کنید.');
      } else {
        throw new Error(error.message || 'خطا در ارتباط با سرور');
      }
    }
  }

  async getResults(valuationCaseId: number, methodId: string): Promise<SensitivityResult | null> {
    try {
      const response = await api.get(`${this.baseUrl}/`, {
        params: {
          valuation_case: valuationCaseId,
          method_id: methodId
        }
      });
      const results = response.data.results || [];
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error loading results:', error);
      return null;
    }
  }
}

export default new SensitivityService();

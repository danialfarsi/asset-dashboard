import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// 🔥 کش کردن Organization Types
export const useOrganizationTypes = () => {
  return useQuery({
    queryKey: ['organizationTypes'],
    queryFn: async () => {
      const { data } = await api.get('/intangible/organization-types/');
      return data.results || data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
};

// 🔥 کش کردن Screening Templates
export const useScreeningTemplates = (orgType?: string) => {
  return useQuery({
    queryKey: ['screeningTemplates', orgType],
    queryFn: async () => {
      if (!orgType) return [];
      const { data } = await api.get(`/intangible/screening-templates/?organization_type=${orgType}`);
      return data.results || data || [];
    },
    enabled: !!orgType,
    staleTime: 10 * 60 * 1000,
  });
};

// 🔥 کش کردن دارایی‌ها
export const useScreenedAssets = (params?: any) => {
  return useQuery({
    queryKey: ['screenedAssets', params],
    queryFn: async () => {
      const { data } = await api.get('/intangible/screened-assets/', { params });
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// 🔥 کش کردن ارزیابی‌ها
export const useValuations = (params?: any) => {
  return useQuery({
    queryKey: ['valuations', params],
    queryFn: async () => {
      const { data } = await api.get('/intangible/asset-valuations/', { params });
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// 🔥 کش کردن یک دارایی خاص
export const useAssetDetail = (assetId: number) => {
  return useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const { data } = await api.get(`/intangible/screened-assets/${assetId}/`);
      return data;
    },
    enabled: !!assetId,
    staleTime: 5 * 60 * 1000,
  });
};

// 🔥 کش کردن فایل‌های یک دارایی
export const useAssetFiles = (assetId: number) => {
  return useQuery({
    queryKey: ['assetFiles', assetId],
    queryFn: async () => {
      const { data } = await api.get(`/intangible/asset-files/?asset=${assetId}`);
      return data.results || data || [];
    },
    enabled: !!assetId,
    staleTime: 5 * 60 * 1000,
  });
};

// 🔥 کش کردن STEP 4
export const useStep4 = (valuationCaseId: number) => {
  return useQuery({
    queryKey: ['step4', valuationCaseId],
    queryFn: async () => {
      const { data } = await api.get(`/intangible/valuation-step4/?valuation_case=${valuationCaseId}`);
      return data.results || data || [];
    },
    enabled: !!valuationCaseId,
    staleTime: 5 * 60 * 1000,
  });
};

// 🔥 کش کردن QC
export const useQC = (valuationCaseId: number) => {
  return useQuery({
    queryKey: ['qc', valuationCaseId],
    queryFn: async () => {
      const { data } = await api.get(`/intangible/valuation-qc/?valuation_case=${valuationCaseId}`);
      return data.results || data || [];
    },
    enabled: !!valuationCaseId,
    staleTime: 5 * 60 * 1000,
  });
};

// 🔥 کش کردن نوتیفیکیشن‌ها
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/intangible/notifications/');
      return data.results || data || [];
    },
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};

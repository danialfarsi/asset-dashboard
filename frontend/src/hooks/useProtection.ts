import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { protectionApi } from '@/lib/protection-api';

export const useProtectionList = () => {
  return useQuery({
    queryKey: ['protection', 'list'],
    queryFn: async () => {
      const response = await protectionApi.list();
      return response.data; // 🔥 اصلاح
    },
  });
};

export const useProtectionDetail = (id: number) => {
  return useQuery({
    queryKey: ['protection', id],
    queryFn: async () => {
      const response = await protectionApi.get(id);
      return response.data; // 🔥 اصلاح
    },
    enabled: !!id,
  });
};

export const useProtectionFull = (id: number) => {
  return useQuery({
    queryKey: ['protection', id, 'full'],
    queryFn: async () => {
      const response = await protectionApi.getFull(id);
      console.log('🔍 API Response for full:', response);
      return response; // 🔥 چون getFull خودش data رو برمی‌گردونه
    },
    enabled: !!id,
    retry: 1,
  });
};

export const useProtectionStep1 = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      protectionApi.step1(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['protection', id, 'full'] });
    },
  });
};

export const useProtectionStep2 = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      protectionApi.step2(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['protection', id, 'full'] });
    },
  });
};

export const useProtectionStep3 = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      protectionApi.step3(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['protection', id, 'full'] });
    },
  });
};

export const useProtectionStep4 = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      protectionApi.step4(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['protection', id, 'full'] });
    },
  });
};

export const useProtectionStep5 = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      protectionApi.step5(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['protection', id, 'full'] });
    },
  });
};

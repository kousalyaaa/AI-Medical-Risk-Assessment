import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/integrations/api/client';

export interface DietPlan {
  id: string;
  user_id: string;
  assessment_id: string | null;
  plan_content: string;
  risk_type: string;
  created_at: string;
}

export interface CreateDietPlanInput {
  assessment_id?: string;
  plan_content: string;
  risk_type: string;
}

export const useDietPlans = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['diet-plans'],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const response = await apiClient.get('/diet-plans');
      return response.data as DietPlan[];
    },
    enabled: false, // Don't fetch automatically
    retry: 1,
  });

  // Manual refetch function that can be called after generation
  const refetch = () => {
    return query.refetch();
  };

  return { ...query, refetch };
};

export const useCreateDietPlan = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDietPlanInput) => {
      if (!user) throw new Error('Not authenticated');

      const response = await apiClient.post('/diet-plans', input);
      return response.data as DietPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
    },
  });
};

export const useGenerateDietPlan = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentId?: string) => {
      if (!user) throw new Error('Not authenticated');

      const response = await apiClient.post('/diet-plans/generate', { assessmentId });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Diet plan generated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
    },
    onError: (error) => {
      console.error('Failed to generate diet plan:', error);
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/integrations/api/client';
import { useAuth } from '@/contexts/AuthContext';

export type AssessmentType = 'heart' | 'diabetes' | 'stroke' | 'kidney' | 'general';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Assessment {
  id: string;
  user_id: string;
  assessment_type: AssessmentType;
  risk_level: RiskLevel;
  risk_score: number | null;
  assessment_data: Record<string, any>; // The actual field from backend
  input_data?: Record<string, any>; // Legacy/Fallback
  recommendations: string[] | null;
  created_at: string;
}

export interface CreateAssessmentInput {
  assessment_type: AssessmentType;
  risk_level: RiskLevel;
  risk_score?: number;
  input_data: Record<string, any>;
  recommendations?: string[];
}

export const useAssessments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assessments', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const response = await apiClient.get('/assessments');
      return response.data as Assessment[];
    },
    enabled: !!user,
  });
};

export const useRecentAssessments = (limit = 5) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assessments', 'recent', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const response = await apiClient.get(`/assessments?limit=${limit}`);
      return response.data as Assessment[];
    },
    enabled: !!user,
  });
};

export const useLatestAssessmentByType = (type: AssessmentType) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assessments', 'latest', type, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const response = await apiClient.get(`/assessments/latest/${type}`);
      return response.data as Assessment | null;
    },
    enabled: !!user,
  });
};

export const useCreateAssessment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAssessmentInput) => {
      if (!user) throw new Error('Not authenticated');

      const response = await apiClient.post('/assessments', input);
      return response.data as Assessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
};

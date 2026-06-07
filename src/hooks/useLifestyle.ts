import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/integrations/api/client';

export interface LifestyleAnalysis {
  id: string;
  user_id: string;
  analysis_content: string;
  created_at: string;
}

export interface CreateLifestyleAnalysisInput {
  assessment_id?: string;
  analysis_content: string;
}

export const useLifestyleAnalyses = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['lifestyle-analyses', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const response = await apiClient.get('/lifestyle-analyses');
      const analyses = response.data as LifestyleAnalysis[];
      
      // Sort by created_at descending to get most recent first
      return analyses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: false, // Don't fetch automatically
    retry: 1,
  });

  return {
    ...query,
    refetch: () => query.refetch(),
  };
};

export const useCreateLifestyleAnalysis = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLifestyleAnalysisInput) => {
      if (!user) throw new Error('Not authenticated');

      const response = await apiClient.post('/lifestyle-analyses', input);
      return response.data as LifestyleAnalysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifestyle-analyses'] });
    },
  });
};

export const useGenerateLifestyleAnalysis = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentId?: string) => {
      console.log('useGenerateLifestyleAnalysis - mutationFn:');
      console.log('- User:', user);
      console.log('- Assessment ID:', assessmentId);
      console.log('- Token in localStorage:', localStorage.getItem('access_token'));
      
      if (!user) throw new Error('Not authenticated');

      try {
        const response = await apiClient.post('/lifestyle-analyses/generate', { assessmentId });
        console.log('useGenerateLifestyleAnalysis - API call successful:');
        console.log('- Response status:', response.status);
        console.log('- Response data:', response.data);
        return response.data as LifestyleAnalysis;
      } catch (error) {
        console.error('useGenerateLifestyleAnalysis - API call failed:');
        console.error('- Error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('useGenerateLifestyleAnalysis - onSuccess:');
      console.log('- Generated analysis:', data);
      queryClient.invalidateQueries({ queryKey: ['lifestyle-analyses'] });
    },
    onError: (error) => {
      console.error('useGenerateLifestyleAnalysis - onError:');
      console.error('- Error:', error);
    },
  });
};

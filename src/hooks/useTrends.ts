import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/integrations/api/client';

export interface TimelineEntry {
  date: string;
  assessment_type: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface RiskProgression {
  from: number;
  to: number;
  change: number;
  percentage_change: number;
}

export interface MajorFactor {
  factor: string;
  score: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ContributingFactor {
  name: string;
  value: string;
  impact: number;
  category: 'age' | 'glucose' | 'bmi' | 'bp' | 'cholesterol' | 'lifestyle' | 'genetics';
}

export interface TrendsData {
  timeline: TimelineEntry[];
  riskProgression: RiskProgression | null;
  metabolicRiskIndex: number;
  majorFactors: MajorFactor[];
  contributingFactors: ContributingFactor[];
}

export interface SimulationParams {
  current_bmi?: number;
  target_bmi?: number;
  current_glucose?: number;
  target_glucose?: number;
  current_blood_pressure?: number;
  target_blood_pressure?: number;
}

export interface SimulationResult {
  current_score: number;
  projected_score: number;
  improvement: number;
  breakdown: {
    bmi_improvement: number;
    glucose_improvement: number;
    bp_improvement: number;
  };
}

export const useTrends = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trends', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const response = await apiClient.get('/trends');
      return response.data as TrendsData;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data fresh
    gcTime: 1000 * 60 * 5, // Keep cache for 5 minutes
  });
};

export const useSimulateImprovement = () => {
  return useMutation({
    mutationFn: async (params: SimulationParams) => {
      const response = await apiClient.post('/trends/simulation', {
        parameters: params,
      });
      return response.data as SimulationResult;
    },
  });
};

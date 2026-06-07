import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLatestAssessmentByType, AssessmentType } from '@/hooks/useAssessments';
import { Brain, Heart, Activity, Stethoscope, ArrowRight } from 'lucide-react';
import { BodyRiskMap } from '@/components/dashboard/BodyRiskMap';
import { motion } from 'framer-motion';

const BodyMap = () => {
  const [selectedOrgan, setSelectedOrgan] = useState<AssessmentType | null>(null);
  const navigate = useNavigate();

  // Fetch latest data for all organs to color the map
  const { data: heartError } = useLatestAssessmentByType('heart');
  const { data: diabetesError } = useLatestAssessmentByType('diabetes');
  const { data: strokeError } = useLatestAssessmentByType('stroke');
  const { data: kidneyError } = useLatestAssessmentByType('kidney');

  // We need the actual data objects, not just the error/status. 
  // Wait, useLatestAssessmentByType returns { data, isLoading, error }.
  // I will rename variables to avoid conflicts
  const heartQuery = useLatestAssessmentByType('heart');
  const diabetesQuery = useLatestAssessmentByType('diabetes');
  const strokeQuery = useLatestAssessmentByType('stroke');
  const kidneyQuery = useLatestAssessmentByType('kidney');

  const risks = {
    heart: heartQuery.data?.risk_level ?? null,
    diabetes: diabetesQuery.data?.risk_level ?? null,
    stroke: strokeQuery.data?.risk_level ?? null,
    kidney: kidneyQuery.data?.risk_level ?? null,
  };

  const handleOrganClick = (type: AssessmentType) => {
    setSelectedOrgan(type);
  };

  // Re-fetch selected organ data for the dialog specifically (or just use the already fetched data?)
  // The existing hook implementation `useLatestAssessmentByType` caches, so calling it again is fine, 
  // or we can select from the 4 queries above.
  // To minimize change specific to the Dialog logic, I'll keep the top-level `assessment` for the dialog 
  // but updated it to use the new `selectedOrgan` state.

  // Fetch selected organ data for the dialog
  const { data: assessment, isLoading } = useLatestAssessmentByType(selectedOrgan as AssessmentType);

  const organData = {
    stroke: { label: 'Brain', icon: Brain, description: 'Stroke Risk Analysis' },
    heart: { label: 'Heart', icon: Heart, description: 'Cardiovascular Health' },
    diabetes: { label: 'Pancreas', icon: Activity, description: 'Diabetes & Metabolism' },
    kidney: { label: 'Kidneys', icon: Stethoscope, description: 'Renal Function' },
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-display font-bold">Body Risk Map</h1>
          <p className="text-muted-foreground">Click on an organ to view your health status.</p>
        </div>

        <div className="flex-1 relative bg-slate-50 dark:bg-slate-900 rounded-xl border border-border p-8 flex items-center justify-center overflow-hidden">

          <div className="w-full h-full flex items-center justify-center p-4">
            <BodyRiskMap
              risks={risks}
              onPartClick={(part) => handleOrganClick(part as AssessmentType)}
              showInfoPopup={false}
            />
          </div>

          <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
            Click on highlighted areas to view details.
          </div>
        </div>

        {/* Details Dialog */}
        <Dialog open={!!selectedOrgan} onOpenChange={(open) => !open && setSelectedOrgan(null)}>
          <DialogContent className="sm:max-w-md border-2 border-primary/20 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-4">
                {selectedOrgan && organData[selectedOrgan as keyof typeof organData]?.icon && (
                  <div className={`p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20`}>
                    {(() => {
                      const Icon = organData[selectedOrgan as keyof typeof organData].icon;
                      return <Icon className="w-8 h-8 text-primary" />;
                    })()}
                  </div>
                )}
                <div>
                  <DialogTitle className="text-xl">
                    {selectedOrgan ? `Hi, I am your ${organData[selectedOrgan as keyof typeof organData].label}!` : ''}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    {selectedOrgan ? "Here's what you told me about my health:" : ''}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground animate-pulse">Reading your health data...</div>
              ) : assessment ? (
                <div className="space-y-6">
                  {/* Risk Badge */}
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                    <span className="font-medium text-sm">Based on your inputs, my risk level is:</span>
                    <Badge variant={assessment.risk_level === 'low' ? 'default' : assessment.risk_level === 'medium' ? 'secondary' : 'destructive'} className="uppercase px-3 py-1 text-xs font-bold tracking-wider">
                      {assessment.risk_level} {assessment.risk_score ? `(${Math.round(assessment.risk_score)}%)` : ''}
                    </Badge>
                  </div>

                  {/* Inputs List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Your Inputs
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {(() => {
                        // The backend returns 'assessment_data', checking both to be safe
                        const inputs = assessment.assessment_data || assessment.input_data || {};
                        // Define priority keys for each organ type
                        const priorityKeys: Record<string, string[]> = {
                          heart: ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'],
                          diabetes: ['pregnancies', 'glucose', 'blood_pressure', 'skin_thickness', 'insulin', 'bmi', 'diabetes_pedigree', 'age'],
                          stroke: ['gender', 'age', 'hypertension', 'heart_disease', 'ever_married', 'work_type', 'Residence_type', 'avg_glucose_level', 'bmi', 'smoking_status'],
                          kidney: ['age', 'blood_pressure', 'specific_gravity', 'albumin', 'sugar', 'red_blood_cells', 'pus_cell', 'pus_cell_clumps', 'bacteria', 'blood_glucose_random', 'blood_urea', 'serum_creatinine', 'sodium', 'potassium', 'haemoglobin', 'packed_cell_volume', 'white_blood_cell_count', 'red_blood_cell_count', 'hypertension', 'diabetes_mellitus', 'coronary_artery_disease', 'appetite', 'peda_edema', 'aanemia']
                        };

                        const keysToShow = priorityKeys[assessment.assessment_type] || Object.keys(inputs);

                        // Filter inputs to only show those that exist and map them
                        let validEntries = Object.entries(inputs)
                          .filter(([key]) => keysToShow.includes(key));

                        // Fallback: If no priority keys match (e.g. different casing/naming), show all non-empty values
                        if (validEntries.length === 0) {
                          validEntries = Object.entries(inputs).filter(([key, value]) => value !== null && value !== '' && key !== 'id' && key !== 'user_id' && key !== 'created_at');
                        }

                        if (validEntries.length === 0) {
                          return <div className="text-sm text-muted-foreground">No specific input data recorded.</div>;
                        }

                        return validEntries.map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-card border hover:border-primary/50 transition-colors">
                            <span className="text-sm font-medium capitalize text-muted-foreground">
                              {key.replace(/_/g, ' ').replace('cp', 'Chest Pain').replace('trestbps', 'Resting BP').replace('chol', 'Cholesterol').replace('thalach', 'Max Heart Rate').replace('exang', 'Exercise Angina')}
                            </span>
                            <span className="font-bold text-foreground">{String(value)}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-muted-foreground text-center">
                    Analysis from your assessment on {new Date(assessment.created_at).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">I don't have enough data yet!</p>
                  <Button onClick={() => navigate(`/assessments?type=${selectedOrgan}`)} className="w-full">
                    Check my health <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default BodyMap;

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAssessments, AssessmentType, Assessment } from '@/hooks/useAssessments';
import { calculateRisk, getRecommendations } from '@/utils/riskUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

const Trends = () => {
  const { data: assessments, isLoading } = useAssessments();
  const [selectedType, setSelectedType] = useState<AssessmentType | 'all'>('all');
  const [simulationType, setSimulationType] = useState<AssessmentType>('heart');
  const [simulatedValues, setSimulatedValues] = useState<Record<string, number>>({});

  // --- Data Processing ---
  const filteredAssessments = useMemo(() => {
    if (!assessments) return [];
    return assessments
      .filter(a => selectedType === 'all' || a.assessment_type === selectedType)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [assessments, selectedType]);

  const chartData = useMemo(() => {
    return filteredAssessments.map(a => ({
      date: new Date(a.created_at).toLocaleDateString(),
      score: a.risk_score || 0,
      type: a.assessment_type,
    }));
  }, [filteredAssessments]);

  const latestAssessment = useMemo(() => {
    if (!assessments) return null;
    return assessments.reduce((latest, current) => {
      return new Date(latest.created_at) > new Date(current.created_at) ? latest : current;
    }, assessments[0]);
  }, [assessments]);

  const metabolicRiskIndex = useMemo(() => {
    if (!assessments || assessments.length === 0) return 0;
    // Simple average of latest scores for distinct types
    const latestByType: Record<string, number> = {};
    assessments.forEach(a => {
      if (!latestByType[a.assessment_type] || new Date(a.created_at) > new Date(latestByType[a.assessment_type + '_date'])) {
        latestByType[a.assessment_type] = a.risk_score || 0;
        latestByType[a.assessment_type + '_date'] = new Date(a.created_at).getTime();
      }
    });

    const scores = Object.keys(latestByType).filter(k => !k.endsWith('_date')).map(k => latestByType[k]);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }, [assessments]);

  // --- Simulation Logic ---
  const handleSimulationChange = (field: string, value: number) => {
    setSimulatedValues(prev => ({ ...prev, [field]: value }));
  };

  const currentSimulatedRisk = useMemo(() => {
    // Merge base values (default) with simulated values
    const baseValues: Record<string, string> = {
      age: '45',
      bmi: '25',
      glucose: '100',
      resting_bp: '120',
      cholesterol: '200',
      blood_pressure: '120',
      top_blood_pressure: '120', // alias
      ...Object.fromEntries(Object.entries(simulatedValues).map(([k, v]) => [k, String(v)]))
    };
    return calculateRisk(simulationType, baseValues);
  }, [simulationType, simulatedValues]);


  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Trends & Monitoring</h1>
          <p className="text-muted-foreground">Track your health progress and simulate improvements.</p>
        </div>

        {/* Metabolic Risk Index */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-background border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Metabolic Risk Index
              </CardTitle>
              <CardDescription>Combined health risk score</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="relative flex items-center justify-center w-32 h-32 rounded-full border-8 border-indigo-100 dark:border-indigo-900">
                <span className="text-4xl font-bold text-indigo-700 dark:text-indigo-300">{Math.round(metabolicRiskIndex)}</span>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm font-medium">{metabolicRiskIndex < 30 ? 'Healthy' : metabolicRiskIndex < 60 ? 'Moderate Risk' : 'High Risk'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Insights (XAI)</CardTitle>
              <CardDescription>Why you might be at risk</CardDescription>
            </CardHeader>
            <CardContent>
              {latestAssessment ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                    {latestAssessment.risk_level === 'high' ? <AlertTriangle className="text-red-500 w-6 h-6 mt-1" /> : <CheckCircle className="text-green-500 w-6 h-6 mt-1" />}
                    <div>
                      <h4 className="font-semibold">{latestAssessment.assessment_type.toUpperCase()} Assessment: {latestAssessment.risk_level.toUpperCase()} Risk</h4>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                        {latestAssessment.recommendations?.slice(0, 3).map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No assessments found. Complete an assessment to see insights.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="progression" className="space-y-6">
          <TabsList>
            <TabsTrigger value="progression">Risk Progression</TabsTrigger>
            <TabsTrigger value="simulation">Improvement Simulation</TabsTrigger>
          </TabsList>

          <TabsContent value="progression">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Health Risk Timeline</CardTitle>
                  <CardDescription>Track your risk scores over time</CardDescription>
                </div>
                <Select value={selectedType} onValueChange={(v: any) => setSelectedType(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="heart">Heart</SelectItem>
                    <SelectItem value="diabetes">Diabetes</SelectItem>
                    <SelectItem value="kidney">Kidney</SelectItem>
                    <SelectItem value="stroke">Stroke</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" name="Risk Score" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulation">
            <Card>
              <CardHeader>
                <CardTitle>What-If Analysis</CardTitle>
                <CardDescription>Adjust factors to see how they impact your risk</CardDescription>
                <div className="mt-4">
                  <Select value={simulationType} onValueChange={(v: any) => setSimulationType(v)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heart">Heart Disease</SelectItem>
                      <SelectItem value="diabetes">Diabetes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {simulationType === 'heart' && (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium">Systolic BP: {simulatedValues.resting_bp || 120} mmHg</label>
                          </div>
                          <Slider
                            value={[simulatedValues.resting_bp || 120]}
                            min={90} max={200} step={1}
                            onValueChange={([v]) => handleSimulationChange('resting_bp', v)}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium">Cholesterol: {simulatedValues.cholesterol || 200} mg/dl</label>
                          </div>
                          <Slider
                            value={[simulatedValues.cholesterol || 200]}
                            min={100} max={400} step={1}
                            onValueChange={([v]) => handleSimulationChange('cholesterol', v)}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium">Max Heart Rate: {simulatedValues.max_hr || 150}</label>
                          </div>
                          <Slider
                            value={[simulatedValues.max_hr || 150]}
                            min={60} max={220} step={1}
                            onValueChange={([v]) => handleSimulationChange('max_hr', v)}
                          />
                        </div>
                      </>
                    )}

                    {simulationType === 'diabetes' && (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium">Glucose: {simulatedValues.glucose || 100} mg/dl</label>
                          </div>
                          <Slider
                            value={[simulatedValues.glucose || 100]}
                            min={50} max={300} step={1}
                            onValueChange={([v]) => handleSimulationChange('glucose', v)}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium">BMI: {simulatedValues.bmi || 25}</label>
                          </div>
                          <Slider
                            value={[simulatedValues.bmi || 25]}
                            min={15} max={50} step={0.1}
                            onValueChange={([v]) => handleSimulationChange('bmi', v)}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium">Age: {simulatedValues.age || 45}</label>
                          </div>
                          <Slider
                            value={[simulatedValues.age || 45]}
                            min={20} max={90} step={1}
                            onValueChange={([v]) => handleSimulationChange('age', v)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <h3 className="text-lg font-medium mb-4">Simulated Risk Score</h3>
                    <div className="relative flex items-center justify-center w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                        <circle
                          cx="80" cy="80" r="70"
                          stroke="currentColor" strokeWidth="10" fill="transparent"
                          strokeDasharray={440}
                          strokeDashoffset={440 - (440 * currentSimulatedRisk.score) / 100}
                          className={`transition-all duration-500 ease-out ${currentSimulatedRisk.level === 'low' ? 'text-green-500' :
                              currentSimulatedRisk.level === 'medium' ? 'text-yellow-500' : 'text-red-500'
                            }`}
                        />
                      </svg>
                      <span className="absolute text-3xl font-bold">{Math.round(currentSimulatedRisk.score)}%</span>
                    </div>
                    <div className="mt-4 text-center">
                      <Badge variant={currentSimulatedRisk.level === 'low' ? 'default' : currentSimulatedRisk.level === 'medium' ? 'secondary' : 'destructive'}>
                        {currentSimulatedRisk.level.toUpperCase()}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        {currentSimulatedRisk.level === 'low' ? 'Low Risk: Keep up the good work!' :
                          currentSimulatedRisk.level === 'medium' ? 'Moderate Risk: Improvements recommended.' : 'High Risk: Action required.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Trends;

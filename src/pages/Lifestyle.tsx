import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAssessments } from '@/hooks/useAssessments';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Activity, Sparkles, Moon, Sun, Heart, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const Lifestyle = () => {
  const { data: assessments, isLoading: isLoadingAssessments } = useAssessments();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!selectedAssessmentId) {
      toast({ title: 'Select an assessment first', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    setAnalysis(null);
    try {
      const res = await apiClient.post('/lifestyle-analyses/generate', {
        assessmentId: selectedAssessmentId
      });
      setAnalysis(res.data.analysis_content);
    } catch (err: any) {
      toast({ title: 'Failed to generate analysis', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const parseSections = (text: string) => {
    const sections: { title: string; content: string[] }[] = [];
    const lines = text.split('\n');
    let currentTitle = '';
    let currentContent: string[] = [];

    lines.forEach(line => {
      const headerMatch = line.match(/^\[(Exercise Routine|Sleep Hygiene|Stress Management|Daily Habits to Adopt|Habits to Avoid)\]/i);
      if (headerMatch) {
        if (currentTitle) {
          sections.push({ title: currentTitle, content: currentContent });
        }
        currentTitle = headerMatch[1].trim();
        currentContent = [];
      } else if (line.trim()) {
        // Clean up any remaining markdown
        const cleanLine = line.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
        if (cleanLine) currentContent.push(cleanLine);
      }
    });
    if (currentTitle) {
      sections.push({ title: currentTitle, content: currentContent });
    }

    if (sections.length === 0) {
      return [{ title: 'Lifestyle Analysis', content: lines }];
    }

    return sections;
  };

  const renderContent = (text: string) => {
    const sections = parseSections(text);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <Card key={idx} className="bg-white/50 dark:bg-slate-800/50 border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-primary flex items-center">
                {section.title.includes('Exercise') && <Activity className="w-5 h-5 mr-2 text-red-500" />}
                {section.title.includes('Sleep') && <Moon className="w-5 h-5 mr-2 text-indigo-500" />}
                {section.title.includes('Stress') && <Smile className="w-5 h-5 mr-2 text-teal-500" />}
                {section.title.includes('Habits') && <Sun className="w-5 h-5 mr-2 text-amber-500" />}
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.content.map((line, i) => (
                  <li key={i} className="text-muted-foreground text-sm flex items-start">
                    <span className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                    {line.replace(/^- /, '').replace(/\*\*/g, '')}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg transform -rotate-3 hover:-rotate-6 transition-transform">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-2">AI Lifestyle Coach</h1>
          <p className="text-muted-foreground text-lg">Optimized habits for a healthier you.</p>
        </div>

        <Card className="mb-8 border-2 border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Analyze Lifestyle</CardTitle>
            <CardDescription>Select a health assessment to get tailored lifestyle advice.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-2 block">Based on Assessment</label>
              <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingAssessments ? "Loading..." : "Select Assessment"} />
                </SelectTrigger>
                <SelectContent>
                  {assessments?.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.assessment_type.toUpperCase()} - {new Date(a.created_at).toLocaleDateString()} ({a.risk_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedAssessmentId}
              className="w-full sm:w-auto gradient-primary text-white font-semibold"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Analyze
            </Button>
          </CardContent>
        </Card>

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6"
          >
            <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800">
              <CardHeader className="bg-blue-100/50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Your Lifestyle Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-1">
                  {renderContent(analysis)}
                </div>
              </CardContent>
            </Card>

            {/* Visual Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl overflow-hidden shadow-md h-32 bg-red-100 flex flex-col items-center justify-center p-4 text-center">
                <Heart className="w-8 h-8 text-red-500 mb-2" />
                <span className="font-medium text-sm text-red-700">Physical Health</span>
              </div>
              <div className="rounded-xl overflow-hidden shadow-md h-32 bg-indigo-100 flex flex-col items-center justify-center p-4 text-center">
                <Moon className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="font-medium text-sm text-indigo-700">Sleep Quality</span>
              </div>
              <div className="rounded-xl overflow-hidden shadow-md h-32 bg-teal-100 flex flex-col items-center justify-center p-4 text-center">
                <Smile className="w-8 h-8 text-teal-500 mb-2" />
                <span className="font-medium text-sm text-teal-700">Stress Management</span>
              </div>
              <div className="rounded-xl overflow-hidden shadow-md h-32 bg-amber-100 flex flex-col items-center justify-center p-4 text-center">
                <Sun className="w-8 h-8 text-amber-500 mb-2" />
                <span className="font-medium text-sm text-amber-700">Daily Habits</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};

export default Lifestyle;

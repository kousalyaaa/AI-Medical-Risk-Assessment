import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAssessments } from '@/hooks/useAssessments';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Utensils, Sparkles, Coffee, Sun, Moon, Apple } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const DietPlans = () => {
  const { data: assessments, isLoading: isLoadingAssessments } = useAssessments();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!selectedAssessmentId) {
      toast({ title: 'Select an assessment first', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    setPlan(null);
    try {
      const res = await apiClient.post('/diet-plans/generate', {
        assessmentId: selectedAssessmentId
      });
      setPlan(res.data.plan_content);
    } catch (err: any) {
      toast({ title: 'Failed to generate plan', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const parseSections = (text: string) => {
    // Regex to split by bracketed headers like "[Breakfast]"
    const sections: { title: string; content: string[] }[] = [];
    const lines = text.split('\n');
    let currentTitle = '';
    let currentContent: string[] = [];

    lines.forEach(line => {
      const headerMatch = line.match(/^\[(Breakfast|Lunch|Dinner|Snack|Snacks|Important Tips|Hydration|Key Nutrients)\]/i);
      if (headerMatch) {
        if (currentTitle) {
          sections.push({ title: currentTitle, content: currentContent });
        }
        currentTitle = headerMatch[1].trim();
        currentContent = [];
      } else if (line.trim()) {
        // Clean up any remaining markdown just in case
        const cleanLine = line.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
        if (cleanLine) currentContent.push(cleanLine);
      }
    });
    if (currentTitle) {
      sections.push({ title: currentTitle, content: currentContent });
    }

    // Fallback if no sections found
    if (sections.length === 0) {
      return [{ title: 'Diet Plan', content: lines }];
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
                {section.title.includes('Breakfast') && <Coffee className="w-5 h-5 mr-2 text-orange-500" />}
                {section.title.includes('Lunch') && <Sun className="w-5 h-5 mr-2 text-yellow-500" />}
                {section.title.includes('Dinner') && <Moon className="w-5 h-5 mr-2 text-blue-500" />}
                {section.title.includes('Snack') && <Apple className="w-5 h-5 mr-2 text-green-500" />}
                {section.title.includes('Tips') && <Sparkles className="w-5 h-5 mr-2 text-purple-500" />}
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
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-2">AI Nutritionist</h1>
          <p className="text-muted-foreground text-lg">Personalized diet plans tailored to your health risks.</p>
        </div>

        <Card className="mb-8 border-2 border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Generate New Plan</CardTitle>
            <CardDescription>Select a recent health assessment to base your plan on.</CardDescription>
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
              Generate Plan
            </Button>
          </CardContent>
        </Card>

        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6"
          >
            <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-white to-green-50 dark:from-slate-900 dark:to-slate-800">
              <CardHeader className="bg-green-100/50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                <CardTitle className="text-green-800 dark:text-green-300 flex items-center">
                  <Utensils className="w-5 h-5 mr-2" />
                  Your Personalized Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-1">
                  {renderContent(plan)}
                </div>
              </CardContent>
            </Card>

            {/* Images/Placeholders for Visual Appeal */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl overflow-hidden shadow-md h-32 bg-orange-100 flex flex-col items-center justify-center p-4 text-center">
                <Coffee className="w-8 h-8 text-orange-500 mb-2" />
                <span className="font-medium text-sm text-orange-700">Healthy Breakfast</span>
              </div>
              <div className="rounded-xl overflow-hidden shadow-md h-32 bg-yellow-100 flex flex-col items-center justify-center p-4 text-center">
                <Sun className="w-8 h-8 text-yellow-500 mb-2" />
                <span className="font-medium text-sm text-yellow-700">Balanced Lunch</span>
              </div>
              <div className="rounded-xl overflow-hidden shadow-md h-32 bg-blue-100 flex flex-col items-center justify-center p-4 text-center">
                <Moon className="w-8 h-8 text-blue-500 mb-2" />
                <span className="font-medium text-sm text-blue-700">Light Dinner</span>
              </div>
              <div className="rounded-xl overflow-hidden shadow-md h-32 bg-green-100 flex flex-col items-center justify-center p-4 text-center">
                <Apple className="w-8 h-8 text-green-500 mb-2" />
                <span className="font-medium text-sm text-green-700">Nutritious Snacks</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};

export default DietPlans;

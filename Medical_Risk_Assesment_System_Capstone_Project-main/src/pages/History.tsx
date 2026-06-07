import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Heart, Activity, Brain, Stethoscope, Download, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAssessments } from '@/hooks/useAssessments';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const iconMap = { heart: Heart, diabetes: Activity, stroke: Brain, kidney: Stethoscope, general: Heart };

const History = () => {
  const { data: assessments = [], isLoading } = useAssessments();

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h1 className="text-3xl font-display font-bold">Assessment History</h1>
        <p className="text-muted-foreground">View all your past health assessments</p>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : assessments.length === 0 ? (
          <div className="health-card text-center py-12">
            <p className="text-muted-foreground">No assessments yet. Start your first assessment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment, index) => {
              const Icon = iconMap[assessment.assessment_type] || Heart;
              return (
                <motion.div
                  key={assessment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="health-card flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold capitalize">{assessment.assessment_type} Assessment</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(assessment.created_at), 'MMMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    assessment.risk_level === 'low' && 'bg-risk-low-bg text-risk-low',
                    assessment.risk_level === 'medium' && 'bg-risk-medium-bg text-risk-medium',
                    assessment.risk_level === 'high' && 'bg-risk-high-bg text-risk-high'
                  )}>
                    {assessment.risk_level.toUpperCase()} ({assessment.risk_score}%)
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </MainLayout>
  );
};

export default History;

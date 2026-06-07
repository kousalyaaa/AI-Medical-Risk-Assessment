import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskLevel, AssessmentType } from '@/hooks/useAssessments';
import { cn } from '@/lib/utils';

interface AssessmentResultProps {
  type: AssessmentType;
  riskLevel: RiskLevel;
  riskScore: number;
  recommendations: string[];
  onGetDietPlan: () => void;
  onDownloadReport: () => void;
  onViewHospitals: () => void;
}

const riskConfig = {
  low: {
    icon: CheckCircle,
    bg: 'bg-risk-low',
    lightBg: 'bg-risk-low-bg',
    text: 'text-risk-low',
    title: 'Low Risk',
    message: 'Great news! Your health indicators are within normal ranges.',
  },
  medium: {
    icon: AlertTriangle,
    bg: 'bg-risk-medium',
    lightBg: 'bg-risk-medium-bg',
    text: 'text-risk-medium',
    title: 'Medium Risk',
    message: 'Some indicators need attention. Follow the recommendations below.',
  },
  high: {
    icon: XCircle,
    bg: 'bg-risk-high',
    lightBg: 'bg-risk-high-bg',
    text: 'text-risk-high',
    title: 'High Risk',
    message: 'Please consult a healthcare professional as soon as possible.',
  },
};

const typeLabels: Record<AssessmentType, string> = {
  heart: 'Heart Disease',
  diabetes: 'Diabetes',
  stroke: 'Stroke',
  kidney: 'Kidney Disease',
  general: 'General Health',
};

export const AssessmentResult = ({
  type,
  riskLevel,
  riskScore,
  recommendations,
  onGetDietPlan,
  onDownloadReport,
  onViewHospitals,
}: AssessmentResultProps) => {
  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Risk Level Display */}
      <div className={cn('rounded-2xl p-8 text-center', config.lightBg)}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className={cn('w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center', config.bg)}
        >
          <Icon className="w-10 h-10 text-white" />
        </motion.div>

        <h2 className={cn('text-2xl font-display font-bold mb-2', config.text)}>
          {config.title}
        </h2>
        <p className="text-muted-foreground mb-4">{config.message}</p>

        {/* Score Ring */}
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              className="stroke-muted fill-none"
              strokeWidth="8"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              className={cn('fill-none', `stroke-current ${config.text}`)}
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 352' }}
              animate={{ strokeDasharray: `${(riskScore / 100) * 352} 352` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">{Math.round(riskScore)}%</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          {typeLabels[type]} Risk Score
        </p>
      </div>

      {/* Recommendations */}
      <div className="health-card">
        <h3 className="font-display font-semibold text-lg mb-4">Recommendations</h3>
        <ul className="space-y-3">
          {recommendations.map((rec, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-primary">{index + 1}</span>
              </div>
              <span className="text-sm text-muted-foreground">{rec}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button onClick={onGetDietPlan} variant="outline" className="h-12">
          Get AI Diet Plan
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button onClick={onDownloadReport} variant="outline" className="h-12">
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
        {riskLevel === 'high' && (
          <Button onClick={onViewHospitals} className="h-12 gradient-primary text-white">
            Find Hospitals
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

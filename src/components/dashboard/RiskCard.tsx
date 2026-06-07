import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiskLevel } from '@/hooks/useAssessments';

interface RiskCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  riskLevel?: RiskLevel | null;
  lastChecked?: string | null;
  onClick: () => void;
  delay?: number;
}

const riskConfig = {
  low: {
    bg: 'bg-risk-low-bg',
    text: 'text-risk-low',
    border: 'border-risk-low/30',
    label: 'Low Risk',
  },
  medium: {
    bg: 'bg-risk-medium-bg',
    text: 'text-risk-medium',
    border: 'border-risk-medium/30',
    label: 'Medium Risk',
  },
  high: {
    bg: 'bg-risk-high-bg',
    text: 'text-risk-high',
    border: 'border-risk-high/30',
    label: 'High Risk',
  },
};

export const RiskCard = ({
  title,
  description,
  icon: Icon,
  riskLevel,
  lastChecked,
  onClick,
  delay = 0,
}: RiskCardProps) => {
  const risk = riskLevel ? riskConfig[riskLevel] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="health-card-interactive group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {risk && (
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold border',
              risk.bg,
              risk.text,
              risk.border
            )}
          >
            {risk.label}
          </span>
        )}
      </div>

      <h3 className="font-display font-semibold text-lg text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      {lastChecked ? (
        <p className="text-xs text-muted-foreground">
          Last checked: {new Date(lastChecked).toLocaleDateString()}
        </p>
      ) : (
        <p className="text-xs text-primary font-medium">Click to start assessment →</p>
      )}
    </motion.div>
  );
};

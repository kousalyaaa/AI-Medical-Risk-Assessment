import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiskLevel } from '@/hooks/useAssessments';

interface BodyPart {
  id: string;
  name: string;
  path: string;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  assessment: 'heart' | 'diabetes' | 'stroke' | 'kidney';
}

interface BodyRiskMapProps {
  risks: {
    heart?: RiskLevel | null;
    diabetes?: RiskLevel | null;
    stroke?: RiskLevel | null;
    kidney?: RiskLevel | null;
  };
  onPartClick?: (part: string) => void;
  showInfoPopup?: boolean;
}

const bodyParts: BodyPart[] = [
  { id: 'brain', name: 'Brain', cx: 100, cy: 25, rx: 20, ry: 15, assessment: 'stroke', path: '' },
  { id: 'heart', name: 'Heart', cx: 90, cy: 80, rx: 12, ry: 12, assessment: 'heart', path: '' },
  { id: 'kidneys', name: 'Kidneys', cx: 100, cy: 120, rx: 25, ry: 10, assessment: 'kidney', path: '' },
  { id: 'pancreas', name: 'Pancreas', cx: 100, cy: 100, rx: 15, ry: 8, assessment: 'diabetes', path: '' },
];

const riskColors = {
  low: 'fill-body-healthy',
  medium: 'fill-body-warning',
  high: 'fill-body-danger',
  null: 'fill-muted-foreground/30',
};

const riskExplanations = {
  heart: {
    low: 'Your heart health indicators are within normal ranges. Keep maintaining your healthy lifestyle!',
    medium: 'Some heart health indicators need attention. Consider regular monitoring and lifestyle adjustments.',
    high: 'Critical heart health indicators detected. Please consult a cardiologist immediately.',
  },
  diabetes: {
    low: 'Your blood sugar levels and diabetes risk factors are healthy. Keep up the good work!',
    medium: 'Some diabetes risk factors are elevated. Monitor your diet and exercise regularly.',
    high: 'High diabetes risk detected. Schedule an appointment with an endocrinologist.',
  },
  stroke: {
    low: 'Your stroke risk factors are well controlled. Continue with your healthy habits!',
    medium: 'Some stroke risk factors need attention. Consider blood pressure monitoring.',
    high: 'Elevated stroke risk detected. Seek immediate medical consultation.',
  },
  kidney: {
    low: 'Your kidney function indicators are normal. Stay hydrated and maintain healthy habits!',
    medium: 'Some kidney function markers need monitoring. Increase water intake and reduce sodium.',
    high: 'Kidney function concerns detected. Please consult a nephrologist soon.',
  },
};

export const BodyRiskMap = ({ risks, onPartClick, showInfoPopup = true, className }: BodyRiskMapProps & { className?: string }) => {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const handlePartClick = (part: BodyPart) => {
    setSelectedPart(part.id);
    onPartClick?.(part.assessment);
  };

  const getPartRisk = (assessment: 'heart' | 'diabetes' | 'stroke' | 'kidney'): RiskLevel | null => {
    return risks[assessment] ?? null;
  };

  return (
    <div className={cn("health-card relative flex flex-col items-center justify-center", className)}>
      <h3 className="font-display font-semibold text-lg mb-2">Body Risk Visualization</h3>
      <p className="text-sm text-muted-foreground mb-4 text-center">
        Tap on body parts to see detailed health information
      </p>

      <div className="relative flex items-center justify-center w-full h-full min-h-[300px] flex-1">
        <svg viewBox="0 0 200 320" className="h-full w-auto max-h-[80%] drop-shadow-xl" preserveAspectRatio="xMidYMid meet">
          {/* Body outline */}
          <ellipse cx="100" cy="25" rx="25" ry="25" className="fill-muted stroke-border stroke-2" />
          <path
            d="M75 50 L60 120 L75 120 L70 180 L90 180 L85 280 L100 280 L100 180 L100 280 L115 280 L110 180 L130 180 L125 120 L140 120 L125 50 Z"
            className="fill-muted stroke-border stroke-2"
          />

          {/* Interactive body parts */}
          {bodyParts.map((part) => {
            const risk = getPartRisk(part.assessment);
            const riskClass = risk ? riskColors[risk] : riskColors.null;

            return (
              <motion.ellipse
                key={part.id}
                cx={part.cx}
                cy={part.cy}
                rx={part.rx}
                ry={part.ry}
                className={cn(
                  riskClass,
                  'cursor-pointer transition-all duration-300',
                  risk === 'high' && 'animate-pulse-glow',
                  selectedPart === part.id && 'stroke-foreground stroke-2'
                )}
                whileHover={{ scale: 1.2 }}
                onClick={() => handlePartClick(part)}
              />
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute right-0 top-0 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-body-healthy" />
            <span>Low Risk</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-body-warning" />
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-body-danger" />
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            <span>Not Assessed</span>
          </div>
        </div>
      </div>

      {/* Info popup */}
      <AnimatePresence>
        {showInfoPopup && selectedPart && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 right-4 p-4 bg-card rounded-lg border shadow-lg"
          >
            <button
              onClick={() => setSelectedPart(null)}
              className="absolute top-2 right-2 p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4" />
            </button>
            {bodyParts.find(p => p.id === selectedPart) && (
              <>
                <h4 className="font-semibold mb-2">
                  {bodyParts.find(p => p.id === selectedPart)?.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const part = bodyParts.find(p => p.id === selectedPart);
                    if (!part) return 'No data available';
                    const risk = getPartRisk(part.assessment);
                    if (!risk) return 'No assessment data. Complete an assessment to see your risk level.';
                    return riskExplanations[part.assessment][risk];
                  })()}
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

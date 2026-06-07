import { useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, Brain, Stethoscope, ClipboardList, ArrowLeft, ChevronRight, Upload } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AssessmentForm } from '@/components/assessments/AssessmentForm';
import OCRUpload from '@/pages/OCRUpload';
import { AssessmentResult } from '@/components/assessments/AssessmentResult';
import { Button } from '@/components/ui/button';
import { AssessmentType, RiskLevel } from '@/hooks/useAssessments';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';

const assessmentTypes = [
  { id: 'heart', label: 'Heart Disease', icon: Heart, description: 'Cardiovascular health assessment', color: 'text-red-500' },
  { id: 'diabetes', label: 'Diabetes', icon: Activity, description: 'Blood sugar and insulin risk', color: 'text-orange-500' },
  { id: 'stroke', label: 'Stroke', icon: Brain, description: 'Stroke risk evaluation', color: 'text-purple-500' },
  { id: 'kidney', label: 'Kidney Disease', icon: Stethoscope, description: 'Renal function assessment', color: 'text-blue-500' },
  { id: 'general', label: 'General Checkup', icon: ClipboardList, description: 'Overall health evaluation', color: 'text-primary' },
  { id: 'upload', label: 'Upload Lab Report', icon: Upload, description: 'Extract data from PDF/Images', color: 'text-gray-500' },
];

const Assessments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const initialData = location.state?.initialData;



  // Allow 'upload' as a valid type even if not in AssessmentType enum strictly for UI
  const selectedType = searchParams.get('type');
  const [result, setResult] = useState<{ level: RiskLevel; score: number; recommendations: string[] } | null>(null);

  const handleSelectType = (type: string) => {
    setResult(null);
    setSearchParams({ type });
  };

  const handleComplete = (level: RiskLevel, score: number) => {
    setResult({
      level,
      score,

      recommendations: getDefaultRecommendations(selectedType as AssessmentType, level),
    });
  };

  const handleBack = () => {
    if (result) {
      setResult(null);
    } else {
      setSearchParams({});
    }
  };

  const handleDownloadReport = () => {
    if (!selectedType || !result) return;

    const doc = new jsPDF();
    const type = assessmentTypes.find(t => t.id === selectedType);

    doc.setFontSize(24);
    doc.setTextColor(0, 128, 128);
    doc.text('HealthRisk Assessment Report', 20, 30);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Assessment Type: ${type?.label}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
    doc.text(`Risk Level: ${result.level.toUpperCase()}`, 20, 70);
    doc.text(`Risk Score: ${Math.round(result.score)}%`, 20, 80);

    doc.setFontSize(12);
    doc.text('Recommendations:', 20, 100);
    result.recommendations.forEach((rec, index) => {
      doc.text(`${index + 1}. ${rec}`, 25, 115 + index * 10);
    });

    doc.save(`health-report-${selectedType}-${Date.now()}.pdf`);
    toast({ title: 'Report downloaded!', description: 'Check your downloads folder.' });
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {(selectedType || result) && (
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className="text-3xl font-display font-bold text-foreground">
            {result
              ? 'Assessment Results'
              : selectedType
                ? `${assessmentTypes.find(t => t.id === selectedType)?.label} Assessment`
                : 'Health Assessments'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {result
              ? 'Review your results and recommendations'
              : selectedType
                ? 'Fill in your health information for accurate assessment'
                : 'Select an assessment type to begin'}
          </p>
        </motion.div>



        <AnimatePresence mode="wait">
          {result && selectedType ? (
            <AssessmentResult
              key="result"
              type={selectedType as AssessmentType}
              riskLevel={result.level}
              riskScore={result.score}
              recommendations={result.recommendations}
              onGetDietPlan={() => navigate('/diet-plans')}
              onDownloadReport={handleDownloadReport}
              onViewHospitals={() => navigate('/hospitals')}
            />
          ) : selectedType === 'upload' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <OCRUpload />
            </motion.div>
          ) : selectedType ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="health-card"
            >
              <AssessmentForm
                type={selectedType as AssessmentType}
                initialValues={initialData}
                autoSubmit={location.state?.autoSubmit}
                onComplete={handleComplete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {assessmentTypes.map((type, index) => {
                const Icon = type.icon;
                return (
                  <motion.button
                    key={type.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectType(type.id)}
                    className="health-card-interactive text-left flex items-center gap-4"
                  >
                    <div className={cn('w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center', type.color)}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
};

const getDefaultRecommendations = (type: AssessmentType, level: RiskLevel): string[] => {
  const recommendations: Record<AssessmentType, Record<RiskLevel, string[]>> = {
    heart: {
      low: ['Maintain current healthy lifestyle', 'Continue regular exercise', 'Annual checkups recommended'],
      medium: ['Reduce saturated fat intake', 'Increase physical activity', 'Monitor blood pressure weekly'],
      high: ['Immediate cardiology consultation required', 'Avoid strenuous activity until cleared', 'Daily blood pressure monitoring'],
    },
    diabetes: {
      low: ['Maintain balanced diet', 'Regular physical activity', 'Annual glucose screening'],
      medium: ['Reduce sugar and refined carb intake', 'Increase fiber consumption', 'Regular glucose monitoring'],
      high: ['Immediate medical consultation', 'Daily glucose monitoring', 'Strict dietary control'],
    },
    stroke: {
      low: ['Maintain healthy blood pressure', 'Continue healthy lifestyle', 'Regular checkups'],
      medium: ['Blood pressure management', 'Reduce sodium intake', 'Increase physical activity'],
      high: ['Immediate medical attention', 'Blood pressure medication review', 'Lifestyle modifications critical'],
    },
    kidney: {
      low: ['Stay well hydrated', 'Maintain healthy diet', 'Annual kidney function tests'],
      medium: ['Reduce sodium intake', 'Monitor blood pressure', 'Limit protein if advised'],
      high: ['Immediate nephrology referral', 'Dietary restrictions may be needed', 'Regular monitoring required'],
    },
    general: {
      low: ['Continue healthy habits', 'Regular exercise', 'Balanced nutrition'],
      medium: ['Improve diet quality', 'Increase physical activity', 'Better sleep hygiene'],
      high: ['Comprehensive health evaluation', 'Lifestyle intervention program', 'Regular monitoring'],
    },
  };
  return recommendations[type][level];
};

export default Assessments;

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateAssessment, AssessmentType, RiskLevel } from '@/hooks/useAssessments';
import { useToast } from '@/hooks/use-toast';

import { useEffect } from 'react';

interface AssessmentFormProps {
  type: AssessmentType;
  initialValues?: Record<string, string>;
  autoSubmit?: boolean;
  onComplete: (riskLevel: RiskLevel, score: number) => void;
}

// Mapped form configurations to match Backend/CSV expectations
const formConfigs = {
  heart: [
    { name: 'age', label: 'Age', type: 'number', placeholder: 'Enter your age', min: 10, max: 100 },
    { name: 'sex', label: 'Sex', type: 'select', options: [{ label: 'Male', value: '1' }, { label: 'Female', value: '0' }] },
    { name: 'cp', label: 'Chest Pain Type', type: 'select', options: [{ label: 'Typical Angina', value: '0' }, { label: 'Atypical Angina', value: '1' }, { label: 'Non-anginal Pain', value: '2' }, { label: 'Asymptomatic', value: '3' }] },
    { name: 'trestbps', label: 'Resting Blood Pressure', type: 'number', placeholder: '120', min: 80, max: 210 },
    { name: 'chol', label: 'Cholesterol', type: 'number', placeholder: '200', min: 100, max: 600 },
    { name: 'fbs', label: 'Fasting Blood Sugar > 120 mg/dl', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'restecg', label: 'Resting ECG', type: 'select', options: [{ label: 'Normal', value: '0' }, { label: 'ST-T Wave Abnormality', value: '1' }, { label: 'Left Ventricular Hypertrophy', value: '2' }] },
    { name: 'thalach', label: 'Max Heart Rate', type: 'number', placeholder: '150', min: 50, max: 220 },
    { name: 'exang', label: 'Exercise Induced Angina', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'oldpeak', label: 'ST Depression', type: 'number', placeholder: '1.0', min: 0, max: 10, step: '0.1' },
    { name: 'slope', label: 'Slope of Peak Exercise', type: 'select', options: [{ label: 'Upsloping', value: '0' }, { label: 'Flat', value: '1' }, { label: 'Downsloping', value: '2' }] },
    { name: 'ca', label: 'Major Vessels (0-4)', type: 'number', placeholder: '0', min: 0, max: 4 },
    { name: 'thal', label: 'Thalassemia', type: 'select', options: [{ label: 'Normal', value: '1' }, { label: 'Fixed Defect', value: '2' }, { label: 'Reversible Defect', value: '3' }] },
  ],
  diabetes: [
    { name: 'age', label: 'Age', type: 'number', placeholder: 'Enter your age', min: 1, max: 120 },
    { name: 'pregnancies', label: 'Pregnancies', type: 'number', placeholder: '0', min: 0, max: 20 },
    { name: 'glucose', label: 'Glucose Level', type: 'number', placeholder: '100', min: 0, max: 300 },
    { name: 'blood_pressure', label: 'Blood Pressure', type: 'number', placeholder: '72', min: 0, max: 150 },
    { name: 'skin_thickness', label: 'Skin Thickness', type: 'number', placeholder: '20', min: 0, max: 110 },
    { name: 'insulin', label: 'Insulin Level', type: 'number', placeholder: '79', min: 0, max: 900 },
    { name: 'bmi', label: 'BMI', type: 'number', placeholder: '25.0', min: 0, max: 80, step: '0.1' },
    { name: 'diabetes_pedigree', label: 'Diabetes Pedigree Function', type: 'number', placeholder: '0.5', min: 0, max: 3.0, step: '0.01' },
  ],
  stroke: [
    { name: 'age', label: 'Age', type: 'number', placeholder: 'Enter your age', min: 0, max: 120 },
    { name: 'gender', label: 'Gender', type: 'select', options: [{ label: 'Male', value: '1' }, { label: 'Female', value: '0' }] },
    { name: 'hypertension', label: 'Hypertension', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'heart_disease', label: 'Heart Disease', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'ever_married', label: 'Ever Married', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'work_type', label: 'Work Type', type: 'select', options: [{ label: 'Private', value: '0' }, { label: 'Self-employed', value: '1' }, { label: 'Govt Job', value: '2' }, { label: 'Children', value: '3' }, { label: 'Never Worked', value: '4' }] },
    { name: 'Residence_type', label: 'Residence Type', type: 'select', options: [{ label: 'Urban', value: '0' }, { label: 'Rural', value: '1' }] },
    { name: 'avg_glucose_level', label: 'Average Glucose Level', type: 'number', placeholder: '100', min: 40, max: 300 },
    { name: 'bmi', label: 'BMI', type: 'number', placeholder: '25.0', min: 10, max: 100, step: '0.1' },
    { name: 'smoking_status', label: 'Smoking Status', type: 'select', options: [{ label: 'Never Smoked', value: '0' }, { label: 'Unknown', value: '1' }, { label: 'Formerly Smoked', value: '2' }, { label: 'Smokes', value: '3' }] },
  ],
  kidney: [
    { name: 'age', label: 'Age', type: 'number', placeholder: 'Enter your age', min: 1, max: 120 },
    { name: 'blood_pressure', label: 'Blood Pressure', type: 'number', placeholder: '80', min: 40, max: 200 },
    { name: 'specific_gravity', label: 'Specific Gravity', type: 'number', placeholder: '1.020', min: 1.005, max: 1.030, step: '0.005' },
    { name: 'albumin', label: 'Albumin (0-5)', type: 'number', placeholder: '0', min: 0, max: 5 },
    { name: 'sugar', label: 'Sugar (0-5)', type: 'number', placeholder: '0', min: 0, max: 5 },
    { name: 'red_blood_cells', label: 'Red Blood Cells', type: 'select', options: [{ label: 'Normal', value: '1' }, { label: 'Abnormal', value: '0' }] },
    { name: 'pus_cell', label: 'Pus Cell', type: 'select', options: [{ label: 'Normal', value: '1' }, { label: 'Abnormal', value: '0' }] },
    { name: 'pus_cell_clumps', label: 'Pus Cell Clumps', type: 'select', options: [{ label: 'Present', value: '1' }, { label: 'Not Present', value: '0' }] },
    { name: 'bacteria', label: 'Bacteria', type: 'select', options: [{ label: 'Present', value: '1' }, { label: 'Not Present', value: '0' }] },
    { name: 'blood_glucose_random', label: 'Blood Glucose Random', type: 'number', placeholder: '120', min: 20, max: 500 },
    { name: 'blood_urea', label: 'Blood Urea', type: 'number', placeholder: '30', min: 1, max: 400 },
    { name: 'serum_creatinine', label: 'Serum Creatinine', type: 'number', placeholder: '1.0', min: 0.1, max: 80, step: '0.1' },
    { name: 'sodium', label: 'Sodium (mEq/L)', type: 'number', placeholder: '135', min: 4, max: 170 },
    { name: 'potassium', label: 'Potassium (mEq/L)', type: 'number', placeholder: '4.0', min: 1, max: 50, step: '0.1' },
    { name: 'haemoglobin', label: 'Hemoglobin (g/dL)', type: 'number', placeholder: '14.0', min: 3, max: 25, step: '0.1' },
    { name: 'packed_cell_volume', label: 'Packed Cell Volume', type: 'number', placeholder: '40', min: 5, max: 65 },
    { name: 'white_blood_cell_count', label: 'WBC Count', type: 'number', placeholder: '8000', min: 1000, max: 30000 },
    { name: 'red_blood_cell_count', label: 'RBC Count', type: 'number', placeholder: '5.0', min: 1, max: 15, step: '0.1' },
    { name: 'hypertension', label: 'Hypertension', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'diabetes_mellitus', label: 'Diabetes Mellitus', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'coronary_artery_disease', label: 'Coronary Artery Disease', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'appetite', label: 'Appetite', type: 'select', options: [{ label: 'Good', value: '1' }, { label: 'Poor', value: '0' }] },
    { name: 'peda_edema', label: 'Pedal Edema', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'aanemia', label: 'Anemia', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
  ],
  general: [
    { name: 'age', label: 'Age', type: 'number', placeholder: 'Enter your age', min: 1, max: 120 },
    { name: 'gender', label: 'Gender', type: 'select', options: [{ label: 'Male', value: '1' }, { label: 'Female', value: '0' }] },
    { name: 'weight', label: 'Weight (kg)', type: 'number', placeholder: '70', min: 10, max: 300 },
    { name: 'height', label: 'Height (cm)', type: 'number', placeholder: '170', min: 50, max: 250 },
    { name: 'blood_pressure', label: 'Systolic BP', type: 'number', placeholder: '120', min: 60, max: 250 },
    { name: 'smoking', label: 'Smoking Habits', type: 'select', options: [{ label: 'Non-smoker', value: '0' }, { label: 'Occasional', value: '1' }, { label: 'Regular', value: '2' }] },
    { name: 'alcohol', label: 'Alcohol Consumption', type: 'select', options: [{ label: 'Non-drinker', value: '0' }, { label: 'Occasional', value: '1' }, { label: 'Regular', value: '2' }] },
    { name: 'family_history', label: 'Family History of Chronic Disease', type: 'select', options: [{ label: 'No', value: '0' }, { label: 'Yes', value: '1' }] },
    { name: 'exercise_frequency', label: 'Exercise Frequency', type: 'select', options: [{ label: 'None', value: '0' }, { label: 'Occasional', value: '1' }, { label: 'Regular', value: '2' }, { label: 'Daily', value: '3' }] },
    { name: 'diet_quality', label: 'Diet Quality', type: 'select', options: [{ label: 'Poor', value: '0' }, { label: 'Average', value: '1' }, { label: 'Good', value: '2' }, { label: 'Excellent', value: '3' }] },
    { name: 'sleep_hours', label: 'Sleep Hours', type: 'number', placeholder: '7', min: 0, max: 24 },
    { name: 'stress_level', label: 'Stress Level', type: 'select', options: [{ label: 'Low', value: '0' }, { label: 'Moderate', value: '1' }, { label: 'High', value: '2' }, { label: 'Very High', value: '3' }] },
  ],
};

import { calculateRisk, getRecommendations } from '@/utils/riskUtils';

export const AssessmentForm = ({ type, initialValues = {}, autoSubmit = false, onComplete }: AssessmentFormProps) => {
  const [formData, setFormData] = useState<Record<string, string>>(initialValues);
  const [loading, setLoading] = useState(false);
  const { mutateAsync: createAssessment } = useCreateAssessment();
  const { toast } = useToast();

  const fields = formConfigs[type];

  useEffect(() => {
    if (autoSubmit && Object.keys(initialValues).length > 0) {
      const submitAuto = async () => {
        // Create a synthetic event or extract submission logic
        await handleSubmit({ preventDefault: () => { } } as React.FormEvent);
      };
      submitAuto();
    }
  }, [autoSubmit, initialValues]);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    for (const field of fields) {
      if (field.type === 'number' && field.min !== undefined && field.max !== undefined) {
        const val = parseFloat(formData[field.name]);
        if (!isNaN(val) && (val < field.min || val > field.max)) {
          toast({
            title: 'Invalid Input',
            description: `${field.label} must be between ${field.min} and ${field.max}`,
            variant: 'destructive',
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { level, score } = calculateRisk(type, formData);

      await createAssessment({
        assessment_type: type,
        risk_level: level,
        risk_score: score,
        input_data: formData,
        recommendations: getRecommendations(type, level, formData),
      });

      toast({
        title: 'Assessment Complete',
        description: `Your ${type} risk level is ${level.toUpperCase()}`,
      });

      onComplete(level, score);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assessment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field, index) => (
          <motion.div
            key={field.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-2"
          >
            <Label htmlFor={field.name}>{field.label}</Label>
            {field.type === 'select' ? (
              <Select
                value={formData[field.name] || ''}
                onValueChange={(value) => handleChange(field.name, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div>
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required
                  min={field.min}
                  max={field.max}
                  step={field.step || 'any'}
                />
                {(field.min !== undefined && field.max !== undefined) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Range: {field.min} - {field.max}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <Button
        type="submit"
        className="w-full h-12 gradient-primary text-white font-semibold"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Submit Assessment'
        )}
      </Button>
    </motion.form>
  );
};



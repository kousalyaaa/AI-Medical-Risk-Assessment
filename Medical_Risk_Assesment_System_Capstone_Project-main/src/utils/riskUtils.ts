import { AssessmentType, RiskLevel } from '@/hooks/useAssessments';

export const calculateRisk = (type: AssessmentType, data: Record<string, string>): { level: RiskLevel; score: number } => {
    // This is a simplified risk calculation - in production, call your ML backend
    let riskScore = 0;
    const age = parseInt(data.age) || 0;

    if (age > 60) riskScore += 25;
    else if (age > 45) riskScore += 15;
    else if (age > 30) riskScore += 5;

    if (type === 'heart') {
        const cholesterol = parseInt(data.cholesterol) || 0;
        const bp = parseInt(data.resting_bp) || parseInt(data.blood_pressure) || 0;

        // Multi-tier scoring for more sensitivity
        if (cholesterol > 280) riskScore += 40;
        else if (cholesterol > 240) riskScore += 25;
        else if (cholesterol > 200) riskScore += 15;

        if (bp > 160) riskScore += 40;
        else if (bp > 140) riskScore += 20;
        else if (bp > 120) riskScore += 10;

        if (data.smoking === 'current') riskScore += 20;
    }

    if (type === 'diabetes') {
        const glucose = parseInt(data.glucose) || 0;
        const bmi = parseFloat(data.bmi) || 0;

        if (glucose > 200) riskScore += 50;
        else if (glucose > 140) riskScore += 30;
        else if (glucose > 100) riskScore += 15;

        if (bmi > 35) riskScore += 30;
        else if (bmi > 30) riskScore += 20;
        else if (bmi > 25) riskScore += 10;

        if (parseInt(data.age) > 50) riskScore += 10; // Extra age risk for diabetes
    }

    if (type === 'stroke') {
        if (data.hypertension === 'yes' || data.hypertension === '1') riskScore += 30;
        if (data.heart_disease === 'yes' || data.heart_disease === '1') riskScore += 30;
        if (data.smoking_status === 'smokes') riskScore += 20;
        const glucose = parseInt(data.avg_glucose_level) || 0;
        if (glucose > 200) riskScore += 30;
    }

    if (type === 'kidney') {
        const creatinine = parseFloat(data.serum_creatinine) || 0;
        if (creatinine > 2.0) riskScore += 50;
        else if (creatinine > 1.5) riskScore += 30;
        else if (creatinine > 1.2) riskScore += 15;
    }

    if (type === 'general') {
        // BMI Calculation
        const weight = parseFloat(data.weight) || 0;
        const height = parseFloat(data.height) || 0;
        let bmi = 0;
        if (height > 0) {
            bmi = weight / ((height / 100) * (height / 100));
        }

        if (bmi >= 30) riskScore += 25; // Obese
        else if (bmi >= 25) riskScore += 15; // Overweight

        // Lifestyle
        if (data.smoking === '2') riskScore += 20; // Regular smoker
        else if (data.smoking === '1') riskScore += 10;

        if (data.alcohol === '2') riskScore += 15; // Regular drinker

        if (data.exercise_frequency === '0') riskScore += 15; // No exercise
        else if (data.exercise_frequency === '1') riskScore += 5;

        // Vitals
        const bp = parseInt(data.blood_pressure) || 0;
        if (bp > 140) riskScore += 20;
        else if (bp > 130) riskScore += 10;

        if (data.family_history === '1') riskScore += 15;

        if (data.stress_level === '3' || data.stress_level === '2') riskScore += 10;
        if (parseInt(data.sleep_hours) < 6) riskScore += 10;
    }

    // Normalize to 0-100
    riskScore = Math.min(100, Math.max(0, riskScore));

    let level: RiskLevel;
    if (riskScore >= 70) level = 'high'; // Bump threshold slightly if easy to hit, but keep 60 for consistency? 
    // Let's keep strict tiers: High >= 65, Medium >= 35
    if (riskScore >= 65) level = 'high';
    else if (riskScore >= 35) level = 'medium';
    else level = 'low';

    return { level, score: riskScore };
};

export const getRecommendations = (type: AssessmentType, level: RiskLevel, data?: Record<string, string>): string[] => {
    const recommendations: Record<AssessmentType, Record<RiskLevel, string[]>> = {
        heart: {
            low: ['Maintain current healthy lifestyle', 'Continue regular exercise', 'Annual checkups recommended'],
            medium: ['Reduce saturated fat intake', 'Increase physical activity', 'Monitor blood pressure weekly', 'Schedule a cardiac consultation'],
            high: ['Immediate cardiology consultation required', 'Avoid strenuous activity until cleared', 'Daily blood pressure monitoring', 'Consider medication evaluation'],
        },
        diabetes: {
            low: ['Maintain balanced diet', 'Regular physical activity', 'Annual glucose screening'],
            medium: ['Reduce sugar and refined carb intake', 'Increase fiber consumption', 'Regular glucose monitoring', 'Consult an endocrinologist'],
            high: ['Immediate medical consultation', 'Daily glucose monitoring', 'Strict dietary control', 'Medication evaluation required'],
        },
        stroke: {
            low: ['Maintain healthy blood pressure', 'Continue healthy lifestyle', 'Regular checkups'],
            medium: ['Blood pressure management', 'Reduce sodium intake', 'Increase physical activity', 'Neurologist consultation'],
            high: ['Immediate medical attention', 'Blood pressure medication review', 'Lifestyle modifications critical', 'Regular monitoring required'],
        },
        kidney: {
            low: ['Stay well hydrated', 'Maintain healthy diet', 'Annual kidney function tests'],
            medium: ['Reduce sodium intake', 'Monitor blood pressure', 'Limit protein if advised', 'Nephrology consultation'],
            high: ['Immediate nephrology referral', 'Dietary restrictions may be needed', 'Regular monitoring required', 'Avoid nephrotoxic medications'],
        },
        general: {
            low: ['Continue healthy habits', 'Regular exercise', 'Balanced nutrition', 'Annual health checkups'],
            medium: ['Improve diet quality', 'Increase physical activity', 'Better sleep hygiene', 'Stress management'],
            high: ['Comprehensive health evaluation', 'Lifestyle intervention program', 'Regular monitoring', 'Professional guidance recommended'],
        },
    };

    // Generate specific warnings/predictions for general checkup based on risks
    if (type === 'general' && data) {
        const warnings: string[] = [];
        const bmi = (parseFloat(data.weight) || 0) / Math.pow((parseFloat(data.height) || 100) / 100, 2);
        const bp = parseInt(data.blood_pressure) || 0;

        if (bmi >= 30) warnings.push("⚠️ High obesity risk detected: Increasing probability of Type 2 Diabetes if unchecked.");
        if (bp >= 140) warnings.push("⚠️ Elevated Blood Pressure: High potential for developing Hypertension or Cardiovascular issues.");
        if (data.smoking === '2') warnings.push("⚠️ Smoking Warning: Significantly increases risk of Heart Disease and Respiratory disorders.");
        if (data.family_history === '1') warnings.push("⚠️ Genetic Factors: Family history increases baseline risk; early screening recommended.");

        // Return standard recommendations + specific warnings
        const standardRecs = recommendations[type]?.[level] || [];
        return [...warnings, ...standardRecs];
    }

    return recommendations[type]?.[level] || [];
};

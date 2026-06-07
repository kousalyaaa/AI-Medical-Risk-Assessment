import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Activity, Brain, Stethoscope, ClipboardList, TrendingUp, Calendar, Bell } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RiskCard } from '@/components/dashboard/RiskCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { BodyRiskMap } from '@/components/dashboard/BodyRiskMap';
import { useProfile } from '@/hooks/useProfile';
import { useAssessments, useRecentAssessments, useLatestAssessmentByType } from '@/hooks/useAssessments';
import { format } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: allAssessments = [] } = useAssessments();
  const { data: recentAssessments = [] } = useRecentAssessments(5);

  // Get latest risk levels for each type
  const { data: heartAssessment } = useLatestAssessmentByType('heart');
  const { data: diabetesAssessment } = useLatestAssessmentByType('diabetes');
  const { data: strokeAssessment } = useLatestAssessmentByType('stroke');
  const { data: kidneyAssessment } = useLatestAssessmentByType('kidney');

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const riskData = {
    heart: heartAssessment?.risk_level ?? null,
    diabetes: diabetesAssessment?.risk_level ?? null,
    stroke: strokeAssessment?.risk_level ?? null,
    kidney: kidneyAssessment?.risk_level ?? null,
  };

  const assessmentsThisMonth = allAssessments.filter(
    a => new Date(a.created_at).getMonth() === new Date().getMonth()
  ).length;

  const highRiskCount = allAssessments.filter(a => a.risk_level === 'high').length;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {greeting()}, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your health status
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Assessments"
            value={allAssessments.length}
            icon={ClipboardList}
            delay={0}
          />
          <StatCard
            title="This Month"
            value={assessmentsThisMonth}
            icon={TrendingUp}
            trend="up"
            trendValue="+2"
            delay={0.1}
          />
          <StatCard
            title="High Risk Alerts"
            value={highRiskCount}
            icon={Bell}
            trend={highRiskCount > 0 ? 'down' : 'neutral'}
            trendValue={highRiskCount > 0 ? 'Needs attention' : 'None'}
            delay={0.2}
          />
          <StatCard
            title="Last Assessment"
            value={recentAssessments[0] ? format(new Date(recentAssessments[0].created_at), 'MMM d') : 'None'}
            icon={Calendar}
            delay={0.3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assessment Cards */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-display font-semibold">Health Assessments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RiskCard
                title="Heart Disease"
                description="Assess your cardiovascular health risk"
                icon={Heart}
                riskLevel={riskData.heart}
                lastChecked={heartAssessment?.created_at}
                onClick={() => navigate('/assessments?type=heart')}
                delay={0}
              />
              <RiskCard
                title="Diabetes"
                description="Check your diabetes risk factors"
                icon={Activity}
                riskLevel={riskData.diabetes}
                lastChecked={diabetesAssessment?.created_at}
                onClick={() => navigate('/assessments?type=diabetes')}
                delay={0.1}
              />
              <RiskCard
                title="Stroke"
                description="Evaluate your stroke risk level"
                icon={Brain}
                riskLevel={riskData.stroke}
                lastChecked={strokeAssessment?.created_at}
                onClick={() => navigate('/assessments?type=stroke')}
                delay={0.2}
              />
              <RiskCard
                title="Kidney Disease"
                description="Monitor your kidney health"
                icon={Stethoscope}
                riskLevel={riskData.kidney}
                lastChecked={kidneyAssessment?.created_at}
                onClick={() => navigate('/assessments?type=kidney')}
                delay={0.3}
              />
            </div>

            {/* Recent Activity */}
            {recentAssessments.length > 0 && (
              <div className="health-card">
                <h3 className="font-display font-semibold text-lg mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentAssessments.slice(0, 3).map((assessment, index) => (
                    <motion.div
                      key={assessment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {assessment.assessment_type === 'heart' && <Heart className="w-5 h-5 text-primary" />}
                          {assessment.assessment_type === 'diabetes' && <Activity className="w-5 h-5 text-primary" />}
                          {assessment.assessment_type === 'stroke' && <Brain className="w-5 h-5 text-primary" />}
                          {assessment.assessment_type === 'kidney' && <Stethoscope className="w-5 h-5 text-primary" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {assessment.assessment_type} Assessment
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(assessment.created_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${assessment.risk_level === 'low'
                          ? 'bg-risk-low-bg text-risk-low'
                          : assessment.risk_level === 'medium'
                            ? 'bg-risk-medium-bg text-risk-medium'
                            : 'bg-risk-high-bg text-risk-high'
                          }`}
                      >
                        {assessment.risk_level.charAt(0).toUpperCase() + assessment.risk_level.slice(1)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Body Risk Map */}
          <div className="lg:col-span-1 h-[400px] flex items-center justify-center bg-card rounded-xl border shadow-sm">
            <BodyRiskMap
              risks={riskData}
              onPartClick={(part) => navigate(`/assessments?type=${part}`)}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

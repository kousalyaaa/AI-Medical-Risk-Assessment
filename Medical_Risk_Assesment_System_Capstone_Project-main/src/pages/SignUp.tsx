import { AuthForm } from '@/components/auth/AuthForm';

const SignUp = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h2 className="text-4xl font-display font-bold mb-6">
            Start Your Health Journey Today
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Join thousands of users who trust HealthRisk for their health assessments.
            Get instant insights and personalized recommendations.
          </p>
          <ul className="space-y-4">
            {[
              'Heart Disease Risk Assessment',
              'Diabetes Risk Analysis',
              'Stroke Prediction',
              'Kidney Health Monitoring',
              'AI-Powered Diet Plans',
              'Hospital Recommendations',
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
                <span className="text-white/90">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <AuthForm mode="signup" />
      </div>
    </div>
  );
};

export default SignUp;

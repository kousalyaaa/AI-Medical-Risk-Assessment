import { AuthForm } from '@/components/auth/AuthForm';

const SignIn = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <AuthForm mode="signin" />
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h2 className="text-4xl font-display font-bold mb-6">
            Your Health, Our Priority
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Get personalized health risk assessments powered by advanced AI algorithms.
            Track your health journey and receive tailored recommendations.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold">4</p>
              <p className="text-sm text-white/70">Disease Assessments</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold">AI</p>
              <p className="text-sm text-white/70">Powered Analysis</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm text-white/70">Health Monitoring</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-white/70">Private & Secure</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

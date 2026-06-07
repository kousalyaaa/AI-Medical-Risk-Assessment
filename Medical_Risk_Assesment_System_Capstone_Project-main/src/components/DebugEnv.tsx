import React from 'react';

const DebugEnv: React.FC = () => {
  const envVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Environment Variables Debug</h2>
      <div className="space-y-2">
        {envVars.map(key => (
          <div key={key} className="flex justify-between">
            <span className="font-mono text-sm">{key}:</span>
            <span className="font-mono text-sm">
              {import.meta.env[key] ? '✅ Present' : '❌ Missing'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 p-2 bg-white rounded">
        <h3 className="font-semibold mb-2">Google Maps API Key:</h3>
        <p className="font-mono text-sm">
          {import.meta.env.VITE_GOOGLE_MAPS_API_KEY 
            ? `✅ ${import.meta.env.VITE_GOOGLE_MAPS_API_KEY.substring(0, 20)}...` 
            : '❌ Missing'}
        </p>
      </div>
    </div>
  );
};

export default DebugEnv;
import React from 'react';
import { RiskVectorBreakdown } from '@/components/dashboard/RiskVectorBreakdown';

const TestRiskVector = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0d1512] to-[#0a0f0d] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-8">Risk Vector Breakdown Test</h1>
        <RiskVectorBreakdown selectedCountry={null} timeWindow="30D" />
      </div>
    </div>
  );
};

export default TestRiskVector;

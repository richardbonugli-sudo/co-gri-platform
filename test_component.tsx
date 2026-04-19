// Minimal test to see if RiskTrendComparison can render
import React from 'react';
import { RiskTrendComparison } from './src/components/dashboard/RiskTrendComparison';

function TestApp() {
  return (
    <div>
      <h1>Test RiskTrendComparison</h1>
      <RiskTrendComparison selectedCountry={null} timeWindow="30D" />
    </div>
  );
}

export default TestApp;

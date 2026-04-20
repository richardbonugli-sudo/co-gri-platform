import { GlobalRiskIndex } from '@/components/dashboard/GlobalRiskIndex';

export default function TestGlobalRisk() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">GDP-Weighted Global Risk Index</h1>
          <p className="text-gray-400">Phase 4: GDP-Weighted CSI Implementation Test</p>
        </div>

        {/* Test with different time windows */}
        <div className="space-y-6">
          <GlobalRiskIndex timeWindow="30D" />
        </div>
      </div>
    </div>
  );
}
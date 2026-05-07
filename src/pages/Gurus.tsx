import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import ForecastReport2026 from '@/components/ForecastReport2026';

const Gurus = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0d1512] to-[#0a0f0d] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
          
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#7fa89f] to-[#5a8a7f] bg-clip-text text-transparent">
              16 Geopolitical Investment Risk Gurus
            </h1>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-[#0d5f5f]/20 border border-[#0d5f5f] rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#7fa89f]">About the Forecast</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            This comprehensive geopolitical risk assessment combines insights from 16 leading experts across military intelligence, 
            diplomacy, economics, and strategic analysis. Their collective expertise spans decades of experience in conflict zones, 
            financial markets, and international relations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-[#0d5f5f]/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-[#7fa89f] mb-1">16</div>
              <div className="text-sm text-gray-400">Expert Analysts</div>
            </div>
            <div className="bg-[#0d5f5f]/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-[#7fa89f] mb-1">195</div>
              <div className="text-sm text-gray-400">Countries Assessed</div>
            </div>
            <div className="bg-[#0d5f5f]/30 rounded-lg p-4">
              <div className="text-3xl font-bold text-[#7fa89f] mb-1">85%</div>
              <div className="text-sm text-gray-400">Overall Confidence</div>
            </div>
          </div>
        </div>

        {/* Military & Intelligence Experts */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#7fa89f]">Military & Intelligence Experts</h2>
          <div className="bg-[#0d1512] border border-[#0d5f5f]/30 rounded-lg p-4 hover:border-[#0d5f5f] transition-all">
            <img
              src="/assets/gurus/military-intelligence-experts.png"
              alt="Military and Intelligence Experts - Larry C. Johnson, Lt. Col. Daniel Davis, Col. Larry Wilkerson, Jacques Baud, Scott Ritter, Amb. Chas Freeman, Andrei Martyanov, Prof. Mohammad Marandi"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>

        {/* Financial & Economic Experts */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#7fa89f]">Financial & Economic Experts</h2>
          <div className="bg-[#0d1512] border border-[#0d5f5f]/30 rounded-lg p-4 hover:border-[#0d5f5f] transition-all">
            <img
              src="/assets/gurus/financial-economic-experts.png"
              alt="Financial and Economic Experts - Sean Foo, Dr. Marc Faber, Michael Every, Louis-Vincent Gave, Alex Krainer, Dr. Anas Al-Hajji, Prof. Glenn Diesen, Stanislav Krapivnik"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>

        {/* 2026 Baseline Forecast Report - HTML Version */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-[#7fa89f]">2026 Baseline Forecast Report</h2>
          <ForecastReport2026 />
        </div>
      </div>
    </div>
  );
};

export default Gurus;
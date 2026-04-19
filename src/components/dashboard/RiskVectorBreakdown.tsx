/**
 * Risk Vector Breakdown Component (Component 3)
 * Displays 7 CSI risk vectors with contribution percentages
 * Fixed: Guaranteed bar rendering with proper text display
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { getCountryShockIndex } from '@/data/globalCountries';

interface RiskVectorBreakdownProps {
  selectedCountry?: string | null;
  timeWindow?: '7D' | '30D' | '90D' | '12M';
}

export const RiskVectorBreakdown: React.FC<RiskVectorBreakdownProps> = ({
  selectedCountry,
  timeWindow = '30D'
}) => {
  // Calculate vector breakdown
  const vectorData = useMemo(() => {
    if (!selectedCountry) {
      // Global Mode: Average vector contributions
      return [
        { name: 'Conflict & Security', value: 18, color: '#ef4444' },
        { name: 'Sanctions & Regulatory', value: 12, color: '#f97316' },
        { name: 'Trade & Logistics', value: 15, color: '#f59e0b' },
        { name: 'Governance & Rule of Law', value: 20, color: '#eab308' },
        { name: 'Cyber & Data Sovereignty', value: 10, color: '#84cc16' },
        { name: 'Public Unrest & Labor', value: 14, color: '#22c55e' },
        { name: 'Currency & Capital Controls', value: 11, color: '#10b981' }
      ];
    } else {
      // Country Focus Mode: Country-specific vector breakdown
      const csi = getCountryShockIndex(selectedCountry);
      
      let vectors;
      
      if (csi >= 70) {
        vectors = [
          { name: 'Conflict & Security', value: 28, color: '#ef4444' },
          { name: 'Sanctions & Regulatory', value: 16, color: '#f97316' },
          { name: 'Trade & Logistics', value: 12, color: '#f59e0b' },
          { name: 'Governance & Rule of Law', value: 22, color: '#eab308' },
          { name: 'Cyber & Data Sovereignty', value: 6, color: '#84cc16' },
          { name: 'Public Unrest & Labor', value: 10, color: '#22c55e' },
          { name: 'Currency & Capital Controls', value: 6, color: '#10b981' }
        ];
      } else if (csi >= 50) {
        vectors = [
          { name: 'Conflict & Security', value: 20, color: '#ef4444' },
          { name: 'Sanctions & Regulatory', value: 14, color: '#f97316' },
          { name: 'Trade & Logistics', value: 16, color: '#f59e0b' },
          { name: 'Governance & Rule of Law', value: 18, color: '#eab308' },
          { name: 'Cyber & Data Sovereignty', value: 10, color: '#84cc16' },
          { name: 'Public Unrest & Labor', value: 12, color: '#22c55e' },
          { name: 'Currency & Capital Controls', value: 10, color: '#10b981' }
        ];
      } else if (csi >= 30) {
        vectors = [
          { name: 'Conflict & Security', value: 14, color: '#ef4444' },
          { name: 'Sanctions & Regulatory', value: 12, color: '#f97316' },
          { name: 'Trade & Logistics', value: 16, color: '#f59e0b' },
          { name: 'Governance & Rule of Law', value: 16, color: '#eab308' },
          { name: 'Cyber & Data Sovereignty', value: 14, color: '#84cc16' },
          { name: 'Public Unrest & Labor', value: 14, color: '#22c55e' },
          { name: 'Currency & Capital Controls', value: 14, color: '#10b981' }
        ];
      } else {
        vectors = [
          { name: 'Conflict & Security', value: 8, color: '#ef4444' },
          { name: 'Sanctions & Regulatory', value: 10, color: '#f97316' },
          { name: 'Trade & Logistics', value: 14, color: '#f59e0b' },
          { name: 'Governance & Rule of Law', value: 12, color: '#eab308' },
          { name: 'Cyber & Data Sovereignty', value: 18, color: '#84cc16' },
          { name: 'Public Unrest & Labor', value: 16, color: '#22c55e' },
          { name: 'Currency & Capital Controls', value: 22, color: '#10b981' }
        ];
      }
      
      return vectors.map(v => ({
        ...v,
        value: Math.max(5, Math.min(35, v.value + (Math.random() * 6 - 3)))
      })).map(v => ({
        ...v,
        value: parseFloat(v.value.toFixed(1))
      }));
    }
  }, [selectedCountry]);

  const maxValue = 40;

  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#7fa89f]" />
            <CardTitle className="text-white text-lg font-semibold">Risk Vector Breakdown</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]">
            {selectedCountry ? 'Country Focus' : 'Global Average'}
          </Badge>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          {selectedCountry 
            ? `CSI vector contributions for ${selectedCountry}`
            : 'Average vector contributions across all countries'
          }
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {vectorData.map((vector, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#7fa89f] font-medium whitespace-nowrap">{vector.name}</span>
                <span className="text-white font-semibold ml-4">{vector.value}%</span>
              </div>
              <div className="w-full bg-[#0d5f5f]/20 rounded-full h-7 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                  style={{
                    width: `${(vector.value / maxValue) * 100}%`,
                    backgroundColor: vector.color,
                    minWidth: '40px'
                  }}
                >
                  <span className="text-white text-xs font-semibold drop-shadow-lg">
                    {vector.value}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* X-axis scale reference */}
        <div className="mt-6 pt-4 border-t border-[#0d5f5f]/30">
          <div className="flex justify-between text-xs text-[#7fa89f]">
            <span>0%</span>
            <span>10%</span>
            <span>20%</span>
            <span>30%</span>
            <span>40%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskVectorBreakdown;
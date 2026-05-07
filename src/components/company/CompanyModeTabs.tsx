/**
 * Company Mode Sub-Tab Navigation
 * Phase 1A: Lens Badge System Implementation
 * 
 * Provides sub-tab structure for Company Mode:
 * - [Structural] (default) - Current state CO-GRI
 * - [Forecast Overlay] - Probability-weighted expected path
 * - [Scenario Shock] - Conditional stress test
 * - [Trading Signal] - Implementation summary
 */

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalState } from '@/store/globalState';
import { Lens } from '@/types/global';

interface CompanyModeTabsProps {
  className?: string;
}

export const CompanyModeTabs: React.FC<CompanyModeTabsProps> = ({ className = '' }) => {
  const { active_lens, setLens } = useGlobalState();

  const handleTabChange = (value: string) => {
    setLens(value as Lens);
  };

  return (
    <Tabs value={active_lens} onValueChange={handleTabChange} className={className}>
      <TabsList className="grid w-full grid-cols-4 bg-slate-100">
        <TabsTrigger 
          value="Structural"
          className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
        >
          Structural
        </TabsTrigger>
        <TabsTrigger 
          value="Forecast Overlay"
          className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
        >
          Forecast Overlay
        </TabsTrigger>
        <TabsTrigger 
          value="Scenario Shock"
          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
        >
          Scenario Shock
        </TabsTrigger>
        <TabsTrigger 
          value="Trading Signal"
          className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
        >
          Trading Signal
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default CompanyModeTabs;
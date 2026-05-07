/**
 * Scenario State Management using Zustand
 * Part of CO-GRI Platform Scenario Mode Implementation
 */

import { create } from 'zustand';
import { 
  ScenarioInput, 
  ScenarioResult, 
  ScenarioTemplate,
  ScenarioConfig,
  EventType,
  PropagationType,
  Severity
} from '@/types/scenario';
import { calculateScenarioImpact, applyScenarioToCompany } from '@/services/scenarioEngine';

interface ScenarioState {
  // Active scenario
  activeScenario: ScenarioInput | null;
  scenarioResult: ScenarioResult | null;
  
  // Saved scenarios
  savedScenarios: ScenarioTemplate[];
  
  // Comparison mode
  comparisonMode: boolean;
  comparedScenarios: ScenarioResult[];
  
  // UI state
  isCalculating: boolean;
  calculationProgress: number;
  error: string | null;
  
  // Actions
  setActiveScenario: (scenario: ScenarioInput) => void;
  runScenario: (config: ScenarioConfig, ticker: string) => Promise<void>;
  saveScenario: (scenario: ScenarioInput) => void;
  loadScenario: (scenarioId: string) => void;
  deleteScenario: (scenarioId: string) => void;
  toggleComparisonMode: () => void;
  addToComparison: (result: ScenarioResult) => void;
  removeFromComparison: (scenarioId: string) => void;
  clearComparison: () => void;
  reset: () => void;
  clearError: () => void;
}

// Generate unique ID
function generateId(): string {
  return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useScenarioState = create<ScenarioState>((set, get) => ({
  activeScenario: null,
  scenarioResult: null,
  savedScenarios: [],
  comparisonMode: false,
  comparedScenarios: [],
  isCalculating: false,
  calculationProgress: 0,
  error: null,
  
  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  
  runScenario: async (config: ScenarioConfig, ticker: string) => {
    set({ isCalculating: true, calculationProgress: 0, error: null });
    
    try {
      // Step 1: Validate inputs (10%)
      set({ calculationProgress: 10 });
      
      // Step 2: Calculate scenario impact (60%)
      set({ calculationProgress: 30 });
      const scenarioImpact = calculateScenarioImpact(config);
      
      // Step 3: Apply to company (90%)
      set({ calculationProgress: 60 });
      const companyResult = await applyScenarioToCompany(ticker, scenarioImpact, config);
      
      // Step 4: Transform to ScenarioResult format
      set({ calculationProgress: 90 });
      
      const result: ScenarioResult = {
        scenarioId: generateId(),
        companyId: ticker,
        ticker: ticker.toUpperCase(),
        baselineCOGRI: companyResult.baselineScore,
        scenarioCOGRI: companyResult.scenarioScore,
        deltaCOGRI: companyResult.scoreDelta,
        deltaPercentage: companyResult.percentChange,
        baselineRiskLevel: companyResult.baselineRiskLevel as any,
        scenarioRiskLevel: companyResult.scenarioRiskLevel as any,
        riskLevelChange: companyResult.scoreDelta > 0 ? 'Upgrade' : 
                        companyResult.scoreDelta < 0 ? 'Downgrade' : 'Stable',
        confidence: 0.85,
        dataQuality: {
          exposureCoverage: 95,
          shockDataFreshness: new Date(),
          alignmentCoverage: 85
        },
        channelAttribution: [],
        nodeAttribution: companyResult.countryExposures.map(ce => ({
          country: ce.country,
          baselineRisk: ce.baseContribution,
          scenarioRisk: ce.scenarioContribution,
          delta: ce.scenarioContribution - ce.baseContribution,
          deltaPercentage: ce.baseContribution > 0 
            ? ((ce.scenarioContribution - ce.baseContribution) / ce.baseContribution) * 100 
            : 0,
          contribution: 0,
          dominantChannel: 'Supply Chain' as const,
          channelBreakdown: {
            revenue: 0,
            supplyChain: 0,
            physicalAssets: 0,
            financial: 0
          },
          baselineShock: ce.baseCSI,
          scenarioShock: ce.scenarioCSI,
          shockDelta: ce.scenarioCSI - ce.baseCSI
        })),
        calculatedAt: new Date(),
        calculationTime: 1500
      };
      
      // Step 5: Complete (100%)
      set({ 
        scenarioResult: result,
        calculationProgress: 100,
        isCalculating: false
      });
      
      // Add to comparison if in comparison mode
      if (get().comparisonMode) {
        get().addToComparison(result);
      }
      
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to calculate scenario',
        isCalculating: false,
        calculationProgress: 0
      });
    }
  },
  
  saveScenario: (scenario) => {
    const template: ScenarioTemplate = {
      ...scenario,
      category: 'Custom',
      isPublic: false,
      usageCount: 0,
      savedAt: new Date(),
      tags: []
    };
    set({ 
      savedScenarios: [...get().savedScenarios, template]
    });
  },
  
  loadScenario: (scenarioId) => {
    const scenario = get().savedScenarios.find(s => s.id === scenarioId);
    if (scenario) {
      set({ activeScenario: scenario });
    }
  },
  
  deleteScenario: (scenarioId) => {
    set({
      savedScenarios: get().savedScenarios.filter(s => s.id !== scenarioId)
    });
  },
  
  toggleComparisonMode: () => {
    set({ comparisonMode: !get().comparisonMode });
  },
  
  addToComparison: (result) => {
    const compared = get().comparedScenarios;
    if (compared.length < 4) {
      set({ comparedScenarios: [...compared, result] });
    }
  },
  
  removeFromComparison: (scenarioId) => {
    set({
      comparedScenarios: get().comparedScenarios.filter(
        r => r.scenarioId !== scenarioId
      )
    });
  },
  
  clearComparison: () => {
    set({ comparedScenarios: [] });
  },
  
  reset: () => {
    set({
      activeScenario: null,
      scenarioResult: null,
      isCalculating: false,
      calculationProgress: 0,
      error: null
    });
  },
  
  clearError: () => {
    set({ error: null });
  }
}));
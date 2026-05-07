/**
 * Company Mode Routing Configuration
 * Phase 2 - Task 3: Lens-aware routing documentation
 * 
 * This file documents how components should adapt their content based on the active lens.
 */

import { Lens } from '@/types/global';

/**
 * Lens Configuration
 * Defines the visual and functional properties of each lens
 */
export const LENS_CONFIG: Record<Lens, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
  dataSource: string;
}> = {
  'Structural': {
    color: '#3B82F6',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
    icon: 'Activity',
    description: 'Current State',
    dataSource: 'structural'
  },
  'Forecast Overlay': {
    color: '#8B5CF6',
    bgColor: 'bg-purple-500',
    borderColor: 'border-purple-500',
    icon: 'TrendingUp',
    description: 'Probability-Weighted Expected Path',
    dataSource: 'forecast'
  },
  'Scenario Shock': {
    color: '#F97316',
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-500',
    icon: 'AlertTriangle',
    description: 'Conditional Stress Test',
    dataSource: 'scenario'
  },
  'Trading Signal': {
    color: '#10B981',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500',
    icon: 'DollarSign',
    description: 'Implementation Output',
    dataSource: 'trading'
  }
};

/**
 * Component Content Adaptation Guide
 * 
 * Each component should adapt its content based on the active lens:
 * 
 * C1: Company Summary Panel
 * - Structural: Current CO-GRI score, risk level, primary driver
 * - Forecast Overlay: Expected delta CO-GRI, forecast outlook, confidence
 * - Scenario Shock: Scenario CO-GRI, delta from structural, impacted channels
 * - Trading Signal: Recommendation, position adjustment, expected impact
 * 
 * C2: COGRI Trend Chart
 * - Structural: Historical CO-GRI trend
 * - Forecast Overlay: Historical + projected forecast path
 * - Scenario Shock: Historical + scenario impact trajectory
 * - Trading Signal: Historical + trading signal timeline
 * 
 * C3: Risk Contribution Map
 * - Structural: Current risk contributions by country
 * - Forecast Overlay: Expected changes in risk contributions
 * - Scenario Shock: Scenario-adjusted risk contributions
 * - Trading Signal: Risk-adjusted position recommendations by region
 * 
 * C4: Exposure Pathways
 * - Structural: Current channel contribution shares
 * - Forecast Overlay: Expected channel impact assessment
 * - Scenario Shock: Delta by channel (structural vs scenario)
 * - Trading Signal: Channel-specific position adjustments
 * 
 * C5: Top Relevant Risks
 * - Structural: Top structural drivers (current state)
 * - Forecast Overlay: Relevant forecast events (filtered by relevance)
 * - Scenario Shock: Scenario assumptions and drivers
 * - Trading Signal: Risk factors affecting trading recommendations
 * 
 * C6: Peer Comparison
 * - Structural: Current CO-GRI scores and risk levels
 * - Forecast Overlay: Forecast outlook and confidence levels
 * - Scenario Shock: Scenario impact comparison
 * - Trading Signal: Trading recommendations and positions
 * 
 * C7: Risk Attribution
 * - Structural: Current risk attribution by country
 * - Forecast Overlay: Expected changes in attribution
 * - Scenario Shock: Scenario-adjusted attribution
 * - Trading Signal: Risk-weighted position sizing
 * 
 * C8: Timeline / Event Feed
 * - Structural: Historical events affecting top countries
 * - Forecast Overlay: Forecast events timeline
 * - Scenario Shock: Scenario assumptions and timeline
 * - Trading Signal: Trading signal history and triggers
 * 
 * C9: Verification Drawer
 * - All Lenses: Same verification data (collapsed by default)
 */

/**
 * Data Filtering Rules
 * 
 * CRITICAL GUARDRAILS:
 * 
 * 1. Forecast Overlay:
 *    - MUST filter events by relevance (exposure threshold >5%, impact threshold |ΔCO-GRI| > 2)
 *    - MUST NOT redistribute exposures
 *    - MUST NOT create new exposures
 *    - ONLY apply deltas to existing exposure countries
 * 
 * 2. Scenario Shock:
 *    - MUST show conditional stress test results
 *    - MUST display transmission trace (collapsed by default)
 *    - MUST show delta from structural baseline
 * 
 * 3. Trading Signal:
 *    - MUST show implementation-ready recommendations
 *    - MUST include confidence scores
 *    - MUST show expected impact metrics
 */

/**
 * Example: Component Data Adapter
 * 
 * Usage in components:
 * 
 * ```typescript
 * import { useGlobalState } from '@/store/globalState';
 * import { LENS_CONFIG } from '@/config/companyModeRouting';
 * 
 * function MyComponent() {
 *   const activeLens = useGlobalState((state) => state.active_lens);
 *   const dataSource = LENS_CONFIG[activeLens].dataSource;
 *   
 *   // Fetch appropriate data based on lens
 *   const data = useMemo(() => {
 *     switch (dataSource) {
 *       case 'structural':
 *         return structuralData;
 *       case 'forecast':
 *         return forecastData;
 *       case 'scenario':
 *         return scenarioData;
 *       case 'trading':
 *         return tradingData;
 *       default:
 *         return structuralData;
 *     }
 *   }, [dataSource]);
 *   
 *   return (
 *     <Card>
 *       <LensBadge lens={activeLens} />
 *       {/* Render data based on active lens *\/}
 *     </Card>
 *   );
 * }
 * ```
 */

export default LENS_CONFIG;
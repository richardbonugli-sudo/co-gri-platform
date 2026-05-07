/**
 * Unified Framework Integration Tests
 * Tests five-mode navigation, engine orchestration, and cross-mode interactions
 * Part of CO-GRI Platform Phase 3 - Week 6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlobalState, Mode } from '@/store/globalState';
import { engineOrchestrator, EngineType } from '@/services/engines/EngineOrchestrator';
import { deepLinking } from '@/utils/deepLinking';

describe('Unified Framework Integration Tests', () => {
  beforeEach(() => {
    // Reset global state before each test
    const { result } = renderHook(() => useGlobalState());
    act(() => {
      result.current.clearSelection();
      result.current.setActiveMode('Company');
    });
  });

  describe('Five-Mode Navigation', () => {
    it('should initialize with Company mode as default', () => {
      const { result } = renderHook(() => useGlobalState());
      expect(result.current.active_mode).toBe('Company');
    });

    it('should switch between all five modes', () => {
      const { result } = renderHook(() => useGlobalState());
      const modes: Mode[] = ['Country', 'Company', 'Forecast', 'Scenario', 'Trading'];

      modes.forEach(mode => {
        act(() => {
          result.current.setActiveMode(mode);
        });
        expect(result.current.active_mode).toBe(mode);
      });
    });

    it('should preserve selection when switching modes', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setSelectedCompany('AAPL');
        result.current.setActiveMode('Forecast');
      });

      expect(result.current.selected.company).toBe('AAPL');
      expect(result.current.active_mode).toBe('Forecast');
    });

    it('should clear selection on demand', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setSelectedCompany('AAPL');
        result.current.setSelectedCountry('China');
        result.current.clearSelection();
      });

      expect(result.current.selected.company).toBeNull();
      expect(result.current.selected.country).toBeNull();
    });
  });

  describe('Entity Selection', () => {
    it('should set selected country', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setSelectedCountry('China');
      });

      expect(result.current.selected.country).toBe('China');
    });

    it('should set selected company', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setSelectedCompany('AAPL');
      });

      expect(result.current.selected.company).toBe('AAPL');
    });

    it('should set selected sector', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setSelectedSector('Technology');
      });

      expect(result.current.selected.sector).toBe('Technology');
    });

    it('should set selected portfolio', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setSelectedPortfolio('Tech Portfolio');
      });

      expect(result.current.selected.portfolio).toBe('Tech Portfolio');
    });

    it('should support multiple simultaneous selections', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setSelectedCompany('AAPL');
        result.current.setSelectedCountry('China');
        result.current.setSelectedSector('Technology');
      });

      expect(result.current.selected.company).toBe('AAPL');
      expect(result.current.selected.country).toBe('China');
      expect(result.current.selected.sector).toBe('Technology');
    });
  });

  describe('Engine Orchestration', () => {
    it('should route to correct primary engine for each mode', () => {
      const modes: Mode[] = ['Country', 'Company', 'Forecast', 'Scenario', 'Trading'];
      const expectedEngines: Record<Mode, EngineType> = {
        'Country': 'COGRI',
        'Company': 'COGRI',
        'Forecast': 'Forecast',
        'Scenario': 'Scenario',
        'Trading': 'Trading'
      };

      modes.forEach(mode => {
        const context = { mode };
        const engine = engineOrchestrator.routeToEngine(context);
        expect(engine).toBe(expectedEngines[mode]);
      });
    });

    it('should get correct engine activation for Company mode', () => {
      const activations = engineOrchestrator.getEngineActivation('Company');

      expect(activations).toHaveLength(6);
      
      const cogri = activations.find(a => a.engine === 'COGRI');
      expect(cogri?.level).toBe('Primary');

      const forecast = activations.find(a => a.engine === 'Forecast');
      expect(forecast?.level).toBe('Secondary');

      const propagation = activations.find(a => a.engine === 'Propagation');
      expect(propagation?.level).toBe('Inactive');
    });

    it('should get active engines for each mode', () => {
      const companyEngines = engineOrchestrator.getActiveEngines('Company');
      expect(companyEngines).toContain('COGRI');
      expect(companyEngines).toContain('Forecast');
      expect(companyEngines).toContain('Scenario');
      expect(companyEngines).toContain('Trading');
      expect(companyEngines).not.toContain('Propagation');

      const forecastEngines = engineOrchestrator.getActiveEngines('Forecast');
      expect(forecastEngines).toContain('Forecast');
      expect(forecastEngines).toContain('COGRI');
      expect(forecastEngines).toContain('Propagation');
    });

    it('should get primary and secondary engines separately', () => {
      const primary = engineOrchestrator.getPrimaryEngine('Company');
      expect(primary).toBe('COGRI');

      const secondary = engineOrchestrator.getSecondaryEngines('Company');
      expect(secondary).toContain('Forecast');
      expect(secondary).toContain('Scenario');
      expect(secondary).toContain('Trading');
      expect(secondary).not.toContain('COGRI');
    });
  });

  describe('Deep Linking', () => {
    it('should generate deep link URL', () => {
      const url = deepLinking.generateDeepLink({
        mode: 'Company',
        company: 'AAPL',
        lens: 'Forecast Overlay'
      });

      expect(url).toContain('/company');
      expect(url).toContain('company=AAPL');
      expect(url).toContain('lens=Forecast');
    });

    it('should create Company to Scenario navigation context', () => {
      const exposures = [
        { country: 'China', exposureWeight: 0.40, preNormalizedWeight: 0.40, countryShockIndex: 65, contribution: 26, status: 'evidence' as const },
        { country: 'Taiwan', exposureWeight: 0.25, preNormalizedWeight: 0.25, countryShockIndex: 55, contribution: 13.75, status: 'evidence' as const },
        { country: 'Vietnam', exposureWeight: 0.15, preNormalizedWeight: 0.15, countryShockIndex: 45, contribution: 6.75, status: 'evidence' as const }
      ];

      const context = deepLinking.companyToScenario('AAPL', exposures);

      expect(context.fromMode).toBe('Company');
      expect(context.toMode).toBe('Scenario');
      expect(context.prefillData?.sourceCompany).toBe('AAPL');
      expect(context.prefillData?.affectedCountries).toContain('China');
      expect(context.prefillData?.affectedCountries).toContain('Taiwan');
      expect(context.preserveSelection).toBe(true);
    });

    it('should create Country to Company navigation context', () => {
      const context = deepLinking.countryToCompany('China');

      expect(context.fromMode).toBe('Country');
      expect(context.toMode).toBe('Company');
      expect(context.prefillData?.filterCountry).toBe('China');
      expect(context.prefillData?.highlightedCountries).toContain('China');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain Company Mode lens state', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setActiveCompanyLens('Forecast Overlay');
      });

      expect(result.current.active_company_lens).toBe('Forecast Overlay');
    });

    it('should maintain C3-C8 interaction state', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setHighlightedCountries(['China', 'Taiwan']);
      });

      expect(result.current.highlightedCountries).toEqual(['China', 'Taiwan']);
    });

    it('should maintain bottom row view state', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setBottomRowView('timeline');
      });

      expect(result.current.bottomRowView).toBe('timeline');
    });

    it('should clear highlights without affecting mode', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setActiveMode('Company');
        result.current.setHighlightedCountries(['China']);
        result.current.clearHighlights();
      });

      expect(result.current.highlightedCountries).toEqual([]);
      expect(result.current.active_mode).toBe('Company');
    });
  });

  describe('User Preferences', () => {
    it('should update user preferences', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.updatePreferences({
          defaultMode: 'Forecast',
          defaultCompanyLens: 'Trading Signal'
        });
      });

      expect(result.current.preferences.defaultMode).toBe('Forecast');
      expect(result.current.preferences.defaultCompanyLens).toBe('Trading Signal');
    });

    it('should persist partial preference updates', () => {
      const { result } = renderHook(() => useGlobalState());

      const originalTimeWindow = result.current.preferences.defaultTimeWindow;

      act(() => {
        result.current.updatePreferences({
          defaultMode: 'Scenario'
        });
      });

      expect(result.current.preferences.defaultMode).toBe('Scenario');
      expect(result.current.preferences.defaultTimeWindow).toBe(originalTimeWindow);
    });
  });

  describe('Performance & Edge Cases', () => {
    it('should handle rapid mode switching', () => {
      const { result } = renderHook(() => useGlobalState());
      const modes: Mode[] = ['Country', 'Company', 'Forecast', 'Scenario', 'Trading'];

      act(() => {
        modes.forEach(mode => {
          result.current.setActiveMode(mode);
        });
      });

      expect(result.current.active_mode).toBe('Trading');
    });

    it('should handle multiple entity selections in sequence', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setSelectedCompany('AAPL');
        result.current.setSelectedCompany('MSFT');
        result.current.setSelectedCompany('TSLA');
      });

      expect(result.current.selected.company).toBe('TSLA');
    });

    it('should handle null selections', () => {
      const { result } = renderHook(() => useGlobalState());

      act(() => {
        result.current.setSelectedCompany('AAPL');
        result.current.setSelectedCompany(null);
      });

      expect(result.current.selected.company).toBeNull();
    });
  });
});
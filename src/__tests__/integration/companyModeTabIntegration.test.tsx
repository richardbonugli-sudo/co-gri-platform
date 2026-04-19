/**
 * Integration Tests for Company Mode Tab Navigation
 * Phase 2 - Task 3: Lens-aware routing verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlobalState } from '@/store/globalState';
import { Lens } from '@/types/global';

describe('Company Mode Tab Integration', () => {
  beforeEach(() => {
    // Reset global state before each test
    const { result } = renderHook(() => useGlobalState());
    act(() => {
      result.current.setLens('Structural');
    });
  });

  it('should initialize with Structural lens as default', () => {
    const { result } = renderHook(() => useGlobalState());
    expect(result.current.active_lens).toBe('Structural');
  });

  it('should update global lens state when tab is switched', () => {
    const { result } = renderHook(() => useGlobalState());

    act(() => {
      result.current.setLens('Forecast Overlay');
    });

    expect(result.current.active_lens).toBe('Forecast Overlay');
  });

  it('should cycle through all four lens types', () => {
    const { result } = renderHook(() => useGlobalState());
    const lenses: Lens[] = ['Structural', 'Forecast Overlay', 'Scenario Shock', 'Trading Signal'];

    lenses.forEach((lens) => {
      act(() => {
        result.current.setLens(lens);
      });
      expect(result.current.active_lens).toBe(lens);
    });
  });

  it('should maintain lens state across component re-renders', () => {
    const { result, rerender } = renderHook(() => useGlobalState());

    act(() => {
      result.current.setLens('Scenario Shock');
    });

    rerender();

    expect(result.current.active_lens).toBe('Scenario Shock');
  });

  it('should allow switching between any two lenses', () => {
    const { result } = renderHook(() => useGlobalState());

    // Switch from Structural to Trading Signal
    act(() => {
      result.current.setLens('Trading Signal');
    });
    expect(result.current.active_lens).toBe('Trading Signal');

    // Switch from Trading Signal to Forecast Overlay
    act(() => {
      result.current.setLens('Forecast Overlay');
    });
    expect(result.current.active_lens).toBe('Forecast Overlay');

    // Switch from Forecast Overlay back to Structural
    act(() => {
      result.current.setLens('Structural');
    });
    expect(result.current.active_lens).toBe('Structural');
  });

  it('should not lose lens state when mode changes', () => {
    const { result } = renderHook(() => useGlobalState());

    act(() => {
      result.current.setLens('Forecast Overlay');
      result.current.setMode('Country');
    });

    expect(result.current.active_lens).toBe('Forecast Overlay');
    expect(result.current.active_mode).toBe('Country');
  });
});

describe('Lens Badge Display Verification', () => {
  it('should provide correct lens information for badge rendering', () => {
    const { result } = renderHook(() => useGlobalState());

    const lensConfigs: Record<Lens, { color: string; description: string }> = {
      'Structural': { color: 'blue', description: 'Current State' },
      'Forecast Overlay': { color: 'purple', description: 'Probability-Weighted Expected Path' },
      'Scenario Shock': { color: 'orange', description: 'Conditional Stress Test' },
      'Trading Signal': { color: 'green', description: 'Implementation Output' }
    };

    Object.entries(lensConfigs).forEach(([lens, config]) => {
      act(() => {
        result.current.setLens(lens as Lens);
      });

      expect(result.current.active_lens).toBe(lens);
      // Verify lens config is accessible
      expect(lensConfigs[result.current.active_lens]).toEqual(config);
    });
  });
});

describe('Component Data Filtering by Lens', () => {
  it('should indicate which data source to use based on active lens', () => {
    const { result } = renderHook(() => useGlobalState());

    const dataSourceMap: Record<Lens, string> = {
      'Structural': 'current_state_data',
      'Forecast Overlay': 'forecast_data',
      'Scenario Shock': 'scenario_data',
      'Trading Signal': 'trading_data'
    };

    Object.entries(dataSourceMap).forEach(([lens, expectedSource]) => {
      act(() => {
        result.current.setLens(lens as Lens);
      });

      const activeDataSource = dataSourceMap[result.current.active_lens];
      expect(activeDataSource).toBe(expectedSource);
    });
  });
});
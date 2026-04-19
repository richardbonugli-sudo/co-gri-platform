/**
 * Trading State Management
 * Zustand store for Trading Mode state
 */

import { create } from 'zustand';
import {
  TradingSignal,
  Portfolio,
  OptimizationResult,
  BacktestResult,
  SignalFilters,
  SignalSort,
  OptimizationSettings,
  BacktestConfig,
} from '@/types/trading';

interface TradingState {
  // Signals
  signals: TradingSignal[];
  selectedSignal: TradingSignal | null;
  signalFilters: SignalFilters;
  signalSort: SignalSort;
  
  // Portfolio
  currentPortfolio: Portfolio | null;
  optimizationResult: OptimizationResult | null;
  isOptimizing: boolean;
  
  // Backtest
  backtestResult: BacktestResult | null;
  isBacktesting: boolean;
  backtestProgress: number;
  
  // UI state
  activeTab: 'signals' | 'portfolio' | 'backtest';
  
  // Error handling
  error: string | null;
  
  // Actions
  setSignals: (signals: TradingSignal[]) => void;
  setSelectedSignal: (signal: TradingSignal | null) => void;
  setSignalFilters: (filters: SignalFilters) => void;
  setSignalSort: (sort: SignalSort) => void;
  
  setCurrentPortfolio: (portfolio: Portfolio | null) => void;
  setOptimizationResult: (result: OptimizationResult | null) => void;
  setIsOptimizing: (isOptimizing: boolean) => void;
  
  setBacktestResult: (result: BacktestResult | null) => void;
  setIsBacktesting: (isBacktesting: boolean) => void;
  setBacktestProgress: (progress: number) => void;
  
  setActiveTab: (tab: 'signals' | 'portfolio' | 'backtest') => void;
  setError: (error: string | null) => void;
  
  // Async actions
  generateSignals: (universe: string[]) => Promise<void>;
  optimizePortfolio: (portfolio: Portfolio, settings: OptimizationSettings) => Promise<void>;
  runBacktest: (config: BacktestConfig) => Promise<void>;
}

export const useTradingState = create<TradingState>((set, get) => ({
  // Initial state
  signals: [],
  selectedSignal: null,
  signalFilters: {
    signal_types: ['BUY', 'SELL', 'HOLD'],
    confidence_threshold: 0,
    sectors: [],
  },
  signalSort: {
    sort_by: 'signal_strength',
    order: 'desc',
  },
  
  currentPortfolio: null,
  optimizationResult: null,
  isOptimizing: false,
  
  backtestResult: null,
  isBacktesting: false,
  backtestProgress: 0,
  
  activeTab: 'signals',
  error: null,
  
  // Actions
  setSignals: (signals) => set({ signals }),
  setSelectedSignal: (signal) => set({ selectedSignal: signal }),
  setSignalFilters: (filters) => set({ signalFilters: filters }),
  setSignalSort: (sort) => set({ signalSort: sort }),
  
  setCurrentPortfolio: (portfolio) => set({ currentPortfolio: portfolio }),
  setOptimizationResult: (result) => set({ optimizationResult: result }),
  setIsOptimizing: (isOptimizing) => set({ isOptimizing }),
  
  setBacktestResult: (result) => set({ backtestResult: result }),
  setIsBacktesting: (isBacktesting) => set({ isBacktesting }),
  setBacktestProgress: (progress) => set({ backtestProgress: progress }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  setError: (error) => set({ error }),
  
  // Async actions (will be implemented by TradingEngine)
  generateSignals: async (universe) => {
    set({ error: null });
    try {
      // Will be implemented by TradingEngine
      const { TradingEngine } = await import('@/services/engines/TradingEngine');
      const engine = new TradingEngine();
      const signals = await engine.generateSignals(universe);
      set({ signals });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to generate signals' });
    }
  },
  
  optimizePortfolio: async (portfolio, settings) => {
    set({ isOptimizing: true, error: null });
    try {
      const { TradingEngine } = await import('@/services/engines/TradingEngine');
      const engine = new TradingEngine();
      const result = await engine.optimizePortfolio(portfolio, settings);
      set({ optimizationResult: result, isOptimizing: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to optimize portfolio',
        isOptimizing: false 
      });
    }
  },
  
  runBacktest: async (config) => {
    set({ isBacktesting: true, backtestProgress: 0, error: null });
    try {
      const { TradingEngine } = await import('@/services/engines/TradingEngine');
      const engine = new TradingEngine();
      const result = await engine.runBacktest(config, (progress) => {
        set({ backtestProgress: progress });
      });
      set({ backtestResult: result, isBacktesting: false, backtestProgress: 100 });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to run backtest',
        isBacktesting: false,
        backtestProgress: 0
      });
    }
  },
}));
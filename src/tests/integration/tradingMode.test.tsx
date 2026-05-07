/**
 * Trading Mode Integration Tests
 * Part of CO-GRI Platform Phase 3 - Week 11-13
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TradingEngine } from '@/services/engines/TradingEngine';
import {
  generateMockSignals,
  getSamplePortfolio,
  type TradingSignal,
  type Portfolio
} from '@/services/mockData/tradingDataGenerator';
import type { OptimizationSettings, BacktestConfig } from '@/types/trading';

describe('Trading Mode - Week 11-13 Integration Tests', () => {
  let tradingEngine: TradingEngine;
  let mockSignals: TradingSignal[];
  let samplePortfolio: Portfolio;

  beforeEach(() => {
    tradingEngine = new TradingEngine();
    mockSignals = generateMockSignals();
    samplePortfolio = getSamplePortfolio('balanced');
  });

  // ============================================================================
  // SIGNAL GENERATION TESTS
  // ============================================================================

  describe('Signal Generation', () => {
    it('should generate trading signals', () => {
      expect(mockSignals.length).toBeGreaterThan(0);
      
      mockSignals.forEach(signal => {
        expect(signal.signal_id).toBeTruthy();
        expect(signal.ticker).toBeTruthy();
        expect(signal.company_name).toBeTruthy();
        expect(['BUY', 'SELL', 'HOLD']).toContain(signal.signal_type);
        expect(['High', 'Medium', 'Low']).toContain(signal.signal_strength);
        expect(['High', 'Medium', 'Low']).toContain(signal.confidence);
      });
    });

    it('should have valid signal metrics', () => {
      mockSignals.forEach(signal => {
        expect(signal.current_cogri).toBeGreaterThan(0);
        expect(signal.forecast_delta_cogri).toBeDefined();
        expect(signal.scenario_risk_score).toBeGreaterThan(0);
        expect(signal.confidence_score).toBeGreaterThanOrEqual(0);
        expect(signal.confidence_score).toBeLessThanOrEqual(100);
      });
    });

    it('should have valid price targets', () => {
      mockSignals.forEach(signal => {
        expect(signal.current_price).toBeGreaterThan(0);
        expect(signal.price_target).toBeGreaterThan(0);
        expect(signal.stop_loss).toBeGreaterThan(0);
        expect(signal.expected_return).toBeDefined();
      });
    });

    it('should have signal drivers', () => {
      mockSignals.forEach(signal => {
        expect(signal.signal_drivers.length).toBeGreaterThan(0);
        
        signal.signal_drivers.forEach(driver => {
          expect(driver.factor).toBeTruthy();
          expect(['Positive', 'Negative', 'Neutral']).toContain(driver.direction);
          expect(driver.weight).toBeGreaterThan(0);
          expect(driver.weight).toBeLessThanOrEqual(1);
          expect(driver.explanation).toBeTruthy();
        });
      });
    });

    it('should have rationale', () => {
      mockSignals.forEach(signal => {
        expect(signal.rationale.length).toBeGreaterThan(0);
        signal.rationale.forEach(item => {
          expect(item).toBeTruthy();
        });
      });
    });

    it('should generate signal for specific ticker', async () => {
      const signal = await tradingEngine.generateSignalForTicker('AAPL');
      
      expect(signal).toBeDefined();
      expect(signal.ticker).toBe('AAPL');
      expect(['BUY', 'SELL', 'HOLD']).toContain(signal.signal_type);
    });
  });

  // ============================================================================
  // PORTFOLIO TESTS
  // ============================================================================

  describe('Portfolio Management', () => {
    it('should generate sample portfolios', () => {
      const conservative = getSamplePortfolio('conservative');
      const balanced = getSamplePortfolio('balanced');
      const aggressive = getSamplePortfolio('aggressive');
      
      expect(conservative).toBeDefined();
      expect(balanced).toBeDefined();
      expect(aggressive).toBeDefined();
      
      expect(conservative.name).toContain('Conservative');
      expect(balanced.name).toContain('Balanced');
      expect(aggressive.name).toContain('Aggressive');
    });

    it('should have valid portfolio structure', () => {
      expect(samplePortfolio.portfolio_id).toBeTruthy();
      expect(samplePortfolio.name).toBeTruthy();
      expect(samplePortfolio.holdings.length).toBeGreaterThan(0);
      expect(samplePortfolio.total_value).toBeGreaterThan(0);
      expect(samplePortfolio.weighted_cogri).toBeGreaterThan(0);
    });

    it('should have valid holdings', () => {
      samplePortfolio.holdings.forEach(holding => {
        expect(holding.ticker).toBeTruthy();
        expect(holding.shares).toBeGreaterThan(0);
        expect(holding.price).toBeGreaterThan(0);
        expect(holding.value).toBeGreaterThan(0);
        expect(holding.weight).toBeGreaterThan(0);
        expect(holding.weight).toBeLessThanOrEqual(100);
        expect(holding.cogri).toBeGreaterThan(0);
      });
    });

    it('should have weights sum to 100%', () => {
      const totalWeight = samplePortfolio.holdings.reduce((sum, h) => sum + h.weight, 0);
      expect(totalWeight).toBeCloseTo(100, 1);
    });
  });

  // ============================================================================
  // PORTFOLIO OPTIMIZATION TESTS
  // ============================================================================

  describe('Portfolio Optimization', () => {
    it('should optimize portfolio', async () => {
      const settings: OptimizationSettings = {
        objective: 'Minimize Risk',
        cogri_weight: 50,
        risk_tolerance: 'Moderate',
        rebalancing_frequency: 'Monthly',
        max_position_size: 25,
        min_position_size: 2,
        max_sector_exposure: 40,
        min_holdings: 5,
        max_holdings: 20,
        transaction_costs: 0.1,
        tax_loss_harvesting: false,
        esg_screening: false
      };

      const result = await tradingEngine.optimizePortfolio(samplePortfolio, settings);
      
      expect(result).toBeDefined();
      expect(result.metrics_comparison).toBeDefined();
      expect(result.trades.length).toBeGreaterThanOrEqual(0);
      expect(result.optimized_portfolio).toBeDefined();
    });

    it('should have valid metrics comparison', async () => {
      const settings: OptimizationSettings = {
        objective: 'Minimize Risk',
        cogri_weight: 60,
        risk_tolerance: 'Conservative',
        rebalancing_frequency: 'Quarterly',
        max_position_size: 20,
        min_position_size: 3,
        max_sector_exposure: 35,
        min_holdings: 8,
        max_holdings: 15,
        transaction_costs: 0.15,
        tax_loss_harvesting: true,
        esg_screening: false
      };

      const result = await tradingEngine.optimizePortfolio(samplePortfolio, settings);
      const comparison = result.metrics_comparison;
      
      expect(comparison.original).toBeDefined();
      expect(comparison.optimized).toBeDefined();
      expect(comparison.improvements).toBeDefined();
      
      // Optimized should have lower risk
      expect(comparison.optimized.weighted_cogri).toBeLessThanOrEqual(
        comparison.original.weighted_cogri
      );
    });

    it('should generate recommended trades', async () => {
      const settings: OptimizationSettings = {
        objective: 'Maximize Sharpe',
        cogri_weight: 40,
        risk_tolerance: 'Aggressive',
        rebalancing_frequency: 'Weekly',
        max_position_size: 30,
        min_position_size: 1,
        max_sector_exposure: 50,
        min_holdings: 3,
        max_holdings: 25,
        transaction_costs: 0.05,
        tax_loss_harvesting: false,
        esg_screening: true
      };

      const result = await tradingEngine.optimizePortfolio(samplePortfolio, settings);
      
      result.trades.forEach(trade => {
        expect(trade.ticker).toBeTruthy();
        expect(['BUY', 'SELL']).toContain(trade.action);
        expect(trade.shares).toBeGreaterThan(0);
        expect(trade.value).toBeGreaterThan(0);
        expect(trade.rationale).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // BACKTEST TESTS
  // ============================================================================

  describe('Backtesting', () => {
    it('should run backtest', async () => {
      const config: BacktestConfig = {
        strategy: 'CO-GRI Momentum',
        universe: 'S&P 500',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2025-12-31'),
        rebalancing_frequency: 'Monthly',
        initial_capital: 100000,
        transaction_costs: 0.1
      };

      const result = await tradingEngine.runBacktest(config);
      
      expect(result).toBeDefined();
      expect(result.config).toEqual(config);
      expect(result.performance).toBeDefined();
      expect(result.equity_curve.length).toBeGreaterThan(0);
    });

    it('should have valid performance metrics', async () => {
      const config: BacktestConfig = {
        strategy: 'Mean Reversion',
        universe: 'Russell 2000',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2024-12-31'),
        rebalancing_frequency: 'Quarterly',
        initial_capital: 250000,
        transaction_costs: 0.15
      };

      const result = await tradingEngine.runBacktest(config);
      const perf = result.performance;
      
      expect(perf.total_return).toBeDefined();
      expect(perf.annualized_return).toBeDefined();
      expect(perf.sharpe_ratio).toBeDefined();
      expect(perf.max_drawdown).toBeLessThanOrEqual(0);
      expect(perf.volatility).toBeGreaterThan(0);
      expect(perf.win_rate).toBeGreaterThanOrEqual(0);
      expect(perf.win_rate).toBeLessThanOrEqual(100);
      expect(perf.total_trades).toBeGreaterThan(0);
      expect(perf.profit_factor).toBeGreaterThan(0);
    });

    it('should have valid equity curve', async () => {
      const config: BacktestConfig = {
        strategy: 'CO-GRI + Forecast',
        universe: 'S&P 500',
        start_date: new Date('2024-06-01'),
        end_date: new Date('2025-06-01'),
        rebalancing_frequency: 'Weekly',
        initial_capital: 500000,
        transaction_costs: 0.08
      };

      const result = await tradingEngine.runBacktest(config);
      
      expect(result.equity_curve.length).toBeGreaterThan(0);
      
      result.equity_curve.forEach(point => {
        expect(point.date).toBeDefined();
        expect(point.portfolio_value).toBeGreaterThan(0);
        expect(point.benchmark_value).toBeGreaterThan(0);
      });
      
      // First point should be initial capital
      expect(result.equity_curve[0].portfolio_value).toBeCloseTo(config.initial_capital, -3);
    });

    it('should have benchmark comparison', async () => {
      const config: BacktestConfig = {
        strategy: 'CO-GRI Momentum',
        universe: 'S&P 500',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        rebalancing_frequency: 'Monthly',
        initial_capital: 100000,
        transaction_costs: 0.1
      };

      const result = await tradingEngine.runBacktest(config);
      const benchmark = result.benchmark;
      
      expect(benchmark.benchmark_name).toBeTruthy();
      expect(benchmark.strategy_return).toBeDefined();
      expect(benchmark.benchmark_return).toBeDefined();
      expect(benchmark.alpha).toBeDefined();
      expect(benchmark.beta).toBeGreaterThan(0);
      expect(benchmark.information_ratio).toBeDefined();
      expect(benchmark.tracking_error).toBeGreaterThan(0);
    });

    it('should have performance attribution', async () => {
      const config: BacktestConfig = {
        strategy: 'CO-GRI + Forecast',
        universe: 'S&P 500',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        rebalancing_frequency: 'Monthly',
        initial_capital: 100000,
        transaction_costs: 0.1
      };

      const result = await tradingEngine.runBacktest(config);
      const attribution = result.attribution;
      
      expect(attribution.by_sector.length).toBeGreaterThan(0);
      expect(attribution.by_signal_type.length).toBeGreaterThan(0);
      
      attribution.by_sector.forEach(item => {
        expect(item.sector).toBeTruthy();
        expect(item.contribution).toBeDefined();
        expect(item.trades).toBeGreaterThanOrEqual(0);
        expect(item.win_rate).toBeGreaterThanOrEqual(0);
        expect(item.win_rate).toBeLessThanOrEqual(100);
      });
      
      attribution.by_signal_type.forEach(item => {
        expect(['BUY', 'SELL']).toContain(item.signal_type);
        expect(item.contribution).toBeDefined();
        expect(item.trades).toBeGreaterThanOrEqual(0);
        expect(item.win_rate).toBeGreaterThanOrEqual(0);
        expect(item.win_rate).toBeLessThanOrEqual(100);
      });
    });
  });

  // ============================================================================
  // SIGNAL FILTERING AND SORTING TESTS
  // ============================================================================

  describe('Signal Filtering and Sorting', () => {
    it('should filter signals by type', () => {
      const buySignals = mockSignals.filter(s => s.signal_type === 'BUY');
      const sellSignals = mockSignals.filter(s => s.signal_type === 'SELL');
      const holdSignals = mockSignals.filter(s => s.signal_type === 'HOLD');
      
      expect(buySignals.length + sellSignals.length + holdSignals.length).toBe(mockSignals.length);
    });

    it('should filter signals by confidence', () => {
      const highConfidence = mockSignals.filter(s => s.confidence === 'High');
      
      highConfidence.forEach(signal => {
        expect(signal.confidence_score).toBeGreaterThanOrEqual(70);
      });
    });

    it('should sort signals by expected return', () => {
      const sorted = [...mockSignals].sort((a, b) => b.expected_return - a.expected_return);
      
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].expected_return).toBeGreaterThanOrEqual(sorted[i + 1].expected_return);
      }
    });

    it('should sort signals by CO-GRI', () => {
      const sorted = [...mockSignals].sort((a, b) => a.current_cogri - b.current_cogri);
      
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].current_cogri).toBeLessThanOrEqual(sorted[i + 1].current_cogri);
      }
    });
  });

  // ============================================================================
  // END-TO-END INTEGRATION
  // ============================================================================

  describe('End-to-End Integration', () => {
    it('should complete full trading workflow', async () => {
      // Step 1: Generate signals
      const signals = generateMockSignals();
      expect(signals.length).toBeGreaterThan(0);
      
      // Step 2: Filter high-confidence BUY signals
      const buySignals = signals.filter(s => 
        s.signal_type === 'BUY' && s.confidence === 'High'
      );
      expect(buySignals.length).toBeGreaterThan(0);
      
      // Step 3: Load portfolio
      const portfolio = getSamplePortfolio('balanced');
      expect(portfolio).toBeDefined();
      
      // Step 4: Optimize portfolio
      const settings: OptimizationSettings = {
        objective: 'Minimize Risk',
        cogri_weight: 50,
        risk_tolerance: 'Moderate',
        rebalancing_frequency: 'Monthly',
        max_position_size: 25,
        min_position_size: 2,
        max_sector_exposure: 40,
        min_holdings: 5,
        max_holdings: 20,
        transaction_costs: 0.1,
        tax_loss_harvesting: false,
        esg_screening: false
      };
      
      const optResult = await tradingEngine.optimizePortfolio(portfolio, settings);
      expect(optResult).toBeDefined();
      
      // Step 5: Run backtest
      const backtestConfig: BacktestConfig = {
        strategy: 'CO-GRI Momentum',
        universe: 'S&P 500',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        rebalancing_frequency: 'Monthly',
        initial_capital: 100000,
        transaction_costs: 0.1
      };
      
      const backtestResult = await tradingEngine.runBacktest(backtestConfig);
      expect(backtestResult).toBeDefined();
      expect(backtestResult.performance.total_return).toBeDefined();
    });
  });
});
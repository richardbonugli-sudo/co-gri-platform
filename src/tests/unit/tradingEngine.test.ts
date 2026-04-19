/**
 * Trading Engine Unit Tests
 * Tests core trading engine functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TradingEngine } from '@/services/engines/TradingEngine';
import type { Portfolio, OptimizationSettings, BacktestConfig } from '@/types/trading';

describe('TradingEngine Unit Tests', () => {
  let engine: TradingEngine;

  beforeEach(() => {
    engine = new TradingEngine();
  });

  describe('Signal Generation', () => {
    it('should generate signal for valid ticker', async () => {
      const signal = await engine.generateSignalForTicker('AAPL');
      
      expect(signal).toBeDefined();
      expect(signal.ticker).toBe('AAPL');
      expect(['BUY', 'SELL', 'HOLD']).toContain(signal.signal_type);
    });

    it('should calculate signal strength correctly', async () => {
      const signal = await engine.generateSignalForTicker('MSFT');
      
      expect(['High', 'Medium', 'Low']).toContain(signal.signal_strength);
      
      if (signal.signal_strength === 'High') {
        expect(Math.abs(signal.expected_return)).toBeGreaterThan(5);
      }
    });

    it('should include all required signal fields', async () => {
      const signal = await engine.generateSignalForTicker('GOOGL');
      
      expect(signal.signal_id).toBeTruthy();
      expect(signal.ticker).toBeTruthy();
      expect(signal.company_name).toBeTruthy();
      expect(signal.sector).toBeTruthy();
      expect(signal.current_cogri).toBeGreaterThan(0);
      expect(signal.current_price).toBeGreaterThan(0);
      expect(signal.price_target).toBeGreaterThan(0);
      expect(signal.stop_loss).toBeGreaterThan(0);
      expect(signal.signal_drivers.length).toBeGreaterThan(0);
      expect(signal.rationale.length).toBeGreaterThan(0);
    });
  });

  describe('Portfolio Optimization', () => {
    let testPortfolio: Portfolio;

    beforeEach(() => {
      testPortfolio = {
        portfolio_id: 'test-001',
        name: 'Test Portfolio',
        holdings: [
          { ticker: 'AAPL', shares: 100, price: 180, value: 18000, weight: 36, cogri: 48.5 },
          { ticker: 'MSFT', shares: 80, price: 350, value: 28000, weight: 56, cogri: 45.2 },
          { ticker: 'GOOGL', shares: 30, price: 140, value: 4200, weight: 8, cogri: 52.1 }
        ],
        total_value: 50200,
        weighted_cogri: 47.3,
        created_at: new Date()
      };
    });

    it('should optimize portfolio with minimize risk objective', async () => {
      const settings: OptimizationSettings = {
        objective: 'Minimize Risk',
        cogri_weight: 70,
        risk_tolerance: 'Conservative',
        rebalancing_frequency: 'Monthly',
        max_position_size: 40,
        min_position_size: 5,
        max_sector_exposure: 50,
        min_holdings: 3,
        max_holdings: 10,
        transaction_costs: 0.1,
        tax_loss_harvesting: false,
        esg_screening: false
      };

      const result = await engine.optimizePortfolio(testPortfolio, settings);
      
      expect(result.metrics_comparison.optimized.weighted_cogri).toBeLessThanOrEqual(
        result.metrics_comparison.original.weighted_cogri
      );
    });

    it('should respect position size constraints', async () => {
      const settings: OptimizationSettings = {
        objective: 'Maximize Return',
        cogri_weight: 30,
        risk_tolerance: 'Aggressive',
        rebalancing_frequency: 'Weekly',
        max_position_size: 25,
        min_position_size: 10,
        max_sector_exposure: 60,
        min_holdings: 2,
        max_holdings: 5,
        transaction_costs: 0.05,
        tax_loss_harvesting: false,
        esg_screening: false
      };

      const result = await engine.optimizePortfolio(testPortfolio, settings);
      
      result.optimized_portfolio.holdings.forEach(holding => {
        expect(holding.weight).toBeLessThanOrEqual(settings.max_position_size);
        expect(holding.weight).toBeGreaterThanOrEqual(settings.min_position_size);
      });
    });

    it('should generate valid trade recommendations', async () => {
      const settings: OptimizationSettings = {
        objective: 'Maximize Sharpe',
        cogri_weight: 50,
        risk_tolerance: 'Moderate',
        rebalancing_frequency: 'Monthly',
        max_position_size: 30,
        min_position_size: 5,
        max_sector_exposure: 45,
        min_holdings: 3,
        max_holdings: 15,
        transaction_costs: 0.1,
        tax_loss_harvesting: true,
        esg_screening: false
      };

      const result = await engine.optimizePortfolio(testPortfolio, settings);
      
      result.trades.forEach(trade => {
        expect(['BUY', 'SELL']).toContain(trade.action);
        expect(trade.shares).toBeGreaterThan(0);
        expect(trade.value).toBeGreaterThan(0);
        expect(trade.rationale).toBeTruthy();
      });
    });
  });

  describe('Backtesting', () => {
    it('should run backtest with valid configuration', async () => {
      const config: BacktestConfig = {
        strategy: 'CO-GRI Momentum',
        universe: 'S&P 500',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        rebalancing_frequency: 'Monthly',
        initial_capital: 100000,
        transaction_costs: 0.1
      };

      const result = await engine.runBacktest(config);
      
      expect(result).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.equity_curve.length).toBeGreaterThan(0);
    });

    it('should calculate performance metrics correctly', async () => {
      const config: BacktestConfig = {
        strategy: 'Mean Reversion',
        universe: 'Russell 2000',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2024-12-31'),
        rebalancing_frequency: 'Quarterly',
        initial_capital: 250000,
        transaction_costs: 0.15
      };

      const result = await engine.runBacktest(config);
      const perf = result.performance;
      
      // Annualized return should be reasonable
      expect(Math.abs(perf.annualized_return)).toBeLessThan(200);
      
      // Sharpe ratio should be reasonable
      expect(Math.abs(perf.sharpe_ratio)).toBeLessThan(10);
      
      // Max drawdown should be negative
      expect(perf.max_drawdown).toBeLessThanOrEqual(0);
      
      // Win rate should be between 0 and 100
      expect(perf.win_rate).toBeGreaterThanOrEqual(0);
      expect(perf.win_rate).toBeLessThanOrEqual(100);
    });

    it('should generate equity curve with correct initial value', async () => {
      const config: BacktestConfig = {
        strategy: 'CO-GRI + Forecast',
        universe: 'S&P 500',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-06-30'),
        rebalancing_frequency: 'Monthly',
        initial_capital: 500000,
        transaction_costs: 0.08
      };

      const result = await engine.runBacktest(config);
      
      expect(result.equity_curve[0].portfolio_value).toBeCloseTo(config.initial_capital, -3);
    });
  });

  describe('Risk Calculations', () => {
    it('should calculate portfolio risk correctly', async () => {
      const portfolio: Portfolio = {
        portfolio_id: 'risk-test',
        name: 'Risk Test Portfolio',
        holdings: [
          { ticker: 'AAPL', shares: 50, price: 180, value: 9000, weight: 30, cogri: 48.5 },
          { ticker: 'TSLA', shares: 25, price: 250, value: 6250, weight: 20.83, cogri: 65.2 },
          { ticker: 'JPM', shares: 100, price: 150, value: 15000, weight: 50, cogri: 42.1 }
        ],
        total_value: 30000,
        weighted_cogri: 48.7,
        created_at: new Date()
      };

      const settings: OptimizationSettings = {
        objective: 'Minimize Risk',
        cogri_weight: 80,
        risk_tolerance: 'Conservative',
        rebalancing_frequency: 'Monthly',
        max_position_size: 35,
        min_position_size: 10,
        max_sector_exposure: 40,
        min_holdings: 3,
        max_holdings: 10,
        transaction_costs: 0.1,
        tax_loss_harvesting: false,
        esg_screening: false
      };

      const result = await engine.optimizePortfolio(portfolio, settings);
      
      // Optimized portfolio should have lower weighted CO-GRI
      expect(result.metrics_comparison.optimized.weighted_cogri).toBeLessThan(
        result.metrics_comparison.original.weighted_cogri
      );
    });
  });
});
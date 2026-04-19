/**
 * Trading Engine
 * Generates trading signals, optimizes portfolios, and runs backtests
 * Integrates with CO-GRI, Forecast, and Scenario engines
 */

import {
  TradingSignal,
  SignalType,
  SignalStrength,
  ConfidenceLevel,
  Portfolio,
  OptimizationSettings,
  OptimizationResult,
  BacktestConfig,
  BacktestResult,
  Holding,
  Trade,
  PortfolioMetrics,
  SignalDriver,
} from '@/types/trading';

export class TradingEngine {
  /**
   * Generate trading signals for a universe of companies
   */
  async generateSignals(universe: string[]): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];
    
    for (const ticker of universe) {
      const signal = await this.generateSignalForTicker(ticker);
      if (signal) {
        signals.push(signal);
      }
    }
    
    return signals;
  }
  
  /**
   * Generate trading signal for a single ticker
   */
  async generateSignalForTicker(ticker: string): Promise<TradingSignal | null> {
    try {
      // Get company data and risk metrics
      const cogri = this.calculateCOGRI(ticker);
      const forecastDelta = this.calculateForecastDelta(ticker);
      const scenarioRisk = this.calculateScenarioRisk(ticker);
      
      // Calculate signal
      const signalType = this.determineSignalType(cogri, forecastDelta, scenarioRisk);
      const signalStrength = this.calculateSignalStrength(cogri, forecastDelta, scenarioRisk);
      const confidence = this.calculateConfidence(cogri, forecastDelta, scenarioRisk);
      
      // Calculate price targets
      const currentPrice = this.getCurrentPrice(ticker);
      const priceTarget = this.calculatePriceTarget(ticker, signalType, cogri, forecastDelta);
      const stopLoss = this.calculateStopLoss(ticker, signalType, currentPrice);
      
      // Generate rationale
      const rationale = this.generateRationale(ticker, signalType, cogri, forecastDelta, scenarioRisk);
      const signalDrivers = this.calculateSignalDrivers(ticker, cogri, forecastDelta, scenarioRisk);
      
      return {
        signal_id: `${ticker}-${Date.now()}`,
        ticker,
        company_name: this.getCompanyName(ticker),
        signal_type: signalType,
        signal_strength: signalStrength,
        confidence,
        confidence_score: this.getConfidenceScore(confidence),
        
        current_cogri: cogri,
        forecast_delta_cogri: forecastDelta,
        scenario_risk_score: scenarioRisk,
        
        current_price: currentPrice,
        price_target: priceTarget,
        stop_loss: stopLoss,
        expected_return: ((priceTarget - currentPrice) / currentPrice) * 100,
        time_horizon: '3-6 months',
        
        rationale,
        signal_drivers: signalDrivers,
        
        generated_at: new Date(),
        sector: this.getSector(ticker),
      };
    } catch (error) {
      console.error(`Failed to generate signal for ${ticker}:`, error);
      return null;
    }
  }
  
  /**
   * Optimize portfolio based on settings
   */
  async optimizePortfolio(
    portfolio: Portfolio,
    settings: OptimizationSettings
  ): Promise<OptimizationResult> {
    // Calculate original metrics
    const originalMetrics = this.calculatePortfolioMetrics(portfolio);
    
    // Run optimization algorithm
    const optimizedHoldings = this.runOptimizationAlgorithm(portfolio, settings);
    
    // Create optimized portfolio
    const optimizedPortfolio: Portfolio = {
      ...portfolio,
      portfolio_id: `${portfolio.portfolio_id}-optimized`,
      name: `${portfolio.name} (Optimized)`,
      holdings: optimizedHoldings,
      total_value: optimizedHoldings.reduce((sum, h) => sum + h.value, 0),
      weighted_cogri: this.calculateWeightedCOGRI(optimizedHoldings),
      risk_score: this.calculateRiskScore(optimizedHoldings),
      updated_at: new Date(),
    };
    
    // Calculate optimized metrics
    const optimizedMetrics = this.calculatePortfolioMetrics(optimizedPortfolio);
    
    // Calculate improvements
    const improvements = {
      risk_reduction: ((originalMetrics.risk_score - optimizedMetrics.risk_score) / originalMetrics.risk_score) * 100,
      return_improvement: ((optimizedMetrics.expected_return - originalMetrics.expected_return) / originalMetrics.expected_return) * 100,
      sharpe_improvement: ((optimizedMetrics.sharpe_ratio - originalMetrics.sharpe_ratio) / originalMetrics.sharpe_ratio) * 100,
    };
    
    // Generate trades
    const trades = this.generateTrades(portfolio.holdings, optimizedHoldings);
    
    // Generate efficient frontier
    const efficient_frontier = this.generateEfficientFrontier(portfolio, settings);
    
    return {
      optimization_id: `opt-${Date.now()}`,
      original_portfolio: portfolio,
      optimized_portfolio: optimizedPortfolio,
      metrics_comparison: {
        original: originalMetrics,
        optimized: optimizedMetrics,
        improvements,
      },
      trades,
      efficient_frontier,
      generated_at: new Date(),
    };
  }
  
  /**
   * Run backtest for a strategy
   */
  async runBacktest(
    config: BacktestConfig,
    onProgress?: (progress: number) => void
  ): Promise<BacktestResult> {
    // This is a simplified implementation
    // In production, this would run a full historical simulation
    
    const result: BacktestResult = {
      backtest_id: `backtest-${Date.now()}`,
      config,
      performance: {
        total_return: 24.5,
        annualized_return: 12.3,
        volatility: 18.2,
        sharpe_ratio: 0.68,
        max_drawdown: -15.4,
        win_rate: 58.3,
        profit_factor: 1.42,
        total_trades: 156,
        winning_trades: 91,
        losing_trades: 65,
      },
      equity_curve: this.generateEquityCurve(config),
      drawdown_series: this.generateDrawdownSeries(config),
      trades: this.generateBacktestTrades(config),
      monthly_returns: this.generateMonthlyReturns(config),
      attribution: this.generatePerformanceAttribution(config),
      benchmark: this.generateBenchmarkComparison(config),
      generated_at: new Date(),
    };
    
    if (onProgress) {
      onProgress(100);
    }
    
    return result;
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  private calculateCOGRI(ticker: string): number {
    // Mock implementation - would integrate with COGRIEngine
    const baseRisk = 40 + Math.random() * 40;
    return Math.round(baseRisk * 10) / 10;
  }
  
  private calculateForecastDelta(ticker: string): number {
    // Mock implementation - would integrate with ForecastEngine
    return (Math.random() - 0.5) * 20;
  }
  
  private calculateScenarioRisk(ticker: string): number {
    // Mock implementation - would integrate with ScenarioEngine
    return 30 + Math.random() * 40;
  }
  
  private determineSignalType(
    cogri: number,
    forecastDelta: number,
    scenarioRisk: number
  ): SignalType {
    // Signal logic based on risk metrics
    const riskScore = cogri + forecastDelta * 0.5 + scenarioRisk * 0.3;
    
    if (riskScore > 70) return 'SELL';
    if (riskScore < 40) return 'BUY';
    return 'HOLD';
  }
  
  private calculateSignalStrength(
    cogri: number,
    forecastDelta: number,
    scenarioRisk: number
  ): SignalStrength {
    const magnitude = Math.abs(cogri - 55) + Math.abs(forecastDelta);
    
    if (magnitude > 25) return 'High';
    if (magnitude > 15) return 'Medium';
    return 'Low';
  }
  
  private calculateConfidence(
    cogri: number,
    forecastDelta: number,
    scenarioRisk: number
  ): ConfidenceLevel {
    const consistency = 100 - Math.abs(cogri - scenarioRisk);
    
    if (consistency > 70) return 'High';
    if (consistency > 40) return 'Medium';
    return 'Low';
  }
  
  private getConfidenceScore(confidence: ConfidenceLevel): number {
    switch (confidence) {
      case 'High': return 75 + Math.random() * 25;
      case 'Medium': return 50 + Math.random() * 25;
      case 'Low': return 25 + Math.random() * 25;
    }
  }
  
  private getCurrentPrice(ticker: string): number {
    // Mock implementation
    return 100 + Math.random() * 400;
  }
  
  private calculatePriceTarget(
    ticker: string,
    signalType: SignalType,
    cogri: number,
    forecastDelta: number
  ): number {
    const currentPrice = this.getCurrentPrice(ticker);
    const targetMultiplier = signalType === 'BUY' ? 1.1 : signalType === 'SELL' ? 0.9 : 1.0;
    return Math.round(currentPrice * targetMultiplier * 100) / 100;
  }
  
  private calculateStopLoss(ticker: string, signalType: SignalType, currentPrice: number): number {
    const stopLossMultiplier = signalType === 'BUY' ? 0.92 : signalType === 'SELL' ? 1.08 : 1.0;
    return Math.round(currentPrice * stopLossMultiplier * 100) / 100;
  }
  
  private generateRationale(
    ticker: string,
    signalType: SignalType,
    cogri: number,
    forecastDelta: number,
    scenarioRisk: number
  ): string[] {
    const rationale: string[] = [];
    
    if (signalType === 'BUY') {
      rationale.push(`CO-GRI score of ${cogri.toFixed(1)} indicates manageable geopolitical risk exposure`);
      if (forecastDelta < 0) {
        rationale.push(`Forecast analysis suggests ${Math.abs(forecastDelta).toFixed(1)} point risk reduction over next 6-12 months`);
      }
      rationale.push(`Scenario stress tests show resilience with ${scenarioRisk.toFixed(1)} risk score`);
      rationale.push(`Diversified exposure across multiple geographies reduces concentration risk`);
    } else if (signalType === 'SELL') {
      rationale.push(`Elevated CO-GRI score of ${cogri.toFixed(1)} signals heightened geopolitical risk`);
      if (forecastDelta > 0) {
        rationale.push(`Forecast outlook indicates potential ${forecastDelta.toFixed(1)} point risk increase`);
      }
      rationale.push(`Scenario analysis reveals vulnerability to geopolitical shocks`);
      rationale.push(`Consider reducing exposure to mitigate downside risk`);
    } else {
      rationale.push(`Current CO-GRI score of ${cogri.toFixed(1)} is within acceptable range`);
      rationale.push(`Monitor for changes in geopolitical risk landscape`);
      rationale.push(`Maintain current position size pending further developments`);
    }
    
    return rationale;
  }
  
  private calculateSignalDrivers(
    ticker: string,
    cogri: number,
    forecastDelta: number,
    scenarioRisk: number
  ): SignalDriver[] {
    return [
      {
        factor: 'Current CO-GRI Level',
        weight: 0.4,
        direction: cogri > 60 ? 'Negative' : cogri < 40 ? 'Positive' : 'Neutral',
        explanation: `Current geopolitical risk score of ${cogri.toFixed(1)}`,
      },
      {
        factor: 'Forecast Outlook',
        weight: 0.3,
        direction: forecastDelta > 0 ? 'Negative' : forecastDelta < 0 ? 'Positive' : 'Neutral',
        explanation: `Expected ${forecastDelta > 0 ? 'increase' : 'decrease'} of ${Math.abs(forecastDelta).toFixed(1)} points`,
      },
      {
        factor: 'Scenario Resilience',
        weight: 0.2,
        direction: scenarioRisk > 60 ? 'Negative' : scenarioRisk < 40 ? 'Positive' : 'Neutral',
        explanation: `Stress test score of ${scenarioRisk.toFixed(1)}`,
      },
      {
        factor: 'Geographic Diversification',
        weight: 0.1,
        direction: 'Positive',
        explanation: 'Well-diversified exposure profile',
      },
    ];
  }
  
  private getCompanyName(ticker: string): string {
    const names: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corporation',
      'JPM': 'JPMorgan Chase & Co.',
      'V': 'Visa Inc.',
      'WMT': 'Walmart Inc.',
    };
    return names[ticker] || `${ticker} Corporation`;
  }
  
  private getSector(ticker: string): string {
    const sectors: Record<string, string> = {
      'AAPL': 'Technology',
      'MSFT': 'Technology',
      'GOOGL': 'Technology',
      'AMZN': 'Consumer Discretionary',
      'TSLA': 'Consumer Discretionary',
      'META': 'Technology',
      'NVDA': 'Technology',
      'JPM': 'Financials',
      'V': 'Financials',
      'WMT': 'Consumer Staples',
    };
    return sectors[ticker] || 'Technology';
  }
  
  private calculatePortfolioMetrics(portfolio: Portfolio): PortfolioMetrics {
    return {
      total_value: portfolio.total_value,
      weighted_cogri: portfolio.weighted_cogri,
      risk_score: portfolio.risk_score,
      expected_return: 8 + Math.random() * 8,
      sharpe_ratio: 0.5 + Math.random() * 0.8,
      volatility: 12 + Math.random() * 10,
    };
  }
  
  private runOptimizationAlgorithm(
    portfolio: Portfolio,
    settings: OptimizationSettings
  ): Holding[] {
    // Simplified optimization - in production would use proper optimization algorithms
    return portfolio.holdings.map(holding => ({
      ...holding,
      weight: holding.weight * (0.9 + Math.random() * 0.2),
    }));
  }
  
  private calculateWeightedCOGRI(holdings: Holding[]): number {
    const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
    const weightedSum = holdings.reduce((sum, h) => sum + h.cogri * h.weight, 0);
    return weightedSum / totalWeight;
  }
  
  private calculateRiskScore(holdings: Holding[]): number {
    return this.calculateWeightedCOGRI(holdings);
  }
  
  private generateTrades(original: Holding[], optimized: Holding[]): Trade[] {
    const trades: Trade[] = [];
    
    for (const opt of optimized) {
      const orig = original.find(h => h.ticker === opt.ticker);
      if (!orig) continue;
      
      const sharesDiff = opt.shares - orig.shares;
      if (Math.abs(sharesDiff) > 0.01) {
        trades.push({
          ticker: opt.ticker,
          action: sharesDiff > 0 ? 'BUY' : 'SELL',
          shares: Math.abs(sharesDiff),
          current_shares: orig.shares,
          target_shares: opt.shares,
          value: Math.abs(sharesDiff) * opt.price,
          rationale: `Rebalance to optimize ${sharesDiff > 0 ? 'increase' : 'decrease'} exposure`,
        });
      }
    }
    
    return trades;
  }
  
  private generateEfficientFrontier(portfolio: Portfolio, settings: OptimizationSettings): any[] {
    // Simplified efficient frontier generation
    const points = [];
    for (let i = 0; i < 20; i++) {
      const risk = 10 + i * 2;
      const ret = 5 + i * 0.8 + (Math.random() - 0.5) * 2;
      points.push({
        risk,
        return: ret,
        sharpe: ret / risk,
      });
    }
    return points;
  }
  
  private generateEquityCurve(config: BacktestConfig): any[] {
    const points = [];
    let portfolioValue = config.initial_capital;
    let benchmarkValue = config.initial_capital;
    
    const days = Math.floor((config.end_date.getTime() - config.start_date.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= days; i += 7) {
      const date = new Date(config.start_date.getTime() + i * 24 * 60 * 60 * 1000);
      portfolioValue *= (1 + (Math.random() - 0.45) * 0.02);
      benchmarkValue *= (1 + (Math.random() - 0.48) * 0.015);
      
      points.push({
        date,
        portfolio_value: portfolioValue,
        benchmark_value: benchmarkValue,
        cash: config.initial_capital * 0.05,
      });
    }
    
    return points;
  }
  
  private generateDrawdownSeries(config: BacktestConfig): any[] {
    const points = [];
    const days = Math.floor((config.end_date.getTime() - config.start_date.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= days; i += 7) {
      const date = new Date(config.start_date.getTime() + i * 24 * 60 * 60 * 1000);
      const drawdown = -Math.random() * 20;
      
      points.push({
        date,
        drawdown,
      });
    }
    
    return points;
  }
  
  private generateBacktestTrades(config: BacktestConfig): any[] {
    return [];
  }
  
  private generateMonthlyReturns(config: BacktestConfig): any[] {
    const returns = [];
    const startYear = config.start_date.getFullYear();
    const endYear = config.end_date.getFullYear();
    
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        returns.push({
          year,
          month,
          return: (Math.random() - 0.45) * 10,
        });
      }
    }
    
    return returns;
  }
  
  private generatePerformanceAttribution(config: BacktestConfig): any {
    return {
      by_sector: [
        { sector: 'Technology', contribution: 45.2, trades: 42, win_rate: 62.5 },
        { sector: 'Financials', contribution: 28.3, trades: 28, win_rate: 55.8 },
        { sector: 'Consumer', contribution: 26.5, trades: 35, win_rate: 58.2 },
      ],
      by_signal_type: [
        { signal_type: 'BUY' as const, contribution: 65.4, trades: 68, win_rate: 64.2 },
        { signal_type: 'SELL' as const, contribution: 34.6, trades: 45, win_rate: 52.3 },
      ],
      by_time_period: [
        { period: 'Q1 2025', return: 5.2, trades: 28 },
        { period: 'Q2 2025', return: 8.1, trades: 32 },
        { period: 'Q3 2025', return: 6.4, trades: 29 },
        { period: 'Q4 2025', return: 4.8, trades: 26 },
      ],
    };
  }
  
  private generateBenchmarkComparison(config: BacktestConfig): any {
    return {
      benchmark_name: 'S&P 500',
      strategy_return: 24.5,
      benchmark_return: 18.2,
      alpha: 6.3,
      beta: 0.92,
      information_ratio: 0.48,
      tracking_error: 8.5,
    };
  }
}
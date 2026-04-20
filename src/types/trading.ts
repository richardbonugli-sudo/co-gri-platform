/**
 * Trading Mode Type Definitions
 * Comprehensive TypeScript interfaces for Trading Mode (Weeks 11-13)
 */

// ============================================================================
// TRADING SIGNALS
// ============================================================================

export type SignalType = 'BUY' | 'SELL' | 'HOLD';
export type SignalStrength = 'High' | 'Medium' | 'Low';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface TradingSignal {
  signal_id: string;
  ticker: string;
  company_name: string;
  signal_type: SignalType;
  signal_strength: SignalStrength;
  confidence: ConfidenceLevel;
  confidence_score: number; // [0-100]
  
  // Risk metrics
  current_cogri: number;
  forecast_delta_cogri: number;
  scenario_risk_score: number;
  
  // Price targets
  current_price: number;
  price_target: number;
  stop_loss: number;
  expected_return: number; // percentage
  time_horizon: string; // "3-6 months"
  
  // Signal drivers
  rationale: string[];
  signal_drivers: SignalDriver[];
  
  // Metadata
  generated_at: Date;
  sector: string;
}

export interface SignalDriver {
  factor: string;
  weight: number; // [0-1]
  direction: 'Positive' | 'Negative' | 'Neutral';
  explanation: string;
}

// ============================================================================
// PORTFOLIO
// ============================================================================

export interface Holding {
  ticker: string;
  company_name: string;
  shares: number;
  price: number;
  value: number;
  weight: number; // percentage
  cogri: number;
  sector: string;
}

export interface Portfolio {
  portfolio_id: string;
  name: string;
  holdings: Holding[];
  total_value: number;
  weighted_cogri: number;
  risk_score: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// OPTIMIZATION
// ============================================================================

export type OptimizationObjective = 'Minimize Risk' | 'Maximize Return' | 'Maximize Sharpe';
export type RiskTolerance = 'Conservative' | 'Moderate' | 'Aggressive';
export type RebalancingFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';

export interface OptimizationSettings {
  objective: OptimizationObjective;
  cogri_weight: number; // [0-100]
  risk_tolerance: RiskTolerance;
  rebalancing_frequency: RebalancingFrequency;
  
  // Constraints
  max_position_size: number; // percentage
  min_position_size: number; // percentage
  max_sector_exposure: number; // percentage
  min_holdings: number;
  max_holdings: number;
  
  // Advanced options
  transaction_costs: number; // percentage
  tax_loss_harvesting: boolean;
  esg_screening: boolean;
}

export interface Trade {
  ticker: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  shares: number;
  current_shares: number;
  target_shares: number;
  value: number;
  rationale: string;
}

export interface OptimizationResult {
  optimization_id: string;
  original_portfolio: Portfolio;
  optimized_portfolio: Portfolio;
  
  // Metrics comparison
  metrics_comparison: {
    original: PortfolioMetrics;
    optimized: PortfolioMetrics;
    improvements: MetricsImprovement;
  };
  
  // Recommended trades
  trades: Trade[];
  
  // Efficient frontier
  efficient_frontier: EfficientFrontierPoint[];
  
  generated_at: Date;
}

export interface PortfolioMetrics {
  total_value: number;
  weighted_cogri: number;
  risk_score: number;
  expected_return: number;
  sharpe_ratio: number;
  volatility: number;
}

export interface MetricsImprovement {
  risk_reduction: number; // percentage
  return_improvement: number; // percentage
  sharpe_improvement: number; // percentage
}

export interface EfficientFrontierPoint {
  risk: number;
  return: number;
  sharpe: number;
  is_current?: boolean;
  is_optimized?: boolean;
}

// ============================================================================
// BACKTEST
// ============================================================================

export type StrategyType = 'CO-GRI Momentum' | 'Mean Reversion' | 'CO-GRI + Forecast' | 'Custom';
export type UniverseType = 'S&P 500' | 'Russell 2000' | 'Custom';

export interface BacktestConfig {
  strategy: StrategyType;
  universe: UniverseType;
  custom_tickers?: string[];
  
  // Time period
  start_date: Date;
  end_date: Date;
  
  // Parameters
  rebalancing_frequency: RebalancingFrequency;
  initial_capital: number;
  transaction_costs: number; // percentage
  
  // Strategy-specific parameters
  momentum_lookback?: number; // days
  mean_reversion_threshold?: number;
  forecast_weight?: number; // [0-1]
}

export interface BacktestResult {
  backtest_id: string;
  config: BacktestConfig;
  
  // Performance summary
  performance: BacktestPerformance;
  
  // Time series data
  equity_curve: EquityCurvePoint[];
  drawdown_series: DrawdownPoint[];
  
  // Trade log
  trades: BacktestTrade[];
  
  // Monthly returns
  monthly_returns: MonthlyReturn[];
  
  // Attribution
  attribution: PerformanceAttribution;
  
  // Benchmark comparison
  benchmark: BenchmarkComparison;
  
  generated_at: Date;
}

export interface BacktestPerformance {
  total_return: number; // percentage
  annualized_return: number; // percentage
  volatility: number; // percentage
  sharpe_ratio: number;
  max_drawdown: number; // percentage
  win_rate: number; // percentage
  profit_factor: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
}

export interface EquityCurvePoint {
  date: Date;
  portfolio_value: number;
  benchmark_value: number;
  cash: number;
}

export interface DrawdownPoint {
  date: Date;
  drawdown: number; // percentage
}

export interface BacktestTrade {
  date: Date;
  ticker: string;
  action: 'BUY' | 'SELL';
  shares: number;
  price: number;
  value: number;
  cogri_at_entry: number;
  pnl?: number; // for closed positions
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return: number; // percentage
}

export interface PerformanceAttribution {
  by_sector: SectorAttribution[];
  by_signal_type: SignalTypeAttribution[];
  by_time_period: TimePeriodAttribution[];
}

export interface SectorAttribution {
  sector: string;
  contribution: number; // percentage
  trades: number;
  win_rate: number;
}

export interface SignalTypeAttribution {
  signal_type: SignalType;
  contribution: number; // percentage
  trades: number;
  win_rate: number;
}

export interface TimePeriodAttribution {
  period: string; // "Q1 2025"
  return: number; // percentage
  trades: number;
}

export interface BenchmarkComparison {
  benchmark_name: string; // "S&P 500"
  strategy_return: number;
  benchmark_return: number;
  alpha: number;
  beta: number;
  information_ratio: number;
  tracking_error: number;
}

// ============================================================================
// COMPANY MODE INTEGRATION
// ============================================================================

export interface CompanyTradingView {
  ticker: string;
  current_signal: TradingSignal | null;
  signal_history: TradingSignal[];
  price_chart_data: PriceChartPoint[];
}

export interface PriceChartPoint {
  date: Date;
  price: number;
  cogri: number;
  price_target?: number;
  stop_loss?: number;
}

// ============================================================================
// FILTERS & SORTING
// ============================================================================

export interface SignalFilters {
  signal_types: SignalType[];
  confidence_threshold: number; // [0-100]
  sectors: string[];
  min_expected_return?: number;
  max_cogri?: number;
}

export type SignalSortBy = 'signal_strength' | 'confidence' | 'cogri' | 'expected_return' | 'generated_at';
export type SortOrder = 'asc' | 'desc';

export interface SignalSort {
  sort_by: SignalSortBy;
  order: SortOrder;
}
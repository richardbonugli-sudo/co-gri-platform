/**
 * Performance Analytics for CO-GRI Trading
 * 
 * Provides detailed performance analysis including:
 * - Risk-adjusted return metrics (Sharpe, Sortino, Calmar)
 * - Drawdown analysis
 * - Trade statistics
 * - Monthly/yearly performance breakdown
 * - Rolling metrics
 * 
 * @module performanceAnalytics
 */

import type { Trade, EquityPoint, PerformanceMetrics } from './enhancedBacktesting';

export interface MonthlyPerformance {
  year: number;
  month: number;
  return: number;
  trades: number;
  winRate: number;
  sharpeRatio: number;
}

export interface YearlyPerformance {
  year: number;
  return: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: number;
  winRate: number;
  bestMonth: number;
  worstMonth: number;
}

export interface RollingMetrics {
  date: Date;
  return: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
}

export interface TradeStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  expectancy: number;
  avgHoldingPeriod: number;
  avgWinHoldingPeriod: number;
  avgLossHoldingPeriod: number;
}

export interface DrawdownAnalysis {
  maxDrawdown: number;
  maxDrawdownDate: Date;
  avgDrawdown: number;
  maxDrawdownDuration: number;
  avgDrawdownDuration: number;
  currentDrawdown: number;
  drawdownPeriods: DrawdownPeriod[];
}

export interface DrawdownPeriod {
  startDate: Date;
  endDate: Date;
  peakValue: number;
  troughValue: number;
  drawdown: number;
  duration: number;
  recovery: boolean;
  recoveryDate?: Date;
}

/**
 * Calculate Sharpe Ratio
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.03
): number {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const annualizedReturn = avgReturn * 252; // Daily to annual
  
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252);
  
  if (volatility === 0) return 0;
  
  return (annualizedReturn - riskFreeRate) / volatility;
}

/**
 * Calculate Sortino Ratio (downside deviation)
 */
export function calculateSortinoRatio(
  returns: number[],
  riskFreeRate: number = 0.03
): number {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const annualizedReturn = avgReturn * 252;
  
  // Only consider negative returns for downside deviation
  const negativeReturns = returns.filter(r => r < 0);
  const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / returns.length;
  const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252);
  
  if (downsideDeviation === 0) return 0;
  
  return (annualizedReturn - riskFreeRate) / downsideDeviation;
}

/**
 * Calculate Calmar Ratio (return / max drawdown)
 */
export function calculateCalmarRatio(
  annualizedReturn: number,
  maxDrawdown: number
): number {
  if (maxDrawdown === 0) return 0;
  return annualizedReturn / maxDrawdown;
}

/**
 * Analyze drawdowns in detail
 */
export function analyzeDrawdowns(equityCurve: EquityPoint[]): DrawdownAnalysis {
  if (equityCurve.length === 0) {
    return {
      maxDrawdown: 0,
      maxDrawdownDate: new Date(),
      avgDrawdown: 0,
      maxDrawdownDuration: 0,
      avgDrawdownDuration: 0,
      currentDrawdown: 0,
      drawdownPeriods: [],
    };
  }
  
  const drawdownPeriods: DrawdownPeriod[] = [];
  let peak = equityCurve[0].equity;
  let peakDate = equityCurve[0].date;
  let inDrawdown = false;
  let drawdownStart: Date | null = null;
  let maxDrawdown = 0;
  let maxDrawdownDate = equityCurve[0].date;
  let troughValue = peak;
  let troughDate = peakDate;
  
  for (let i = 0; i < equityCurve.length; i++) {
    const point = equityCurve[i];
    
    if (point.equity > peak) {
      // New peak
      if (inDrawdown) {
        // Drawdown recovered
        const duration = Math.floor((point.date.getTime() - drawdownStart!.getTime()) / (24 * 60 * 60 * 1000));
        drawdownPeriods.push({
          startDate: drawdownStart!,
          endDate: point.date,
          peakValue: peak,
          troughValue,
          drawdown: (peak - troughValue) / peak,
          duration,
          recovery: true,
          recoveryDate: point.date,
        });
        inDrawdown = false;
      }
      peak = point.equity;
      const peakDate = point.date;
    } else if (point.equity < peak) {
      // In drawdown
      if (!inDrawdown) {
        inDrawdown = true;
        drawdownStart = point.date;
        troughValue = point.equity;
        troughDate = point.date;
      } else if (point.equity < troughValue) {
        troughValue = point.equity;
        troughDate = point.date;
      }
      
      const currentDD = (peak - point.equity) / peak;
      if (currentDD > maxDrawdown) {
        maxDrawdown = currentDD;
        maxDrawdownDate = point.date;
      }
    }
  }
  
  // Handle ongoing drawdown
  if (inDrawdown) {
    const duration = Math.floor((equityCurve[equityCurve.length - 1].date.getTime() - drawdownStart!.getTime()) / (24 * 60 * 60 * 1000));
    drawdownPeriods.push({
      startDate: drawdownStart!,
      endDate: equityCurve[equityCurve.length - 1].date,
      peakValue: peak,
      troughValue,
      drawdown: (peak - troughValue) / peak,
      duration,
      recovery: false,
    });
  }
  
  const avgDrawdown = drawdownPeriods.length > 0
    ? drawdownPeriods.reduce((sum, dd) => sum + dd.drawdown, 0) / drawdownPeriods.length
    : 0;
  
  const avgDrawdownDuration = drawdownPeriods.length > 0
    ? drawdownPeriods.reduce((sum, dd) => sum + dd.duration, 0) / drawdownPeriods.length
    : 0;
  
  const maxDrawdownDuration = drawdownPeriods.length > 0
    ? Math.max(...drawdownPeriods.map(dd => dd.duration))
    : 0;
  
  const currentDrawdown = (peak - equityCurve[equityCurve.length - 1].equity) / peak;
  
  return {
    maxDrawdown,
    maxDrawdownDate,
    avgDrawdown,
    maxDrawdownDuration,
    avgDrawdownDuration,
    currentDrawdown,
    drawdownPeriods,
  };
}

/**
 * Calculate detailed trade statistics
 */
export function calculateTradeStatistics(trades: Trade[]): TradeStatistics {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      avgHoldingPeriod: 0,
      avgWinHoldingPeriod: 0,
      avgLossHoldingPeriod: 0,
    };
  }
  
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);
  
  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  
  const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
  
  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0;
  
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
  const expectancy = trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length;
  
  const avgHoldingPeriod = trades.reduce((sum, t) => sum + t.holdingPeriod, 0) / trades.length;
  const avgWinHoldingPeriod = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + t.holdingPeriod, 0) / winningTrades.length
    : 0;
  const avgLossHoldingPeriod = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + t.holdingPeriod, 0) / losingTrades.length
    : 0;
  
  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: winningTrades.length / trades.length,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    profitFactor,
    expectancy,
    avgHoldingPeriod,
    avgWinHoldingPeriod,
    avgLossHoldingPeriod,
  };
}

/**
 * Calculate monthly performance breakdown
 */
export function calculateMonthlyPerformance(
  equityCurve: EquityPoint[],
  trades: Trade[]
): MonthlyPerformance[] {
  const monthlyData: Map<string, MonthlyPerformance> = new Map();
  
  // Group equity points by month
  for (let i = 1; i < equityCurve.length; i++) {
    const date = equityCurve[i].date;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    
    if (!monthlyData.has(key)) {
      monthlyData.set(key, {
        year: date.getFullYear(),
        month: date.getMonth(),
        return: 0,
        trades: 0,
        winRate: 0,
        sharpeRatio: 0,
      });
    }
  }
  
  // Calculate returns for each month
  let lastMonthEquity = equityCurve[0].equity;
  let currentMonth = `${equityCurve[0].date.getFullYear()}-${equityCurve[0].date.getMonth()}`;
  
  for (let i = 1; i < equityCurve.length; i++) {
    const date = equityCurve[i].date;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    
    if (key !== currentMonth) {
      // Month changed
      const monthData = monthlyData.get(currentMonth);
      if (monthData) {
        monthData.return = (equityCurve[i - 1].equity - lastMonthEquity) / lastMonthEquity;
      }
      lastMonthEquity = equityCurve[i - 1].equity;
      currentMonth = key;
    }
  }
  
  // Add trade statistics
  for (const trade of trades) {
    const key = `${trade.exitDate.getFullYear()}-${trade.exitDate.getMonth()}`;
    const monthData = monthlyData.get(key);
    if (monthData) {
      monthData.trades++;
    }
  }
  
  return Array.from(monthlyData.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

/**
 * Calculate yearly performance breakdown
 */
export function calculateYearlyPerformance(
  monthlyPerformance: MonthlyPerformance[]
): YearlyPerformance[] {
  const yearlyData: Map<number, YearlyPerformance> = new Map();
  
  for (const month of monthlyPerformance) {
    if (!yearlyData.has(month.year)) {
      yearlyData.set(month.year, {
        year: month.year,
        return: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        trades: 0,
        winRate: 0,
        bestMonth: -Infinity,
        worstMonth: Infinity,
      });
    }
    
    const yearData = yearlyData.get(month.year)!;
    yearData.return = (1 + yearData.return) * (1 + month.return) - 1;
    yearData.trades += month.trades;
    yearData.bestMonth = Math.max(yearData.bestMonth, month.return);
    yearData.worstMonth = Math.min(yearData.worstMonth, month.return);
  }
  
  return Array.from(yearlyData.values()).sort((a, b) => a.year - b.year);
}

/**
 * Calculate rolling metrics (e.g., 3-year rolling Sharpe)
 */
export function calculateRollingMetrics(
  equityCurve: EquityPoint[],
  windowDays: number = 756 // 3 years
): RollingMetrics[] {
  const rollingMetrics: RollingMetrics[] = [];
  
  for (let i = windowDays; i < equityCurve.length; i++) {
    const window = equityCurve.slice(i - windowDays, i);
    const returns: number[] = [];
    
    for (let j = 1; j < window.length; j++) {
      const ret = (window[j].equity - window[j - 1].equity) / window[j - 1].equity;
      returns.push(ret);
    }
    
    const sharpeRatio = calculateSharpeRatio(returns);
    const totalReturn = (window[window.length - 1].equity - window[0].equity) / window[0].equity;
    
    // Calculate max drawdown in window
    let peak = window[0].equity;
    let maxDD = 0;
    for (const point of window) {
      if (point.equity > peak) peak = point.equity;
      const dd = (peak - point.equity) / peak;
      maxDD = Math.max(maxDD, dd);
    }
    
    rollingMetrics.push({
      date: equityCurve[i].date,
      return: totalReturn,
      sharpeRatio,
      maxDrawdown: maxDD,
      winRate: 0, // Would need trade data
    });
  }
  
  return rollingMetrics;
}

/**
 * Generate comprehensive performance report
 */
export function generatePerformanceReport(
  trades: Trade[],
  equityCurve: EquityPoint[],
  riskFreeRate: number = 0.03
): {
  metrics: PerformanceMetrics;
  tradeStats: TradeStatistics;
  drawdownAnalysis: DrawdownAnalysis;
  monthlyPerformance: MonthlyPerformance[];
  yearlyPerformance: YearlyPerformance[];
  rollingMetrics: RollingMetrics[];
} {
  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const ret = (equityCurve[i].equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity;
    returns.push(ret);
  }
  
  const totalReturn = (equityCurve[equityCurve.length - 1].equity - equityCurve[0].equity) / equityCurve[0].equity;
  const years = (equityCurve[equityCurve.length - 1].date.getTime() - equityCurve[0].date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1;
  
  const sharpeRatio = calculateSharpeRatio(returns, riskFreeRate);
  const sortinoRatio = calculateSortinoRatio(returns, riskFreeRate);
  const drawdownAnalysis = analyzeDrawdowns(equityCurve);
  const calmarRatio = calculateCalmarRatio(annualizedReturn, drawdownAnalysis.maxDrawdown);
  
  const tradeStats = calculateTradeStatistics(trades);
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252);
  
  const negativeReturns = returns.filter(r => r < 0);
  const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / returns.length;
  const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252);
  
  const metrics: PerformanceMetrics = {
    totalReturn,
    annualizedReturn,
    sharpeRatio,
    sortinoRatio,
    calmarRatio,
    maxDrawdown: drawdownAnalysis.maxDrawdown,
    avgDrawdown: drawdownAnalysis.avgDrawdown,
    drawdownDuration: drawdownAnalysis.maxDrawdownDuration,
    winRate: tradeStats.winRate,
    profitFactor: tradeStats.profitFactor,
    avgWin: tradeStats.avgWin,
    avgLoss: tradeStats.avgLoss,
    expectancy: tradeStats.expectancy,
    volatility,
    downsideDeviation,
  };
  
  const monthlyPerformance = calculateMonthlyPerformance(equityCurve, trades);
  const yearlyPerformance = calculateYearlyPerformance(monthlyPerformance);
  const rollingMetrics = calculateRollingMetrics(equityCurve);
  
  return {
    metrics,
    tradeStats,
    drawdownAnalysis,
    monthlyPerformance,
    yearlyPerformance,
    rollingMetrics,
  };
}
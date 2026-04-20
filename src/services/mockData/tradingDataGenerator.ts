/**
 * Trading Mock Data Generator
 * Generates realistic mock data for Trading Mode testing
 */

import {
  TradingSignal,
  SignalType,
  SignalStrength,
  ConfidenceLevel,
  Portfolio,
  Holding,
  SignalDriver,
} from '@/types/trading';

// Popular tickers for signal generation
const POPULAR_TICKERS = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
  { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Financials' },
  { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { ticker: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples' },
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { ticker: 'HD', name: 'Home Depot', sector: 'Consumer Discretionary' },
  { ticker: 'BAC', name: 'Bank of America', sector: 'Financials' },
  { ticker: 'DIS', name: 'Walt Disney Company', sector: 'Communication Services' },
  { ticker: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' },
  { ticker: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
  { ticker: 'CSCO', name: 'Cisco Systems', sector: 'Technology' },
  { ticker: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
];

/**
 * Generate mock trading signals
 */
export function generateMockSignals(count: number = 25): TradingSignal[] {
  const signals: TradingSignal[] = [];
  const selectedTickers = POPULAR_TICKERS.slice(0, count);
  
  // Signal distribution: 40% BUY, 30% SELL, 30% HOLD
  const signalTypes: SignalType[] = [
    ...Array(Math.floor(count * 0.4)).fill('BUY'),
    ...Array(Math.floor(count * 0.3)).fill('SELL'),
    ...Array(Math.ceil(count * 0.3)).fill('HOLD'),
  ];
  
  selectedTickers.forEach((company, index) => {
    const signalType = signalTypes[index] || 'HOLD';
    const cogri = 35 + Math.random() * 50;
    const forecastDelta = (Math.random() - 0.5) * 20;
    const scenarioRisk = 30 + Math.random() * 40;
    const currentPrice = 50 + Math.random() * 400;
    
    // Signal strength distribution: 20% High, 50% Medium, 30% Low
    let signalStrength: SignalStrength;
    const strengthRand = Math.random();
    if (strengthRand < 0.2) signalStrength = 'High';
    else if (strengthRand < 0.7) signalStrength = 'Medium';
    else signalStrength = 'Low';
    
    // Confidence distribution: 30% High, 50% Medium, 20% Low
    let confidence: ConfidenceLevel;
    const confidenceRand = Math.random();
    if (confidenceRand < 0.3) confidence = 'High';
    else if (confidenceRand < 0.8) confidence = 'Medium';
    else confidence = 'Low';
    
    const confidenceScore = confidence === 'High' ? 75 + Math.random() * 25 :
                           confidence === 'Medium' ? 50 + Math.random() * 25 :
                           25 + Math.random() * 25;
    
    const priceTarget = signalType === 'BUY' ? currentPrice * (1.08 + Math.random() * 0.12) :
                       signalType === 'SELL' ? currentPrice * (0.88 + Math.random() * 0.08) :
                       currentPrice * (0.98 + Math.random() * 0.04);
    
    const stopLoss = signalType === 'BUY' ? currentPrice * (0.88 + Math.random() * 0.08) :
                    signalType === 'SELL' ? currentPrice * (1.08 + Math.random() * 0.08) :
                    currentPrice * (0.92 + Math.random() * 0.08);
    
    signals.push({
      signal_id: `${company.ticker}-${Date.now()}-${index}`,
      ticker: company.ticker,
      company_name: company.name,
      signal_type: signalType,
      signal_strength: signalStrength,
      confidence,
      confidence_score: Math.round(confidenceScore),
      
      current_cogri: Math.round(cogri * 10) / 10,
      forecast_delta_cogri: Math.round(forecastDelta * 10) / 10,
      scenario_risk_score: Math.round(scenarioRisk * 10) / 10,
      
      current_price: Math.round(currentPrice * 100) / 100,
      price_target: Math.round(priceTarget * 100) / 100,
      stop_loss: Math.round(stopLoss * 100) / 100,
      expected_return: Math.round(((priceTarget - currentPrice) / currentPrice) * 1000) / 10,
      time_horizon: '3-6 months',
      
      rationale: generateRationale(signalType, cogri, forecastDelta, scenarioRisk),
      signal_drivers: generateSignalDrivers(signalType, cogri, forecastDelta, scenarioRisk),
      
      generated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      sector: company.sector,
    });
  });
  
  return signals;
}

/**
 * Generate rationale for a signal
 */
function generateRationale(
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
    rationale.push(`Strong fundamentals support upside potential despite geopolitical headwinds`);
  } else if (signalType === 'SELL') {
    rationale.push(`Elevated CO-GRI score of ${cogri.toFixed(1)} signals heightened geopolitical risk`);
    if (forecastDelta > 0) {
      rationale.push(`Forecast outlook indicates potential ${forecastDelta.toFixed(1)} point risk increase`);
    }
    rationale.push(`Scenario analysis reveals vulnerability to geopolitical shocks`);
    rationale.push(`Concentrated exposure to high-risk regions increases downside risk`);
    rationale.push(`Consider reducing exposure to mitigate potential losses`);
  } else {
    rationale.push(`Current CO-GRI score of ${cogri.toFixed(1)} is within acceptable range`);
    rationale.push(`Geopolitical risk profile remains stable with no significant changes expected`);
    rationale.push(`Monitor for changes in geopolitical risk landscape`);
    rationale.push(`Maintain current position size pending further developments`);
  }
  
  return rationale;
}

/**
 * Generate signal drivers
 */
function generateSignalDrivers(
  signalType: SignalType,
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
      direction: Math.random() > 0.5 ? 'Positive' : 'Neutral',
      explanation: Math.random() > 0.5 ? 'Well-diversified exposure profile' : 'Moderate concentration in key markets',
    },
  ];
}

/**
 * Generate sample portfolios
 */
export function generateSamplePortfolios(): { conservative: Portfolio; balanced: Portfolio; aggressive: Portfolio } {
  const baseDate = new Date();
  
  // Conservative Portfolio
  const conservativeHoldings: Holding[] = [
    { ticker: 'JNJ', company_name: 'Johnson & Johnson', shares: 100, price: 165.50, value: 16550, weight: 20, cogri: 38.5, sector: 'Healthcare' },
    { ticker: 'PG', company_name: 'Procter & Gamble', shares: 120, price: 145.20, value: 17424, weight: 21, cogri: 35.2, sector: 'Consumer Staples' },
    { ticker: 'WMT', company_name: 'Walmart Inc.', shares: 110, price: 158.30, value: 17413, weight: 21, cogri: 42.8, sector: 'Consumer Staples' },
    { ticker: 'V', company_name: 'Visa Inc.', shares: 70, price: 245.60, value: 17192, weight: 21, cogri: 45.3, sector: 'Financials' },
    { ticker: 'MSFT', company_name: 'Microsoft Corporation', shares: 45, price: 375.80, value: 16911, weight: 17, cogri: 48.9, sector: 'Technology' },
  ];
  
  const conservative: Portfolio = {
    portfolio_id: 'conservative-001',
    name: 'Conservative Portfolio',
    holdings: conservativeHoldings,
    total_value: conservativeHoldings.reduce((sum, h) => sum + h.value, 0),
    weighted_cogri: 42.1,
    risk_score: 42.1,
    created_at: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000),
    updated_at: baseDate,
  };
  
  // Balanced Portfolio
  const balancedHoldings: Holding[] = [
    { ticker: 'AAPL', company_name: 'Apple Inc.', shares: 50, price: 185.20, value: 9260, weight: 15, cogri: 62.4, sector: 'Technology' },
    { ticker: 'MSFT', company_name: 'Microsoft Corporation', shares: 25, price: 375.80, value: 9395, weight: 15, cogri: 48.9, sector: 'Technology' },
    { ticker: 'GOOGL', company_name: 'Alphabet Inc.', shares: 70, price: 142.50, value: 9975, weight: 16, cogri: 55.7, sector: 'Technology' },
    { ticker: 'JPM', company_name: 'JPMorgan Chase & Co.', shares: 60, price: 168.40, value: 10104, weight: 16, cogri: 51.2, sector: 'Financials' },
    { ticker: 'JNJ', company_name: 'Johnson & Johnson', shares: 60, price: 165.50, value: 9930, weight: 16, cogri: 38.5, sector: 'Healthcare' },
    { ticker: 'WMT', company_name: 'Walmart Inc.', shares: 70, price: 158.30, value: 11081, weight: 18, cogri: 42.8, sector: 'Consumer Staples' },
    { ticker: 'DIS', company_name: 'Walt Disney Company', shares: 30, price: 95.20, value: 2856, weight: 4, cogri: 58.3, sector: 'Communication Services' },
  ];
  
  const balanced: Portfolio = {
    portfolio_id: 'balanced-001',
    name: 'Balanced Portfolio',
    holdings: balancedHoldings,
    total_value: balancedHoldings.reduce((sum, h) => sum + h.value, 0),
    weighted_cogri: 51.3,
    risk_score: 51.3,
    created_at: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000),
    updated_at: baseDate,
  };
  
  // Aggressive Portfolio
  const aggressiveHoldings: Holding[] = [
    { ticker: 'NVDA', company_name: 'NVIDIA Corporation', shares: 40, price: 485.30, value: 19412, weight: 22, cogri: 68.7, sector: 'Technology' },
    { ticker: 'TSLA', company_name: 'Tesla Inc.', shares: 80, price: 245.60, value: 19648, weight: 22, cogri: 72.5, sector: 'Consumer Discretionary' },
    { ticker: 'META', company_name: 'Meta Platforms Inc.', shares: 50, price: 385.20, value: 19260, weight: 21, cogri: 65.8, sector: 'Technology' },
    { ticker: 'AMZN', company_name: 'Amazon.com Inc.', shares: 120, price: 152.80, value: 18336, weight: 20, cogri: 58.4, sector: 'Consumer Discretionary' },
    { ticker: 'NFLX', company_name: 'Netflix Inc.', shares: 35, price: 425.60, value: 14896, weight: 15, cogri: 54.2, sector: 'Communication Services' },
  ];
  
  const aggressive: Portfolio = {
    portfolio_id: 'aggressive-001',
    name: 'Aggressive Growth Portfolio',
    holdings: aggressiveHoldings,
    total_value: aggressiveHoldings.reduce((sum, h) => sum + h.value, 0),
    weighted_cogri: 64.2,
    risk_score: 64.2,
    created_at: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
    updated_at: baseDate,
  };
  
  return { conservative, balanced, aggressive };
}

/**
 * Get a sample portfolio by name
 */
export function getSamplePortfolio(name: 'conservative' | 'balanced' | 'aggressive'): Portfolio {
  const portfolios = generateSamplePortfolios();
  return portfolios[name];
}
/**
 * Peer Comparison Utilities
 * Supporting functions for Peer Comparison (C6)
 * Part of CO-GRI Platform Phase 2 - Week 3
 */

import { RiskLevel, TrendDirection } from '@/types/company';
import { getRiskLevel, getTrendDirection } from './riskCalculations';

export interface PeerCompany {
  ticker: string;
  name: string;
  sector: string;
  CO_GRI: number;
  risk_level: RiskLevel;
  delta_30D?: number;
  direction?: TrendDirection;
  forecast_outlook?: 'Headwind' | 'Tailwind' | 'Mixed';
  market_cap?: number;
}

/**
 * Sector peer mappings
 * In production, this would come from a database
 */
const SECTOR_PEERS: Record<string, string[]> = {
  'Technology': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMD', 'INTC', 'ORCL'],
  'Semiconductors': ['NVDA', 'AMD', 'INTC', 'TSM', 'QCOM', 'AVGO', 'TXN', 'MU'],
  'Automotive': ['TSLA', 'F', 'GM', 'TM', 'HMC', 'STLA', 'RIVN', 'LCID'],
  'Retail': ['AMZN', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'NKE', 'SBUX'],
  'Finance': ['JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'USB', 'PNC'],
  'Healthcare': ['JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'ABT', 'DHR', 'BMY'],
  'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO'],
  'Consumer': ['PG', 'KO', 'PEP', 'WMT', 'COST', 'MCD', 'SBUX', 'NKE']
};

/**
 * Generate peer companies for a given sector
 * Implements specification Part 3.3 C6
 */
export function generatePeerCompanies(
  currentTicker: string,
  sector: string,
  currentScore: number,
  maxPeers: number = 5
): PeerCompany[] {
  const peerTickers = SECTOR_PEERS[sector] || SECTOR_PEERS['Technology'];
  
  // Filter out current company and take maxPeers
  const selectedPeers = peerTickers
    .filter(ticker => ticker !== currentTicker)
    .slice(0, maxPeers);

  return selectedPeers.map(ticker => {
    // Generate realistic peer data with some variance from current score
    const variance = (Math.random() - 0.5) * 20; // ±10 points
    const peerScore = Math.max(0, Math.min(100, currentScore + variance));
    const previousScore = peerScore - (Math.random() - 0.5) * 6; // ±3 points change

    return {
      ticker,
      name: getCompanyName(ticker),
      sector,
      CO_GRI: peerScore,
      risk_level: getRiskLevel(peerScore),
      delta_30D: peerScore - previousScore,
      direction: getTrendDirection(peerScore, previousScore),
      forecast_outlook: generateForecastOutlook(),
      market_cap: generateMarketCap()
    };
  });
}

/**
 * Rank peers by CO-GRI score
 */
export function rankPeersByRisk(peers: PeerCompany[]): PeerCompany[] {
  return [...peers].sort((a, b) => b.CO_GRI - a.CO_GRI);
}

/**
 * Get company's rank among peers
 */
export function getCompanyRank(
  currentScore: number,
  peers: PeerCompany[]
): { rank: number; total: number } {
  const allScores = [currentScore, ...peers.map(p => p.CO_GRI)];
  const sortedScores = [...allScores].sort((a, b) => b - a);
  const rank = sortedScores.indexOf(currentScore) + 1;
  
  return { rank, total: allScores.length };
}

/**
 * Calculate sector average CO-GRI
 */
export function calculateSectorAverage(peers: PeerCompany[]): number {
  if (peers.length === 0) return 0;
  const sum = peers.reduce((acc, peer) => acc + peer.CO_GRI, 0);
  return sum / peers.length;
}

/**
 * Get company name from ticker (simplified)
 */
function getCompanyName(ticker: string): string {
  const names: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'AMD': 'Advanced Micro Devices',
    'INTC': 'Intel Corporation',
    'ORCL': 'Oracle Corporation',
    'TSM': 'Taiwan Semiconductor',
    'QCOM': 'Qualcomm Inc.',
    'AVGO': 'Broadcom Inc.',
    'TXN': 'Texas Instruments',
    'MU': 'Micron Technology',
    'TSLA': 'Tesla Inc.',
    'F': 'Ford Motor Company',
    'GM': 'General Motors',
    'TM': 'Toyota Motor Corp.',
    'HMC': 'Honda Motor Co.',
    'AMZN': 'Amazon.com Inc.',
    'WMT': 'Walmart Inc.',
    'TGT': 'Target Corporation',
    'COST': 'Costco Wholesale',
    'JPM': 'JPMorgan Chase',
    'BAC': 'Bank of America',
    'WFC': 'Wells Fargo',
    'C': 'Citigroup Inc.'
  };
  return names[ticker] || `${ticker} Corporation`;
}

/**
 * Generate forecast outlook (simplified)
 */
function generateForecastOutlook(): 'Headwind' | 'Tailwind' | 'Mixed' {
  const rand = Math.random();
  if (rand < 0.33) return 'Headwind';
  if (rand < 0.66) return 'Tailwind';
  return 'Mixed';
}

/**
 * Generate market cap (simplified, in billions)
 */
function generateMarketCap(): number {
  return Math.floor(Math.random() * 2000) + 100; // $100B - $2.1T
}
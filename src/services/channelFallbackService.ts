/**
 * Channel-Specific Fallback Service
 * 
 * Implements independent fallback logic for each of the 5 exposure channels.
 * Each channel has sector-specific fallback templates that reflect real-world patterns.
 * 
 * Key Principles:
 * 1. Each channel has its own fallback template per sector
 * 2. Fallback only applies to countries with status='unknown'
 * 3. Countries with evidence or known_zero are LOCKED (never overwritten)
 * 4. Regional boundaries enforced per channel
 */

import { ChannelType, EvidenceStatus } from '@/utils/channelExposureBuilder';

export interface ChannelFallbackTemplate {
  channel: ChannelType;
  sector: string;
  countries: Record<string, number>; // country -> weight (pre-normalization)
  description: string;
}

/**
 * Revenue Channel Fallback Templates
 * Based on market presence and sales distribution patterns
 */
const REVENUE_FALLBACK_TEMPLATES: Record<string, ChannelFallbackTemplate> = {
  'Technology': {
    channel: 'revenue',
    sector: 'Technology',
    countries: {
      'United States': 0.45,
      'China': 0.15,
      'Germany': 0.06,
      'United Kingdom': 0.05,
      'Japan': 0.05,
      'France': 0.04,
      'Canada': 0.03,
      'South Korea': 0.03,
      'India': 0.03,
      'Australia': 0.02,
      'Brazil': 0.02,
      'Netherlands': 0.02,
      'Singapore': 0.02,
      'Switzerland': 0.01,
      'Sweden': 0.01,
      'Italy': 0.01
    },
    description: 'Technology sector revenue concentrated in developed markets with strong digital infrastructure'
  },
  'Energy': {
    channel: 'revenue',
    sector: 'Energy',
    countries: {
      'United States': 0.35,
      'China': 0.18,
      'Saudi Arabia': 0.08,
      'Russia': 0.06,
      'United Arab Emirates': 0.05,
      'India': 0.05,
      'Japan': 0.04,
      'Germany': 0.03,
      'United Kingdom': 0.03,
      'Canada': 0.03,
      'Brazil': 0.02,
      'Mexico': 0.02,
      'Nigeria': 0.02,
      'Norway': 0.02,
      'Qatar': 0.01,
      'Kuwait': 0.01
    },
    description: 'Energy sector revenue follows global energy consumption and production patterns'
  },
  'Finance': {
    channel: 'revenue',
    sector: 'Finance',
    countries: {
      'United States': 0.50,
      'United Kingdom': 0.12,
      'China': 0.10,
      'Japan': 0.06,
      'Germany': 0.04,
      'France': 0.03,
      'Switzerland': 0.03,
      'Canada': 0.02,
      'Singapore': 0.02,
      'Hong Kong': 0.02,
      'Australia': 0.02,
      'Netherlands': 0.01,
      'Luxembourg': 0.01,
      'South Korea': 0.01,
      'India': 0.01
    },
    description: 'Finance sector revenue concentrated in major financial centers'
  },
  'Healthcare': {
    channel: 'revenue',
    sector: 'Healthcare',
    countries: {
      'United States': 0.55,
      'Germany': 0.08,
      'Japan': 0.06,
      'China': 0.06,
      'United Kingdom': 0.05,
      'France': 0.04,
      'Canada': 0.03,
      'Italy': 0.02,
      'Spain': 0.02,
      'Australia': 0.02,
      'Switzerland': 0.02,
      'Netherlands': 0.01,
      'Brazil': 0.01,
      'South Korea': 0.01,
      'India': 0.01,
      'Belgium': 0.01
    },
    description: 'Healthcare revenue concentrated in markets with advanced healthcare systems'
  },
  'Consumer': {
    channel: 'revenue',
    sector: 'Consumer',
    countries: {
      'United States': 0.40,
      'China': 0.20,
      'Germany': 0.06,
      'United Kingdom': 0.05,
      'Japan': 0.05,
      'France': 0.04,
      'India': 0.03,
      'Brazil': 0.03,
      'Canada': 0.02,
      'Italy': 0.02,
      'Mexico': 0.02,
      'Spain': 0.02,
      'South Korea': 0.02,
      'Australia': 0.01,
      'Indonesia': 0.01,
      'Netherlands': 0.01,
      'Turkey': 0.01
    },
    description: 'Consumer sector revenue follows population and purchasing power distribution'
  }
};

/**
 * Supply Chain Channel Fallback Templates
 * Based on manufacturing hubs, supplier locations, and logistics networks
 */
const SUPPLY_CHAIN_FALLBACK_TEMPLATES: Record<string, ChannelFallbackTemplate> = {
  'Technology': {
    channel: 'supply',
    sector: 'Technology',
    countries: {
      'China': 0.35,
      'Taiwan': 0.15,
      'South Korea': 0.12,
      'Vietnam': 0.08,
      'Japan': 0.06,
      'United States': 0.05,
      'Malaysia': 0.05,
      'Thailand': 0.04,
      'Singapore': 0.03,
      'India': 0.03,
      'Philippines': 0.02,
      'Germany': 0.01,
      'Mexico': 0.01
    },
    description: 'Technology supply chain concentrated in Asian manufacturing hubs'
  },
  'Energy': {
    channel: 'supply',
    sector: 'Energy',
    countries: {
      'United States': 0.25,
      'China': 0.20,
      'Russia': 0.12,
      'Saudi Arabia': 0.10,
      'United Arab Emirates': 0.08,
      'Norway': 0.06,
      'Canada': 0.05,
      'Brazil': 0.04,
      'Nigeria': 0.03,
      'Qatar': 0.03,
      'Kuwait': 0.02,
      'Venezuela': 0.01,
      'Iraq': 0.01
    },
    description: 'Energy supply chain follows resource extraction and refining locations'
  },
  'Finance': {
    channel: 'supply',
    sector: 'Finance',
    countries: {
      'United States': 0.40,
      'United Kingdom': 0.15,
      'India': 0.12,
      'Ireland': 0.08,
      'Singapore': 0.06,
      'China': 0.05,
      'Philippines': 0.04,
      'Poland': 0.03,
      'Germany': 0.02,
      'Canada': 0.02,
      'Malaysia': 0.02,
      'South Africa': 0.01
    },
    description: 'Finance supply chain includes IT services, back-office operations, and data centers'
  },
  'Healthcare': {
    channel: 'supply',
    sector: 'Healthcare',
    countries: {
      'United States': 0.30,
      'China': 0.18,
      'India': 0.15,
      'Germany': 0.08,
      'Ireland': 0.06,
      'Switzerland': 0.05,
      'Singapore': 0.04,
      'United Kingdom': 0.03,
      'Japan': 0.03,
      'Belgium': 0.02,
      'France': 0.02,
      'Italy': 0.02,
      'South Korea': 0.01,
      'Israel': 0.01
    },
    description: 'Healthcare supply chain includes pharmaceutical manufacturing and medical device production'
  },
  'Consumer': {
    channel: 'supply',
    sector: 'Consumer',
    countries: {
      'China': 0.40,
      'Vietnam': 0.12,
      'Bangladesh': 0.10,
      'India': 0.08,
      'United States': 0.06,
      'Mexico': 0.05,
      'Thailand': 0.04,
      'Indonesia': 0.04,
      'Turkey': 0.03,
      'Pakistan': 0.02,
      'Germany': 0.02,
      'Italy': 0.02,
      'Poland': 0.01,
      'Brazil': 0.01
    },
    description: 'Consumer goods supply chain concentrated in low-cost manufacturing regions'
  }
};

/**
 * Physical Assets Channel Fallback Templates
 * Based on facility locations, real estate, and infrastructure
 */
const ASSETS_FALLBACK_TEMPLATES: Record<string, ChannelFallbackTemplate> = {
  'Technology': {
    channel: 'assets',
    sector: 'Technology',
    countries: {
      'United States': 0.50,
      'China': 0.12,
      'Ireland': 0.08,
      'Germany': 0.05,
      'United Kingdom': 0.05,
      'Singapore': 0.04,
      'Japan': 0.03,
      'Canada': 0.03,
      'India': 0.03,
      'Netherlands': 0.02,
      'Sweden': 0.02,
      'Australia': 0.01,
      'Switzerland': 0.01,
      'France': 0.01
    },
    description: 'Technology physical assets include data centers, offices, and R&D facilities'
  },
  'Energy': {
    channel: 'assets',
    sector: 'Energy',
    countries: {
      'United States': 0.30,
      'Russia': 0.15,
      'Saudi Arabia': 0.12,
      'China': 0.10,
      'United Arab Emirates': 0.08,
      'Norway': 0.06,
      'Canada': 0.05,
      'Brazil': 0.04,
      'Nigeria': 0.03,
      'Qatar': 0.02,
      'Kuwait': 0.02,
      'Iraq': 0.01,
      'Venezuela': 0.01,
      'Kazakhstan': 0.01
    },
    description: 'Energy physical assets include extraction sites, refineries, and pipelines'
  },
  'Finance': {
    channel: 'assets',
    sector: 'Finance',
    countries: {
      'United States': 0.60,
      'United Kingdom': 0.12,
      'China': 0.08,
      'Japan': 0.05,
      'Germany': 0.03,
      'Switzerland': 0.03,
      'France': 0.02,
      'Singapore': 0.02,
      'Canada': 0.02,
      'Hong Kong': 0.01,
      'Australia': 0.01,
      'Luxembourg': 0.01
    },
    description: 'Finance physical assets concentrated in headquarters and major branch locations'
  },
  'Healthcare': {
    channel: 'assets',
    sector: 'Healthcare',
    countries: {
      'United States': 0.60,
      'Germany': 0.08,
      'Switzerland': 0.06,
      'United Kingdom': 0.05,
      'Japan': 0.04,
      'France': 0.03,
      'China': 0.03,
      'Ireland': 0.03,
      'Canada': 0.02,
      'Belgium': 0.02,
      'Netherlands': 0.02,
      'Singapore': 0.01,
      'Italy': 0.01
    },
    description: 'Healthcare physical assets include manufacturing plants, R&D centers, and distribution facilities'
  },
  'Consumer': {
    channel: 'assets',
    sector: 'Consumer',
    countries: {
      'United States': 0.45,
      'China': 0.15,
      'Germany': 0.08,
      'United Kingdom': 0.06,
      'France': 0.05,
      'Japan': 0.04,
      'Mexico': 0.03,
      'Brazil': 0.03,
      'Canada': 0.02,
      'India': 0.02,
      'Italy': 0.02,
      'Spain': 0.02,
      'Australia': 0.01,
      'South Korea': 0.01,
      'Netherlands': 0.01
    },
    description: 'Consumer goods physical assets include warehouses, distribution centers, and retail locations'
  }
};

/**
 * Financial Exposure Channel Fallback Templates
 * Based on banking relationships, debt markets, and financial operations
 */
const FINANCIAL_FALLBACK_TEMPLATES: Record<string, ChannelFallbackTemplate> = {
  'Technology': {
    channel: 'financial',
    sector: 'Technology',
    countries: {
      'United States': 0.65,
      'United Kingdom': 0.10,
      'Switzerland': 0.06,
      'Japan': 0.05,
      'Germany': 0.04,
      'Singapore': 0.03,
      'Hong Kong': 0.02,
      'Luxembourg': 0.02,
      'Ireland': 0.01,
      'France': 0.01,
      'Netherlands': 0.01
    },
    description: 'Technology financial exposure concentrated in major financial centers for debt and banking'
  },
  'Energy': {
    channel: 'financial',
    sector: 'Energy',
    countries: {
      'United States': 0.50,
      'United Kingdom': 0.15,
      'Switzerland': 0.08,
      'Singapore': 0.06,
      'Japan': 0.05,
      'United Arab Emirates': 0.04,
      'Hong Kong': 0.03,
      'Germany': 0.03,
      'Luxembourg': 0.02,
      'France': 0.02,
      'Netherlands': 0.01,
      'China': 0.01
    },
    description: 'Energy financial exposure includes project financing and commodity trading'
  },
  'Finance': {
    channel: 'financial',
    sector: 'Finance',
    countries: {
      'United States': 0.70,
      'United Kingdom': 0.12,
      'Switzerland': 0.06,
      'Japan': 0.04,
      'Luxembourg': 0.03,
      'Singapore': 0.02,
      'Germany': 0.01,
      'Hong Kong': 0.01,
      'France': 0.01
    },
    description: 'Finance sector financial exposure highly concentrated in primary financial centers'
  },
  'Healthcare': {
    channel: 'financial',
    sector: 'Healthcare',
    countries: {
      'United States': 0.70,
      'United Kingdom': 0.10,
      'Switzerland': 0.06,
      'Germany': 0.04,
      'Japan': 0.03,
      'Singapore': 0.02,
      'Luxembourg': 0.02,
      'France': 0.01,
      'Ireland': 0.01,
      'Netherlands': 0.01
    },
    description: 'Healthcare financial exposure concentrated in markets with strong capital markets'
  },
  'Consumer': {
    channel: 'financial',
    sector: 'Consumer',
    countries: {
      'United States': 0.60,
      'United Kingdom': 0.12,
      'Switzerland': 0.06,
      'Germany': 0.05,
      'Japan': 0.04,
      'France': 0.03,
      'Singapore': 0.03,
      'Hong Kong': 0.02,
      'Luxembourg': 0.02,
      'Netherlands': 0.01,
      'China': 0.01,
      'Canada': 0.01
    },
    description: 'Consumer sector financial exposure follows corporate headquarters and debt markets'
  }
};

/**
 * Counterparty Risk Channel Fallback Templates
 * Based on customer concentration, supplier dependencies, and trading partners
 */
const COUNTERPARTY_FALLBACK_TEMPLATES: Record<string, ChannelFallbackTemplate> = {
  'Technology': {
    channel: 'counterparty',
    sector: 'Technology',
    countries: {
      'United States': 0.40,
      'China': 0.18,
      'Germany': 0.08,
      'United Kingdom': 0.06,
      'Japan': 0.06,
      'South Korea': 0.05,
      'France': 0.04,
      'Canada': 0.03,
      'India': 0.02,
      'Taiwan': 0.02,
      'Netherlands': 0.02,
      'Singapore': 0.02,
      'Australia': 0.01,
      'Brazil': 0.01
    },
    description: 'Technology counterparty risk includes major customers and strategic partners'
  },
  'Energy': {
    channel: 'counterparty',
    sector: 'Energy',
    countries: {
      'United States': 0.30,
      'China': 0.20,
      'Japan': 0.10,
      'India': 0.08,
      'Germany': 0.06,
      'South Korea': 0.05,
      'United Kingdom': 0.04,
      'France': 0.03,
      'Italy': 0.03,
      'Spain': 0.02,
      'Netherlands': 0.02,
      'Singapore': 0.02,
      'Brazil': 0.02,
      'Turkey': 0.02,
      'Thailand': 0.01
    },
    description: 'Energy counterparty risk concentrated in major energy consumers and trading partners'
  },
  'Finance': {
    channel: 'counterparty',
    sector: 'Finance',
    countries: {
      'United States': 0.55,
      'United Kingdom': 0.15,
      'China': 0.08,
      'Japan': 0.06,
      'Germany': 0.04,
      'France': 0.03,
      'Switzerland': 0.02,
      'Singapore': 0.02,
      'Hong Kong': 0.02,
      'Canada': 0.01,
      'Australia': 0.01,
      'Netherlands': 0.01
    },
    description: 'Finance counterparty risk includes interbank exposures and institutional clients'
  },
  'Healthcare': {
    channel: 'counterparty',
    sector: 'Healthcare',
    countries: {
      'United States': 0.50,
      'Germany': 0.10,
      'China': 0.08,
      'Japan': 0.06,
      'United Kingdom': 0.05,
      'France': 0.04,
      'Italy': 0.03,
      'Canada': 0.03,
      'Spain': 0.02,
      'Brazil': 0.02,
      'India': 0.02,
      'Australia': 0.02,
      'South Korea': 0.01,
      'Netherlands': 0.01,
      'Switzerland': 0.01
    },
    description: 'Healthcare counterparty risk includes hospital systems, insurers, and distributors'
  },
  'Consumer': {
    channel: 'counterparty',
    sector: 'Consumer',
    countries: {
      'United States': 0.35,
      'China': 0.20,
      'Germany': 0.08,
      'United Kingdom': 0.06,
      'Japan': 0.05,
      'France': 0.05,
      'India': 0.04,
      'Brazil': 0.03,
      'Canada': 0.03,
      'Mexico': 0.02,
      'Italy': 0.02,
      'Spain': 0.02,
      'South Korea': 0.02,
      'Australia': 0.01,
      'Indonesia': 0.01,
      'Turkey': 0.01
    },
    description: 'Consumer counterparty risk includes retailers, distributors, and e-commerce platforms'
  }
};

/**
 * Get fallback template for a specific channel and sector
 */
export function getChannelFallbackTemplate(
  channel: ChannelType,
  sector: string
): ChannelFallbackTemplate | null {
  // Normalize sector name
  const normalizedSector = normalizeSectorName(sector);
  
  let template: ChannelFallbackTemplate | null = null;
  
  switch (channel) {
    case 'revenue':
      template = REVENUE_FALLBACK_TEMPLATES[normalizedSector] || REVENUE_FALLBACK_TEMPLATES['Consumer'];
      break;
    case 'supply':
      template = SUPPLY_CHAIN_FALLBACK_TEMPLATES[normalizedSector] || SUPPLY_CHAIN_FALLBACK_TEMPLATES['Consumer'];
      break;
    case 'assets':
      template = ASSETS_FALLBACK_TEMPLATES[normalizedSector] || ASSETS_FALLBACK_TEMPLATES['Consumer'];
      break;
    case 'financial':
      template = FINANCIAL_FALLBACK_TEMPLATES[normalizedSector] || FINANCIAL_FALLBACK_TEMPLATES['Consumer'];
      break;
    case 'counterparty':
      template = COUNTERPARTY_FALLBACK_TEMPLATES[normalizedSector] || COUNTERPARTY_FALLBACK_TEMPLATES['Consumer'];
      break;
  }
  
  return template;
}

/**
 * Normalize sector name to match template keys
 */
function normalizeSectorName(sector: string): string {
  const sectorLower = sector.toLowerCase();
  
  if (sectorLower.includes('tech') || sectorLower.includes('software') || sectorLower.includes('internet')) {
    return 'Technology';
  }
  if (sectorLower.includes('energy') || sectorLower.includes('oil') || sectorLower.includes('gas')) {
    return 'Energy';
  }
  if (sectorLower.includes('financ') || sectorLower.includes('bank') || sectorLower.includes('insurance')) {
    return 'Finance';
  }
  if (sectorLower.includes('health') || sectorLower.includes('pharma') || sectorLower.includes('biotech') || sectorLower.includes('medical')) {
    return 'Healthcare';
  }
  if (sectorLower.includes('consumer') || sectorLower.includes('retail') || sectorLower.includes('food')) {
    return 'Consumer';
  }
  
  return 'Consumer'; // Default fallback
}

/**
 * Apply fallback to a channel, respecting evidence protection
 * 
 * Evidence Protection Rules:
 * 1. Countries with status='evidence' are LOCKED (never overwritten)
 * 2. Countries with status='known_zero' are LOCKED (explicitly zero, don't add fallback)
 * 3. Only countries with status='unknown' receive fallback values
 */
export function applyChannelFallback(
  existingCountries: Map<string, { value: number; status: EvidenceStatus; source?: string }>,
  channel: ChannelType,
  sector: string,
  homeCountry: string
): Map<string, { value: number; status: EvidenceStatus; source?: string }> {
  const template = getChannelFallbackTemplate(channel, sector);
  if (!template) {
    return existingCountries;
  }
  
  const result = new Map(existingCountries);
  
  // Identify which countries need fallback (status='unknown')
  const countriesNeedingFallback = new Set<string>();
  
  for (const [country, weight] of Object.entries(template.countries)) {
    const existing = result.get(country);
    
    // Only apply fallback if:
    // 1. Country doesn't exist in map (status='unknown' by default)
    // 2. OR country exists with status='unknown'
    if (!existing || existing.status === 'unknown') {
      countriesNeedingFallback.add(country);
    }
    // If status is 'evidence' or 'known_zero', SKIP (evidence protection)
  }
  
  // Apply fallback only to countries needing it
  for (const country of countriesNeedingFallback) {
    const weight = template.countries[country];
    if (weight && weight > 0) {
      result.set(country, {
        value: weight,
        status: 'fallback',
        source: `${template.description} (Sector: ${sector})`
      });
    }
  }
  
  return result;
}

/**
 * Get summary of fallback application for a channel
 */
export function getChannelFallbackSummary(
  channel: ChannelType,
  sector: string,
  evidenceCount: number,
  knownZeroCount: number,
  fallbackCount: number
): string {
  const template = getChannelFallbackTemplate(channel, sector);
  const channelName = channel === 'revenue' ? 'Revenue' :
                      channel === 'supply' ? 'Supply Chain' :
                      channel === 'assets' ? 'Physical Assets' :
                      channel === 'financial' ? 'Financial' : 'Counterparty';
  
  return `${channelName} Channel: ${evidenceCount} countries with evidence (locked), ${knownZeroCount} known-zero countries (locked), ${fallbackCount} countries using fallback. Template: ${template?.description || 'Generic fallback'}`;
}
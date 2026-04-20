/**
 * Propagation Rules - Event-type-specific propagation configuration
 * 
 * Defines how different event types propagate through trade networks.
 */

import type { EventType, VectorCode } from '@/types/csi.types';

export interface PropagationRule {
  event_type: EventType;
  vector_code: VectorCode;
  decay_per_hop: number; // Multiplier per hop (e.g., 0.5 = 50% decay)
  max_hops: number; // Maximum propagation distance
  min_intensity_threshold: number; // Minimum trade intensity to propagate
  sector_multipliers?: Record<string, number>; // Sector-specific adjustments
  description: string;
}

/**
 * Propagation rules by event type
 */
export const PROPAGATION_RULES: PropagationRule[] = [
  {
    event_type: 'SANCTION',
    vector_code: 'SC2',
    decay_per_hop: 0.5,
    max_hops: 3,
    min_intensity_threshold: 50,
    sector_multipliers: {
      'Finance': 1.2,
      'Technology': 1.1,
      'Energy': 1.15
    },
    description: 'Sanctions propagate through financial and trade networks'
  },
  {
    event_type: 'EXPORT_CONTROL',
    vector_code: 'SC3',
    decay_per_hop: 0.6,
    max_hops: 2,
    min_intensity_threshold: 60,
    sector_multipliers: {
      'Technology': 1.3,
      'Semiconductors': 1.4,
      'Defense': 1.2
    },
    description: 'Export controls primarily affect technology supply chains'
  },
  {
    event_type: 'TARIFF',
    vector_code: 'SC3',
    decay_per_hop: 0.5,
    max_hops: 2,
    min_intensity_threshold: 70,
    sector_multipliers: {
      'Manufacturing': 1.2,
      'Automotive': 1.15,
      'Agriculture': 1.1
    },
    description: 'Tariffs impact direct trade partners most significantly'
  },
  {
    event_type: 'KINETIC',
    vector_code: 'SC1',
    decay_per_hop: 0.4,
    max_hops: 3,
    min_intensity_threshold: 40,
    sector_multipliers: {
      'Energy': 1.3,
      'Defense': 1.25,
      'Transportation': 1.2
    },
    description: 'Kinetic conflicts have wide-ranging regional impacts'
  },
  {
    event_type: 'CAPITAL_CONTROL',
    vector_code: 'SC5',
    decay_per_hop: 0.6,
    max_hops: 2,
    min_intensity_threshold: 60,
    sector_multipliers: {
      'Finance': 1.4,
      'Banking': 1.3,
      'Investment': 1.2
    },
    description: 'Capital controls primarily affect financial flows'
  },
  {
    event_type: 'COUP',
    vector_code: 'SC6',
    decay_per_hop: 0.5,
    max_hops: 2,
    min_intensity_threshold: 50,
    sector_multipliers: {
      'Mining': 1.2,
      'Energy': 1.15,
      'Agriculture': 1.1
    },
    description: 'Political instability affects resource-dependent partners'
  },
  {
    event_type: 'CYBER_ATTACK',
    vector_code: 'SC7',
    decay_per_hop: 0.7,
    max_hops: 2,
    min_intensity_threshold: 55,
    sector_multipliers: {
      'Technology': 1.3,
      'Finance': 1.2,
      'Telecommunications': 1.25
    },
    description: 'Cyber attacks propagate through digital infrastructure'
  },
  {
    event_type: 'TRADE_RESTRICTION',
    vector_code: 'SC3',
    decay_per_hop: 0.55,
    max_hops: 2,
    min_intensity_threshold: 65,
    sector_multipliers: {
      'Manufacturing': 1.2,
      'Trade': 1.25,
      'Logistics': 1.15
    },
    description: 'Trade restrictions impact supply chain partners'
  },
  {
    event_type: 'REGULATORY_CHANGE',
    vector_code: 'SC4',
    decay_per_hop: 0.65,
    max_hops: 1,
    min_intensity_threshold: 70,
    sector_multipliers: {
      'Pharmaceuticals': 1.2,
      'Finance': 1.15,
      'Technology': 1.1
    },
    description: 'Regulatory changes have limited cross-border propagation'
  },
  {
    event_type: 'POLITICAL_INSTABILITY',
    vector_code: 'SC6',
    decay_per_hop: 0.5,
    max_hops: 2,
    min_intensity_threshold: 55,
    sector_multipliers: {
      'Tourism': 1.2,
      'Investment': 1.15,
      'Trade': 1.1
    },
    description: 'Political instability affects regional confidence'
  }
];

/**
 * Get propagation rule for an event type
 */
export function getPropagationRule(eventType: EventType): PropagationRule | undefined {
  return PROPAGATION_RULES.find(rule => rule.event_type === eventType);
}

/**
 * Calculate sector multiplier
 */
export function getSectorMultiplier(rule: PropagationRule, sectors?: string[]): number {
  if (!sectors || !rule.sector_multipliers) {
    return 1.0;
  }

  // Use the highest multiplier among affected sectors
  let maxMultiplier = 1.0;
  for (const sector of sectors) {
    const multiplier = rule.sector_multipliers[sector];
    if (multiplier && multiplier > maxMultiplier) {
      maxMultiplier = multiplier;
    }
  }

  return maxMultiplier;
}

/**
 * Check if event type is eligible for propagation
 */
export function isPropagationEligible(eventType: EventType): boolean {
  return PROPAGATION_RULES.some(rule => rule.event_type === eventType);
}
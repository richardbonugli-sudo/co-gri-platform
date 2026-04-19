/**
 * TierBadge — shared evidence-tier badge component.
 *
 * Recommendation R12: Extracted from VerificationDrawer.tsx so it can be
 * reused in RiskAttribution.tsx, ExposurePathways.tsx, RiskContributionMap.tsx,
 * and any future component that needs to surface data-quality tiers.
 *
 * Three canonical tiers (Recommendation R9 — FALLBACK collapsed into MODELED):
 *   DIRECT    — explicitly disclosed in SEC filing
 *   ALLOCATED — derived from structural constraint (region total → prior split)
 *   MODELED   — prior-based inference / GF fallback (no direct filing evidence)
 */

import React from 'react';

export type EvidenceTier = 'DIRECT' | 'ALLOCATED' | 'MODELED';

interface TierConfig {
  label: string;
  className: string;
  tooltip: string;
}

const TIER_CONFIG: Record<EvidenceTier, TierConfig> = {
  DIRECT: {
    label: 'Direct',
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
    tooltip: 'Explicitly disclosed in SEC filing',
  },
  ALLOCATED: {
    label: 'Allocated',
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
    tooltip: 'Derived from structural constraint (region total → prior split)',
  },
  MODELED: {
    label: 'Modeled',
    className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600',
    tooltip: 'Model-estimated. No direct filing evidence (includes GF fallback).',
  },
};

/**
 * Normalize a raw dataSource value (which may include the legacy 'FALLBACK' string)
 * to one of the three canonical EvidenceTier values.
 *
 * Recommendation R9: FALLBACK is a subset of MODELED — collapse it here so the
 * rest of the UI only needs to handle three values.
 */
export function normalizeToTier(
  value: string | undefined | null
): EvidenceTier {
  if (!value) return 'MODELED';
  if (value === 'DIRECT') return 'DIRECT';
  if (value === 'ALLOCATED') return 'ALLOCATED';
  // Both 'MODELED' and legacy 'FALLBACK' map to MODELED (R9)
  return 'MODELED';
}

interface TierBadgeProps {
  /** Raw tier string — accepts EvidenceTier or legacy 'FALLBACK' (normalized to MODELED). */
  tier?: string | null;
  /** Optional extra CSS classes. */
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, className = '' }) => {
  const normalized = normalizeToTier(tier);
  const { label, className: baseClass, tooltip } = TIER_CONFIG[normalized];

  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${baseClass} ${className}`}
      title={tooltip}
    >
      {label}
    </span>
  );
};

export default TierBadge;
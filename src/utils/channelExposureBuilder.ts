/**
 * Channel Exposure Builder
 * 
 * Implements per-channel independent construction for the five exposure components:
 * - W_r (Revenue): 35% weight
 * - W_s (Supply Chain): 30% weight  
 * - W_p (Physical Assets): 20% weight
 * - W_f (Financial): 10% weight
 * - W_c (Counterparty): 5% weight
 * 
 * Each channel is built independently with its own evidence and fallback logic.
 * 
 * CRITICAL EVIDENCE PROTECTION:
 * - Countries with evidence are LOCKED (never overwritten by fallback)
 * - Countries with known_zero are LOCKED (explicitly zero, no fallback)
 * - Only unknown countries receive fallback values
 */

export type ChannelType = 'revenue' | 'supply' | 'assets' | 'financial' | 'counterparty';
export type EvidenceStatus = 'evidence' | 'known_zero' | 'unknown' | 'fallback';

export interface ChannelCountryData {
  country: string;
  value: number;
  status: EvidenceStatus;
  source?: string;
  region?: string;
}

export interface ChannelEvidence {
  channel: ChannelType;
  channelName: string;
  channelWeight: number; // α, β, γ, δ, ε
  countries: Map<string, ChannelCountryData>;
  totalPreNorm: number;
  hasEvidence: boolean;
  evidenceCount: number;
  knownZeroCount: number;
  fallbackCount: number;
  unknownCount: number;
  evidenceSource?: string;
}

export interface ChannelBreakdown {
  revenue: ChannelEvidence;
  supply: ChannelEvidence;
  assets: ChannelEvidence;
  financial: ChannelEvidence;
  counterparty: ChannelEvidence;
}

export interface BlendedExposure {
  country: string;
  W_r: number;
  W_s: number;
  W_p: number;
  W_f: number;
  W_c: number;
  W_r_status: EvidenceStatus;
  W_s_status: EvidenceStatus;
  W_p_status: EvidenceStatus;
  W_f_status: EvidenceStatus;
  W_c_status: EvidenceStatus;
  blendedPreNorm: number;
  blendedNormalized: number;
}

/**
 * Channel weights (α, β, γ, δ, ε)
 */
export const CHANNEL_WEIGHTS = {
  revenue: 0.35,
  supply: 0.30,
  assets: 0.20,
  financial: 0.10,
  counterparty: 0.05
};

/**
 * Channel names for display
 */
export const CHANNEL_NAMES = {
  revenue: 'Revenue (W_r)',
  supply: 'Supply Chain (W_s)',
  assets: 'Physical Assets (W_p)',
  financial: 'Financial (W_f)',
  counterparty: 'Counterparty (W_c)'
};

/**
 * Initialize an empty channel
 */
export function initializeChannel(
  channelType: ChannelType,
  channelWeight: number
): ChannelEvidence {
  return {
    channel: channelType,
    channelName: CHANNEL_NAMES[channelType],
    channelWeight,
    countries: new Map(),
    totalPreNorm: 0,
    hasEvidence: false,
    evidenceCount: 0,
    knownZeroCount: 0,
    fallbackCount: 0,
    unknownCount: 0
  };
}

/**
 * Add evidence to a channel for a specific country
 * 
 * EVIDENCE PROTECTION:
 * - If country already has evidence, don't overwrite
 * - If country has known_zero, don't overwrite
 * - Only overwrite if current status is 'unknown' or 'fallback'
 */
export function addChannelEvidence(
  channel: ChannelEvidence,
  country: string,
  value: number,
  status: EvidenceStatus,
  source?: string,
  region?: string
): void {
  const existing = channel.countries.get(country);
  
  // EVIDENCE PROTECTION: Don't overwrite evidence or known_zero
  if (existing) {
    if (existing.status === 'evidence' && status !== 'evidence') {
      // Don't overwrite evidence with fallback or unknown
      return;
    }
    if (existing.status === 'known_zero' && status !== 'evidence') {
      // Don't overwrite known_zero with fallback or unknown
      // Only evidence can override known_zero (if we get better data)
      return;
    }
  }
  
  // Update country data
  if (value > 0 || status === 'known_zero') {
    channel.countries.set(country, {
      country,
      value,
      status,
      source,
      region
    });
    
    // Update channel statistics
    if (status === 'evidence') {
      if (value > 0) {
        channel.hasEvidence = true;
        channel.evidenceCount++;
        channel.evidenceSource = source;
      }
    } else if (status === 'known_zero') {
      channel.knownZeroCount++;
    } else if (status === 'fallback') {
      channel.fallbackCount++;
    } else if (status === 'unknown') {
      channel.unknownCount++;
    }
    
    // Update total (only for non-zero values)
    if (value > 0) {
      channel.totalPreNorm += value;
    }
  }
}

/**
 * Normalize a single channel (only countries with non-zero values)
 * 
 * NORMALIZATION RULES:
 * - Only normalize countries with value > 0
 * - Preserve evidence status during normalization
 * - Known_zero countries remain at 0 (not included in normalization)
 */
export function normalizeChannel(channel: ChannelEvidence): void {
  if (channel.totalPreNorm === 0) return;
  
  for (const [country, data] of channel.countries.entries()) {
    if (data.value > 0) {
      const normalized = data.value / channel.totalPreNorm;
      channel.countries.set(country, {
        ...data,
        value: normalized
      });
    }
  }
  
  channel.totalPreNorm = 1.0; // After normalization
}

/**
 * Blend all five channels into final exposure weights
 * W_i,c = α×W_r + β×W_s + γ×W_p + δ×W_f + ε×W_c
 * 
 * BLENDING RULES:
 * - Each channel contributes according to its weight
 * - Evidence status is preserved per channel
 * - If a country has evidence in ANY channel, that channel's status is 'evidence'
 */
export function blendChannels(
  breakdown: ChannelBreakdown
): Map<string, BlendedExposure> {
  const allCountries = new Set<string>();
  
  // Collect all countries from all channels
  for (const channel of Object.values(breakdown)) {
    for (const country of channel.countries.keys()) {
      allCountries.add(country);
    }
  }
  
  const blended = new Map<string, BlendedExposure>();
  
  for (const country of allCountries) {
    const W_r = breakdown.revenue.countries.get(country)?.value || 0;
    const W_s = breakdown.supply.countries.get(country)?.value || 0;
    const W_p = breakdown.assets.countries.get(country)?.value || 0;
    const W_f = breakdown.financial.countries.get(country)?.value || 0;
    const W_c = breakdown.counterparty.countries.get(country)?.value || 0;
    
    const W_r_status = breakdown.revenue.countries.get(country)?.status || 'unknown';
    const W_s_status = breakdown.supply.countries.get(country)?.status || 'unknown';
    const W_p_status = breakdown.assets.countries.get(country)?.status || 'unknown';
    const W_f_status = breakdown.financial.countries.get(country)?.status || 'unknown';
    const W_c_status = breakdown.counterparty.countries.get(country)?.status || 'unknown';
    
    // Blend using channel weights
    const blendedPreNorm = 
      CHANNEL_WEIGHTS.revenue * W_r +
      CHANNEL_WEIGHTS.supply * W_s +
      CHANNEL_WEIGHTS.assets * W_p +
      CHANNEL_WEIGHTS.financial * W_f +
      CHANNEL_WEIGHTS.counterparty * W_c;
    
    // Only include countries with non-zero blended exposure
    if (blendedPreNorm > 0) {
      blended.set(country, {
        country,
        W_r,
        W_s,
        W_p,
        W_f,
        W_c,
        W_r_status,
        W_s_status,
        W_p_status,
        W_f_status,
        W_c_status,
        blendedPreNorm,
        blendedNormalized: 0 // Will be set after final normalization
      });
    }
  }
  
  return blended;
}

/**
 * Final normalization of blended exposures
 * Normalize LAST - only countries with non-zero blended weights
 */
export function normalizeBlendedExposures(
  blended: Map<string, BlendedExposure>
): Map<string, BlendedExposure> {
  const totalPreNorm = Array.from(blended.values())
    .reduce((sum, exp) => sum + exp.blendedPreNorm, 0);
  
  if (totalPreNorm === 0) return blended;
  
  const normalized = new Map<string, BlendedExposure>();
  
  for (const [country, exposure] of blended.entries()) {
    normalized.set(country, {
      ...exposure,
      blendedNormalized: exposure.blendedPreNorm / totalPreNorm
    });
  }
  
  return normalized;
}

/**
 * Generate detailed calculation text for a channel
 */
export function generateChannelCalculationText(
  channel: ChannelEvidence,
  showPreNorm: boolean = true
): string[] {
  const lines: string[] = [];
  
  lines.push(`${channel.channelName} (α=${channel.channelWeight.toFixed(2)}):`);
  
  // Show evidence summary
  if (channel.hasEvidence) {
    lines.push(`  ✅ Evidence: ${channel.evidenceCount} countries from ${channel.evidenceSource}`);
  }
  if (channel.knownZeroCount > 0) {
    lines.push(`  🔒 Known Zero: ${channel.knownZeroCount} countries (explicitly zero exposure)`);
  }
  if (channel.fallbackCount > 0) {
    lines.push(`  📊 Fallback: ${channel.fallbackCount} countries (sector-based estimation)`);
  }
  if (channel.unknownCount > 0) {
    lines.push(`  ❓ Unknown: ${channel.unknownCount} countries (no data available)`);
  }
  
  lines.push('');
  
  if (showPreNorm) {
    lines.push('  Pre-Normalization:');
    
    // Sort by value descending
    const sorted = Array.from(channel.countries.entries())
      .filter(([_, data]) => data.value > 0)
      .sort((a, b) => b[1].value - a[1].value);
    
    for (const [country, data] of sorted) {
      const statusIcon = 
        data.status === 'evidence' ? '✅' :
        data.status === 'known_zero' ? '🔒' :
        data.status === 'fallback' ? '📊' : '❓';
      
      lines.push(`    ${statusIcon} ${country}: ${(data.value * 100).toFixed(2)}%`);
    }
    lines.push(`  Total: ${(channel.totalPreNorm * 100).toFixed(2)}%`);
  } else {
    lines.push('  Normalized:');
    
    // Sort by value descending
    const sorted = Array.from(channel.countries.entries())
      .filter(([_, data]) => data.value > 0)
      .sort((a, b) => b[1].value - a[1].value);
    
    for (const [country, data] of sorted) {
      const statusIcon = 
        data.status === 'evidence' ? '✅' :
        data.status === 'known_zero' ? '🔒' :
        data.status === 'fallback' ? '📊' : '❓';
      
      lines.push(`    ${statusIcon} ${country}: ${(data.value * 100).toFixed(2)}%`);
    }
  }
  
  lines.push('');
  return lines;
}

/**
 * Generate detailed blending calculation text
 */
export function generateBlendingCalculationText(
  blended: Map<string, BlendedExposure>
): string[] {
  const lines: string[] = [];
  
  lines.push('Blending Formula: W_i,c = α×W_r + β×W_s + γ×W_p + δ×W_f + ε×W_c');
  lines.push('Where: α=0.35, β=0.30, γ=0.20, δ=0.10, ε=0.05');
  lines.push('');
  lines.push('PRE-NORMALIZATION (Blended Totals):');
  
  // Sort by blended pre-norm value descending
  const sorted = Array.from(blended.entries())
    .sort((a, b) => b[1].blendedPreNorm - a[1].blendedPreNorm);
  
  for (const [country, exp] of sorted) {
    const statusSummary = [
      exp.W_r_status === 'evidence' ? 'R✅' : exp.W_r_status === 'fallback' ? 'R📊' : 'R❓',
      exp.W_s_status === 'evidence' ? 'S✅' : exp.W_s_status === 'fallback' ? 'S📊' : 'S❓',
      exp.W_p_status === 'evidence' ? 'P✅' : exp.W_p_status === 'fallback' ? 'P📊' : 'P❓',
      exp.W_f_status === 'evidence' ? 'F✅' : exp.W_f_status === 'fallback' ? 'F📊' : 'F❓',
      exp.W_c_status === 'evidence' ? 'C✅' : exp.W_c_status === 'fallback' ? 'C📊' : 'C❓'
    ].join(' ');
    
    lines.push(
      `  ${country}: 0.35×${exp.W_r.toFixed(4)} + 0.30×${exp.W_s.toFixed(4)} + ` +
      `0.20×${exp.W_p.toFixed(4)} + 0.10×${exp.W_f.toFixed(4)} + 0.05×${exp.W_c.toFixed(4)} = ` +
      `${exp.blendedPreNorm.toFixed(4)} [${statusSummary}]`
    );
  }
  
  const totalPreNorm = Array.from(blended.values())
    .reduce((sum, exp) => sum + exp.blendedPreNorm, 0);
  
  lines.push('');
  lines.push(`Total Pre-Norm: ${totalPreNorm.toFixed(4)}`);
  lines.push('');
  lines.push('NORMALIZATION (Applied LAST - only to non-zero countries):');
  
  for (const [country, exp] of sorted) {
    lines.push(
      `  ${country}: ${exp.blendedPreNorm.toFixed(4)} ÷ ${totalPreNorm.toFixed(4)} = ` +
      `${exp.blendedNormalized.toFixed(4)}`
    );
  }
  
  lines.push('');
  lines.push(`✓ No new countries added during normalization`);
  lines.push(`✓ Only ${blended.size} countries with non-zero weights normalized`);
  lines.push('');
  lines.push('Legend: ✅ = Evidence  🔒 = Known Zero  ❓ = Unknown  📊 = Fallback');
  
  return lines;
}

/**
 * Get channel statistics summary
 */
export function getChannelStatsSummary(channel: ChannelEvidence): string {
  return `${channel.channelName}: ${channel.evidenceCount} evidence, ${channel.knownZeroCount} known-zero, ${channel.fallbackCount} fallback, ${channel.unknownCount} unknown`;
}
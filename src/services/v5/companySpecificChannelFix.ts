/**
 * V5 Company-Specific Channel Fix (Step 1.1)
 *
 * Replaces the broken single-shared-channelData pattern with four independently
 * computed channel objects per country.
 *
 * BEFORE (broken):
 *   channelBreakdown[country] = {
 *     revenue: channelData,   // same object
 *     financial: channelData, // same object
 *     supply: channelData,    // same object
 *     assets: channelData,    // same object
 *   };
 *
 * AFTER (correct):
 *   channelBreakdown[country] = {
 *     revenue:   buildRevenueChannelData(exposure, companySpecific, allCountries),
 *     financial: buildFinancialChannelData(exposure, companySpecific, allCountries),
 *     supply:    buildSupplyChannelData(exposure, companySpecific, allCountries),
 *     assets:    buildAssetsChannelData(exposure, companySpecific, allCountries),
 *   };
 */

import {
  buildRevenueChannelData,
  buildSupplyChannelData,
  buildAssetsChannelData,
  buildFinancialChannelData,
  type CompanySpecificData,
  type ChannelDataV5,
} from './channelBuilder';
import { calculateAllAlignments } from '../politicalAlignmentService';

export interface ChannelBreakdownEntry {
  revenue: ChannelDataV5;
  financial: ChannelDataV5;
  supply: ChannelDataV5;
  assets: ChannelDataV5;
  blended: number;
  politicalAlignment?: {
    alignmentFactor: number;
    relationship: string;
    source: string;
  };
}

export type ChannelBreakdownV5 = Record<string, ChannelBreakdownEntry>;

/**
 * Build independent channel breakdown for all countries in company-specific data.
 * Each channel uses channel-specific logic — NO shared vectors.
 *
 * @param companySpecific - Company-specific exposure data
 * @param coefficients - Channel blending coefficients {revenue, supply, assets, financial}
 * @returns Independent channel breakdown per country
 */
export function buildIndependentChannelBreakdown(
  companySpecific: CompanySpecificData,
  coefficients: { revenue: number; supply: number; assets: number; financial: number }
): { channelBreakdown: ChannelBreakdownV5; blendedWeights: Record<string, number> } {
  const channelBreakdown: ChannelBreakdownV5 = {};
  const blendedWeights: Record<string, number> = {};

  const allCountries = companySpecific.exposures.map(e => e.country);
  const alignments = calculateAllAlignments(companySpecific.homeCountry, allCountries);

  console.log(`\n[V5 Channel Builder] Building INDEPENDENT channels for ${companySpecific.ticker}`);
  console.log(`[V5 Channel Builder] Countries: ${allCountries.join(', ')}`);
  console.log(`[V5 Channel Builder] Sector: ${companySpecific.sector}`);

  // Normalize supply weights across all countries so they sum to 1.0
  // (supply prior is independently computed per country, needs normalization)
  const supplyRaw: Record<string, number> = {};
  const assetsRaw: Record<string, number> = {};
  const financialRaw: Record<string, number> = {};
  const revenueRaw: Record<string, number> = {};

  for (const exposure of companySpecific.exposures) {
    const revData = buildRevenueChannelData(exposure, companySpecific, allCountries);
    const supData = buildSupplyChannelData(exposure, companySpecific, allCountries);
    const astData = buildAssetsChannelData(exposure, companySpecific, allCountries);
    const finData = buildFinancialChannelData(exposure, companySpecific, allCountries);

    revenueRaw[exposure.country] = revData.weight;
    supplyRaw[exposure.country] = supData.weight;
    assetsRaw[exposure.country] = astData.weight;
    financialRaw[exposure.country] = finData.weight;
  }

  // Normalize each channel independently to sum to 1.0
  const normalize = (raw: Record<string, number>): Record<string, number> => {
    const total = Object.values(raw).reduce((s, w) => s + w, 0);
    if (total <= 0) return raw;
    const out: Record<string, number> = {};
    for (const [c, w] of Object.entries(raw)) out[c] = w / total;
    return out;
  };

  const revenueNorm = normalize(revenueRaw);
  const supplyNorm = normalize(supplyRaw);
  const assetsNorm = normalize(assetsRaw);
  const financialNorm = normalize(financialRaw);

  for (const exposure of companySpecific.exposures) {
    const country = exposure.country;

    // Rebuild channel data with normalized weights
    const revData = buildRevenueChannelData(exposure, companySpecific, allCountries);
    const supData = buildSupplyChannelData(exposure, companySpecific, allCountries);
    const astData = buildAssetsChannelData(exposure, companySpecific, allCountries);
    const finData = buildFinancialChannelData(exposure, companySpecific, allCountries);

    // Override weights with normalized values
    revData.weight = revenueNorm[country] || revData.weight;
    supData.weight = supplyNorm[country] || supData.weight;
    astData.weight = assetsNorm[country] || astData.weight;
    finData.weight = financialNorm[country] || finData.weight;

    // Compute blended weight using channel coefficients
    const revContrib = revData.state === 'known-zero' ? 0 : coefficients.revenue * revData.weight;
    const supContrib = supData.state === 'known-zero' ? 0 : coefficients.supply * supData.weight;
    const astContrib = astData.state === 'known-zero' ? 0 : coefficients.assets * astData.weight;
    const finContrib = finData.state === 'known-zero' ? 0 : coefficients.financial * finData.weight;

    const blended = revContrib + supContrib + astContrib + finContrib;

    console.log(`[V5 Channel Builder] ${country}:`);
    console.log(`  Revenue: ${(revData.weight * 100).toFixed(2)}% [${revData.tier}]`);
    console.log(`  Supply:  ${(supData.weight * 100).toFixed(2)}% [${supData.tier}]`);
    console.log(`  Assets:  ${(astData.weight * 100).toFixed(2)}% [${astData.tier}]`);
    console.log(`  Financial: ${(finData.weight * 100).toFixed(2)}% [${finData.tier}]`);
    console.log(`  Blended: ${(blended * 100).toFixed(4)}%`);

    if (blended < 0.0001) {
      console.log(`  ⚠️ Below micro-exposure threshold, excluding`);
      continue;
    }

    const alignment = alignments[country];
    blendedWeights[country] = blended;

    channelBreakdown[country] = {
      revenue: revData,
      financial: finData,
      supply: supData,
      assets: astData,
      blended,
      politicalAlignment: {
        alignmentFactor: alignment.alignmentFactor,
        relationship: alignment.relationship,
        source: alignment.source,
      },
    };
  }

  // Normalize blended weights
  const totalBlended = Object.values(blendedWeights).reduce((s, w) => s + w, 0);
  if (totalBlended > 0) {
    for (const country of Object.keys(blendedWeights)) {
      blendedWeights[country] /= totalBlended;
      channelBreakdown[country].blended = blendedWeights[country];
    }
  }

  // Fix 4: Channel-distinctness validation.
  // Each of the four channels must have a distinct weight vector — i.e., they must NOT
  // all be identical (which would indicate the old shared-channelData bug has regressed).
  // We check the top country's weight across all four channels; if all four are equal
  // to within floating-point tolerance, emit a console error.
  const countries = Object.keys(channelBreakdown);
  if (countries.length > 0) {
    const sample = channelBreakdown[countries[0]];
    const revW = sample.revenue.weight;
    const supW = sample.supply.weight;
    const astW = sample.assets.weight;
    const finW = sample.financial.weight;
    const allEqual =
      Math.abs(revW - supW) < 1e-9 &&
      Math.abs(revW - astW) < 1e-9 &&
      Math.abs(revW - finW) < 1e-9;

    if (allEqual) {
      console.error(
        `[V5 Fix4] ❌ CHANNEL DISTINCTNESS VIOLATION for ${companySpecific.ticker}: ` +
        `All four channels have identical weight ${revW.toFixed(6)} for country "${countries[0]}". ` +
        `This indicates the shared-channelData regression has occurred. ` +
        `Check buildRevenueChannelData / buildSupplyChannelData / buildAssetsChannelData / buildFinancialChannelData.`
      );
    } else {
      console.log(
        `[V5 Fix4] ✅ Channel distinctness OK for ${companySpecific.ticker}: ` +
        `rev=${revW.toFixed(4)} sup=${supW.toFixed(4)} ast=${astW.toFixed(4)} fin=${finW.toFixed(4)}`
      );
    }
  }

  console.log(`[V5 Channel Builder] ✅ Independent channels built for ${Object.keys(channelBreakdown).length} countries`);

  return { channelBreakdown, blendedWeights };
}
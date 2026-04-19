/**
 * V.4 Services - Main Export
 * 
 * Central export point for all V.4 compliant services.
 */

// Core orchestrator
export { allocateChannel_V4, runStep1_V4 } from './v4Orchestrator';

// Evidence extraction
export { extractEvidenceBundle_V4 } from './evidenceExtractor';

// Label resolution
export {
  canonicalizeLabel,
  classifyEntityKind,
  isLabel,
  isCountry,
  lookupMembership,
  resolveMembershipForLabel,
  KNOWN_LABELS,
  GLOBAL_COUNTRIES
} from './labelResolution';

// RF taxonomy
export {
  decideRFCase_V4,
  mentionsSpecificCountries,
  definesRestrictedSet,
  anyGeographyMembershipEvidenceExists
} from './rfTaxonomy';

// Closed-total validation
export {
  isClosedTotal,
  validateClosedTotal,
  labelHasClosedAllocatableTotal,
  findClosedTotalLabels,
  validateStructuredEvidence,
  calculateStructuredConfidence
} from './closedTotalValidation';

// Restricted set builder
export {
  buildRestrictedSetP,
  exposurePlausiblyWorldwide
} from './restrictedSetBuilder';

// Allocators
export {
  applySSF,
  applyRF,
  applyGF,
  normalizeCountryWeights,
  mergeAdd,
  removeAndRenormalize
} from './allocators';

// Re-export types
export * from '@/types/v4Types';
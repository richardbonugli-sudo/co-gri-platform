/**
 * Refactored CSI Engine - Export Module
 * Part of Phase 1: Core Architecture Redesign
 */

export { RefactoredCSIEngine, refactoredCSIEngine } from './RefactoredCSIEngine';
export { StructuralBaselineEngine, structuralBaselineEngine } from './StructuralBaselineEngine';
export { EscalationDriftEngine, escalationDriftEngine } from './EscalationDriftEngine';
export { EventDeltaEngine, eventDeltaEngine } from './EventDeltaEngine';

// Re-export types for convenience
export type {
  CSIComponents,
  CSIAttribution
} from './types';
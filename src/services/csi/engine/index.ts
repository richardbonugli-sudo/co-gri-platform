/**
 * CSI Engine - Main Export
 * Phase 1 Implementation Complete
 */

// Core orchestrator
export { csiEngineOrchestrator } from './CSIEngineOrchestrator';

// State management
export { escalationSignalLog } from './state/EscalationSignalLog';
export { eventCandidateStore } from './state/EventCandidateStore';
export { eventDeltaLedger } from './state/EventDeltaLedger';

// Sources
export { sourceRegistry } from './sources/SourceRegistry';

// Gating
export { gatingOrchestrator } from './gating/GatingOrchestrator';

// Calculation
export { baselineCalculator } from './calculation/BaselineCalculator';
export { decayEngine } from './calculation/DecayEngine';
export { csiEngine } from './calculation/CSIEngine';

// Types
export * from './types';
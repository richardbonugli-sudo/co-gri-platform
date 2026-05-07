/**
 * CSI Enhancement - Main Entry Point
 * Phase 1 Implementation
 */

export { BaseDataSourceClient } from './data-sources/BaseDataSourceClient';
export { GDELTClient } from './data-sources/GDELTClient';
export { SignalParser } from './ingestion/SignalParser';
export { IngestionOrchestrator } from './ingestion/IngestionOrchestrator';
export { CorroborationFilter } from './corroboration/CorroborationFilter';
export { PersistenceTracker } from './persistence/PersistenceTracker';
export { SignalStorage } from './storage/SignalStorage';
export { MonitoringService } from './monitoring/MonitoringService';

export type {
  RawSignal,
  StructuredSignal,
  CorroborationResult,
  PersistenceResult,
  SignalQualificationResult,
  DataSourceConfig,
  DataSourceHealth
} from '@/types/csi-enhancement/signals';

export type { IngestionMetrics } from './ingestion/IngestionOrchestrator';
export type { SystemMetrics, Alert } from './monitoring/MonitoringService';
/**
 * Ingestion Orchestrator
 * Coordinates the entire signal ingestion pipeline
 */

import type { RawSignal, StructuredSignal, DataSourceConfig } from '@/types/csi-enhancement/signals';
import { BaseDataSourceClient } from '../data-sources/BaseDataSourceClient';
import { GDELTClient } from '../data-sources/GDELTClient';
import { SignalParser } from './SignalParser';
import { CorroborationFilter } from '../corroboration/CorroborationFilter';
import { PersistenceTracker } from '../persistence/PersistenceTracker';
import { SignalStorage } from '../storage/SignalStorage';

export interface IngestionMetrics {
  signalsIngested: number;
  signalsParsed: number;
  signalsQualified: number;
  signalsRejected: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export class IngestionOrchestrator {
  private clients: Map<string, BaseDataSourceClient> = new Map();
  private parser: SignalParser;
  private corroborationFilter: CorroborationFilter;
  private persistenceTracker: PersistenceTracker;
  private storage: SignalStorage;
  private metrics: IngestionMetrics;

  constructor(storage?: SignalStorage) {
    this.parser = new SignalParser();
    this.corroborationFilter = new CorroborationFilter();
    this.persistenceTracker = new PersistenceTracker();
    this.storage = storage || new SignalStorage();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): IngestionMetrics {
    return {
      signalsIngested: 0,
      signalsParsed: 0,
      signalsQualified: 0,
      signalsRejected: 0,
      errors: 0,
      startTime: new Date()
    };
  }

  /**
   * Register a data source client
   */
  registerClient(sourceId: string, client: BaseDataSourceClient): void {
    this.clients.set(sourceId, client);
    console.log(`[Orchestrator] Registered client: ${sourceId}`);
  }

  /**
   * Run ingestion for all sources
   */
  async runIngestion(): Promise<IngestionMetrics> {
    console.log('[Orchestrator] Starting ingestion run...');
    this.metrics = this.initializeMetrics();

    const promises: Promise<void>[] = [];

    for (const [sourceId, client] of this.clients.entries()) {
      promises.push(this.ingestFromSource(sourceId, client));
    }

    await Promise.allSettled(promises);

    this.metrics.endTime = new Date();
    this.metrics.duration = this.metrics.endTime.getTime() - this.metrics.startTime.getTime();

    console.log('[Orchestrator] Ingestion run complete:', this.metrics);
    return this.metrics;
  }

  /**
   * Ingest from a single source
   */
  private async ingestFromSource(sourceId: string, client: BaseDataSourceClient): Promise<void> {
    try {
      console.log(`[Orchestrator] Fetching from ${sourceId}...`);

      // Fetch latest signals
      const rawSignals = await client.fetchLatest({ limit: 100 });
      console.log(`[Orchestrator] Fetched ${rawSignals.length} signals from ${sourceId}`);

      this.metrics.signalsIngested += rawSignals.length;

      // Process each signal
      for (const rawSignal of rawSignals) {
        await this.processSignal(rawSignal);
      }
    } catch (error) {
      console.error(`[Orchestrator] Error ingesting from ${sourceId}:`, error);
      this.metrics.errors++;
    }
  }

  /**
   * Process a single signal through the pipeline
   */
  async processSignal(rawSignal: RawSignal): Promise<void> {
    try {
      // Step 1: Parse raw signal
      const structuredSignal = await this.parser.parse(rawSignal);
      this.metrics.signalsParsed++;

      // Validate minimum requirements
      if (!this.validateSignal(structuredSignal)) {
        console.log(`[Orchestrator] Signal rejected: ${structuredSignal.signalId} - validation failed`);
        this.metrics.signalsRejected++;
        return;
      }

      // Save signal (unqualified)
      await this.storage.saveSignal(structuredSignal);

      // Step 2: Check corroboration
      const recentSignals = await this.storage.findRecentSignals(72);
      const corroborationResult = await this.corroborationFilter.checkCorroboration(
        structuredSignal,
        recentSignals
      );

      // Step 3: Check persistence
      const relatedSignals = this.persistenceTracker.findRelatedSignals(
        structuredSignal,
        recentSignals
      );
      const persistenceResult = await this.persistenceTracker.checkPersistence(
        structuredSignal,
        relatedSignals
      );

      // Step 4: Qualify signal
      const isQualified = corroborationResult.isCorroborated && persistenceResult.isPersistent;

      if (isQualified) {
        // Update signal as qualified
        structuredSignal.isQualified = true;
        structuredSignal.qualificationReason = `Corroborated by ${corroborationResult.sourceCount} sources, persistent for ${persistenceResult.durationHours.toFixed(1)} hours`;
        structuredSignal.qualifiedAt = new Date();
        structuredSignal.corroborationCount = corroborationResult.sourceCount;
        structuredSignal.corroborationScore = corroborationResult.combinedCredibility;

        await this.storage.saveSignal(structuredSignal);

        // Save persistence record
        await this.storage.savePersistence(structuredSignal.signalId, persistenceResult);

        console.log(`[Orchestrator] Signal qualified: ${structuredSignal.signalId}`);
        this.metrics.signalsQualified++;
      } else {
        console.log(`[Orchestrator] Signal not qualified: ${structuredSignal.signalId} - corroborated: ${corroborationResult.isCorroborated}, persistent: ${persistenceResult.isPersistent}`);
        this.metrics.signalsRejected++;
      }
    } catch (error) {
      console.error('[Orchestrator] Error processing signal:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Validate signal has minimum required fields
   */
  private validateSignal(signal: StructuredSignal): boolean {
    // Must have at least one country
    if (!signal.countries || signal.countries.length === 0) {
      return false;
    }

    // Must have primary vector
    if (!signal.primaryVector) {
      return false;
    }

    // Must have headline
    if (!signal.headline || signal.headline.length < 10) {
      return false;
    }

    // Must have valid severity
    if (!['low', 'medium', 'high', 'critical'].includes(signal.severity)) {
      return false;
    }

    // Must have valid signal type
    if (!['threat', 'action', 'policy', 'conflict', 'economic', 'diplomatic'].includes(signal.signalType)) {
      return false;
    }

    return true;
  }

  /**
   * Get current metrics
   */
  getMetrics(): IngestionMetrics {
    return { ...this.metrics };
  }

  /**
   * Initialize default clients
   */
  async initializeDefaultClients(): Promise<void> {
    console.log('[Orchestrator] Initializing default clients...');

    // GDELT Client (free, always available)
    const gdeltConfig: DataSourceConfig = {
      sourceId: 'gdelt',
      sourceName: 'GDELT Project',
      sourceType: 'event_database',
      credibilityWeight: 0.85,
      apiEndpoint: 'https://api.gdeltproject.org/api/v2/doc/doc',
      authMethod: 'api_key',
      updateFrequency: 'realtime',
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 100000
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2
      },
      isActive: true
    };

    const gdeltClient = new GDELTClient(gdeltConfig);
    this.registerClient('gdelt', gdeltClient);

    console.log('[Orchestrator] Default clients initialized');
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.storage.close();
  }
}
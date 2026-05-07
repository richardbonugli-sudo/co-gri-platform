/**
 * Debug Bundle Generator
 * 
 * Core infrastructure for generating comprehensive V.4 debug output
 * Browser-compatible version
 */

import {
  DebugBundle,
  EngineMetadata,
  ConfigSnapshot,
  DebugBundleOptions
} from './types/debugBundle.types';
import { Channel } from '@/types/v4Types';

/**
 * Generate a unique run ID
 */
export function generateRunId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}`;
}

/**
 * Get engine version (date + git SHA)
 */
export function getEngineVersion(): string {
  const date = new Date().toISOString().split('T')[0];
  
  // In production, this would read from git
  // For now, use a placeholder
  const gitSha = 'v4_debug_bundle';
  
  return `${date}_${gitSha}`;
}

/**
 * Generate inputs hash (browser-compatible)
 */
export function generateInputsHash(
  secFilingText: string,
  config: ConfigSnapshot
): string {
  const combined = secFilingText + JSON.stringify(config);
  
  // Simple hash function for browser
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Create engine metadata
 */
export function createEngineMetadata(
  ticker: string,
  channel: Channel,
  runId: string,
  cacheHit: boolean,
  inputsHash: string,
  config: ConfigSnapshot
): EngineMetadata {
  return {
    engine_version: getEngineVersion(),
    run_id: runId,
    cache_hit: cacheHit,
    cache_key: `v4_${ticker}_${channel}_${inputsHash}`,
    inputs_hash: inputsHash,
    config_snapshot: config,
    timestamp: new Date().toISOString(),
    ticker,
    channel: channel.toString()
  };
}

/**
 * Initialize debug bundle
 */
export function initializeDebugBundle(
  ticker: string,
  channel: Channel,
  options: DebugBundleOptions
): {
  bundle: Partial<DebugBundle>;
  runId: string;
  metadata: EngineMetadata;
} {
  const runId = options.run_id || generateRunId();
  
  // Create config snapshot
  const config: ConfigSnapshot = {
    channel: channel.toString(),
    useV4Orchestrator: true,
    channelSpecificRouting: {},
    featureFlags: {}
  };
  
  // Generate inputs hash (simplified - in production would use actual SEC filing)
  const inputsHash = generateInputsHash('', config);
  
  // Create engine metadata
  const metadata = createEngineMetadata(
    ticker,
    channel,
    runId,
    !options.cache_bust,  // cache_hit = !cache_bust
    inputsHash,
    config
  );
  
  const bundle: Partial<DebugBundle> = {
    engineMetadata: metadata
  };
  
  return { bundle, runId, metadata };
}

/**
 * Write debug bundle to console and return as JSON string
 * Browser-compatible version - returns JSON string instead of writing to file
 */
export async function writeDebugBundle(
  bundle: DebugBundle,
  ticker: string,
  channel: Channel,
  runId: string,
  outputDir?: string
): Promise<string> {
  
  // Generate filename
  const channelName = channel.toString().toLowerCase();
  const filename = `step1_v4_debug_bundle_${ticker}_${channelName}_${runId}.json`;
  
  // Convert to JSON
  const jsonContent = JSON.stringify(bundle, null, 2);
  
  console.log(`[Debug Bundle] Generated: ${filename}`);
  console.log(`[Debug Bundle] Size: ${(jsonContent.length / 1024).toFixed(2)} KB`);
  console.log(`[Debug Bundle] Output directory: ${outputDir || 'browser console'}`);
  
  // In browser environment, we can't write to filesystem
  // Instead, we'll store in sessionStorage or trigger download
  if (typeof window !== 'undefined') {
    try {
      // Store in sessionStorage
      const storageKey = `debug_bundle_${ticker}_${channelName}_${runId}`;
      sessionStorage.setItem(storageKey, jsonContent);
      console.log(`[Debug Bundle] Stored in sessionStorage: ${storageKey}`);
      
      // Also trigger download
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      console.log(`[Debug Bundle] Download triggered: ${filename}`);
      
      return storageKey;
    } catch (error) {
      console.warn('[Debug Bundle] Could not store in sessionStorage:', error);
    }
  }
  
  // Return the filename as path
  return filename;
}

/**
 * Validate debug bundle completeness
 */
export function validateDebugBundle(bundle: DebugBundle, channel: Channel): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  
  // Check required sections
  if (!bundle.engineMetadata) missingFields.push('engineMetadata');
  if (!bundle.step0Evidence) missingFields.push('step0Evidence');
  if (!bundle.step1DecisionTrace) missingFields.push('step1DecisionTrace');
  if (!bundle.integrityChecks) missingFields.push('integrityChecks');
  if (!bundle.uiMappingAudit) missingFields.push('uiMappingAudit');
  
  // Revenue channel requires revenueSpecific section
  if (channel === Channel.REVENUE && !bundle.revenueSpecific) {
    missingFields.push('revenueSpecific');
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}
/**
 * Debug logging helper — P3-4 V5 Implementation
 *
 * Gates all COGRI debug console.log calls behind the VITE_DEBUG_COGRI
 * environment variable so production builds stay silent.
 *
 * Usage:
 *   import { debugLog } from '@/utils/debugLog';
 *   debugLog('myModule', 'some message', value);
 *
 * Enable at runtime:
 *   VITE_DEBUG_COGRI=true npm run dev
 */

const isDebugEnabled = (): boolean => {
  try {
    return import.meta.env?.VITE_DEBUG_COGRI === 'true';
  } catch {
    // Node/test environment — check process.env
    return process.env.VITE_DEBUG_COGRI === 'true';
  }
};

/**
 * Gated debug logger. Only emits when VITE_DEBUG_COGRI=true.
 */
export function debugLog(module: string, message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.log(`🔍 [${module}] ${message}`, ...args);
  }
}

/**
 * Gated debug warn. Only emits when VITE_DEBUG_COGRI=true.
 */
export function debugWarn(module: string, message: string, ...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.warn(`⚠️  [${module}] ${message}`, ...args);
  }
}

export default debugLog;

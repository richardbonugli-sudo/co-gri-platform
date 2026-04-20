/**
 * Detection Monitor
 * 
 * Logs and tracks detection pipeline performance:
 * - Feeds fetched
 * - Articles processed
 * - Candidates detected
 * - Events created
 * - Errors
 */

export interface DetectionRunLog {
  run_id: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  sources_fetched: number;
  articles_processed: number;
  candidates_detected: number;
  events_created: number;
  auto_confirmed: number;
  manual_review: number;
  errors: string[];
}

export interface DetectionMetrics {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_articles_processed: number;
  total_candidates_detected: number;
  total_events_created: number;
  detection_rate: number; // candidates per article
  confirmation_rate: number; // events per candidate
  avg_duration_ms: number;
  last_run: DetectionRunLog | null;
}

// In-memory storage for logs (in production, use database)
const detectionLogs: DetectionRunLog[] = [];
const MAX_LOGS = 100; // Keep last 100 runs

/**
 * Log a detection run
 */
export function logDetectionRun(log: DetectionRunLog): void {
  detectionLogs.unshift(log);
  
  // Keep only last MAX_LOGS
  if (detectionLogs.length > MAX_LOGS) {
    detectionLogs.pop();
  }
  
  console.log(`[Detection Monitor] 📝 Logged detection run ${log.run_id}`);
}

/**
 * Get all detection logs
 */
export function getDetectionLogs(limit: number = 20): DetectionRunLog[] {
  return detectionLogs.slice(0, limit);
}

/**
 * Get detection metrics
 */
export function getDetectionMetrics(): DetectionMetrics {
  const totalRuns = detectionLogs.length;
  const successfulRuns = detectionLogs.filter(log => log.errors.length === 0).length;
  const failedRuns = totalRuns - successfulRuns;
  
  const totalArticlesProcessed = detectionLogs.reduce((sum, log) => sum + log.articles_processed, 0);
  const totalCandidatesDetected = detectionLogs.reduce((sum, log) => sum + log.candidates_detected, 0);
  const totalEventsCreated = detectionLogs.reduce((sum, log) => sum + log.events_created, 0);
  
  const detectionRate = totalArticlesProcessed > 0 
    ? totalCandidatesDetected / totalArticlesProcessed 
    : 0;
  
  const confirmationRate = totalCandidatesDetected > 0 
    ? totalEventsCreated / totalCandidatesDetected 
    : 0;
  
  const avgDurationMs = totalRuns > 0 
    ? detectionLogs.reduce((sum, log) => sum + log.duration_ms, 0) / totalRuns 
    : 0;
  
  return {
    total_runs: totalRuns,
    successful_runs: successfulRuns,
    failed_runs: failedRuns,
    total_articles_processed: totalArticlesProcessed,
    total_candidates_detected: totalCandidatesDetected,
    total_events_created: totalEventsCreated,
    detection_rate: Math.round(detectionRate * 1000) / 1000,
    confirmation_rate: Math.round(confirmationRate * 1000) / 1000,
    avg_duration_ms: Math.round(avgDurationMs),
    last_run: detectionLogs.length > 0 ? detectionLogs[0] : null
  };
}

/**
 * Get recent errors
 */
export function getRecentErrors(limit: number = 10): Array<{
  run_id: string;
  timestamp: string;
  errors: string[];
}> {
  return detectionLogs
    .filter(log => log.errors.length > 0)
    .slice(0, limit)
    .map(log => ({
      run_id: log.run_id,
      timestamp: log.start_time,
      errors: log.errors
    }));
}

/**
 * Get source reliability metrics
 */
export function getSourceReliability(): Record<string, {
  fetches: number;
  successes: number;
  failures: number;
  reliability: number;
}> {
  // This would track per-source metrics in production
  // For now, return empty object
  return {};
}

/**
 * Clear old logs
 */
export function clearOldLogs(daysToKeep: number = 30): number {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  const initialLength = detectionLogs.length;
  
  // Remove logs older than cutoff
  const filtered = detectionLogs.filter(log => {
    const logDate = new Date(log.start_time);
    return logDate >= cutoffDate;
  });
  
  detectionLogs.length = 0;
  detectionLogs.push(...filtered);
  
  const removed = initialLength - detectionLogs.length;
  console.log(`[Detection Monitor] 🗑️ Cleared ${removed} old logs`);
  
  return removed;
}

/**
 * Export logs for analysis
 */
export function exportLogs(): string {
  return JSON.stringify(detectionLogs, null, 2);
}
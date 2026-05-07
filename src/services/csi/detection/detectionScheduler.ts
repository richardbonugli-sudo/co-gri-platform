/**
 * Detection Scheduler
 * 
 * Schedules automated event detection pipeline.
 * Browser-compatible version using setInterval for scheduling.
 */

import { getSourcesByTier, getSourcesDueForUpdate, type DataSource } from '../dataSources/config';
import { fetchMultipleFeeds, filterNewArticles, deduplicateArticles } from '../dataSources/rssFeedIngestion';
import { extractEntities, type ExtractedEntities } from './nerEngine';
import { classifyArticle, type Classification } from './policyClassifier';
import { detectCandidates, type EventCandidate } from './candidateDetector';
import { triageCandidates, getAutoConfirmCandidates, getManualReviewCandidates } from './triageEngine';
import { createEventsFromCandidates } from './autoEventCreator';
import { logDetectionRun, type DetectionRunLog } from './detectionMonitor';

// In-memory storage for last update times and manual review queue
const lastUpdateMap = new Map<string, Date>();
const manualReviewQueue: EventCandidate[] = [];
let isRunning = false;
let schedulerIntervals: NodeJS.Timeout[] = [];

/**
 * Run the complete detection pipeline
 */
export async function runDetectionPipeline(sources: DataSource[]): Promise<DetectionRunLog> {
  const startTime = Date.now();
  const log: DetectionRunLog = {
    run_id: `RUN-${Date.now()}`,
    start_time: new Date().toISOString(),
    end_time: '',
    duration_ms: 0,
    sources_fetched: 0,
    articles_processed: 0,
    candidates_detected: 0,
    events_created: 0,
    auto_confirmed: 0,
    manual_review: 0,
    errors: []
  };
  
  try {
    console.log(`[Detection Pipeline] 🚀 Starting detection run ${log.run_id}...`);
    
    // Step 1: Fetch RSS feeds
    console.log(`[Detection Pipeline] 📡 Step 1: Fetching ${sources.length} RSS feeds...`);
    const allArticles = await fetchMultipleFeeds(sources);
    log.sources_fetched = sources.length;
    
    // Filter new articles (published in last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newArticles = filterNewArticles(allArticles, yesterday);
    const uniqueArticles = deduplicateArticles(newArticles);
    log.articles_processed = uniqueArticles.length;
    
    console.log(`[Detection Pipeline] 📰 Processing ${uniqueArticles.length} new articles...`);
    
    if (uniqueArticles.length === 0) {
      console.log(`[Detection Pipeline] ℹ️ No new articles to process`);
      log.end_time = new Date().toISOString();
      log.duration_ms = Date.now() - startTime;
      return log;
    }
    
    // Step 2: Extract entities (NER)
    console.log(`[Detection Pipeline] 🔍 Step 2: Extracting entities...`);
    const entitiesMap = new Map<string, ExtractedEntities>();
    uniqueArticles.forEach(article => {
      const fullText = `${article.title} ${article.description} ${article.content || ''}`;
      const entities = extractEntities(fullText);
      entitiesMap.set(article.article_id, entities);
    });
    
    // Step 3: Classify articles
    console.log(`[Detection Pipeline] 🏷️ Step 3: Classifying articles...`);
    const classificationsMap = new Map<string, Classification>();
    uniqueArticles.forEach(article => {
      const entities = entitiesMap.get(article.article_id);
      if (!entities) return;
      
      const classification = classifyArticle(article, entities);
      if (classification) {
        classificationsMap.set(article.article_id, classification);
      }
    });
    
    // Step 4: Detect candidates
    console.log(`[Detection Pipeline] 🎯 Step 4: Detecting event candidates...`);
    const candidates = detectCandidates(uniqueArticles, entitiesMap, classificationsMap, 60);
    log.candidates_detected = candidates.length;
    
    if (candidates.length === 0) {
      console.log(`[Detection Pipeline] ℹ️ No candidates detected`);
      log.end_time = new Date().toISOString();
      log.duration_ms = Date.now() - startTime;
      return log;
    }
    
    // Step 5: Triage candidates
    console.log(`[Detection Pipeline] 📋 Step 5: Triaging candidates...`);
    const triageResults = triageCandidates(candidates);
    
    const autoConfirmCandidates = getAutoConfirmCandidates(candidates, triageResults);
    const manualReviewCandidates = getManualReviewCandidates(candidates, triageResults);
    
    log.auto_confirmed = autoConfirmCandidates.length;
    log.manual_review = manualReviewCandidates.length;
    
    // Step 6: Auto-create events
    console.log(`[Detection Pipeline] ⚡ Step 6: Creating events...`);
    const autoConfirmMap = new Map<string, boolean>();
    autoConfirmCandidates.forEach(c => autoConfirmMap.set(c.candidate_id, true));
    
    const events = await createEventsFromCandidates(
      [...autoConfirmCandidates, ...manualReviewCandidates],
      autoConfirmMap
    );
    
    log.events_created = events.length;
    
    // Add manual review candidates to queue
    manualReviewCandidates.forEach(candidate => {
      if (!manualReviewQueue.find(c => c.candidate_id === candidate.candidate_id)) {
        manualReviewQueue.push(candidate);
      }
    });
    
    // Update last update times
    sources.forEach(source => {
      lastUpdateMap.set(source.id, new Date());
    });
    
    console.log(`[Detection Pipeline] ✅ Detection run complete: ${log.events_created} events created (${log.auto_confirmed} auto-confirmed, ${log.manual_review} manual review)`);
    
  } catch (error) {
    console.error(`[Detection Pipeline] ❌ Error during detection run:`, error);
    log.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }
  
  log.end_time = new Date().toISOString();
  log.duration_ms = Date.now() - startTime;
  
  // Log the run
  logDetectionRun(log);
  
  return log;
}

/**
 * Schedule detection runs by tier using setInterval
 */
export async function startScheduler(): Promise<void> {
  if (isRunning) {
    console.log(`[Detection Scheduler] ⚠️ Scheduler already running`);
    return;
  }
  
  isRunning = true;
  console.log(`[Detection Scheduler] 🚀 Starting detection scheduler...`);
  
  // Tier 1: Every hour (3600000 ms)
  const tier1Interval = setInterval(async () => {
    console.log(`[Detection Scheduler] ⏰ Tier 1 hourly check triggered`);
    const sources = getSourcesDueForUpdate(lastUpdateMap).filter(s => s.tier === 1);
    if (sources.length > 0) {
      await runDetectionPipeline(sources);
    }
  }, 3600000);
  schedulerIntervals.push(tier1Interval);
  
  // Tier 2: Every 6 hours (21600000 ms)
  const tier2Interval = setInterval(async () => {
    console.log(`[Detection Scheduler] ⏰ Tier 2 6-hour check triggered`);
    const sources = getSourcesDueForUpdate(lastUpdateMap).filter(s => s.tier === 2);
    if (sources.length > 0) {
      await runDetectionPipeline(sources);
    }
  }, 21600000);
  schedulerIntervals.push(tier2Interval);
  
  // Tier 3: Daily (86400000 ms)
  const tier3Interval = setInterval(async () => {
    console.log(`[Detection Scheduler] ⏰ Tier 3 daily check triggered`);
    const sources = getSourcesDueForUpdate(lastUpdateMap).filter(s => s.tier === 3);
    if (sources.length > 0) {
      await runDetectionPipeline(sources);
    }
  }, 86400000);
  schedulerIntervals.push(tier3Interval);
  
  console.log(`[Detection Scheduler] ✅ Scheduler started successfully`);
  console.log(`[Detection Scheduler] 📅 Tier 1: Hourly, Tier 2: Every 6 hours, Tier 3: Daily`);
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  schedulerIntervals.forEach(interval => clearInterval(interval));
  schedulerIntervals = [];
  isRunning = false;
  console.log(`[Detection Scheduler] 🛑 Scheduler stopped`);
}

/**
 * Run detection immediately (manual trigger)
 */
export async function runDetectionNow(tier?: 1 | 2 | 3): Promise<DetectionRunLog> {
  console.log(`[Detection Scheduler] 🔥 Manual detection run triggered${tier ? ` for Tier ${tier}` : ''}`);
  
  const sources = tier 
    ? getSourcesByTier(tier)
    : getSourcesDueForUpdate(lastUpdateMap);
  
  return await runDetectionPipeline(sources);
}

/**
 * Get manual review queue
 */
export function getManualReviewQueue(): EventCandidate[] {
  return [...manualReviewQueue];
}

/**
 * Remove candidate from manual review queue
 */
export function removeFromReviewQueue(candidateId: string): void {
  const index = manualReviewQueue.findIndex(c => c.candidate_id === candidateId);
  if (index !== -1) {
    manualReviewQueue.splice(index, 1);
    console.log(`[Detection Scheduler] ✅ Removed candidate ${candidateId} from review queue`);
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  isRunning: boolean;
  lastUpdateTimes: Record<string, string>;
  queueSize: number;
} {
  const lastUpdateTimes: Record<string, string> = {};
  lastUpdateMap.forEach((date, sourceId) => {
    lastUpdateTimes[sourceId] = date.toISOString();
  });
  
  return {
    isRunning,
    lastUpdateTimes,
    queueSize: manualReviewQueue.length
  };
}
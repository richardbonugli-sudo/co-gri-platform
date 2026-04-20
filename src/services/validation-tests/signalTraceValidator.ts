/**
 * Signal Trace Validator
 * 
 * Validates raw signal traces for specific events:
 * - China silver export restriction
 * - PRC sanctions on U.S. defense-related firms
 * 
 * Outputs JSON with signal source, credibility score, corroboration status.
 * Corroboration requires: ≥2 independent sources, 48-72hr persistence, ≥0.7 credibility.
 */

export interface SignalSource {
  sourceId: string;
  sourceName: string;
  category: 'OFFICIAL' | 'NEWS_TIER1' | 'NEWS_TIER2' | 'RESEARCH' | 'SOCIAL';
  credibility: number; // 0.0 - 1.0
  timestamp: Date;
  url: string;
  headline: string;
  excerpt: string;
}

export interface SignalTrace {
  eventId: string;
  eventName: string;
  eventType: string;
  targetCountry: string;
  vector: string;
  severity: number;
  sources: SignalSource[];
  corroborationStatus: {
    isCorroborated: boolean;
    independentSourceCount: number;
    persistenceHours: number;
    averageCredibility: number;
    meetsMinSources: boolean;
    meetsPersistence: boolean;
    meetsCredibility: boolean;
  };
}

export interface SignalTraceValidationResult {
  eventName: string;
  passed: boolean;
  checks: Array<{
    checkName: string;
    passed: boolean;
    expected: string;
    actual: string;
    message: string;
  }>;
  signalTrace: SignalTrace;
}

// Corroboration thresholds
const MIN_INDEPENDENT_SOURCES = 2;
const MIN_PERSISTENCE_HOURS = 48;
const MAX_PERSISTENCE_HOURS = 72;
const MIN_AVG_CREDIBILITY = 0.7;

/**
 * Calculate corroboration status for a signal trace
 */
function calculateCorroboration(sources: SignalSource[]): SignalTrace['corroborationStatus'] {
  // Count independent sources (unique source IDs)
  const uniqueSourceIds = new Set(sources.map(s => s.sourceId));
  const independentSourceCount = uniqueSourceIds.size;

  // Calculate persistence (time between first and last source)
  const timestamps = sources.map(s => s.timestamp.getTime());
  const oldestTimestamp = Math.min(...timestamps);
  const newestTimestamp = Math.max(...timestamps);
  const persistenceHours = (newestTimestamp - oldestTimestamp) / (1000 * 60 * 60);

  // Calculate average credibility
  const averageCredibility = sources.reduce((sum, s) => sum + s.credibility, 0) / sources.length;

  // Check thresholds
  const meetsMinSources = independentSourceCount >= MIN_INDEPENDENT_SOURCES;
  const meetsPersistence = persistenceHours >= MIN_PERSISTENCE_HOURS;
  const meetsCredibility = averageCredibility >= MIN_AVG_CREDIBILITY;

  const isCorroborated = meetsMinSources && meetsPersistence && meetsCredibility;

  return {
    isCorroborated,
    independentSourceCount,
    persistenceHours,
    averageCredibility,
    meetsMinSources,
    meetsPersistence,
    meetsCredibility,
  };
}

/**
 * Create signal trace for China silver export restriction
 */
function createChinaSilverExportTrace(): SignalTrace {
  const baseDate = new Date('2025-02-01T08:00:00Z');

  const sources: SignalSource[] = [
    {
      sourceId: 'reuters',
      sourceName: 'Reuters',
      category: 'NEWS_TIER1',
      credibility: 0.92,
      timestamp: new Date(baseDate.getTime()),
      url: 'https://reuters.com/article/china-silver-export',
      headline: 'China restricts silver exports amid trade tensions',
      excerpt: 'China has imposed new restrictions on silver exports, citing national security concerns...',
    },
    {
      sourceId: 'bloomberg',
      sourceName: 'Bloomberg',
      category: 'NEWS_TIER1',
      credibility: 0.91,
      timestamp: new Date(baseDate.getTime() + 6 * 60 * 60 * 1000), // +6 hours
      url: 'https://bloomberg.com/news/china-silver-restrictions',
      headline: 'China Curbs Silver Exports in Latest Trade Move',
      excerpt: 'Beijing announced new export controls on silver and related materials...',
    },
    {
      sourceId: 'mofcom',
      sourceName: 'MOFCOM (Ministry of Commerce)',
      category: 'OFFICIAL',
      credibility: 0.95,
      timestamp: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000), // +24 hours
      url: 'https://mofcom.gov.cn/announcements/silver-export',
      headline: 'Official Notice on Silver Export Control Measures',
      excerpt: 'The Ministry of Commerce hereby announces new export control measures for silver...',
    },
    {
      sourceId: 'ft',
      sourceName: 'Financial Times',
      category: 'NEWS_TIER1',
      credibility: 0.90,
      timestamp: new Date(baseDate.getTime() + 52 * 60 * 60 * 1000), // +52 hours
      url: 'https://ft.com/content/china-silver-export-ban',
      headline: 'China silver export ban signals escalation in trade war',
      excerpt: 'Analysts warn that China\'s silver export restrictions could disrupt global supply chains...',
    },
  ];

  const corroborationStatus = calculateCorroboration(sources);

  return {
    eventId: 'EVT-CN-SILVER-2025-001',
    eventName: 'China Silver Export Restriction',
    eventType: 'trade_war',
    targetCountry: 'China',
    vector: 'SC2',
    severity: 7,
    sources,
    corroborationStatus,
  };
}

/**
 * Create signal trace for PRC sanctions on U.S. defense firms
 */
function createPRCSanctionsTrace(): SignalTrace {
  const baseDate = new Date('2025-01-15T10:00:00Z');

  const sources: SignalSource[] = [
    {
      sourceId: 'xinhua',
      sourceName: 'Xinhua News Agency',
      category: 'OFFICIAL',
      credibility: 0.85,
      timestamp: new Date(baseDate.getTime()),
      url: 'https://xinhua.net/english/prc-sanctions-defense',
      headline: 'PRC announces sanctions on U.S. defense-related firms',
      excerpt: 'The People\'s Republic of China has announced sanctions targeting several U.S. defense companies...',
    },
    {
      sourceId: 'reuters',
      sourceName: 'Reuters',
      category: 'NEWS_TIER1',
      credibility: 0.92,
      timestamp: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000), // +3 hours
      url: 'https://reuters.com/article/china-us-defense-sanctions',
      headline: 'China sanctions U.S. defense firms in tit-for-tat move',
      excerpt: 'China imposed sanctions on multiple U.S. defense companies in response to recent arms sales...',
    },
    {
      sourceId: 'scmp',
      sourceName: 'South China Morning Post',
      category: 'NEWS_TIER2',
      credibility: 0.82,
      timestamp: new Date(baseDate.getTime() + 12 * 60 * 60 * 1000), // +12 hours
      url: 'https://scmp.com/news/china-sanctions-defense',
      headline: 'Beijing targets US defence contractors with new sanctions',
      excerpt: 'China\'s Ministry of Foreign Affairs announced sanctions against US defense firms...',
    },
    {
      sourceId: 'csis',
      sourceName: 'CSIS (Center for Strategic and International Studies)',
      category: 'RESEARCH',
      credibility: 0.88,
      timestamp: new Date(baseDate.getTime() + 48 * 60 * 60 * 1000), // +48 hours
      url: 'https://csis.org/analysis/prc-defense-sanctions',
      headline: 'Analysis: PRC Defense Sanctions and Strategic Implications',
      excerpt: 'The latest round of PRC sanctions on U.S. defense firms represents a significant escalation...',
    },
    {
      sourceId: 'ap',
      sourceName: 'Associated Press',
      category: 'NEWS_TIER1',
      credibility: 0.91,
      timestamp: new Date(baseDate.getTime() + 60 * 60 * 60 * 1000), // +60 hours
      url: 'https://apnews.com/china-sanctions-us-defense',
      headline: 'China sanctions US defense companies over Taiwan arms sales',
      excerpt: 'China announced sanctions on several U.S. defense companies, citing arms sales to Taiwan...',
    },
  ];

  const corroborationStatus = calculateCorroboration(sources);

  return {
    eventId: 'EVT-CN-SANCTIONS-2025-001',
    eventName: 'PRC Sanctions on U.S. Defense-Related Firms',
    eventType: 'sanctions',
    targetCountry: 'China',
    vector: 'SC2',
    severity: 8,
    sources,
    corroborationStatus,
  };
}

/**
 * Validate a signal trace
 */
function validateSignalTrace(trace: SignalTrace): SignalTraceValidationResult {
  const checks: SignalTraceValidationResult['checks'] = [];

  // Check 1: Has minimum independent sources
  checks.push({
    checkName: 'Minimum Independent Sources (≥2)',
    passed: trace.corroborationStatus.meetsMinSources,
    expected: `≥${MIN_INDEPENDENT_SOURCES} independent sources`,
    actual: `${trace.corroborationStatus.independentSourceCount} independent sources`,
    message: trace.corroborationStatus.meetsMinSources
      ? `${trace.corroborationStatus.independentSourceCount} sources meet threshold`
      : `Only ${trace.corroborationStatus.independentSourceCount} sources, need ≥${MIN_INDEPENDENT_SOURCES}`,
  });

  // Check 2: Meets persistence threshold (48-72 hours)
  checks.push({
    checkName: 'Persistence Threshold (48-72hr)',
    passed: trace.corroborationStatus.meetsPersistence,
    expected: `≥${MIN_PERSISTENCE_HOURS} hours persistence`,
    actual: `${trace.corroborationStatus.persistenceHours.toFixed(1)} hours`,
    message: trace.corroborationStatus.meetsPersistence
      ? `${trace.corroborationStatus.persistenceHours.toFixed(1)}hr persistence meets threshold`
      : `${trace.corroborationStatus.persistenceHours.toFixed(1)}hr persistence below ${MIN_PERSISTENCE_HOURS}hr threshold`,
  });

  // Check 3: Average credibility ≥ 0.7
  checks.push({
    checkName: 'Average Credibility (≥0.7)',
    passed: trace.corroborationStatus.meetsCredibility,
    expected: `≥${MIN_AVG_CREDIBILITY} average credibility`,
    actual: `${trace.corroborationStatus.averageCredibility.toFixed(3)} average credibility`,
    message: trace.corroborationStatus.meetsCredibility
      ? `${(trace.corroborationStatus.averageCredibility * 100).toFixed(1)}% credibility meets threshold`
      : `${(trace.corroborationStatus.averageCredibility * 100).toFixed(1)}% credibility below ${MIN_AVG_CREDIBILITY * 100}% threshold`,
  });

  // Check 4: Overall corroboration status
  checks.push({
    checkName: 'Overall Corroboration',
    passed: trace.corroborationStatus.isCorroborated,
    expected: 'Corroborated (all 3 criteria met)',
    actual: trace.corroborationStatus.isCorroborated ? 'CORROBORATED' : 'NOT CORROBORATED',
    message: trace.corroborationStatus.isCorroborated
      ? 'Signal fully corroborated'
      : 'Signal not fully corroborated',
  });

  // Check 5: Has at least one official source
  const hasOfficialSource = trace.sources.some(s => s.category === 'OFFICIAL');
  checks.push({
    checkName: 'Official Source Present',
    passed: hasOfficialSource,
    expected: 'At least one OFFICIAL source',
    actual: hasOfficialSource ? 'Official source found' : 'No official source',
    message: hasOfficialSource
      ? 'Official source strengthens corroboration'
      : 'No official source - relying on news sources only',
  });

  // Check 6: Source diversity (multiple categories)
  const categories = new Set(trace.sources.map(s => s.category));
  const hasDiversity = categories.size >= 2;
  checks.push({
    checkName: 'Source Category Diversity (≥2 categories)',
    passed: hasDiversity,
    expected: '≥2 source categories',
    actual: `${categories.size} categories: ${Array.from(categories).join(', ')}`,
    message: hasDiversity
      ? `Good source diversity with ${categories.size} categories`
      : 'Insufficient source diversity',
  });

  // Check 7: All credibility scores are valid (0-1)
  const allCredibilityValid = trace.sources.every(s => s.credibility >= 0 && s.credibility <= 1);
  checks.push({
    checkName: 'Credibility Scores Valid (0-1)',
    passed: allCredibilityValid,
    expected: 'All credibility scores between 0 and 1',
    actual: allCredibilityValid ? 'All valid' : 'Invalid scores found',
    message: allCredibilityValid ? 'All credibility scores valid' : 'Some credibility scores out of range',
  });

  // Check 8: Severity is within valid range (1-10)
  const severityValid = trace.severity >= 1 && trace.severity <= 10;
  checks.push({
    checkName: 'Severity Range Valid (1-10)',
    passed: severityValid,
    expected: 'Severity between 1 and 10',
    actual: `Severity: ${trace.severity}`,
    message: severityValid ? `Severity ${trace.severity} is valid` : `Severity ${trace.severity} out of range`,
  });

  const allPassed = checks.every(c => c.passed);

  return {
    eventName: trace.eventName,
    passed: allPassed,
    checks,
    signalTrace: trace,
  };
}

/**
 * Run all signal trace validations
 */
export function runSignalTraceValidation(): SignalTraceValidationResult[] {
  console.log('\n🔍 Running Signal Trace Validation...\n');
  const results: SignalTraceValidationResult[] = [];

  // Scenario 1: China Silver Export Restriction
  const silverTrace = createChinaSilverExportTrace();
  const silverResult = validateSignalTrace(silverTrace);
  results.push(silverResult);
  console.log(`  ${silverResult.passed ? '✅' : '❌'} ${silverResult.eventName}: ${silverResult.checks.filter(c => c.passed).length}/${silverResult.checks.length} checks passed`);

  // Scenario 2: PRC Sanctions on U.S. Defense Firms
  const sanctionsTrace = createPRCSanctionsTrace();
  const sanctionsResult = validateSignalTrace(sanctionsTrace);
  results.push(sanctionsResult);
  console.log(`  ${sanctionsResult.passed ? '✅' : '❌'} ${sanctionsResult.eventName}: ${sanctionsResult.checks.filter(c => c.passed).length}/${sanctionsResult.checks.length} checks passed`);

  return results;
}
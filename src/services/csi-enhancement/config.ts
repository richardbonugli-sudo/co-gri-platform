/**
 * CSI Enhancement Configuration
 * Production configuration settings
 */

export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/csi_enhancement',
    maxConnections: 20,
    idleTimeout: 30000,
    connectionTimeout: 2000
  },

  // Ingestion
  ingestion: {
    intervalMinutes: parseInt(process.env.INGESTION_INTERVAL_MINUTES || '15'),
    maxSignalsPerRun: parseInt(process.env.MAX_SIGNALS_PER_RUN || '1000'),
    batchSize: 100
  },

  // Corroboration
  corroboration: {
    minSources: parseInt(process.env.CORROBORATION_MIN_SOURCES || '2'),
    timeWindowHours: 72,
    minCombinedCredibility: 1.5,
    requireGeographicMatch: true,
    requireVectorMatch: true
  },

  // Persistence
  persistence: {
    minPersistenceHours: parseInt(process.env.PERSISTENCE_MIN_HOURS || '48'),
    maxGapHours: 24,
    minMentionsPerDay: 2,
    decayRatePerDay: 0.1
  },

  // Qualification
  qualification: {
    threshold: parseFloat(process.env.QUALIFICATION_THRESHOLD || '0.6')
  },

  // Monitoring
  monitoring: {
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    pagerdutyApiKey: process.env.PAGERDUTY_API_KEY,
    metricsRetentionDays: 30
  },

  // System
  system: {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};
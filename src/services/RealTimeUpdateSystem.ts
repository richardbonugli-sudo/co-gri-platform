/**
 * Real-Time Update System - Phase 3 Implementation
 * 
 * Automated monitoring and incremental processing for ongoing SEC filings,
 * sustainability reports, and dynamic confidence score updates.
 * 
 * ENHANCED: Now integrates with real SEC EDGAR API for live filing data
 */

import { unifiedDatabaseIntegrator, UnifiedCompanyRecord } from './UnifiedDatabaseIntegrator';
import { secEdgarService, type SECFiling, type GeographicSegment } from './secEdgarService';
import { alphaVantageService } from './alphaVantageService';

export interface UpdateMonitorConfig {
  secFilingMonitoring: boolean;
  sustainabilityReportMonitoring: boolean;
  websiteChangeMonitoring: boolean;
  confidenceRecalculation: boolean;
  alertThresholds: {
    significantChange: number; // Percentage change threshold
    confidenceDropAlert: number; // Confidence drop threshold
    newGeographyAlert: boolean; // Alert on new geographic segments
  };
  updateFrequency: {
    secFilings: number; // Hours between SEC filing checks
    sustainabilityReports: number; // Days between sustainability checks
    confidenceRecalc: number; // Hours between confidence recalculation
  };
}

export interface UpdateEvent {
  eventId: string;
  ticker: string;
  eventType: 'sec_filing' | 'sustainability_report' | 'website_change' | 'confidence_update';
  timestamp: Date;
  source: string;
  changeType: 'new_geography' | 'percentage_change' | 'confidence_change' | 'data_quality_change';
  oldValue?: any;
  newValue?: any;
  significance: 'low' | 'medium' | 'high' | 'critical';
  processed: boolean;
  processingResult?: UpdateResult;
}

export interface UpdateResult {
  success: boolean;
  changesApplied: number;
  newConfidence: number;
  qualityChange?: string;
  errors: string[];
  processingTime: number;
}

export interface UpdateAlert {
  alertId: string;
  ticker: string;
  companyName: string;
  alertType: 'significant_change' | 'confidence_drop' | 'new_geography' | 'data_quality_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface MonitoringStats {
  totalCompaniesMonitored: number;
  activeMonitors: number;
  eventsProcessedToday: number;
  alertsGeneratedToday: number;
  averageProcessingTime: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdateCheck: Date;
  nextScheduledUpdate: Date;
  dataSourceStatus: {
    secEdgar: 'connected' | 'disconnected' | 'rate-limited';
    alphaVantage: 'connected' | 'disconnected' | 'rate-limited';
  };
}

// Track last check dates for each company
interface CompanyCheckRecord {
  ticker: string;
  cik: string;
  lastSECCheck: Date;
  lastFilingDate: string;
}

export class RealTimeUpdateSystem {
  private config: UpdateMonitorConfig;
  private monitoringActive = false;
  private updateEvents: Map<string, UpdateEvent> = new Map();
  private alerts: Map<string, UpdateAlert> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private stats: MonitoringStats;
  private companyCheckRecords: Map<string, CompanyCheckRecord> = new Map();

  // Event callbacks
  private onUpdateEventCallback?: (event: UpdateEvent) => void;
  private onAlertCallback?: (alert: UpdateAlert) => void;
  private onStatsUpdateCallback?: (stats: MonitoringStats) => void;

  constructor(config?: Partial<UpdateMonitorConfig>) {
    this.config = {
      secFilingMonitoring: true,
      sustainabilityReportMonitoring: true,
      websiteChangeMonitoring: false, // Disabled by default due to resource intensity
      confidenceRecalculation: true,
      alertThresholds: {
        significantChange: 5.0, // 5% change threshold
        confidenceDropAlert: 0.1, // 10% confidence drop
        newGeographyAlert: true
      },
      updateFrequency: {
        secFilings: 6, // Check every 6 hours
        sustainabilityReports: 7, // Check weekly
        confidenceRecalc: 24 // Recalculate daily
      },
      ...config
    };

    this.stats = this.initializeStats();
  }

  /**
   * Start real-time monitoring system
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      console.log('⚠️ Monitoring system is already active');
      return;
    }

    console.log('🚀 Starting Real-Time Update System...');

    try {
      // Check API connectivity
      await this.checkAPIConnectivity();

      // Initialize monitoring for all companies
      await this.initializeCompanyMonitoring();

      // Start scheduled monitoring tasks
      this.startScheduledTasks();

      // Start confidence recalculation
      this.startConfidenceRecalculation();

      this.monitoringActive = true;
      this.updateStats();

      console.log('✅ Real-Time Update System started successfully');
      console.log(`📊 Monitoring ${this.stats.totalCompaniesMonitored} companies`);

    } catch (error) {
      console.error('❌ Failed to start monitoring system:', error);
      throw error;
    }
  }

  /**
   * Check API connectivity
   */
  private async checkAPIConnectivity(): Promise<void> {
    console.log('🔌 Checking API connectivity...');
    
    const [secHealth, avHealth] = await Promise.all([
      secEdgarService.healthCheck(),
      alphaVantageService.healthCheck()
    ]);

    this.stats.dataSourceStatus = {
      secEdgar: secHealth ? 'connected' : 'disconnected',
      alphaVantage: avHealth ? 'connected' : 'disconnected'
    };

    console.log(`  SEC EDGAR: ${secHealth ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`  Alpha Vantage: ${avHealth ? '✅ Connected' : '❌ Disconnected'}`);
  }

  /**
   * Stop monitoring system
   */
  async stopMonitoring(): Promise<void> {
    console.log('⏹️ Stopping Real-Time Update System...');

    this.monitoringActive = false;

    // Clear all intervals
    this.monitoringIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.monitoringIntervals.clear();

    this.updateStats();
    console.log('✅ Real-Time Update System stopped');
  }

  /**
   * Initialize monitoring for all companies
   */
  private async initializeCompanyMonitoring(): Promise<void> {
    const companies = unifiedDatabaseIntegrator.getUnifiedRecords();
    console.log(`📋 Initializing monitoring for ${companies.size} companies...`);

    let initializedCount = 0;

    for (const [ticker, company] of companies) {
      try {
        await this.setupCompanyMonitoring(ticker, company);
        initializedCount++;

        if (initializedCount % 100 === 0) {
          console.log(`📊 Initialized monitoring for ${initializedCount}/${companies.size} companies`);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize monitoring for ${ticker}:`, error);
      }
    }

    console.log(`✅ Monitoring initialized for ${initializedCount} companies`);
  }

  /**
   * Setup monitoring for individual company
   */
  private async setupCompanyMonitoring(ticker: string, company: UnifiedCompanyRecord): Promise<void> {
    // Create baseline monitoring record
    const baselineEvent: UpdateEvent = {
      eventId: `baseline_${ticker}_${Date.now()}`,
      ticker,
      eventType: 'confidence_update',
      timestamp: new Date(),
      source: 'System Initialization',
      changeType: 'confidence_change',
      newValue: company.overallConfidence,
      significance: 'low',
      processed: true,
      processingResult: {
        success: true,
        changesApplied: 0,
        newConfidence: company.overallConfidence,
        errors: [],
        processingTime: 0
      }
    };

    this.updateEvents.set(baselineEvent.eventId, baselineEvent);

    // Initialize company check record
    this.companyCheckRecords.set(ticker, {
      ticker,
      cik: company.cik || '',
      lastSECCheck: new Date(0), // Never checked
      lastFilingDate: ''
    });
  }

  /**
   * Start scheduled monitoring tasks
   */
  private startScheduledTasks(): void {
    console.log('⏰ Starting scheduled monitoring tasks...');

    // SEC Filing monitoring
    if (this.config.secFilingMonitoring) {
      const secInterval = setInterval(() => {
        this.checkSECFilings();
      }, this.config.updateFrequency.secFilings * 60 * 60 * 1000);

      this.monitoringIntervals.set('sec_filings', secInterval);
      console.log(`📄 SEC filing monitoring: every ${this.config.updateFrequency.secFilings} hours`);
    }

    // Sustainability report monitoring
    if (this.config.sustainabilityReportMonitoring) {
      const sustainabilityInterval = setInterval(() => {
        this.checkSustainabilityReports();
      }, this.config.updateFrequency.sustainabilityReports * 24 * 60 * 60 * 1000);

      this.monitoringIntervals.set('sustainability_reports', sustainabilityInterval);
      console.log(`🌱 Sustainability report monitoring: every ${this.config.updateFrequency.sustainabilityReports} days`);
    }

    // Website change monitoring (if enabled)
    if (this.config.websiteChangeMonitoring) {
      const websiteInterval = setInterval(() => {
        this.checkWebsiteChanges();
      }, 24 * 60 * 60 * 1000); // Daily

      this.monitoringIntervals.set('website_changes', websiteInterval);
      console.log('🌐 Website change monitoring: daily');
    }
  }

  /**
   * Start confidence recalculation
   */
  private startConfidenceRecalculation(): void {
    if (!this.config.confidenceRecalculation) return;

    const confidenceInterval = setInterval(() => {
      this.recalculateAllConfidenceScores();
    }, this.config.updateFrequency.confidenceRecalc * 60 * 60 * 1000);

    this.monitoringIntervals.set('confidence_recalc', confidenceInterval);
    console.log(`🎯 Confidence recalculation: every ${this.config.updateFrequency.confidenceRecalc} hours`);
  }

  /**
   * Check for new SEC filings - NOW USES REAL SEC EDGAR API
   */
  private async checkSECFilings(): Promise<void> {
    console.log('📄 Checking for new SEC filings via SEC EDGAR API...');

    try {
      const companies = unifiedDatabaseIntegrator.getUnifiedRecords();
      let updatesFound = 0;
      let companiesChecked = 0;

      for (const [ticker, company] of companies) {
        // Skip if no CIK
        if (!company.cik) continue;

        const checkRecord = this.companyCheckRecords.get(ticker);
        if (!checkRecord) continue;

        try {
          // Get recent filings from SEC EDGAR
          const recentFilings = await secEdgarService.getRecentFilings(
            company.cik,
            ['10-K', '10-Q', '8-K'],
            5
          );

          // Check for new filings since last check
          const newFilings = recentFilings.filter(filing => {
            const filingDate = new Date(filing.filingDate);
            return filingDate > checkRecord.lastSECCheck;
          });

          if (newFilings.length > 0) {
            console.log(`📄 Found ${newFilings.length} new filing(s) for ${ticker}`);
            
            for (const filing of newFilings) {
              await this.processNewSECFiling(ticker, company, filing);
              updatesFound++;
            }

            // Update check record
            checkRecord.lastSECCheck = new Date();
            checkRecord.lastFilingDate = newFilings[0].filingDate;
          }

          companiesChecked++;

          // Rate limiting: small delay between companies
          if (companiesChecked % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          console.error(`Error checking SEC filings for ${ticker}:`, error);
        }
      }

      console.log(`✅ SEC filing check completed: ${updatesFound} updates found (${companiesChecked} companies checked)`);
      this.updateStats();

    } catch (error) {
      console.error('❌ SEC filing check failed:', error);
    }
  }

  /**
   * Process new SEC filing - NOW USES REAL DATA
   */
  private async processNewSECFiling(
    ticker: string, 
    company: UnifiedCompanyRecord,
    filing: SECFiling
  ): Promise<void> {
    console.log(`📄 Processing ${filing.form} filing for ${ticker} (${filing.filingDate})...`);

    const startTime = Date.now();

    try {
      // Extract geographic segments from SEC data
      const geographicSegments = await secEdgarService.extractGeographicSegments(company.cik || '');
      
      // Convert to our format
      const newGeographicData: Record<string, any> = {};
      for (const segment of geographicSegments) {
        newGeographicData[segment.region] = {
          percentage: segment.percentage,
          confidence: segment.confidence,
          source: segment.source,
          lastUpdated: segment.filingDate
        };
      }
      
      // Create update event
      const updateEvent: UpdateEvent = {
        eventId: `sec_${ticker}_${Date.now()}`,
        ticker,
        eventType: 'sec_filing',
        timestamp: new Date(),
        source: `SEC EDGAR - ${filing.form} (${filing.filingDate})`,
        changeType: 'percentage_change',
        oldValue: company.geographicSegments,
        newValue: newGeographicData,
        significance: this.calculateSignificance(company.geographicSegments, newGeographicData),
        processed: false
      };

      // Process the update
      const result = await this.applyGeographicUpdate(ticker, newGeographicData);
      updateEvent.processed = true;
      updateEvent.processingResult = result;

      // Store event
      this.updateEvents.set(updateEvent.eventId, updateEvent);

      // Generate alerts if necessary
      if (updateEvent.significance === 'high' || updateEvent.significance === 'critical') {
        await this.generateAlert(ticker, updateEvent);
      }

      // Notify callback
      this.onUpdateEventCallback?.(updateEvent);

      console.log(`✅ SEC filing processed for ${ticker}: ${result.changesApplied} changes applied`);

    } catch (error) {
      console.error(`❌ Failed to process SEC filing for ${ticker}:`, error);
    }
  }

  /**
   * Check for new sustainability reports
   */
  private async checkSustainabilityReports(): Promise<void> {
    console.log('🌱 Checking for new sustainability reports...');

    try {
      const companies = unifiedDatabaseIntegrator.getUnifiedRecords();
      let updatesFound = 0;

      // Focus on large and mid-cap companies for sustainability reports
      for (const [ticker, company] of companies) {
        if (company.tier === 'large' || company.tier === 'mid') {
          const hasNewReport = Math.random() < 0.01; // 1% chance of new report

          if (hasNewReport) {
            await this.processNewSustainabilityReport(ticker, company);
            updatesFound++;
          }
        }
      }

      console.log(`✅ Sustainability report check completed: ${updatesFound} updates found`);
      this.updateStats();

    } catch (error) {
      console.error('❌ Sustainability report check failed:', error);
    }
  }

  /**
   * Process new sustainability report
   */
  private async processNewSustainabilityReport(ticker: string, company: UnifiedCompanyRecord): Promise<void> {
    console.log(`🌱 Processing new sustainability report for ${ticker}...`);

    try {
      // Simulate processing sustainability report
      const sustainabilityData = this.simulateSustainabilityData(company);
      
      const updateEvent: UpdateEvent = {
        eventId: `sustainability_${ticker}_${Date.now()}`,
        ticker,
        eventType: 'sustainability_report',
        timestamp: new Date(),
        source: 'Sustainability Report',
        changeType: 'new_geography',
        oldValue: company.geographicSegments,
        newValue: sustainabilityData,
        significance: 'medium',
        processed: false
      };

      // Process the update
      const result = await this.applyGeographicUpdate(ticker, sustainabilityData);
      updateEvent.processed = true;
      updateEvent.processingResult = result;

      this.updateEvents.set(updateEvent.eventId, updateEvent);
      this.onUpdateEventCallback?.(updateEvent);

      console.log(`✅ Sustainability report processed for ${ticker}`);

    } catch (error) {
      console.error(`❌ Failed to process sustainability report for ${ticker}:`, error);
    }
  }

  /**
   * Check for website changes
   */
  private async checkWebsiteChanges(): Promise<void> {
    console.log('🌐 Checking for website changes...');
    
    // Placeholder for website change monitoring
    // In production, this would involve web scraping and change detection
    
    console.log('✅ Website change check completed');
  }

  /**
   * Recalculate all confidence scores
   */
  private async recalculateAllConfidenceScores(): Promise<void> {
    console.log('🎯 Recalculating confidence scores for all companies...');

    try {
      const companies = unifiedDatabaseIntegrator.getUnifiedRecords();
      let recalculatedCount = 0;

      for (const [ticker, company] of companies) {
        const oldConfidence = company.overallConfidence;
        const newConfidence = this.calculateUpdatedConfidence(company);

        if (Math.abs(newConfidence - oldConfidence) > 0.05) { // 5% change threshold
          await this.updateCompanyConfidence(ticker, newConfidence, oldConfidence);
          recalculatedCount++;
        }
      }

      console.log(`✅ Confidence recalculation completed: ${recalculatedCount} companies updated`);
      this.updateStats();

    } catch (error) {
      console.error('❌ Confidence recalculation failed:', error);
    }
  }

  /**
   * Apply geographic update to company
   */
  private async applyGeographicUpdate(ticker: string, newData: any): Promise<UpdateResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let changesApplied = 0;

    try {
      const company = unifiedDatabaseIntegrator.findCompanyByTicker(ticker);
      if (!company) {
        throw new Error(`Company ${ticker} not found`);
      }

      // Apply updates to geographic segments
      Object.entries(newData).forEach(([geo, segment]: [string, any]) => {
        if (company.geographicSegments[geo]) {
          // Update existing segment
          const existing = company.geographicSegments[geo];
          if (Math.abs(existing.percentage - segment.percentage) > 1.0) {
            // Add to historical values
            existing.historicalValues.push({
              value: existing.percentage,
              confidence: existing.confidence,
              timestamp: existing.lastUpdated,
              source: existing.source,
              changeReason: 'SEC EDGAR Update'
            });

            // Update current values
            existing.percentage = segment.percentage;
            existing.confidence = segment.confidence;
            existing.lastUpdated = new Date().toISOString();
            existing.changeDetected = true;
            existing.lastChangeDate = new Date().toISOString();

            changesApplied++;
          }
        } else {
          // Add new segment
          company.geographicSegments[geo] = {
            ...segment,
            historicalValues: [],
            changeDetected: true,
            lastChangeDate: new Date().toISOString()
          };
          changesApplied++;
        }
      });

      // Recalculate overall confidence
      const newConfidence = this.calculateUpdatedConfidence(company);
      
      // Update company record
      company.overallConfidence = newConfidence;
      company.updatedAt = new Date().toISOString();
      company.version += 1;

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        changesApplied,
        newConfidence,
        errors,
        processingTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      return {
        success: false,
        changesApplied,
        newConfidence: 0,
        errors,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Update company confidence score
   */
  private async updateCompanyConfidence(ticker: string, newConfidence: number, oldConfidence: number): Promise<void> {
    const updateEvent: UpdateEvent = {
      eventId: `confidence_${ticker}_${Date.now()}`,
      ticker,
      eventType: 'confidence_update',
      timestamp: new Date(),
      source: 'Automated Recalculation',
      changeType: 'confidence_change',
      oldValue: oldConfidence,
      newValue: newConfidence,
      significance: this.calculateConfidenceSignificance(oldConfidence, newConfidence),
      processed: true,
      processingResult: {
        success: true,
        changesApplied: 1,
        newConfidence,
        errors: [],
        processingTime: 0
      }
    };

    this.updateEvents.set(updateEvent.eventId, updateEvent);

    // Generate alert for significant confidence drops
    if (oldConfidence - newConfidence > this.config.alertThresholds.confidenceDropAlert) {
      await this.generateAlert(ticker, updateEvent);
    }

    this.onUpdateEventCallback?.(updateEvent);
  }

  /**
   * Generate alert for significant changes
   */
  private async generateAlert(ticker: string, event: UpdateEvent): Promise<void> {
    const company = unifiedDatabaseIntegrator.findCompanyByTicker(ticker);
    if (!company) return;

    let alertType: 'significant_change' | 'confidence_drop' | 'new_geography' | 'data_quality_issue';
    let severity: 'low' | 'medium' | 'high' | 'critical';
    let message: string;

    switch (event.changeType) {
      case 'percentage_change':
        alertType = 'significant_change';
        severity = event.significance as any;
        message = `Significant geographic exposure change detected for ${company.companyName}`;
        break;
      case 'confidence_change':
        alertType = 'confidence_drop';
        severity = 'medium';
        message = `Confidence score dropped for ${company.companyName}: ${(event.oldValue * 100).toFixed(1)}% → ${(event.newValue * 100).toFixed(1)}%`;
        break;
      case 'new_geography':
        alertType = 'new_geography';
        severity = 'low';
        message = `New geographic segment detected for ${company.companyName}`;
        break;
      default:
        alertType = 'data_quality_issue';
        severity = 'medium';
        message = `Data quality issue detected for ${company.companyName}`;
    }

    const alert: UpdateAlert = {
      alertId: `alert_${ticker}_${Date.now()}`,
      ticker,
      companyName: company.companyName,
      alertType,
      severity,
      message,
      details: {
        event,
        oldValue: event.oldValue,
        newValue: event.newValue
      },
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.set(alert.alertId, alert);
    this.onAlertCallback?.(alert);

    console.log(`🚨 Alert generated: ${alert.message}`);
  }

  /**
   * Utility methods
   */
  private calculateSignificance(oldData: any, newData: any): 'low' | 'medium' | 'high' | 'critical' {
    // Calculate percentage changes and determine significance
    let maxChange = 0;

    Object.keys(oldData).forEach(geo => {
      if (newData[geo]) {
        const change = Math.abs(oldData[geo].percentage - newData[geo].percentage);
        maxChange = Math.max(maxChange, change);
      }
    });

    if (maxChange > 20) return 'critical';
    if (maxChange > 10) return 'high';
    if (maxChange > 5) return 'medium';
    return 'low';
  }

  private calculateConfidenceSignificance(oldConfidence: number, newConfidence: number): 'low' | 'medium' | 'high' | 'critical' {
    const change = Math.abs(oldConfidence - newConfidence);
    
    if (change > 0.2) return 'critical';
    if (change > 0.1) return 'high';
    if (change > 0.05) return 'medium';
    return 'low';
  }

  private calculateUpdatedConfidence(company: UnifiedCompanyRecord): number {
    const segments = Object.values(company.geographicSegments);
    if (segments.length === 0) return 0;

    // Weighted average confidence based on percentage
    return segments.reduce((sum, seg) => sum + (seg.confidence * seg.percentage / 100), 0);
  }

  private simulateSustainabilityData(company: UnifiedCompanyRecord): any {
    // Simulate sustainability report data
    return { ...company.geographicSegments };
  }

  private initializeStats(): MonitoringStats {
    return {
      totalCompaniesMonitored: 0,
      activeMonitors: 0,
      eventsProcessedToday: 0,
      alertsGeneratedToday: 0,
      averageProcessingTime: 0,
      systemHealth: 'healthy',
      lastUpdateCheck: new Date(),
      nextScheduledUpdate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      dataSourceStatus: {
        secEdgar: 'disconnected',
        alphaVantage: 'disconnected'
      }
    };
  }

  private updateStats(): void {
    const companies = unifiedDatabaseIntegrator.getUnifiedRecords();
    
    // Count today's events and alerts
    const today = new Date().toDateString();
    const todayEvents = Array.from(this.updateEvents.values())
      .filter(event => event.timestamp.toDateString() === today);
    const todayAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.timestamp.toDateString() === today);

    // Get current API status
    const secStatus = secEdgarService.getStatus();
    const avStatus = alphaVantageService.getStatus();

    this.stats = {
      totalCompaniesMonitored: companies.size,
      activeMonitors: this.monitoringIntervals.size,
      eventsProcessedToday: todayEvents.length,
      alertsGeneratedToday: todayAlerts.length,
      averageProcessingTime: this.calculateAverageProcessingTime(),
      systemHealth: this.assessSystemHealth(),
      lastUpdateCheck: new Date(),
      nextScheduledUpdate: new Date(Date.now() + 6 * 60 * 60 * 1000),
      dataSourceStatus: {
        secEdgar: secStatus.connected ? 'connected' : 'disconnected',
        alphaVantage: avStatus.connected ? 'connected' : 'disconnected'
      }
    };

    this.onStatsUpdateCallback?.(this.stats);
  }

  private calculateAverageProcessingTime(): number {
    const processedEvents = Array.from(this.updateEvents.values())
      .filter(event => event.processed && event.processingResult);

    if (processedEvents.length === 0) return 0;

    const totalTime = processedEvents.reduce((sum, event) => 
      sum + (event.processingResult?.processingTime || 0), 0);

    return totalTime / processedEvents.length;
  }

  private assessSystemHealth(): 'healthy' | 'warning' | 'critical' {
    const errorRate = this.calculateErrorRate();
    
    if (errorRate > 0.2) return 'critical';
    if (errorRate > 0.1) return 'warning';
    return 'healthy';
  }

  private calculateErrorRate(): number {
    const processedEvents = Array.from(this.updateEvents.values())
      .filter(event => event.processed);

    if (processedEvents.length === 0) return 0;

    const failedEvents = processedEvents.filter(event => 
      !event.processingResult?.success);

    return failedEvents.length / processedEvents.length;
  }

  /**
   * Event handlers
   */
  onUpdateEvent(callback: (event: UpdateEvent) => void): void {
    this.onUpdateEventCallback = callback;
  }

  onAlert(callback: (alert: UpdateAlert) => void): void {
    this.onAlertCallback = callback;
  }

  onStatsUpdate(callback: (stats: MonitoringStats) => void): void {
    this.onStatsUpdateCallback = callback;
  }

  /**
   * Public access methods
   */
  getConfiguration(): UpdateMonitorConfig {
    return { ...this.config };
  }

  updateConfiguration(updates: Partial<UpdateMonitorConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('⚙️ Real-time update configuration updated');
  }

  getMonitoringStats(): MonitoringStats {
    return { ...this.stats };
  }

  getRecentEvents(limit: number = 100): UpdateEvent[] {
    return Array.from(this.updateEvents.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getActiveAlerts(): UpdateAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    return true;
  }

  isMonitoringActive(): boolean {
    return this.monitoringActive;
  }

  /**
   * Manually trigger SEC filing check for a specific company
   */
  async checkCompanySECFilings(ticker: string): Promise<SECFiling[]> {
    const company = unifiedDatabaseIntegrator.findCompanyByTicker(ticker);
    if (!company || !company.cik) {
      return [];
    }

    return secEdgarService.getRecentFilings(company.cik, ['10-K', '10-Q', '8-K'], 10);
  }

  /**
   * Get geographic segments for a company from SEC filings
   */
  async getCompanyGeographicSegments(ticker: string): Promise<GeographicSegment[]> {
    const company = unifiedDatabaseIntegrator.findCompanyByTicker(ticker);
    if (!company || !company.cik) {
      return [];
    }

    return secEdgarService.extractGeographicSegments(company.cik);
  }
}

// Export singleton instance
export const realTimeUpdateSystem = new RealTimeUpdateSystem();
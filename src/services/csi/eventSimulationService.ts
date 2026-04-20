/**
 * Event Simulation Service
 * 
 * Simulates real-time geopolitical event arrivals for demo and testing.
 * Generates realistic event patterns based on current global hotspots.
 */

import { eventIngestionPipeline, type RawEventData, type EventSourceType } from './eventIngestionPipeline';
import type { EventCategory, EventSeverity } from '@/data/geopoliticalEvents';

export interface SimulationConfig {
  intervalMs: number;           // Time between events
  eventProbability: number;     // Probability of event generation (0-1)
  hotspotBias: number;          // Bias towards hotspot regions (0-1)
  severityDistribution: {       // Distribution of severity levels
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
}

interface EventTemplate {
  headlines: string[];
  countries: string[];
  region: string;
  category: EventCategory;
  severityRange: [EventSeverity, EventSeverity];
  sources: EventSourceType[];
}

// Current global hotspots with event templates
const EVENT_TEMPLATES: EventTemplate[] = [
  // Middle East Conflict
  {
    headlines: [
      'Military strikes reported in {country} border region',
      'Escalation of tensions between {country} and neighboring states',
      'Missile launch detected from {country} territory',
      'Cross-border attacks intensify near {country}',
      'Air defense systems activated in {country}',
      'Ground forces mobilized in {country} conflict zone'
    ],
    countries: ['Iran', 'Israel', 'Lebanon', 'Syria', 'Yemen', 'Iraq'],
    region: 'Middle East',
    category: 'Conflict',
    severityRange: ['High', 'Critical'],
    sources: ['GDELT', 'ACLED', 'SIPRI']
  },
  // Russia-Ukraine
  {
    headlines: [
      'Heavy fighting reported in eastern {country}',
      'Infrastructure targeted in {country} overnight',
      'New military offensive launched in {country}',
      'Drone attacks reported across {country}',
      'Civilian areas struck in {country} conflict',
      'Military reinforcements deployed to {country} front'
    ],
    countries: ['Ukraine', 'Russia'],
    region: 'Eastern Europe',
    category: 'Conflict',
    severityRange: ['High', 'Critical'],
    sources: ['GDELT', 'ACLED', 'UCDP']
  },
  // Sanctions & Regulatory
  {
    headlines: [
      'New sanctions package announced targeting {country}',
      'Export controls expanded for {country} entities',
      'Asset freezes imposed on {country} officials',
      'Trade restrictions tightened against {country}',
      'Financial sanctions updated for {country} banks'
    ],
    countries: ['Russia', 'Iran', 'North Korea', 'China', 'Belarus', 'Venezuela'],
    region: 'Global',
    category: 'Sanctions',
    severityRange: ['Moderate', 'High'],
    sources: ['OFAC', 'EU_CFSP', 'BIS']
  },
  // China-Taiwan
  {
    headlines: [
      'Military exercises conducted near {country}',
      'Naval activity increases in {country} strait',
      'Air defense zone incursions reported by {country}',
      'Diplomatic tensions rise between {country} and regional powers',
      'Trade restrictions announced affecting {country}'
    ],
    countries: ['Taiwan', 'China'],
    region: 'East Asia',
    category: 'Conflict',
    severityRange: ['Moderate', 'High'],
    sources: ['GDELT', 'SIPRI', 'CSIS']
  },
  // Cyber Events
  {
    headlines: [
      'Critical infrastructure cyber attack reported in {country}',
      'State-sponsored hacking campaign targets {country}',
      'Data breach affects {country} government systems',
      'Ransomware attack disrupts {country} services',
      'Internet disruption reported across {country}'
    ],
    countries: ['Ukraine', 'United States', 'United Kingdom', 'Germany', 'Iran', 'Israel', 'Taiwan'],
    region: 'Global',
    category: 'Cyber',
    severityRange: ['Moderate', 'High'],
    sources: ['CISA', 'ENISA', 'NETBLOCKS']
  },
  // Political Unrest
  {
    headlines: [
      'Mass protests erupt in {country} capital',
      'Political crisis deepens in {country}',
      'Opposition demonstrations grow in {country}',
      'Government crackdown on protesters in {country}',
      'Election disputes trigger unrest in {country}'
    ],
    countries: ['Venezuela', 'Iran', 'Pakistan', 'Bangladesh', 'Nigeria', 'Sudan', 'Myanmar'],
    region: 'Global',
    category: 'Unrest',
    severityRange: ['Moderate', 'High'],
    sources: ['ACLED', 'OSINT', 'FREEDOM_HOUSE']
  },
  // Trade & Supply Chain
  {
    headlines: [
      'Shipping disruptions reported affecting {country} trade',
      'Port congestion impacts {country} exports',
      'New tariffs announced on {country} goods',
      'Supply chain bottlenecks affect {country} manufacturing',
      'Trade agreement negotiations stall with {country}'
    ],
    countries: ['China', 'United States', 'Germany', 'Japan', 'South Korea', 'Vietnam', 'India'],
    region: 'Global',
    category: 'Trade',
    severityRange: ['Low', 'Moderate'],
    sources: ['WTO', 'USTR', 'MARITIME']
  },
  // Currency & Economic
  {
    headlines: [
      'Currency volatility spikes in {country}',
      'Central bank intervention in {country} forex market',
      'Inflation concerns grow in {country}',
      'Capital controls tightened in {country}',
      'Credit rating outlook changed for {country}'
    ],
    countries: ['Turkey', 'Argentina', 'Lebanon', 'Pakistan', 'Egypt', 'Nigeria', 'Venezuela'],
    region: 'Global',
    category: 'Currency',
    severityRange: ['Moderate', 'High'],
    sources: ['IMF_AREAER', 'BIS_FX']
  },
  // African Conflicts
  {
    headlines: [
      'Armed conflict intensifies in {country}',
      'Humanitarian crisis worsens in {country}',
      'Military coup attempt reported in {country}',
      'Rebel forces advance in {country}',
      'Peacekeeping mission challenges in {country}'
    ],
    countries: ['Sudan', 'Ethiopia', 'Democratic Republic of Congo', 'Nigeria', 'Mali', 'Burkina Faso'],
    region: 'Africa',
    category: 'Conflict',
    severityRange: ['High', 'Critical'],
    sources: ['ACLED', 'UCDP', 'GDELT']
  }
];

const DEFAULT_CONFIG: SimulationConfig = {
  intervalMs: 5000,
  eventProbability: 0.7,
  hotspotBias: 0.8,
  severityDistribution: {
    critical: 0.1,
    high: 0.3,
    moderate: 0.4,
    low: 0.2
  }
};

class EventSimulationService {
  private config: SimulationConfig = DEFAULT_CONFIG;
  private simulationInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private eventCount: number = 0;
  private startTime: Date | null = null;

  /**
   * Start event simulation
   */
  start(config?: Partial<SimulationConfig>): void {
    if (this.isRunning) {
      console.log('[Simulation] ⚠️ Already running');
      return;
    }

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isRunning = true;
    this.startTime = new Date();
    this.eventCount = 0;

    console.log(`[Simulation] ▶️ Started simulation (interval: ${this.config.intervalMs}ms)`);

    this.simulationInterval = setInterval(() => {
      this.generateEvent();
    }, this.config.intervalMs);
  }

  /**
   * Stop event simulation
   */
  stop(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
    console.log(`[Simulation] ⏹️ Stopped simulation (generated ${this.eventCount} events)`);
  }

  /**
   * Pause simulation
   */
  pause(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    console.log('[Simulation] ⏸️ Paused simulation');
  }

  /**
   * Resume simulation
   */
  resume(): void {
    if (this.isRunning && !this.simulationInterval) {
      this.simulationInterval = setInterval(() => {
        this.generateEvent();
      }, this.config.intervalMs);
      console.log('[Simulation] ▶️ Resumed simulation');
    }
  }

  /**
   * Generate a single event
   */
  private generateEvent(): void {
    // Check probability
    if (Math.random() > this.config.eventProbability) {
      return;
    }

    // Select template (biased towards hotspots)
    const template = this.selectTemplate();
    
    // Generate event data
    const event = this.createEventFromTemplate(template);

    // Ingest the event
    try {
      eventIngestionPipeline.ingestEvent(event);
      this.eventCount++;
    } catch (error) {
      console.error('[Simulation] Failed to ingest event:', error);
    }
  }

  /**
   * Select an event template
   */
  private selectTemplate(): EventTemplate {
    // Bias towards conflict templates (hotspots)
    if (Math.random() < this.config.hotspotBias) {
      const conflictTemplates = EVENT_TEMPLATES.filter(t => 
        t.category === 'Conflict' || t.category === 'Sanctions'
      );
      return conflictTemplates[Math.floor(Math.random() * conflictTemplates.length)];
    }
    
    return EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  }

  /**
   * Create event data from template
   */
  private createEventFromTemplate(template: EventTemplate): RawEventData {
    // Select random country from template
    const country = template.countries[Math.floor(Math.random() * template.countries.length)];
    
    // Select random headline and replace placeholder
    const headlineTemplate = template.headlines[Math.floor(Math.random() * template.headlines.length)];
    const headline = headlineTemplate.replace('{country}', country);

    // Select severity based on distribution
    const severity = this.selectSeverity(template.severityRange);

    // Select random source
    const source = template.sources[Math.floor(Math.random() * template.sources.length)];

    return {
      source,
      timestamp: new Date(),
      headline,
      description: `${headline}. This event is being monitored for potential CSI impact.`,
      country,
      region: template.region === 'Global' ? undefined : template.region,
      category: template.category,
      severity,
      confidence: 0.7 + Math.random() * 0.3, // 0.7-1.0
      tags: [template.category.toLowerCase(), 'simulated']
    };
  }

  /**
   * Select severity based on distribution
   */
  private selectSeverity(range: [EventSeverity, EventSeverity]): EventSeverity {
    const rand = Math.random();
    const dist = this.config.severityDistribution;

    // Filter by range
    const severities: EventSeverity[] = ['Critical', 'High', 'Moderate', 'Low'];
    const rangeStart = severities.indexOf(range[1]); // Higher severity = lower index
    const rangeEnd = severities.indexOf(range[0]);
    const validSeverities = severities.slice(rangeStart, rangeEnd + 1);

    if (rand < dist.critical && validSeverities.includes('Critical')) return 'Critical';
    if (rand < dist.critical + dist.high && validSeverities.includes('High')) return 'High';
    if (rand < dist.critical + dist.high + dist.moderate && validSeverities.includes('Moderate')) return 'Moderate';
    return validSeverities.includes('Low') ? 'Low' : validSeverities[validSeverities.length - 1];
  }

  /**
   * Manually inject an event
   */
  injectEvent(event: RawEventData): void {
    try {
      eventIngestionPipeline.ingestEvent(event);
      this.eventCount++;
      console.log(`[Simulation] 💉 Injected event: ${event.headline}`);
    } catch (error) {
      console.error('[Simulation] Failed to inject event:', error);
      throw error;
    }
  }

  /**
   * Get simulation status
   */
  getStatus(): {
    isRunning: boolean;
    isPaused: boolean;
    eventCount: number;
    startTime: Date | null;
    config: SimulationConfig;
    eventsPerMinute: number;
  } {
    const isPaused = this.isRunning && !this.simulationInterval;
    let eventsPerMinute = 0;
    
    if (this.startTime && this.eventCount > 0) {
      const elapsedMinutes = (Date.now() - this.startTime.getTime()) / 60000;
      eventsPerMinute = elapsedMinutes > 0 ? this.eventCount / elapsedMinutes : 0;
    }

    return {
      isRunning: this.isRunning,
      isPaused,
      eventCount: this.eventCount,
      startTime: this.startTime,
      config: this.config,
      eventsPerMinute: parseFloat(eventsPerMinute.toFixed(1))
    };
  }

  /**
   * Update simulation config
   */
  updateConfig(config: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart interval if running
    if (this.isRunning && this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = setInterval(() => {
        this.generateEvent();
      }, this.config.intervalMs);
    }

    console.log('[Simulation] ⚙️ Config updated');
  }

  /**
   * Get available templates
   */
  getTemplates(): { category: EventCategory; countries: string[]; region: string }[] {
    return EVENT_TEMPLATES.map(t => ({
      category: t.category,
      countries: t.countries,
      region: t.region
    }));
  }

  /**
   * Reset simulation
   */
  reset(): void {
    this.stop();
    this.eventCount = 0;
    this.startTime = null;
    this.config = DEFAULT_CONFIG;
    console.log('[Simulation] 🔄 Reset complete');
  }
}

// Singleton instance
export const eventSimulationService = new EventSimulationService();
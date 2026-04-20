/**
 * Data Source Configuration for CSI Event Detection
 * 
 * Defines Tier 1, 2, and 3 data sources for automated event detection.
 * Tier 1: Authoritative government sources, updated hourly
 * Tier 2: Major news agencies, updated every 6 hours
 * Tier 3: Regional sources, updated daily
 */

import type { VectorCode } from '@/types/csi.types';

export interface DataSource {
  id: string;
  name: string;
  url: string;
  rss?: string;
  api?: string;
  type: 'RSS' | 'API' | 'SCRAPE';
  tier: 1 | 2 | 3;
  vectors: VectorCode[];
  priority: number;
  updateFrequency: number; // in hours
  confidence: number; // 0-100
  active: boolean;
  description: string;
  region?: string;
}

export const DATA_SOURCES: DataSource[] = [
  // TIER 1: Authoritative Government Sources (Hourly)
  {
    id: 'ofac-sanctions',
    name: 'OFAC Sanctions List',
    url: 'https://ofac.treasury.gov/',
    rss: 'https://ofac.treasury.gov/rss.xml',
    type: 'RSS',
    tier: 1,
    vectors: ['SC2', 'SC5'],
    priority: 100,
    updateFrequency: 1,
    confidence: 95,
    active: true,
    description: 'US Treasury Office of Foreign Assets Control - Sanctions announcements'
  },
  {
    id: 'bis-entity-list',
    name: 'BIS Entity List',
    url: 'https://www.bis.doc.gov/',
    rss: 'https://www.bis.doc.gov/index.php/documents/rss',
    type: 'RSS',
    tier: 1,
    vectors: ['SC2', 'SC3'],
    priority: 95,
    updateFrequency: 1,
    confidence: 95,
    active: true,
    description: 'Bureau of Industry and Security - Export control updates'
  },
  {
    id: 'mofcom-china',
    name: 'MOFCOM China',
    url: 'https://www.mofcom.gov.cn/',
    rss: 'http://english.mofcom.gov.cn/rss/LatestNews.xml',
    type: 'RSS',
    tier: 1,
    vectors: ['SC2', 'SC3'],
    priority: 90,
    updateFrequency: 1,
    confidence: 90,
    active: true,
    description: 'China Ministry of Commerce - Trade and export control announcements',
    region: 'East Asia'
  },
  {
    id: 'eu-cfsp',
    name: 'EU CFSP Sanctions',
    url: 'https://www.eeas.europa.eu/eeas/sanctions_en',
    rss: 'https://www.eeas.europa.eu/rss/eeas_en.xml',
    type: 'RSS',
    tier: 1,
    vectors: ['SC2'],
    priority: 90,
    updateFrequency: 1,
    confidence: 95,
    active: true,
    description: 'EU Common Foreign and Security Policy - Sanctions updates',
    region: 'Europe'
  },
  {
    id: 'un-security-council',
    name: 'UN Security Council',
    url: 'https://www.un.org/securitycouncil/',
    rss: 'https://www.un.org/securitycouncil/content/rss',
    type: 'RSS',
    tier: 1,
    vectors: ['SC2', 'SC1'],
    priority: 100,
    updateFrequency: 1,
    confidence: 100,
    active: true,
    description: 'UN Security Council - Sanctions and resolutions'
  },
  {
    id: 'wto-disputes',
    name: 'WTO Dispute Settlement',
    url: 'https://www.wto.org/english/tratop_e/dispu_e/dispu_e.htm',
    rss: 'https://www.wto.org/english/news_e/rss_e.xml',
    type: 'RSS',
    tier: 1,
    vectors: ['SC3'],
    priority: 85,
    updateFrequency: 1,
    confidence: 90,
    active: true,
    description: 'World Trade Organization - Trade disputes and tariff announcements'
  },
  {
    id: 'acled-conflict',
    name: 'ACLED Conflict Data',
    url: 'https://acleddata.com/',
    api: 'https://api.acleddata.com/acled/read',
    type: 'API',
    tier: 1,
    vectors: ['SC1', 'SC6'],
    priority: 90,
    updateFrequency: 1,
    confidence: 85,
    active: true,
    description: 'Armed Conflict Location & Event Data Project - Real-time conflict tracking'
  },
  {
    id: 'cisa-alerts',
    name: 'CISA Cyber Alerts',
    url: 'https://www.cisa.gov/news-events/cybersecurity-advisories',
    rss: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
    type: 'RSS',
    tier: 1,
    vectors: ['SC7'],
    priority: 85,
    updateFrequency: 1,
    confidence: 90,
    active: true,
    description: 'US Cybersecurity and Infrastructure Security Agency - Cyber threat alerts'
  },

  // TIER 2: Major News Agencies (Every 6 hours)
  {
    id: 'reuters-world',
    name: 'Reuters World News',
    url: 'https://www.reuters.com/world/',
    rss: 'https://www.reuters.com/rssfeed/worldNews',
    type: 'RSS',
    tier: 2,
    vectors: ['SC1', 'SC2', 'SC3', 'SC6'],
    priority: 80,
    updateFrequency: 6,
    confidence: 85,
    active: true,
    description: 'Reuters - Global news and geopolitical events'
  },
  {
    id: 'bloomberg-politics',
    name: 'Bloomberg Politics',
    url: 'https://www.bloomberg.com/politics',
    rss: 'https://www.bloomberg.com/feed/podcast/politics.xml',
    type: 'RSS',
    tier: 2,
    vectors: ['SC2', 'SC3', 'SC5'],
    priority: 75,
    updateFrequency: 6,
    confidence: 80,
    active: true,
    description: 'Bloomberg - Political and economic policy news'
  },
  {
    id: 'ft-world',
    name: 'Financial Times World',
    url: 'https://www.ft.com/world',
    rss: 'https://www.ft.com/world?format=rss',
    type: 'RSS',
    tier: 2,
    vectors: ['SC2', 'SC3', 'SC5'],
    priority: 75,
    updateFrequency: 6,
    confidence: 80,
    active: true,
    description: 'Financial Times - International affairs and trade'
  },
  {
    id: 'bbc-world',
    name: 'BBC World News',
    url: 'https://www.bbc.com/news/world',
    rss: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    type: 'RSS',
    tier: 2,
    vectors: ['SC1', 'SC6'],
    priority: 70,
    updateFrequency: 6,
    confidence: 75,
    active: true,
    description: 'BBC - Global news coverage'
  },

  // TIER 3: Regional and Specialized Sources (Daily)
  {
    id: 'netblocks',
    name: 'NetBlocks Internet Observatory',
    url: 'https://netblocks.org/',
    rss: 'https://netblocks.org/feed',
    type: 'RSS',
    tier: 3,
    vectors: ['SC7'],
    priority: 65,
    updateFrequency: 24,
    confidence: 75,
    active: true,
    description: 'NetBlocks - Internet shutdowns and cyber sovereignty monitoring'
  },
  {
    id: 'sipri-news',
    name: 'SIPRI News',
    url: 'https://www.sipri.org/',
    rss: 'https://www.sipri.org/rss.xml',
    type: 'RSS',
    tier: 3,
    vectors: ['SC1'],
    priority: 70,
    updateFrequency: 24,
    confidence: 80,
    active: true,
    description: 'Stockholm International Peace Research Institute - Arms control and conflict'
  },
  {
    id: 'imf-news',
    name: 'IMF News',
    url: 'https://www.imf.org/en/News',
    rss: 'https://www.imf.org/en/News/rss',
    type: 'RSS',
    tier: 3,
    vectors: ['SC5'],
    priority: 65,
    updateFrequency: 24,
    confidence: 85,
    active: true,
    description: 'International Monetary Fund - Capital controls and financial stability'
  }
];

/**
 * Get data sources by tier
 */
export const getSourcesByTier = (tier: 1 | 2 | 3): DataSource[] => {
  return DATA_SOURCES.filter(source => source.tier === tier && source.active);
};

/**
 * Get data sources by vector
 */
export const getSourcesByVector = (vector: VectorCode): DataSource[] => {
  return DATA_SOURCES.filter(source => 
    source.vectors.includes(vector) && source.active
  );
};

/**
 * Get data source by ID
 */
export const getSourceById = (id: string): DataSource | undefined => {
  return DATA_SOURCES.find(source => source.id === id);
};

/**
 * Get all active data sources
 */
export const getActiveSources = (): DataSource[] => {
  return DATA_SOURCES.filter(source => source.active);
};

/**
 * Get sources due for update
 */
export const getSourcesDueForUpdate = (lastUpdateMap: Map<string, Date>): DataSource[] => {
  const now = new Date();
  return DATA_SOURCES.filter(source => {
    if (!source.active) return false;
    
    const lastUpdate = lastUpdateMap.get(source.id);
    if (!lastUpdate) return true; // Never updated
    
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate >= source.updateFrequency;
  });
};
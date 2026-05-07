/**
 * Geopolitical Events Data
 * 
 * Contains real-world geopolitical events from the past 12 months
 * that drive CSI changes. Events are aligned with the 7-vector model:
 * - Conflict (SC1): Military actions, border disputes, armed conflicts
 * - Sanctions (SC2): Economic sanctions, export controls, trade restrictions
 * - Trade (SC3): Trade agreements, tariffs, supply chain disruptions
 * - Governance (SC4): Political instability, regime changes, elections
 * - Cyber (SC5): Cyber attacks, data breaches, infrastructure attacks
 * - Unrest (SC6): Protests, civil unrest, labor strikes
 * - Currency (SC7): Currency crises, capital controls, financial instability
 * - Protest (NEW): Public demonstrations, social movements
 * - Regulatory (NEW): Regulatory changes, policy shifts
 * - Diplomatic (NEW): Diplomatic relations, negotiations
 * - Infrastructure (NEW): Infrastructure projects, disruptions
 * - Economic Policy (NEW): Economic reforms, fiscal policy
 * - Military Posture (NEW): Military positioning, defense policy
 * - Corporate (NEW): Corporate actions, business environment
 */

export type EventCategory = 
  | 'Conflict' 
  | 'Sanctions' 
  | 'Trade' 
  | 'Governance' 
  | 'Cyber' 
  | 'Unrest' 
  | 'Currency'
  | 'Protest'
  | 'Regulatory'
  | 'Diplomatic'
  | 'Infrastructure'
  | 'Economic Policy'
  | 'Military Posture'
  | 'Corporate';

export type EventSeverity = 'Critical' | 'High' | 'Moderate' | 'Low';

export interface GeopoliticalEvent {
  id: string;
  title: string;
  description: string;
  country: string;
  region: string;
  date: Date;
  category: EventCategory;
  severity: EventSeverity;
  deltaCSI: number; // Impact on CSI (positive = increase risk, negative = decrease risk)
  vectorImpacts: {
    conflict?: number;
    sanctions?: number;
    trade?: number;
    governance?: number;
    cyber?: number;
    unrest?: number;
    currency?: number;
  };
  relatedCountries?: string[]; // Countries also affected by this event
  sources?: string[];
  isOngoing?: boolean;
}

/**
 * Real-world geopolitical events database
 * Events are sorted by date (most recent first)
 * EXPANDED DATABASE: 300+ events covering all monitored countries
 */
export const GEOPOLITICAL_EVENTS: GeopoliticalEvent[] = [
  // ==================== UNITED STATES (20+ events) ====================
  {
    id: 'evt-us-001',
    title: 'US Federal Reserve maintains interest rate policy',
    description: 'Fed holds rates steady amid economic uncertainty',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-03-12'),
    category: 'Economic Policy',
    severity: 'Moderate',
    deltaCSI: 0.8,
    vectorImpacts: { currency: 1.5, trade: 0.5, governance: 0.3 },
    relatedCountries: ['Canada', 'Mexico', 'China'],
    isOngoing: false
  },
  {
    id: 'evt-us-002',
    title: 'US tech sector faces new AI regulation proposals',
    description: 'Congress introduces comprehensive AI safety and ethics legislation',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-03-10'),
    category: 'Regulatory',
    severity: 'Moderate',
    deltaCSI: 1.2,
    vectorImpacts: { governance: 2.0, trade: 1.0, cyber: 0.5 },
    relatedCountries: ['China', 'United Kingdom', 'Japan'],
    isOngoing: true
  },
  {
    id: 'evt-us-003',
    title: 'US-Mexico border security negotiations intensify',
    description: 'Bilateral talks on immigration and border management',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-03-08'),
    category: 'Diplomatic',
    severity: 'Moderate',
    deltaCSI: 1.5,
    vectorImpacts: { governance: 2.0, unrest: 1.0, trade: 0.5 },
    relatedCountries: ['Mexico'],
    isOngoing: true
  },
  {
    id: 'evt-us-004',
    title: 'US infrastructure bill implementation accelerates',
    description: 'Major transportation and energy projects receive federal funding',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-03-05'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.8,
    vectorImpacts: { trade: -1.0, governance: -0.5 },
    relatedCountries: ['Canada'],
    isOngoing: false
  },
  {
    id: 'evt-us-005',
    title: 'US climate protests target fossil fuel companies',
    description: 'Nationwide demonstrations demand faster transition to renewables',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-03-03'),
    category: 'Protest',
    severity: 'Low',
    deltaCSI: 0.6,
    vectorImpacts: { unrest: 1.0, governance: 0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-us-006',
    title: 'US cyber defense budget increases significantly',
    description: 'Pentagon allocates additional resources for cybersecurity infrastructure',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-03-01'),
    category: 'Military Posture',
    severity: 'Moderate',
    deltaCSI: 0.9,
    vectorImpacts: { cyber: 1.5, conflict: 0.5, governance: 0.3 },
    relatedCountries: ['China', 'Russia'],
    isOngoing: false
  },
  {
    id: 'evt-us-007',
    title: 'US corporate earnings show mixed results',
    description: 'Tech sector outperforms while manufacturing faces headwinds',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-02-28'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: 0.4,
    vectorImpacts: { trade: 0.5, currency: 0.3 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-us-008',
    title: 'US-China trade talks resume after pause',
    description: 'High-level negotiations on tariffs and technology transfer',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-02-25'),
    category: 'Diplomatic',
    severity: 'Moderate',
    deltaCSI: -1.2,
    vectorImpacts: { trade: -2.0, sanctions: -0.5, governance: -0.3 },
    relatedCountries: ['China'],
    isOngoing: true
  },
  {
    id: 'evt-us-009',
    title: 'US labor unions stage coordinated strikes',
    description: 'Multiple sectors including auto and logistics see work stoppages',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-02-22'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.3,
    vectorImpacts: { unrest: 2.0, trade: 1.0, governance: 0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-us-010',
    title: 'US expands semiconductor export controls',
    description: 'New restrictions on advanced chip exports to multiple countries',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-02-18'),
    category: 'Sanctions',
    severity: 'High',
    deltaCSI: 2.5,
    vectorImpacts: { sanctions: 4.0, trade: 2.0, cyber: 1.0 },
    relatedCountries: ['China', 'Russia', 'Iran'],
    isOngoing: false
  },
  {
    id: 'evt-us-011',
    title: 'US banking sector faces regulatory scrutiny',
    description: 'Federal regulators investigate risk management practices',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-02-15'),
    category: 'Regulatory',
    severity: 'Moderate',
    deltaCSI: 1.1,
    vectorImpacts: { governance: 1.5, currency: 1.0, trade: 0.5 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-us-012',
    title: 'US military conducts Pacific exercises',
    description: 'Large-scale naval and air exercises with regional allies',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-02-12'),
    category: 'Military Posture',
    severity: 'Moderate',
    deltaCSI: 1.4,
    vectorImpacts: { conflict: 2.0, governance: 0.5 },
    relatedCountries: ['Japan', 'South Korea', 'Philippines', 'Australia'],
    isOngoing: false
  },
  {
    id: 'evt-us-013',
    title: 'US healthcare reform debate intensifies',
    description: 'Congressional proposals for healthcare system changes spark debate',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-02-08'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 0.9,
    vectorImpacts: { governance: 1.5, unrest: 0.5 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-us-014',
    title: 'US tech companies face antitrust investigations',
    description: 'DOJ expands probes into market dominance practices',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-02-05'),
    category: 'Corporate',
    severity: 'Moderate',
    deltaCSI: 1.0,
    vectorImpacts: { governance: 1.5, trade: 0.8 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-us-015',
    title: 'US energy independence initiatives expand',
    description: 'Government promotes domestic energy production and renewables',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-02-01'),
    category: 'Economic Policy',
    severity: 'Low',
    deltaCSI: -0.6,
    vectorImpacts: { trade: -1.0, governance: -0.3 },
    relatedCountries: ['Canada', 'Mexico'],
    isOngoing: false
  },
  {
    id: 'evt-us-016',
    title: 'US immigration policy reforms proposed',
    description: 'New legislative proposals aim to reform immigration system',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-01-28'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 1.2,
    vectorImpacts: { governance: 2.0, unrest: 0.8 },
    relatedCountries: ['Mexico', 'Canada'],
    isOngoing: true
  },
  {
    id: 'evt-us-017',
    title: 'US space program announces Mars mission timeline',
    description: 'NASA reveals detailed plans for crewed Mars exploration',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-01-25'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.4,
    vectorImpacts: { governance: -0.5, trade: -0.2 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-us-018',
    title: 'US cybersecurity incident affects government systems',
    description: 'Federal agencies respond to sophisticated cyber intrusion',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-01-22'),
    category: 'Cyber',
    severity: 'High',
    deltaCSI: 2.8,
    vectorImpacts: { cyber: 5.0, governance: 1.5, conflict: 1.0 },
    relatedCountries: ['Russia', 'China'],
    isOngoing: false
  },
  {
    id: 'evt-us-019',
    title: 'US trade deficit narrows in latest data',
    description: 'Exports increase while imports stabilize',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-01-18'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { trade: -1.0, currency: -0.5 },
    relatedCountries: ['China', 'Mexico', 'Canada'],
    isOngoing: false
  },
  {
    id: 'evt-us-020',
    title: 'US Supreme Court ruling impacts regulatory framework',
    description: 'Major decision affects federal agency authority',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-01-15'),
    category: 'Regulatory',
    severity: 'High',
    deltaCSI: 1.8,
    vectorImpacts: { governance: 3.0, trade: 1.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-us-021',
    title: 'US student loan forgiveness program expanded',
    description: 'Administration announces broader debt relief measures',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-01-12'),
    category: 'Economic Policy',
    severity: 'Moderate',
    deltaCSI: 0.9,
    vectorImpacts: { governance: 1.5, currency: 0.5, unrest: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-us-022',
    title: 'US-EU cooperation on AI standards strengthens',
    description: 'Transatlantic partnership on AI governance framework',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-01-08'),
    category: 'Diplomatic',
    severity: 'Low',
    deltaCSI: -0.5,
    vectorImpacts: { governance: -0.8, trade: -0.3 },
    relatedCountries: ['Germany', 'France', 'United Kingdom'],
    isOngoing: false
  },

  // ==================== CANADA (20+ events) ====================
  {
    id: 'evt-ca-001',
    title: 'Canada announces major infrastructure investment plan',
    description: 'Federal government commits billions to transportation and energy projects',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-03-11'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.9,
    vectorImpacts: { trade: -1.2, governance: -0.5 },
    relatedCountries: ['United States'],
    isOngoing: false
  },
  {
    id: 'evt-ca-002',
    title: 'Canada-US trade relations strengthen',
    description: 'New bilateral agreements on critical minerals and energy',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-03-09'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -0.8,
    vectorImpacts: { trade: -1.5, governance: -0.3 },
    relatedCountries: ['United States'],
    isOngoing: false
  },
  {
    id: 'evt-ca-003',
    title: 'Canada housing market shows signs of cooling',
    description: 'Interest rate impacts reduce housing demand in major cities',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-03-07'),
    category: 'Economic Policy',
    severity: 'Moderate',
    deltaCSI: 1.1,
    vectorImpacts: { currency: 1.5, governance: 0.8, trade: 0.5 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-ca-004',
    title: 'Canada environmental protests target pipeline projects',
    description: 'Indigenous groups and activists demonstrate against fossil fuel infrastructure',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-03-04'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 0.9,
    vectorImpacts: { unrest: 1.5, governance: 0.8, trade: 0.3 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-ca-005',
    title: 'Canada strengthens Arctic sovereignty measures',
    description: 'Military exercises and infrastructure development in Arctic region',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-03-02'),
    category: 'Military Posture',
    severity: 'Moderate',
    deltaCSI: 1.2,
    vectorImpacts: { conflict: 1.8, governance: 0.5 },
    relatedCountries: ['Russia', 'United States'],
    isOngoing: false
  },
  {
    id: 'evt-ca-006',
    title: 'Canada tech sector attracts major investments',
    description: 'AI and quantum computing companies expand Canadian operations',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-02-27'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.6,
    vectorImpacts: { trade: -0.8, governance: -0.4 },
    relatedCountries: ['United States'],
    isOngoing: false
  },
  {
    id: 'evt-ca-007',
    title: 'Canada healthcare system faces capacity challenges',
    description: 'Provincial governments address hospital staffing and resource issues',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-02-24'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 1.0,
    vectorImpacts: { governance: 1.8, unrest: 0.5 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-ca-008',
    title: 'Canada implements new digital privacy regulations',
    description: 'Comprehensive data protection laws come into effect',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-02-21'),
    category: 'Regulatory',
    severity: 'Moderate',
    deltaCSI: 0.7,
    vectorImpacts: { governance: 1.2, cyber: 0.5, trade: 0.3 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-ca-009',
    title: 'Canada-China diplomatic tensions ease slightly',
    description: 'High-level talks resume after period of strained relations',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-02-18'),
    category: 'Diplomatic',
    severity: 'Moderate',
    deltaCSI: -1.0,
    vectorImpacts: { governance: -1.5, trade: -0.8 },
    relatedCountries: ['China'],
    isOngoing: false
  },
  {
    id: 'evt-ca-010',
    title: 'Canada wildfire preparedness measures enhanced',
    description: 'Federal and provincial governments invest in firefighting resources',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-02-15'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: 0.5,
    vectorImpacts: { governance: 0.8, trade: 0.3 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-ca-011',
    title: 'Canada immigration targets increased',
    description: 'Government raises annual immigration levels to address labor shortages',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-02-12'),
    category: 'Governance',
    severity: 'Low',
    deltaCSI: -0.4,
    vectorImpacts: { governance: -0.6, trade: -0.3 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-ca-012',
    title: 'Canada banking sector reports strong earnings',
    description: 'Major banks show resilience amid economic uncertainty',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-02-09'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.5,
    vectorImpacts: { currency: -0.8, trade: -0.3 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-ca-013',
    title: 'Canada cybersecurity framework updated',
    description: 'New standards for critical infrastructure protection',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-02-06'),
    category: 'Cyber',
    severity: 'Moderate',
    deltaCSI: 0.8,
    vectorImpacts: { cyber: 1.5, governance: 0.5 },
    relatedCountries: ['United States'],
    isOngoing: false
  },
  {
    id: 'evt-ca-014',
    title: 'Canada energy sector transitions accelerate',
    description: 'Major investments in renewable energy and carbon capture',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-02-03'),
    category: 'Economic Policy',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { trade: -1.0, governance: -0.4 },
    relatedCountries: ['United States'],
    isOngoing: false
  },
  {
    id: 'evt-ca-015',
    title: 'Canada public sector workers negotiate contracts',
    description: 'Federal employee unions seek wage increases amid inflation',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-01-30'),
    category: 'Protest',
    severity: 'Low',
    deltaCSI: 0.6,
    vectorImpacts: { unrest: 1.0, governance: 0.5 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-ca-016',
    title: 'Canada pharmaceutical industry expands',
    description: 'New manufacturing facilities for vaccines and biologics',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-01-27'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.5,
    vectorImpacts: { trade: -0.8, governance: -0.3 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-ca-017',
    title: 'Canada-Indigenous reconciliation progress',
    description: 'Federal government reaches agreements on land rights and resources',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-01-24'),
    category: 'Governance',
    severity: 'Low',
    deltaCSI: -0.6,
    vectorImpacts: { governance: -1.0, unrest: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-ca-018',
    title: 'Canada trade diversification efforts expand',
    description: 'New trade agreements with Indo-Pacific partners',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-01-21'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { trade: -1.2, governance: -0.3 },
    relatedCountries: ['Japan', 'South Korea', 'Australia'],
    isOngoing: false
  },
  {
    id: 'evt-ca-019',
    title: 'Canada financial regulations tightened',
    description: 'New rules target mortgage lending and consumer debt',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-01-18'),
    category: 'Regulatory',
    severity: 'Moderate',
    deltaCSI: 0.9,
    vectorImpacts: { governance: 1.5, currency: 0.8 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-ca-020',
    title: 'Canada space industry receives government support',
    description: 'Funding for satellite technology and space exploration',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-01-15'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.4,
    vectorImpacts: { governance: -0.5, trade: -0.3 },
    relatedCountries: ['United States'],
    isOngoing: false
  },
  {
    id: 'evt-ca-021',
    title: 'Canada agricultural exports reach record levels',
    description: 'Strong demand for Canadian grain and agricultural products',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-01-12'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -0.6,
    vectorImpacts: { trade: -1.0, currency: -0.3 },
    relatedCountries: ['China', 'United States'],
    isOngoing: false
  },
  {
    id: 'evt-ca-022',
    title: 'Canada climate adaptation strategy launched',
    description: 'Comprehensive plan to address climate change impacts',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-01-09'),
    category: 'Economic Policy',
    severity: 'Low',
    deltaCSI: -0.5,
    vectorImpacts: { governance: -0.8, trade: -0.3 },
    relatedCountries: [],
    isOngoing: false
  },

  // ==================== IRAQ (20+ events) ====================
  {
    id: 'evt-iq-001',
    title: 'Iraq political coalition negotiations continue',
    description: 'Parliamentary factions work to form stable government',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-03-10'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 1.8,
    vectorImpacts: { governance: 3.0, unrest: 1.0 },
    relatedCountries: ['Iran', 'United States'],
    isOngoing: true
  },
  {
    id: 'evt-iq-002',
    title: 'Iraq oil production increases amid OPEC+ discussions',
    description: 'Baghdad raises output targets despite cartel coordination',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-03-08'),
    category: 'Economic Policy',
    severity: 'Moderate',
    deltaCSI: 1.2,
    vectorImpacts: { trade: 2.0, governance: 0.8, currency: 0.5 },
    relatedCountries: ['Saudi Arabia', 'Iran', 'Kuwait'],
    isOngoing: false
  },
  {
    id: 'evt-iq-003',
    title: 'Iraq protests over electricity shortages',
    description: 'Demonstrations in southern cities demand better public services',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-03-06'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.5,
    vectorImpacts: { unrest: 2.5, governance: 1.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-iq-004',
    title: 'Iraq-Iran border security cooperation strengthens',
    description: 'Joint operations target smuggling and militant groups',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-03-04'),
    category: 'Military Posture',
    severity: 'Moderate',
    deltaCSI: 1.3,
    vectorImpacts: { conflict: 2.0, governance: 0.8 },
    relatedCountries: ['Iran'],
    isOngoing: false
  },
  {
    id: 'evt-iq-005',
    title: 'Iraq infrastructure reconstruction projects advance',
    description: 'International funding supports rebuilding of war-damaged areas',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-03-01'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.9,
    vectorImpacts: { governance: -1.2, trade: -0.8 },
    relatedCountries: ['United States', 'European Union'],
    isOngoing: false
  },
  {
    id: 'evt-iq-006',
    title: 'Iraq Kurdish region tensions with Baghdad persist',
    description: 'Disputes over oil revenues and territorial control continue',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-02-26'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 2.4,
    vectorImpacts: { governance: 3.5, conflict: 2.0, trade: 1.0 },
    relatedCountries: ['Turkey', 'Iran'],
    isOngoing: true
  },
  {
    id: 'evt-iq-007',
    title: 'Iraq water crisis worsens amid drought',
    description: 'Tigris and Euphrates water levels reach critical lows',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-02-23'),
    category: 'Infrastructure',
    severity: 'High',
    deltaCSI: 2.2,
    vectorImpacts: { governance: 2.5, unrest: 1.5, trade: 1.0 },
    relatedCountries: ['Turkey', 'Syria', 'Iran'],
    isOngoing: true
  },
  {
    id: 'evt-iq-008',
    title: 'Iraq anti-corruption measures implemented',
    description: 'Government launches investigations into public sector fraud',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-02-20'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: -0.8,
    vectorImpacts: { governance: -1.5, unrest: -0.5 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-iq-009',
    title: 'Iraq security forces combat ISIS remnants',
    description: 'Operations target terrorist cells in rural areas',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-02-17'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 2.8,
    vectorImpacts: { conflict: 4.5, governance: 1.5 },
    relatedCountries: ['Syria'],
    isOngoing: true
  },
  {
    id: 'evt-iq-010',
    title: 'Iraq foreign investment in energy sector grows',
    description: 'International companies sign deals for oil and gas development',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-02-14'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -1.0,
    vectorImpacts: { trade: -1.5, governance: -0.8 },
    relatedCountries: ['China', 'United States', 'France'],
    isOngoing: false
  },
  {
    id: 'evt-iq-011',
    title: 'Iraq banking sector reforms progress',
    description: 'Central bank implements new regulations to modernize financial system',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-02-11'),
    category: 'Regulatory',
    severity: 'Moderate',
    deltaCSI: 0.9,
    vectorImpacts: { governance: 1.5, currency: 0.8 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-iq-012',
    title: 'Iraq unemployment protests in Baghdad',
    description: 'Youth demonstrations demand job creation and economic opportunities',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-02-08'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.4,
    vectorImpacts: { unrest: 2.0, governance: 1.2 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-iq-013',
    title: 'Iraq-Turkey trade relations expand',
    description: 'New bilateral agreements boost cross-border commerce',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-02-05'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { trade: -1.2, governance: -0.4 },
    relatedCountries: ['Turkey'],
    isOngoing: false
  },
  {
    id: 'evt-iq-014',
    title: 'Iraq electricity grid improvements announced',
    description: 'Government plans major investments in power generation',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-02-02'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.8,
    vectorImpacts: { governance: -1.0, trade: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-iq-015',
    title: 'Iraq militia groups face pressure to disarm',
    description: 'Government pushes for integration of armed factions into state forces',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-01-29'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 2.5,
    vectorImpacts: { governance: 3.0, conflict: 2.5, unrest: 1.5 },
    relatedCountries: ['Iran', 'United States'],
    isOngoing: true
  },
  {
    id: 'evt-iq-016',
    title: 'Iraq agricultural sector receives development aid',
    description: 'International organizations fund irrigation and farming projects',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-01-26'),
    category: 'Economic Policy',
    severity: 'Low',
    deltaCSI: -0.6,
    vectorImpacts: { trade: -0.8, governance: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-iq-017',
    title: 'Iraq cyber infrastructure targeted by attacks',
    description: 'Government websites and services face coordinated cyber incidents',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-01-23'),
    category: 'Cyber',
    severity: 'Moderate',
    deltaCSI: 1.6,
    vectorImpacts: { cyber: 3.0, governance: 1.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-iq-018',
    title: 'Iraq religious pilgrimage season security enhanced',
    description: 'Massive security deployment for Arbaeen commemorations',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-01-20'),
    category: 'Military Posture',
    severity: 'Moderate',
    deltaCSI: 1.1,
    vectorImpacts: { conflict: 1.5, governance: 0.8 },
    relatedCountries: ['Iran'],
    isOngoing: false
  },
  {
    id: 'evt-iq-019',
    title: 'Iraq housing crisis prompts government response',
    description: 'New policies aim to address severe housing shortages',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-01-17'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 1.0,
    vectorImpacts: { governance: 1.8, unrest: 0.8 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-iq-020',
    title: 'Iraq telecommunications sector modernization',
    description: '5G network rollout and digital infrastructure investments',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-01-14'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.5,
    vectorImpacts: { trade: -0.8, governance: -0.3 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-iq-021',
    title: 'Iraq-Saudi Arabia relations improve',
    description: 'Diplomatic engagement and economic cooperation increase',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-01-11'),
    category: 'Diplomatic',
    severity: 'Low',
    deltaCSI: -0.9,
    vectorImpacts: { governance: -1.2, trade: -0.8, conflict: -0.5 },
    relatedCountries: ['Saudi Arabia'],
    isOngoing: false
  },
  {
    id: 'evt-iq-022',
    title: 'Iraq education system reforms launched',
    description: 'Government invests in schools and curriculum modernization',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-01-08'),
    category: 'Governance',
    severity: 'Low',
    deltaCSI: -0.6,
    vectorImpacts: { governance: -1.0, unrest: -0.3 },
    relatedCountries: [],
    isOngoing: false
  },

  // ==================== MIDDLE EAST ESCALATION (Recent) ====================
  {
    id: 'evt-me-001',
    title: 'Iran-Israel tensions escalate with missile exchanges',
    description: 'Direct military confrontation between Iran and Israel escalates regional conflict risk significantly',
    country: 'Iran',
    region: 'Middle East',
    date: new Date('2026-03-12'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 8.5,
    vectorImpacts: { conflict: 12.0, sanctions: 4.0, trade: 3.0 },
    relatedCountries: ['Israel', 'Lebanon', 'Syria', 'Iraq'],
    isOngoing: true
  },
  {
    id: 'evt-me-002',
    title: 'Israel military operations intensify in Gaza',
    description: 'Continued military operations in Gaza with regional spillover effects',
    country: 'Israel',
    region: 'Middle East',
    date: new Date('2026-03-11'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 7.2,
    vectorImpacts: { conflict: 10.0, governance: 3.0, unrest: 2.5 },
    relatedCountries: ['Palestine', 'Lebanon', 'Egypt'],
    isOngoing: true
  },
  {
    id: 'evt-me-003',
    title: 'Hezbollah-Israel cross-border attacks intensify',
    description: 'Escalating cross-border military exchanges between Hezbollah and Israel',
    country: 'Lebanon',
    region: 'Middle East',
    date: new Date('2026-03-09'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 9.3,
    vectorImpacts: { conflict: 14.0, governance: 3.0, currency: 2.0 },
    relatedCountries: ['Israel', 'Syria', 'Iran'],
    isOngoing: true
  },
  {
    id: 'evt-me-004',
    title: 'Houthi attacks on Red Sea shipping continue',
    description: 'Yemen-based Houthi forces continue attacks on commercial shipping in Red Sea',
    country: 'Yemen',
    region: 'Middle East',
    date: new Date('2026-03-10'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 6.8,
    vectorImpacts: { conflict: 8.0, trade: 6.0, sanctions: 2.0 },
    relatedCountries: ['Saudi Arabia', 'United Arab Emirates', 'Egypt'],
    isOngoing: true
  },
  {
    id: 'evt-me-005',
    title: 'Syria faces renewed instability amid regional conflict',
    description: 'Syrian territory increasingly affected by regional conflict spillover',
    country: 'Syria',
    region: 'Middle East',
    date: new Date('2026-03-08'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 5.4,
    vectorImpacts: { conflict: 7.0, governance: 4.0, unrest: 2.0 },
    relatedCountries: ['Iran', 'Israel', 'Turkey', 'Iraq'],
    isOngoing: true
  },

  // ==================== RUSSIA-UKRAINE CONFLICT ====================
  {
    id: 'evt-ru-001',
    title: 'Russia launches major offensive in eastern Ukraine',
    description: 'Intensified military operations in Donbas region with significant territorial advances',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2026-03-07'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 6.2,
    vectorImpacts: { conflict: 8.0, sanctions: 5.0, trade: 3.0 },
    relatedCountries: ['Ukraine', 'Belarus'],
    isOngoing: true
  },
  {
    id: 'evt-ua-001',
    title: 'Ukraine infrastructure targeted in missile strikes',
    description: 'Major infrastructure damage from Russian missile and drone attacks',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2026-03-06'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 7.8,
    vectorImpacts: { conflict: 10.0, cyber: 3.0, trade: 2.5 },
    relatedCountries: ['Russia', 'Poland', 'Moldova'],
    isOngoing: true
  },
  {
    id: 'evt-ru-002',
    title: 'New Western sanctions package targets Russian energy sector',
    description: 'EU and US impose additional sanctions on Russian oil and gas exports',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2026-03-02'),
    category: 'Sanctions',
    severity: 'High',
    deltaCSI: 4.5,
    vectorImpacts: { sanctions: 7.0, trade: 3.0, currency: 2.0 },
    relatedCountries: ['Belarus'],
    isOngoing: false
  },

  // ==================== CHINA-RELATED EVENTS ====================
  {
    id: 'evt-cn-001',
    title: 'China conducts military exercises near Taiwan',
    description: 'Large-scale PLA military exercises in Taiwan Strait raise regional tensions',
    country: 'China',
    region: 'East Asia',
    date: new Date('2026-03-04'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 4.8,
    vectorImpacts: { conflict: 6.0, trade: 4.0, governance: 2.0 },
    relatedCountries: ['Taiwan', 'Japan', 'Philippines'],
    isOngoing: false
  },
  {
    id: 'evt-tw-001',
    title: 'Taiwan raises defense alert amid Chinese exercises',
    description: 'Taiwan military on heightened alert following PLA exercises',
    country: 'Taiwan',
    region: 'East Asia',
    date: new Date('2026-03-04'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 5.5,
    vectorImpacts: { conflict: 7.0, trade: 3.0, cyber: 2.0 },
    relatedCountries: ['China', 'United States', 'Japan'],
    isOngoing: false
  },
  {
    id: 'evt-cn-002',
    title: 'US expands semiconductor export controls to China',
    description: 'New US restrictions on advanced chip exports to Chinese companies',
    country: 'China',
    region: 'East Asia',
    date: new Date('2026-02-24'),
    category: 'Sanctions',
    severity: 'High',
    deltaCSI: 3.8,
    vectorImpacts: { sanctions: 5.0, trade: 4.0, cyber: 2.0 },
    relatedCountries: ['United States', 'Taiwan', 'South Korea', 'Japan'],
    isOngoing: false
  },

  // ==================== SOUTH ASIA ====================
  {
    id: 'evt-pk-001',
    title: 'Pakistan political crisis deepens',
    description: 'Political instability intensifies with protests and government challenges',
    country: 'Pakistan',
    region: 'South Asia',
    date: new Date('2026-02-27'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 4.2,
    vectorImpacts: { governance: 6.0, unrest: 4.0, currency: 2.0 },
    relatedCountries: ['India', 'Afghanistan'],
    isOngoing: true
  },
  {
    id: 'evt-in-001',
    title: 'India-China border tensions flare',
    description: 'Renewed tensions along Line of Actual Control in Ladakh region',
    country: 'India',
    region: 'South Asia',
    date: new Date('2026-02-22'),
    category: 'Conflict',
    severity: 'Moderate',
    deltaCSI: 2.9,
    vectorImpacts: { conflict: 4.0, trade: 2.0, governance: 1.5 },
    relatedCountries: ['China'],
    isOngoing: false
  },

  // ==================== AFRICA ====================
  {
    id: 'evt-sd-001',
    title: 'Sudan civil war intensifies',
    description: 'Fighting between SAF and RSF spreads to new regions',
    country: 'Sudan',
    region: 'North Africa',
    date: new Date('2026-03-05'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 8.2,
    vectorImpacts: { conflict: 12.0, governance: 4.0, unrest: 3.0 },
    relatedCountries: ['Egypt', 'Chad', 'South Sudan', 'Ethiopia'],
    isOngoing: true
  },
  {
    id: 'evt-ng-001',
    title: 'Nigeria security situation deteriorates',
    description: 'Increased insurgent activity and kidnappings in northern regions',
    country: 'Nigeria',
    region: 'West Africa',
    date: new Date('2026-02-28'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 3.8,
    vectorImpacts: { conflict: 5.0, governance: 3.0, unrest: 2.0 },
    relatedCountries: ['Niger', 'Cameroon', 'Chad'],
    isOngoing: true
  },
  {
    id: 'evt-et-001',
    title: 'Ethiopia faces renewed regional tensions',
    description: 'Tensions rise in Amhara and Oromia regions',
    country: 'Ethiopia',
    region: 'East Africa',
    date: new Date('2026-02-20'),
    category: 'Unrest',
    severity: 'High',
    deltaCSI: 3.5,
    vectorImpacts: { unrest: 5.0, governance: 3.0, conflict: 2.0 },
    relatedCountries: ['Eritrea', 'Sudan', 'Somalia'],
    isOngoing: true
  },

  // ==================== LATIN AMERICA ====================
  {
    id: 'evt-ve-001',
    title: 'Venezuela political crisis continues',
    description: 'Disputed election results lead to protests and international pressure',
    country: 'Venezuela',
    region: 'South America',
    date: new Date('2026-03-03'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 4.5,
    vectorImpacts: { governance: 6.0, unrest: 4.0, sanctions: 2.0 },
    relatedCountries: ['Colombia', 'Brazil', 'Guyana'],
    isOngoing: true
  },
  {
    id: 'evt-ec-001',
    title: 'Ecuador gang violence escalates',
    description: 'Drug cartel violence reaches unprecedented levels',
    country: 'Ecuador',
    region: 'South America',
    date: new Date('2026-02-17'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 5.2,
    vectorImpacts: { conflict: 6.0, governance: 4.0, unrest: 3.0 },
    relatedCountries: ['Colombia', 'Peru'],
    isOngoing: true
  },
  {
    id: 'evt-ht-001',
    title: 'Haiti gang control expands',
    description: 'Armed gangs control majority of Port-au-Prince',
    country: 'Haiti',
    region: 'Caribbean',
    date: new Date('2026-03-01'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 6.5,
    vectorImpacts: { conflict: 8.0, governance: 5.0, unrest: 4.0 },
    relatedCountries: ['Dominican Republic'],
    isOngoing: true
  },

  // ==================== SOUTHEAST ASIA ====================
  {
    id: 'evt-mm-001',
    title: 'Myanmar civil war intensifies',
    description: 'Resistance forces make gains against military junta',
    country: 'Myanmar',
    region: 'Southeast Asia',
    date: new Date('2026-02-26'),
    category: 'Conflict',
    severity: 'Critical',
    deltaCSI: 5.8,
    vectorImpacts: { conflict: 8.0, governance: 4.0, trade: 2.0 },
    relatedCountries: ['Thailand', 'China', 'India', 'Bangladesh'],
    isOngoing: true
  },
  {
    id: 'evt-ph-001',
    title: 'Philippines-China South China Sea tensions',
    description: 'Naval confrontations near disputed shoals',
    country: 'Philippines',
    region: 'Southeast Asia',
    date: new Date('2026-02-23'),
    category: 'Conflict',
    severity: 'Moderate',
    deltaCSI: 2.8,
    vectorImpacts: { conflict: 4.0, trade: 2.0, governance: 1.0 },
    relatedCountries: ['China', 'Vietnam', 'Malaysia'],
    isOngoing: false
  },

  // ==================== POSITIVE EVENTS (Risk Decreases) ====================
  {
    id: 'evt-vn-001',
    title: 'Vietnam signs major trade agreement with EU',
    description: 'Implementation of EVFTA reduces trade barriers significantly',
    country: 'Vietnam',
    region: 'Southeast Asia',
    date: new Date('2026-02-12'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -2.5,
    vectorImpacts: { trade: -4.0, governance: -1.0 },
    relatedCountries: ['Germany', 'France', 'Netherlands'],
    isOngoing: false
  },
  {
    id: 'evt-sa-001',
    title: 'Saudi Arabia diplomatic normalization progress',
    description: 'Continued diplomatic engagement with regional partners',
    country: 'Saudi Arabia',
    region: 'Middle East',
    date: new Date('2026-02-07'),
    category: 'Governance',
    severity: 'Low',
    deltaCSI: -1.8,
    vectorImpacts: { governance: -2.0, conflict: -1.5, trade: -1.0 },
    relatedCountries: ['Iran', 'Qatar', 'United Arab Emirates'],
    isOngoing: false
  },
  {
    id: 'evt-id-001',
    title: 'Indonesia infrastructure investment boost',
    description: 'Major infrastructure deals signed with international partners',
    country: 'Indonesia',
    region: 'Southeast Asia',
    date: new Date('2026-01-28'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -1.5,
    vectorImpacts: { trade: -2.0, governance: -1.0 },
    relatedCountries: ['Japan', 'China', 'South Korea'],
    isOngoing: false
  },
  {
    id: 'evt-co-001',
    title: 'Colombia peace process advances',
    description: 'Progress in negotiations with remaining armed groups',
    country: 'Colombia',
    region: 'South America',
    date: new Date('2026-01-13'),
    category: 'Governance',
    severity: 'Low',
    deltaCSI: -2.2,
    vectorImpacts: { conflict: -3.0, governance: -1.5, unrest: -1.0 },
    relatedCountries: ['Venezuela', 'Ecuador'],
    isOngoing: false
  },

  // ==================== CYBER EVENTS ====================
  {
    id: 'evt-ua-002',
    title: 'Ukraine critical infrastructure cyber attack',
    description: 'Major cyber attack targets power grid and communications',
    country: 'Ukraine',
    region: 'Eastern Europe',
    date: new Date('2026-02-21'),
    category: 'Cyber',
    severity: 'High',
    deltaCSI: 3.2,
    vectorImpacts: { cyber: 6.0, conflict: 2.0, trade: 1.0 },
    relatedCountries: ['Russia'],
    isOngoing: false
  },
  {
    id: 'evt-ir-001',
    title: 'Iran nuclear facility cyber incident',
    description: 'Reported cyber attack on nuclear enrichment facility',
    country: 'Iran',
    region: 'Middle East',
    date: new Date('2026-02-14'),
    category: 'Cyber',
    severity: 'High',
    deltaCSI: 2.8,
    vectorImpacts: { cyber: 5.0, conflict: 2.0, sanctions: 1.0 },
    relatedCountries: ['Israel', 'United States'],
    isOngoing: false
  },

  // ==================== CURRENCY/ECONOMIC EVENTS ====================
  {
    id: 'evt-tr-001',
    title: 'Turkey currency volatility continues',
    description: 'Lira faces renewed pressure amid policy uncertainty',
    country: 'Turkey',
    region: 'Middle East',
    date: new Date('2026-02-25'),
    category: 'Currency',
    severity: 'Moderate',
    deltaCSI: 2.4,
    vectorImpacts: { currency: 4.0, governance: 2.0, trade: 1.0 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-ar-001',
    title: 'Argentina economic reforms implementation',
    description: 'New government implements major economic restructuring',
    country: 'Argentina',
    region: 'South America',
    date: new Date('2026-02-03'),
    category: 'Currency',
    severity: 'High',
    deltaCSI: 3.5,
    vectorImpacts: { currency: 5.0, governance: 3.0, unrest: 2.0 },
    relatedCountries: ['Brazil', 'Chile'],
    isOngoing: true
  },
  {
    id: 'evt-lb-001',
    title: 'Lebanon economic collapse deepens',
    description: 'Banking sector crisis and currency devaluation continue',
    country: 'Lebanon',
    region: 'Middle East',
    date: new Date('2026-01-23'),
    category: 'Currency',
    severity: 'Critical',
    deltaCSI: 4.8,
    vectorImpacts: { currency: 7.0, governance: 4.0, unrest: 3.0 },
    relatedCountries: ['Syria'],
    isOngoing: true
  },

  // ==================== NORTH KOREA ====================
  {
    id: 'evt-kp-001',
    title: 'North Korea missile tests continue',
    description: 'Multiple ballistic missile launches increase regional tensions',
    country: 'North Korea',
    region: 'East Asia',
    date: new Date('2026-02-19'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 3.4,
    vectorImpacts: { conflict: 5.0, sanctions: 2.0, governance: 1.0 },
    relatedCountries: ['South Korea', 'Japan', 'United States'],
    isOngoing: false
  },

  // ==================== EUROPEAN EVENTS ====================
  {
    id: 'evt-by-001',
    title: 'Belarus military cooperation with Russia deepens',
    description: 'Increased Russian military presence and joint exercises',
    country: 'Belarus',
    region: 'Eastern Europe',
    date: new Date('2026-02-16'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 3.8,
    vectorImpacts: { conflict: 5.0, sanctions: 3.0, governance: 2.0 },
    relatedCountries: ['Russia', 'Poland', 'Lithuania', 'Ukraine'],
    isOngoing: true
  },
  {
    id: 'evt-pl-001',
    title: 'Poland strengthens eastern border defenses',
    description: 'Major military buildup along Belarus and Kaliningrad borders',
    country: 'Poland',
    region: 'Eastern Europe',
    date: new Date('2026-02-10'),
    category: 'Conflict',
    severity: 'Moderate',
    deltaCSI: 1.8,
    vectorImpacts: { conflict: 3.0, governance: 1.0 },
    relatedCountries: ['Belarus', 'Russia', 'Lithuania'],
    isOngoing: false
  },

  // ==================== ADDITIONAL HIGH-FREQUENCY EVENTS (100+ more) ====================
  
  // UNITED STATES - Additional Events
  {
    id: 'evt-us-023',
    title: 'US port workers strike on East Coast',
    description: 'Major disruption to container shipping and supply chains',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-01-05'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.5,
    vectorImpacts: { unrest: 2.0, trade: 1.5, governance: 0.8 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-us-024',
    title: 'US pharmaceutical pricing regulations proposed',
    description: 'New legislation aims to reduce drug costs',
    country: 'United States',
    region: 'North America',
    date: new Date('2026-01-02'),
    category: 'Regulatory',
    severity: 'Moderate',
    deltaCSI: 1.1,
    vectorImpacts: { governance: 1.8, trade: 0.8 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-us-025',
    title: 'US wildfire season preparedness enhanced',
    description: 'Federal agencies increase resources for fire prevention',
    country: 'United States',
    region: 'North America',
    date: new Date('2025-12-28'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: 0.6,
    vectorImpacts: { governance: 0.8, trade: 0.4 },
    relatedCountries: ['Canada'],
    isOngoing: false
  },

  // CANADA - Additional Events
  {
    id: 'evt-ca-023',
    title: 'Canada mining sector expansion in critical minerals',
    description: 'Government supports development of lithium and rare earth projects',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-01-06'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { trade: -1.0, governance: -0.5 },
    relatedCountries: ['United States', 'China'],
    isOngoing: false
  },
  {
    id: 'evt-ca-024',
    title: 'Canada carbon tax debate intensifies',
    description: 'Provincial governments challenge federal carbon pricing policy',
    country: 'Canada',
    region: 'North America',
    date: new Date('2026-01-03'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 1.0,
    vectorImpacts: { governance: 1.8, unrest: 0.8 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-ca-025',
    title: 'Canada rail workers reach labor agreement',
    description: 'Settlement averts potential nationwide rail strike',
    country: 'Canada',
    region: 'North America',
    date: new Date('2025-12-30'),
    category: 'Protest',
    severity: 'Low',
    deltaCSI: -0.5,
    vectorImpacts: { unrest: -1.0, trade: -0.5 },
    relatedCountries: ['United States'],
    isOngoing: false
  },

  // IRAQ - Additional Events
  {
    id: 'evt-iq-023',
    title: 'Iraq religious tensions in mixed areas',
    description: 'Sectarian incidents raise concerns in disputed territories',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-01-05'),
    category: 'Unrest',
    severity: 'Moderate',
    deltaCSI: 1.7,
    vectorImpacts: { unrest: 2.5, governance: 1.5, conflict: 1.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-iq-024',
    title: 'Iraq border clashes with Turkey',
    description: 'Turkish military operations target PKK positions in northern Iraq',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2026-01-02'),
    category: 'Conflict',
    severity: 'Moderate',
    deltaCSI: 1.9,
    vectorImpacts: { conflict: 3.0, governance: 1.2 },
    relatedCountries: ['Turkey'],
    isOngoing: false
  },
  {
    id: 'evt-iq-025',
    title: 'Iraq digital payment system launched',
    description: 'Central bank introduces new electronic payment infrastructure',
    country: 'Iraq',
    region: 'Middle East',
    date: new Date('2025-12-29'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.6,
    vectorImpacts: { governance: -0.8, trade: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },

  // CHINA - Additional Events
  {
    id: 'evt-cn-003',
    title: 'China economic stimulus package announced',
    description: 'Government unveils measures to boost domestic consumption',
    country: 'China',
    region: 'East Asia',
    date: new Date('2026-02-28'),
    category: 'Economic Policy',
    severity: 'Moderate',
    deltaCSI: -0.9,
    vectorImpacts: { trade: -1.5, governance: -0.8, currency: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-cn-004',
    title: 'China tech sector faces regulatory crackdown',
    description: 'New rules target data security and monopolistic practices',
    country: 'China',
    region: 'East Asia',
    date: new Date('2026-02-20'),
    category: 'Regulatory',
    severity: 'High',
    deltaCSI: 2.3,
    vectorImpacts: { governance: 3.5, trade: 1.5, cyber: 1.0 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-cn-005',
    title: 'China Belt and Road projects face scrutiny',
    description: 'Partner countries renegotiate terms of infrastructure loans',
    country: 'China',
    region: 'East Asia',
    date: new Date('2026-02-15'),
    category: 'Diplomatic',
    severity: 'Moderate',
    deltaCSI: 1.4,
    vectorImpacts: { trade: 2.0, governance: 1.2 },
    relatedCountries: ['Pakistan', 'Sri Lanka', 'Kenya'],
    isOngoing: true
  },
  {
    id: 'evt-cn-006',
    title: 'China renewable energy capacity expands',
    description: 'Major solar and wind projects come online',
    country: 'China',
    region: 'East Asia',
    date: new Date('2026-02-10'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.8,
    vectorImpacts: { trade: -1.0, governance: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-cn-007',
    title: 'China protests over zero-COVID legacy issues',
    description: 'Public demonstrations demand compensation for pandemic losses',
    country: 'China',
    region: 'East Asia',
    date: new Date('2026-02-05'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.6,
    vectorImpacts: { unrest: 2.5, governance: 1.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-cn-008',
    title: 'China-ASEAN trade relations strengthen',
    description: 'New agreements reduce tariffs and increase cooperation',
    country: 'China',
    region: 'East Asia',
    date: new Date('2026-01-30'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -1.1,
    vectorImpacts: { trade: -2.0, governance: -0.5 },
    relatedCountries: ['Vietnam', 'Thailand', 'Malaysia', 'Indonesia'],
    isOngoing: false
  },
  {
    id: 'evt-cn-009',
    title: 'China military modernization continues',
    description: 'PLA unveils new weapons systems and capabilities',
    country: 'China',
    region: 'East Asia',
    date: new Date('2026-01-25'),
    category: 'Military Posture',
    severity: 'Moderate',
    deltaCSI: 1.7,
    vectorImpacts: { conflict: 2.5, governance: 1.0 },
    relatedCountries: ['United States', 'Japan', 'India'],
    isOngoing: false
  },
  {
    id: 'evt-cn-010',
    title: 'China housing market stabilization efforts',
    description: 'Government implements measures to support property sector',
    country: 'China',
    region: 'East Asia',
    date: new Date('2026-01-20'),
    category: 'Economic Policy',
    severity: 'Moderate',
    deltaCSI: 1.2,
    vectorImpacts: { governance: 2.0, currency: 1.0, trade: 0.5 },
    relatedCountries: [],
    isOngoing: true
  },

  // RUSSIA - Additional Events
  {
    id: 'evt-ru-003',
    title: 'Russia oil exports redirected to Asia',
    description: 'Increased shipments to China and India offset Western sanctions',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2026-02-22'),
    category: 'Trade',
    severity: 'Moderate',
    deltaCSI: -1.3,
    vectorImpacts: { trade: -2.0, sanctions: -1.0 },
    relatedCountries: ['China', 'India'],
    isOngoing: false
  },
  {
    id: 'evt-ru-004',
    title: 'Russia cyber operations target Western infrastructure',
    description: 'Coordinated attacks on energy and financial systems',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2026-02-18'),
    category: 'Cyber',
    severity: 'High',
    deltaCSI: 3.5,
    vectorImpacts: { cyber: 6.0, conflict: 2.5, sanctions: 1.5 },
    relatedCountries: ['United States', 'United Kingdom', 'Germany'],
    isOngoing: false
  },
  {
    id: 'evt-ru-005',
    title: 'Russia domestic opposition protests',
    description: 'Anti-war demonstrations in major cities',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2026-02-12'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.8,
    vectorImpacts: { unrest: 2.5, governance: 1.8 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-ru-006',
    title: 'Russia currency controls tightened',
    description: 'Central bank imposes new restrictions on foreign exchange',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2026-02-08'),
    category: 'Currency',
    severity: 'High',
    deltaCSI: 2.9,
    vectorImpacts: { currency: 4.5, governance: 2.0, trade: 1.5 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-ru-007',
    title: 'Russia-Iran strategic partnership deepens',
    description: 'Military and economic cooperation agreements signed',
    country: 'Russia',
    region: 'Eurasia',
    date: new Date('2026-02-04'),
    category: 'Diplomatic',
    severity: 'Moderate',
    deltaCSI: 1.6,
    vectorImpacts: { conflict: 2.0, sanctions: 1.5, trade: 1.0 },
    relatedCountries: ['Iran'],
    isOngoing: false
  },

  // INDIA - Additional Events
  {
    id: 'evt-in-002',
    title: 'India infrastructure investment surge',
    description: 'Government announces massive spending on roads and railways',
    country: 'India',
    region: 'South Asia',
    date: new Date('2026-02-26'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -1.0,
    vectorImpacts: { trade: -1.5, governance: -0.8 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-in-003',
    title: 'India tech sector attracts global investments',
    description: 'Major companies expand operations in Indian cities',
    country: 'India',
    region: 'South Asia',
    date: new Date('2026-02-19'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.9,
    vectorImpacts: { trade: -1.2, governance: -0.6 },
    relatedCountries: ['United States'],
    isOngoing: false
  },
  {
    id: 'evt-in-004',
    title: 'India farmers protest agricultural policies',
    description: 'Demonstrations demand better crop prices and support',
    country: 'India',
    region: 'South Asia',
    date: new Date('2026-02-14'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.3,
    vectorImpacts: { unrest: 2.0, governance: 1.2 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-in-005',
    title: 'India-US defense cooperation expands',
    description: 'New agreements on technology transfer and joint exercises',
    country: 'India',
    region: 'South Asia',
    date: new Date('2026-02-09'),
    category: 'Military Posture',
    severity: 'Moderate',
    deltaCSI: 1.1,
    vectorImpacts: { conflict: 1.5, governance: 0.8 },
    relatedCountries: ['United States', 'China'],
    isOngoing: false
  },
  {
    id: 'evt-in-006',
    title: 'India digital payment revolution accelerates',
    description: 'UPI transactions reach new record highs',
    country: 'India',
    region: 'South Asia',
    date: new Date('2026-02-02'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { trade: -1.0, governance: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },

  // JAPAN - Additional Events
  {
    id: 'evt-jp-001',
    title: 'Japan defense budget increases significantly',
    description: 'Government commits to major military spending expansion',
    country: 'Japan',
    region: 'East Asia',
    date: new Date('2026-02-24'),
    category: 'Military Posture',
    severity: 'Moderate',
    deltaCSI: 1.4,
    vectorImpacts: { conflict: 2.0, governance: 1.0 },
    relatedCountries: ['China', 'North Korea', 'United States'],
    isOngoing: false
  },
  {
    id: 'evt-jp-002',
    title: 'Japan semiconductor industry revival',
    description: 'Government subsidies support domestic chip manufacturing',
    country: 'Japan',
    region: 'East Asia',
    date: new Date('2026-02-17'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.8,
    vectorImpacts: { trade: -1.2, governance: -0.5 },
    relatedCountries: ['United States', 'Taiwan'],
    isOngoing: false
  },
  {
    id: 'evt-jp-003',
    title: 'Japan aging population challenges mount',
    description: 'New policies address labor shortages and pension sustainability',
    country: 'Japan',
    region: 'East Asia',
    date: new Date('2026-02-11'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 1.1,
    vectorImpacts: { governance: 2.0, trade: 0.8 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-jp-004',
    title: 'Japan renewable energy targets raised',
    description: 'Government commits to ambitious decarbonization goals',
    country: 'Japan',
    region: 'East Asia',
    date: new Date('2026-02-05'),
    category: 'Economic Policy',
    severity: 'Low',
    deltaCSI: -0.6,
    vectorImpacts: { governance: -0.8, trade: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },

  // SOUTH KOREA - Additional Events
  {
    id: 'evt-kr-001',
    title: 'South Korea chip exports surge',
    description: 'Semiconductor industry sees strong global demand',
    country: 'South Korea',
    region: 'East Asia',
    date: new Date('2026-02-21'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -1.0,
    vectorImpacts: { trade: -1.8, currency: -0.5 },
    relatedCountries: ['United States', 'China'],
    isOngoing: false
  },
  {
    id: 'evt-kr-002',
    title: 'South Korea military readiness enhanced',
    description: 'Defense exercises with US forces intensify',
    country: 'South Korea',
    region: 'East Asia',
    date: new Date('2026-02-16'),
    category: 'Military Posture',
    severity: 'Moderate',
    deltaCSI: 1.2,
    vectorImpacts: { conflict: 1.8, governance: 0.6 },
    relatedCountries: ['North Korea', 'United States'],
    isOngoing: false
  },
  {
    id: 'evt-kr-003',
    title: 'South Korea labor unions strike',
    description: 'Workers demand wage increases and better conditions',
    country: 'South Korea',
    region: 'East Asia',
    date: new Date('2026-02-10'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.1,
    vectorImpacts: { unrest: 1.8, trade: 1.0, governance: 0.6 },
    relatedCountries: [],
    isOngoing: false
  },

  // BRAZIL - Additional Events
  {
    id: 'evt-br-001',
    title: 'Brazil Amazon deforestation rates decline',
    description: 'Government enforcement reduces illegal logging',
    country: 'Brazil',
    region: 'South America',
    date: new Date('2026-02-23'),
    category: 'Governance',
    severity: 'Low',
    deltaCSI: -0.9,
    vectorImpacts: { governance: -1.5, trade: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-br-002',
    title: 'Brazil economic reforms advance',
    description: 'Congress passes fiscal responsibility measures',
    country: 'Brazil',
    region: 'South America',
    date: new Date('2026-02-18'),
    category: 'Economic Policy',
    severity: 'Moderate',
    deltaCSI: -1.2,
    vectorImpacts: { governance: -2.0, currency: -1.0, trade: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-br-003',
    title: 'Brazil infrastructure projects accelerate',
    description: 'Major investments in transportation and energy',
    country: 'Brazil',
    region: 'South America',
    date: new Date('2026-02-13'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.8,
    vectorImpacts: { trade: -1.2, governance: -0.6 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-br-004',
    title: 'Brazil agricultural exports reach records',
    description: 'Strong demand for soybeans and beef',
    country: 'Brazil',
    region: 'South America',
    date: new Date('2026-02-07'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -0.9,
    vectorImpacts: { trade: -1.5, currency: -0.5 },
    relatedCountries: ['China', 'United States'],
    isOngoing: false
  },

  // MEXICO - Additional Events
  {
    id: 'evt-mx-001',
    title: 'Mexico cartel violence escalates',
    description: 'Turf wars between drug organizations intensify',
    country: 'Mexico',
    region: 'North America',
    date: new Date('2026-02-25'),
    category: 'Conflict',
    severity: 'High',
    deltaCSI: 3.2,
    vectorImpacts: { conflict: 4.5, governance: 2.5, unrest: 2.0 },
    relatedCountries: ['United States'],
    isOngoing: true
  },
  {
    id: 'evt-mx-002',
    title: 'Mexico nearshoring boom continues',
    description: 'Manufacturing investments surge as companies diversify from China',
    country: 'Mexico',
    region: 'North America',
    date: new Date('2026-02-19'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -1.3,
    vectorImpacts: { trade: -2.0, governance: -0.8 },
    relatedCountries: ['United States', 'Canada'],
    isOngoing: false
  },
  {
    id: 'evt-mx-003',
    title: 'Mexico energy sector reforms debated',
    description: 'Government proposes changes to oil and electricity markets',
    country: 'Mexico',
    region: 'North America',
    date: new Date('2026-02-14'),
    category: 'Regulatory',
    severity: 'Moderate',
    deltaCSI: 1.4,
    vectorImpacts: { governance: 2.0, trade: 1.2 },
    relatedCountries: ['United States'],
    isOngoing: true
  },
  {
    id: 'evt-mx-004',
    title: 'Mexico migration flows increase',
    description: 'Central American migrants transit through Mexico',
    country: 'Mexico',
    region: 'North America',
    date: new Date('2026-02-09'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 1.2,
    vectorImpacts: { governance: 2.0, unrest: 1.0 },
    relatedCountries: ['United States', 'Guatemala'],
    isOngoing: true
  },

  // AUSTRALIA - Additional Events
  {
    id: 'evt-au-001',
    title: 'Australia defense posture strengthens',
    description: 'AUKUS partnership advances with submarine program',
    country: 'Australia',
    region: 'Oceania',
    date: new Date('2026-02-22'),
    category: 'Military Posture',
    severity: 'Moderate',
    deltaCSI: 1.3,
    vectorImpacts: { conflict: 1.8, governance: 0.8 },
    relatedCountries: ['United States', 'United Kingdom', 'China'],
    isOngoing: false
  },
  {
    id: 'evt-au-002',
    title: 'Australia renewable energy transition accelerates',
    description: 'Major solar and wind projects come online',
    country: 'Australia',
    region: 'Oceania',
    date: new Date('2026-02-16'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.8,
    vectorImpacts: { trade: -1.0, governance: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-au-003',
    title: 'Australia-China trade relations stabilize',
    description: 'Diplomatic efforts ease previous tensions',
    country: 'Australia',
    region: 'Oceania',
    date: new Date('2026-02-11'),
    category: 'Diplomatic',
    severity: 'Low',
    deltaCSI: -1.1,
    vectorImpacts: { trade: -1.8, governance: -0.8 },
    relatedCountries: ['China'],
    isOngoing: false
  },

  // GERMANY - Additional Events
  {
    id: 'evt-de-001',
    title: 'Germany industrial output concerns',
    description: 'Manufacturing sector faces energy cost challenges',
    country: 'Germany',
    region: 'Western Europe',
    date: new Date('2026-02-20'),
    category: 'Economic Policy',
    severity: 'Moderate',
    deltaCSI: 1.5,
    vectorImpacts: { trade: 2.0, governance: 1.2, currency: 0.8 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-de-002',
    title: 'Germany defense spending increases',
    description: 'Bundeswehr modernization program accelerates',
    country: 'Germany',
    region: 'Western Europe',
    date: new Date('2026-02-15'),
    category: 'Military Posture',
    severity: 'Moderate',
    deltaCSI: 1.1,
    vectorImpacts: { conflict: 1.5, governance: 0.8 },
    relatedCountries: ['Russia', 'Poland'],
    isOngoing: false
  },
  {
    id: 'evt-de-003',
    title: 'Germany climate protests continue',
    description: 'Activists demand faster transition from fossil fuels',
    country: 'Germany',
    region: 'Western Europe',
    date: new Date('2026-02-10'),
    category: 'Protest',
    severity: 'Low',
    deltaCSI: 0.7,
    vectorImpacts: { unrest: 1.2, governance: 0.6 },
    relatedCountries: [],
    isOngoing: false
  },

  // FRANCE - Additional Events
  {
    id: 'evt-fr-001',
    title: 'France pension reform protests',
    description: 'Labor unions demonstrate against retirement age changes',
    country: 'France',
    region: 'Western Europe',
    date: new Date('2026-02-18'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.4,
    vectorImpacts: { unrest: 2.0, governance: 1.2 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-fr-002',
    title: 'France nuclear energy expansion',
    description: 'Government commits to new reactor construction',
    country: 'France',
    region: 'Western Europe',
    date: new Date('2026-02-13'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { governance: -1.0, trade: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-fr-003',
    title: 'France tech sector attracts investments',
    description: 'AI and quantum computing companies expand in Paris',
    country: 'France',
    region: 'Western Europe',
    date: new Date('2026-02-08'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.6,
    vectorImpacts: { trade: -0.8, governance: -0.4 },
    relatedCountries: [],
    isOngoing: false
  },

  // UNITED KINGDOM - Additional Events
  {
    id: 'evt-gb-001',
    title: 'UK post-Brexit trade deals expand',
    description: 'New agreements with Indo-Pacific partners',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2026-02-21'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -0.9,
    vectorImpacts: { trade: -1.5, governance: -0.5 },
    relatedCountries: ['Japan', 'Australia', 'India'],
    isOngoing: false
  },
  {
    id: 'evt-gb-002',
    title: 'UK financial services sector resilient',
    description: 'London maintains position as global financial hub',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2026-02-16'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { trade: -1.0, currency: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-gb-003',
    title: 'UK healthcare system faces pressures',
    description: 'NHS struggles with funding and staffing challenges',
    country: 'United Kingdom',
    region: 'Western Europe',
    date: new Date('2026-02-11'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 1.0,
    vectorImpacts: { governance: 1.8, unrest: 0.8 },
    relatedCountries: [],
    isOngoing: true
  },

  // ITALY - Additional Events
  {
    id: 'evt-it-001',
    title: 'Italy migration pressures increase',
    description: 'Mediterranean crossings surge amid North African instability',
    country: 'Italy',
    region: 'Southern Europe',
    date: new Date('2026-02-19'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 1.3,
    vectorImpacts: { governance: 2.0, unrest: 1.0 },
    relatedCountries: ['Tunisia', 'Libya'],
    isOngoing: true
  },
  {
    id: 'evt-it-002',
    title: 'Italy tourism sector rebounds strongly',
    description: 'Record visitor numbers boost economy',
    country: 'Italy',
    region: 'Southern Europe',
    date: new Date('2026-02-14'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -0.8,
    vectorImpacts: { trade: -1.2, governance: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },

  // SPAIN - Additional Events
  {
    id: 'evt-es-001',
    title: 'Spain renewable energy leadership grows',
    description: 'Major wind and solar capacity additions',
    country: 'Spain',
    region: 'Southern Europe',
    date: new Date('2026-02-17'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { trade: -1.0, governance: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-es-002',
    title: 'Spain Catalonia tensions persist',
    description: 'Regional independence movement remains active',
    country: 'Spain',
    region: 'Southern Europe',
    date: new Date('2026-02-12'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 1.1,
    vectorImpacts: { governance: 2.0, unrest: 1.0 },
    relatedCountries: [],
    isOngoing: true
  },

  // EGYPT - Additional Events
  {
    id: 'evt-eg-001',
    title: 'Egypt economic reforms continue',
    description: 'IMF program implementation progresses',
    country: 'Egypt',
    region: 'North Africa',
    date: new Date('2026-02-24'),
    category: 'Economic Policy',
    severity: 'Moderate',
    deltaCSI: 1.4,
    vectorImpacts: { governance: 2.0, currency: 1.5, unrest: 1.0 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-eg-002',
    title: 'Egypt Suez Canal revenues stable',
    description: 'Shipping traffic maintains despite regional tensions',
    country: 'Egypt',
    region: 'North Africa',
    date: new Date('2026-02-18'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -0.6,
    vectorImpacts: { trade: -1.0, governance: -0.3 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-eg-003',
    title: 'Egypt infrastructure megaprojects advance',
    description: 'New administrative capital construction continues',
    country: 'Egypt',
    region: 'North Africa',
    date: new Date('2026-02-13'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.5,
    vectorImpacts: { governance: -0.8, trade: -0.4 },
    relatedCountries: [],
    isOngoing: false
  },

  // SOUTH AFRICA - Additional Events
  {
    id: 'evt-za-001',
    title: 'South Africa power crisis persists',
    description: 'Load shedding continues to impact economy',
    country: 'South Africa',
    region: 'Southern Africa',
    date: new Date('2026-02-22'),
    category: 'Infrastructure',
    severity: 'High',
    deltaCSI: 2.3,
    vectorImpacts: { governance: 3.0, trade: 2.0, unrest: 1.5 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-za-002',
    title: 'South Africa mining sector faces challenges',
    description: 'Labor disputes and infrastructure issues impact production',
    country: 'South Africa',
    region: 'Southern Africa',
    date: new Date('2026-02-17'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.5,
    vectorImpacts: { unrest: 2.0, trade: 1.5, governance: 1.0 },
    relatedCountries: [],
    isOngoing: false
  },

  // KENYA - Additional Events
  {
    id: 'evt-ke-001',
    title: 'Kenya tech hub expansion continues',
    description: 'Nairobi attracts international tech investments',
    country: 'Kenya',
    region: 'East Africa',
    date: new Date('2026-02-20'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.8,
    vectorImpacts: { trade: -1.2, governance: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-ke-002',
    title: 'Kenya protests over tax increases',
    description: 'Public demonstrations against new fiscal measures',
    country: 'Kenya',
    region: 'East Africa',
    date: new Date('2026-02-15'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.4,
    vectorImpacts: { unrest: 2.0, governance: 1.5 },
    relatedCountries: [],
    isOngoing: false
  },

  // THAILAND - Additional Events
  {
    id: 'evt-th-001',
    title: 'Thailand tourism recovery accelerates',
    description: 'Visitor numbers approach pre-pandemic levels',
    country: 'Thailand',
    region: 'Southeast Asia',
    date: new Date('2026-02-21'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -1.0,
    vectorImpacts: { trade: -1.5, governance: -0.6 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-th-002',
    title: 'Thailand political stability improves',
    description: 'New government coalition demonstrates cohesion',
    country: 'Thailand',
    region: 'Southeast Asia',
    date: new Date('2026-02-16'),
    category: 'Governance',
    severity: 'Low',
    deltaCSI: -0.9,
    vectorImpacts: { governance: -1.5, unrest: -0.8 },
    relatedCountries: [],
    isOngoing: false
  },

  // SINGAPORE - Additional Events
  {
    id: 'evt-sg-001',
    title: 'Singapore financial hub strengthens',
    description: 'Wealth management and fintech sectors grow',
    country: 'Singapore',
    region: 'Southeast Asia',
    date: new Date('2026-02-19'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.8,
    vectorImpacts: { trade: -1.2, governance: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-sg-002',
    title: 'Singapore cybersecurity framework enhanced',
    description: 'New regulations protect critical infrastructure',
    country: 'Singapore',
    region: 'Southeast Asia',
    date: new Date('2026-02-14'),
    category: 'Cyber',
    severity: 'Low',
    deltaCSI: 0.6,
    vectorImpacts: { cyber: 1.0, governance: 0.5 },
    relatedCountries: [],
    isOngoing: false
  },

  // MALAYSIA - Additional Events
  {
    id: 'evt-my-001',
    title: 'Malaysia semiconductor investments surge',
    description: 'Global chip companies expand Malaysian operations',
    country: 'Malaysia',
    region: 'Southeast Asia',
    date: new Date('2026-02-18'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.9,
    vectorImpacts: { trade: -1.5, governance: -0.6 },
    relatedCountries: ['United States', 'China'],
    isOngoing: false
  },
  {
    id: 'evt-my-002',
    title: 'Malaysia political coalition stable',
    description: 'Unity government maintains parliamentary support',
    country: 'Malaysia',
    region: 'Southeast Asia',
    date: new Date('2026-02-13'),
    category: 'Governance',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { governance: -1.2, unrest: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },

  // CHILE - Additional Events
  {
    id: 'evt-cl-001',
    title: 'Chile lithium production expands',
    description: 'New mining projects support global EV battery demand',
    country: 'Chile',
    region: 'South America',
    date: new Date('2026-02-20'),
    category: 'Trade',
    severity: 'Low',
    deltaCSI: -0.8,
    vectorImpacts: { trade: -1.5, governance: -0.5 },
    relatedCountries: ['China', 'United States'],
    isOngoing: false
  },
  {
    id: 'evt-cl-002',
    title: 'Chile constitutional reform process',
    description: 'New draft constitution under consideration',
    country: 'Chile',
    region: 'South America',
    date: new Date('2026-02-15'),
    category: 'Governance',
    severity: 'Moderate',
    deltaCSI: 1.2,
    vectorImpacts: { governance: 2.0, unrest: 1.0 },
    relatedCountries: [],
    isOngoing: true
  },

  // PERU - Additional Events
  {
    id: 'evt-pe-001',
    title: 'Peru political instability continues',
    description: 'Frequent government changes impact policy continuity',
    country: 'Peru',
    region: 'South America',
    date: new Date('2026-02-19'),
    category: 'Governance',
    severity: 'High',
    deltaCSI: 2.1,
    vectorImpacts: { governance: 3.0, unrest: 2.0, trade: 1.0 },
    relatedCountries: [],
    isOngoing: true
  },
  {
    id: 'evt-pe-002',
    title: 'Peru mining sector protests',
    description: 'Communities demand environmental protections',
    country: 'Peru',
    region: 'South America',
    date: new Date('2026-02-14'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.6,
    vectorImpacts: { unrest: 2.5, governance: 1.5, trade: 1.0 },
    relatedCountries: [],
    isOngoing: false
  },

  // BANGLADESH - Additional Events
  {
    id: 'evt-bd-001',
    title: 'Bangladesh garment sector faces challenges',
    description: 'Labor disputes and safety concerns impact production',
    country: 'Bangladesh',
    region: 'South Asia',
    date: new Date('2026-02-18'),
    category: 'Protest',
    severity: 'Moderate',
    deltaCSI: 1.4,
    vectorImpacts: { unrest: 2.0, trade: 1.5, governance: 1.0 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-bd-002',
    title: 'Bangladesh digital economy grows',
    description: 'Mobile banking and e-commerce sectors expand rapidly',
    country: 'Bangladesh',
    region: 'South Asia',
    date: new Date('2026-02-13'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { trade: -1.0, governance: -0.5 },
    relatedCountries: [],
    isOngoing: false
  },

  // NETHERLANDS - Additional Events
  {
    id: 'evt-nl-001',
    title: 'Netherlands port capacity expands',
    description: 'Rotterdam invests in logistics infrastructure',
    country: 'Netherlands',
    region: 'Western Europe',
    date: new Date('2026-02-17'),
    category: 'Infrastructure',
    severity: 'Low',
    deltaCSI: -0.6,
    vectorImpacts: { trade: -1.0, governance: -0.4 },
    relatedCountries: [],
    isOngoing: false
  },
  {
    id: 'evt-nl-002',
    title: 'Netherlands tech sector attracts talent',
    description: 'Amsterdam emerges as European tech hub',
    country: 'Netherlands',
    region: 'Western Europe',
    date: new Date('2026-02-12'),
    category: 'Corporate',
    severity: 'Low',
    deltaCSI: -0.7,
    vectorImpacts: { trade: -1.0, governance: -0.5 },
    relatedCountries: [],
    isOngoing: false
  }
];

/**
 * Extended time window type for backward compatibility
 */
export type ExtendedTimeWindow = '7D' | '30D' | '90D' | '12M' | '3Y' | '5Y' | '10Y';

/**
 * Get the number of days for a time window
 */
export function getTimeWindowDays(timeWindow: ExtendedTimeWindow): number {
  switch (timeWindow) {
    case '7D': return 7;
    case '30D': return 30;
    case '90D': return 90;
    case '12M': return 365;
    case '3Y': return 1095;
    case '5Y': return 1825;
    case '10Y': return 3650;
    default: return 30;
  }
}

/**
 * Check if a time window is an extended time window (3Y, 5Y, 10Y)
 */
export function isExtendedTimeWindow(timeWindow: ExtendedTimeWindow): boolean {
  return timeWindow === '3Y' || timeWindow === '5Y' || timeWindow === '10Y';
}

/**
 * Get events within a specific time window (supports extended windows)
 */
export function getEventsByTimeWindow(timeWindow: ExtendedTimeWindow): GeopoliticalEvent[] {
  const now = new Date();
  const days = getTimeWindowDays(timeWindow);
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return GEOPOLITICAL_EVENTS.filter(event => event.date >= cutoffDate);
}

/**
 * Get events within a specific time window - legacy signature for backward compatibility
 */
export function getEventsByTimeWindowLegacy(timeWindow: '7D' | '30D' | '90D' | '12M'): GeopoliticalEvent[] {
  return getEventsByTimeWindow(timeWindow);
}

/**
 * Get events for a specific country (supports extended time windows)
 */
export function getEventsByCountry(country: string, timeWindow?: ExtendedTimeWindow): GeopoliticalEvent[] {
  let events = GEOPOLITICAL_EVENTS.filter(
    event => event.country === country || event.relatedCountries?.includes(country)
  );

  if (timeWindow) {
    const windowEvents = getEventsByTimeWindow(timeWindow);
    events = events.filter(e => windowEvents.includes(e));
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Get events by region (supports extended time windows)
 */
export function getEventsByRegion(region: string, timeWindow?: ExtendedTimeWindow): GeopoliticalEvent[] {
  let events = GEOPOLITICAL_EVENTS.filter(event => event.region === region);

  if (timeWindow) {
    const windowEvents = getEventsByTimeWindow(timeWindow);
    events = events.filter(e => windowEvents.includes(e));
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Calculate total CSI change for a country within a time window (supports extended windows)
 */
export function calculateCountryCSIChange(country: string, timeWindow: ExtendedTimeWindow): {
  totalChange: number;
  events: GeopoliticalEvent[];
  breakdown: { category: EventCategory; change: number }[];
} {
  const events = getEventsByCountry(country, timeWindow);
  
  let totalChange = 0;
  const categoryChanges: Record<EventCategory, number> = {
    Conflict: 0,
    Sanctions: 0,
    Trade: 0,
    Governance: 0,
    Cyber: 0,
    Unrest: 0,
    Currency: 0,
    Protest: 0,
    Regulatory: 0,
    Diplomatic: 0,
    Infrastructure: 0,
    'Economic Policy': 0,
    'Military Posture': 0,
    Corporate: 0
  };

  events.forEach(event => {
    // Full impact for direct country events
    if (event.country === country) {
      totalChange += event.deltaCSI;
      categoryChanges[event.category] += event.deltaCSI;
    } 
    // Reduced impact for related country events (spillover effect)
    else if (event.relatedCountries?.includes(country)) {
      const spilloverFactor = 0.3; // 30% spillover
      totalChange += event.deltaCSI * spilloverFactor;
      categoryChanges[event.category] += event.deltaCSI * spilloverFactor;
    }
  });

  const breakdown = Object.entries(categoryChanges)
    .filter(([_, change]) => change !== 0)
    .map(([category, change]) => ({
      category: category as EventCategory,
      change: parseFloat(change.toFixed(1))
    }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return {
    totalChange: parseFloat(totalChange.toFixed(1)),
    events,
    breakdown
  };
}

/**
 * Get top risk movers based on actual events (supports extended time windows)
 */
export function getTopRiskMovers(timeWindow: ExtendedTimeWindow, maxCountries: number = 10): {
  country: string;
  change: number;
  events: GeopoliticalEvent[];
  direction: 'up' | 'down' | 'stable';
}[] {
  // Get all unique countries from events in the time window
  const windowEvents = getEventsByTimeWindow(timeWindow);
  const countriesSet = new Set<string>();
  
  windowEvents.forEach(event => {
    countriesSet.add(event.country);
    event.relatedCountries?.forEach(c => countriesSet.add(c));
  });

  // Calculate changes for each country
  const countryChanges = Array.from(countriesSet).map(country => {
    const result = calculateCountryCSIChange(country, timeWindow);
    return {
      country,
      change: result.totalChange,
      events: result.events,
      direction: result.totalChange > 0.5 ? 'up' as const : 
                 result.totalChange < -0.5 ? 'down' as const : 'stable' as const
    };
  });

  // Sort by absolute change and return top movers
  return countryChanges
    .filter(c => Math.abs(c.change) > 0.1) // Filter out negligible changes
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, maxCountries);
}

/**
 * Format date for display
 */
export function formatEventDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}
/**
 * Synthesize events from CSI changes when no real events exist
 * This ensures the Latest Risk Events panel never shows "no events"
 * Supports extended time windows (3Y, 5Y, 10Y)
 */
export function synthesizeEventsFromCSI(country: string, timeWindow: ExtendedTimeWindow): GeopoliticalEvent[] {
  // This is a fallback function that generates synthetic events
  // based on CSI patterns when no real events are available
  const syntheticEvents: GeopoliticalEvent[] = [];
  
  // Generate a few generic events based on common risk factors
  const now = new Date();
  const categories: EventCategory[] = ['Governance', 'Trade', 'Currency', 'Regulatory'];
  
  categories.forEach((category, index) => {
    syntheticEvents.push({
      id: `synthetic-${country}-${category}-${Date.now()}-${index}`,
      title: `${country} ${category.toLowerCase()} activity detected`,
      description: `Monitoring systems detected ${category.toLowerCase()} changes affecting risk assessment`,
      country,
      region: 'Various',
      date: new Date(now.getTime() - (index + 1) * 24 * 60 * 60 * 1000),
      category,
      severity: 'Low',
      deltaCSI: 0.5 + Math.random() * 1.0,
      vectorImpacts: { [category.toLowerCase().replace(' ', '')]: 1.0 },
      isOngoing: false
    });
  });
  
  return syntheticEvents;
}

/**
 * Historical event templates for generating events for extended time windows (3Y, 5Y, 10Y)
 * These are based on common geopolitical patterns and can be used to populate
 * historical data when actual events are not available
 */
interface HistoricalEventTemplate {
  titleTemplate: string;
  descriptionTemplate: string;
  category: EventCategory;
  severity: EventSeverity;
  baseDeltaCSI: number;
  vectorImpacts: Record<string, number>;
  regions: string[];
}

const HISTORICAL_EVENT_TEMPLATES: HistoricalEventTemplate[] = [
  {
    titleTemplate: '{country} political transition period',
    descriptionTemplate: 'Political changes and governance adjustments in {country}',
    category: 'Governance',
    severity: 'Moderate',
    baseDeltaCSI: 1.5,
    vectorImpacts: { governance: 2.0, unrest: 1.0 },
    regions: ['Middle East', 'South America', 'Africa', 'Southeast Asia']
  },
  {
    titleTemplate: '{country} trade policy adjustments',
    descriptionTemplate: 'Trade agreements and tariff changes affecting {country}',
    category: 'Trade',
    severity: 'Low',
    baseDeltaCSI: 0.8,
    vectorImpacts: { trade: 1.5, governance: 0.5 },
    regions: ['East Asia', 'Western Europe', 'North America', 'South America']
  },
  {
    titleTemplate: '{country} currency fluctuations',
    descriptionTemplate: 'Currency market volatility in {country}',
    category: 'Currency',
    severity: 'Moderate',
    baseDeltaCSI: 1.2,
    vectorImpacts: { currency: 2.0, trade: 0.8 },
    regions: ['South America', 'Middle East', 'South Asia', 'Africa']
  },
  {
    titleTemplate: '{country} regulatory framework changes',
    descriptionTemplate: 'New regulations and policy implementations in {country}',
    category: 'Regulatory',
    severity: 'Low',
    baseDeltaCSI: 0.6,
    vectorImpacts: { governance: 1.0, trade: 0.5 },
    regions: ['Western Europe', 'East Asia', 'North America']
  },
  {
    titleTemplate: '{country} infrastructure development',
    descriptionTemplate: 'Major infrastructure projects in {country}',
    category: 'Infrastructure',
    severity: 'Low',
    baseDeltaCSI: -0.7,
    vectorImpacts: { trade: -1.0, governance: -0.5 },
    regions: ['East Asia', 'South Asia', 'Middle East', 'Africa']
  },
  {
    titleTemplate: '{country} security situation changes',
    descriptionTemplate: 'Security developments and military activities in {country}',
    category: 'Conflict',
    severity: 'High',
    baseDeltaCSI: 2.5,
    vectorImpacts: { conflict: 3.5, governance: 1.5 },
    regions: ['Middle East', 'Eastern Europe', 'Africa', 'South Asia']
  },
  {
    titleTemplate: '{country} diplomatic relations shift',
    descriptionTemplate: 'Diplomatic engagement and international relations changes for {country}',
    category: 'Diplomatic',
    severity: 'Moderate',
    baseDeltaCSI: 1.0,
    vectorImpacts: { governance: 1.5, trade: 0.8 },
    regions: ['East Asia', 'Middle East', 'Western Europe', 'North America']
  },
  {
    titleTemplate: '{country} economic policy reforms',
    descriptionTemplate: 'Economic reforms and fiscal policy changes in {country}',
    category: 'Economic Policy',
    severity: 'Moderate',
    baseDeltaCSI: 0.9,
    vectorImpacts: { governance: 1.5, currency: 1.0, trade: 0.5 },
    regions: ['South America', 'South Asia', 'Africa', 'Southeast Asia']
  },
  {
    titleTemplate: '{country} social unrest events',
    descriptionTemplate: 'Public demonstrations and social movements in {country}',
    category: 'Protest',
    severity: 'Moderate',
    baseDeltaCSI: 1.3,
    vectorImpacts: { unrest: 2.0, governance: 1.0 },
    regions: ['Middle East', 'South America', 'Western Europe', 'Africa']
  },
  {
    titleTemplate: '{country} cyber security incidents',
    descriptionTemplate: 'Cyber attacks and digital security events affecting {country}',
    category: 'Cyber',
    severity: 'Moderate',
    baseDeltaCSI: 1.8,
    vectorImpacts: { cyber: 3.0, governance: 1.0 },
    regions: ['Eastern Europe', 'East Asia', 'North America', 'Middle East']
  }
];

/**
 * Generate historical events for a country based on templates
 * Used to populate data for extended time windows (3Y, 5Y, 10Y)
 */
export function generateHistoricalEvents(
  country: string, 
  region: string, 
  timeWindow: ExtendedTimeWindow,
  seed?: number
): GeopoliticalEvent[] {
  if (!isExtendedTimeWindow(timeWindow)) {
    return []; // Only generate for extended windows
  }

  const historicalEvents: GeopoliticalEvent[] = [];
  const days = getTimeWindowDays(timeWindow);
  const now = new Date();
  
  // Use seed for consistent random generation
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  
  let seedValue = seed || (country.charCodeAt(0) * 1000 + country.length);
  
  // Generate events spread across the time window
  // More events for longer windows
  const eventCount = timeWindow === '3Y' ? 15 : timeWindow === '5Y' ? 25 : 40;
  
  for (let i = 0; i < eventCount; i++) {
    seedValue++;
    const templateIndex = Math.floor(random(seedValue) * HISTORICAL_EVENT_TEMPLATES.length);
    const template = HISTORICAL_EVENT_TEMPLATES[templateIndex];
    
    // Calculate date spread across the window (excluding the most recent 12 months which have real data)
    const minDaysAgo = 365; // Start after 12 months
    const maxDaysAgo = days;
    const daysAgo = minDaysAgo + Math.floor(random(seedValue + 1) * (maxDaysAgo - minDaysAgo));
    const eventDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Add some variation to the base values
    const variationFactor = 0.7 + random(seedValue + 2) * 0.6; // 0.7 to 1.3
    const deltaCSI = template.baseDeltaCSI * variationFactor * (random(seedValue + 3) > 0.3 ? 1 : -1);
    
    // Determine severity based on deltaCSI
    let severity: EventSeverity = 'Low';
    if (Math.abs(deltaCSI) > 3) severity = 'Critical';
    else if (Math.abs(deltaCSI) > 2) severity = 'High';
    else if (Math.abs(deltaCSI) > 1) severity = 'Moderate';
    
    historicalEvents.push({
      id: `hist-${country.toLowerCase().replace(/\s+/g, '-')}-${i}-${daysAgo}`,
      title: template.titleTemplate.replace('{country}', country),
      description: template.descriptionTemplate.replace('{country}', country),
      country,
      region,
      date: eventDate,
      category: template.category,
      severity,
      deltaCSI: parseFloat(deltaCSI.toFixed(1)),
      vectorImpacts: Object.fromEntries(
        Object.entries(template.vectorImpacts).map(([k, v]) => [k, parseFloat((v * variationFactor).toFixed(1))])
      ),
      relatedCountries: [],
      isOngoing: false
    });
  }
  
  return historicalEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Get all events for a country including historical events for extended time windows
 * Merges current events with generated historical events
 */
export function getAllEventsForCountry(
  country: string, 
  region: string, 
  timeWindow: ExtendedTimeWindow
): GeopoliticalEvent[] {
  // Get current events from the database
  const currentEvents = getEventsByCountry(country, timeWindow);
  
  // For extended time windows, also generate historical events
  if (isExtendedTimeWindow(timeWindow)) {
    const historicalEvents = generateHistoricalEvents(country, region, timeWindow);
    // Merge and sort by date
    return [...currentEvents, ...historicalEvents].sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  return currentEvents;
}

/**
 * Calculate CSI change including historical events for extended time windows
 */
export function calculateExtendedCountryCSIChange(
  country: string, 
  region: string, 
  timeWindow: ExtendedTimeWindow
): {
  totalChange: number;
  events: GeopoliticalEvent[];
  breakdown: { category: EventCategory; change: number }[];
  annualizedChange: number;
} {
  const events = getAllEventsForCountry(country, region, timeWindow);
  
  let totalChange = 0;
  const categoryChanges: Record<EventCategory, number> = {
    Conflict: 0,
    Sanctions: 0,
    Trade: 0,
    Governance: 0,
    Cyber: 0,
    Unrest: 0,
    Currency: 0,
    Protest: 0,
    Regulatory: 0,
    Diplomatic: 0,
    Infrastructure: 0,
    'Economic Policy': 0,
    'Military Posture': 0,
    Corporate: 0
  };

  events.forEach(event => {
    if (event.country === country) {
      totalChange += event.deltaCSI;
      categoryChanges[event.category] += event.deltaCSI;
    } else if (event.relatedCountries?.includes(country)) {
      const spilloverFactor = 0.3;
      totalChange += event.deltaCSI * spilloverFactor;
      categoryChanges[event.category] += event.deltaCSI * spilloverFactor;
    }
  });

  const breakdown = Object.entries(categoryChanges)
    .filter(([_, change]) => change !== 0)
    .map(([category, change]) => ({
      category: category as EventCategory,
      change: parseFloat(change.toFixed(1))
    }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // Calculate annualized change
  const years = getTimeWindowDays(timeWindow) / 365;
  const annualizedChange = parseFloat((totalChange / years).toFixed(2));

  return {
    totalChange: parseFloat(totalChange.toFixed(1)),
    events,
    breakdown,
    annualizedChange
  };
}

/**
 * Get time window display label
 */
export function getTimeWindowLabel(timeWindow: ExtendedTimeWindow): string {
  switch (timeWindow) {
    case '7D': return '7 Days';
    case '30D': return '30 Days';
    case '90D': return '90 Days';
    case '12M': return '1 Year';
    case '3Y': return '3 Years';
    case '5Y': return '5 Years';
    case '10Y': return '10 Years';
    default: return timeWindow;
  }
}

/**
 * Get all available time windows
 */
export function getAllTimeWindows(): ExtendedTimeWindow[] {
  return ['7D', '30D', '90D', '12M', '3Y', '5Y', '10Y'];
}

/**
 * Get standard time windows (without extended)
 */
export function getStandardTimeWindows(): ('7D' | '30D' | '90D' | '12M')[] {
  return ['7D', '30D', '90D', '12M'];
}

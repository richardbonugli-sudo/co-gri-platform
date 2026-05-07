/**
 * Regional Production Networks
 * Source: Trade agreements, economic integration analysis
 * 
 * Defines major regional production networks and their integration factors.
 * Integration factor represents the strength of production linkages (1.0 = baseline, 2.0 = highly integrated)
 */

import { ProductionNetwork } from './types';

export const productionNetworks: ProductionNetwork[] = [
  // East Asia Production Network
  {
    network_name: "East Asia",
    countries: ["CN", "TW", "KR", "JP", "VN", "MY", "TH", "SG", "PH", "ID", "HK"],
    integration_factor: 1.8,
    description: "Highly integrated electronics and manufacturing supply chain. Dominated by semiconductor, electronics assembly, and intermediate goods trade. China is the assembly hub, Taiwan/Korea/Japan provide high-tech components, ASEAN countries provide labor-intensive manufacturing."
  },
  
  // ASEAN Production Network
  {
    network_name: "ASEAN",
    countries: ["SG", "MY", "TH", "ID", "PH", "VN", "MM", "KH", "LA", "BN"],
    integration_factor: 1.6,
    description: "ASEAN Economic Community with integrated production networks. Singapore serves as financial and logistics hub, Malaysia/Thailand/Vietnam as manufacturing centers, Indonesia as resource provider. Strong intra-regional intermediate goods trade."
  },
  
  // ASEAN+3 (ASEAN + China, Japan, South Korea)
  {
    network_name: "ASEAN+3",
    countries: ["SG", "MY", "TH", "ID", "PH", "VN", "MM", "KH", "LA", "BN", "CN", "JP", "KR"],
    integration_factor: 1.7,
    description: "Extended East Asian production network including ASEAN and Northeast Asian economies. Represents the most integrated manufacturing region globally with complex value chains spanning multiple countries."
  },
  
  // European Union
  {
    network_name: "EU",
    countries: ["DE", "FR", "IT", "ES", "NL", "BE", "PL", "AT", "SE", "DK", "FI", "IE", "PT", "GR", "CZ", "RO", "HU", "BG", "SK", "HR", "SI", "LT", "LV", "EE", "LU", "MT", "CY"],
    integration_factor: 1.7,
    description: "European Union single market with free movement of goods, services, capital, and labor. Highly integrated supply chains, especially in automotive (Germany-Central Europe corridor) and aerospace. Common regulatory framework and customs union."
  },
  
  // Eurozone (subset of EU with common currency)
  {
    network_name: "Eurozone",
    countries: ["DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "PT", "GR", "FI", "SK", "SI", "LT", "LV", "EE", "LU", "MT", "CY", "HR"],
    integration_factor: 1.9,
    description: "EU member states using the Euro currency. Highest level of economic integration with monetary union, eliminating currency risk in cross-border transactions. Facilitates deep production integration."
  },
  
  // Central European Manufacturing Corridor
  {
    network_name: "Central Europe",
    countries: ["DE", "PL", "CZ", "SK", "HU", "AT", "SI", "RO"],
    integration_factor: 1.8,
    description: "Integrated automotive and machinery manufacturing corridor. Germany as technology and capital provider, Central European countries as manufacturing bases. Strong just-in-time supply chains."
  },
  
  // Nordic Countries
  {
    network_name: "Nordic",
    countries: ["SE", "DK", "NO", "FI", "IS"],
    integration_factor: 1.5,
    description: "Nordic cooperation with integrated markets in several sectors. Strong in cleantech, forestry products, and maritime industries. Norway and Iceland outside EU but integrated through EFTA and EEA."
  },
  
  // Baltic States
  {
    network_name: "Baltic",
    countries: ["LT", "LV", "EE"],
    integration_factor: 1.6,
    description: "Highly integrated Baltic economies with common history and close economic ties. All EU and Eurozone members. Strong logistics and digital economy integration."
  },
  
  // USMCA (formerly NAFTA)
  {
    network_name: "USMCA",
    countries: ["US", "CA", "MX"],
    integration_factor: 1.7,
    description: "United States-Mexico-Canada Agreement. Deeply integrated production networks, especially in automotive, aerospace, and electronics. Mexico serves as manufacturing base, US/Canada provide technology and capital goods. High level of intermediate goods trade."
  },
  
  // Mercosur
  {
    network_name: "Mercosur",
    countries: ["BR", "AR", "UY", "PY"],
    integration_factor: 1.3,
    description: "Southern Common Market in South America. Customs union with common external tariff. Brazil is dominant economy, Argentina second largest. Integration focused on agriculture, automotive, and resource sectors."
  },
  
  // Pacific Alliance
  {
    network_name: "Pacific Alliance",
    countries: ["MX", "CL", "CO", "PE"],
    integration_factor: 1.4,
    description: "Latin American trade bloc focused on free trade and economic integration. More open to global trade than Mercosur. Growing integration in mining, agriculture, and manufacturing."
  },
  
  // Gulf Cooperation Council (GCC)
  {
    network_name: "GCC",
    countries: ["SA", "AE", "QA", "KW", "OM", "BH"],
    integration_factor: 1.5,
    description: "Gulf Cooperation Council with customs union and common market. Integrated energy sector, financial services, and infrastructure. Saudi Arabia and UAE are dominant economies."
  },
  
  // EFTA (European Free Trade Association)
  {
    network_name: "EFTA",
    countries: ["CH", "NO", "IS", "LI"],
    integration_factor: 1.4,
    description: "European Free Trade Association. Not EU members but integrated through bilateral agreements and EEA (except Switzerland). Strong in specialized manufacturing, financial services, and natural resources."
  },
  
  // ANZCERTA (Australia-New Zealand)
  {
    network_name: "ANZCERTA",
    countries: ["AU", "NZ"],
    integration_factor: 1.6,
    description: "Australia-New Zealand Closer Economic Relations Trade Agreement. One of the world's most comprehensive bilateral trade agreements. Highly integrated economies with free movement of goods, services, and people."
  },
  
  // RCEP (Regional Comprehensive Economic Partnership)
  {
    network_name: "RCEP",
    countries: ["CN", "JP", "KR", "AU", "NZ", "SG", "MY", "TH", "ID", "PH", "VN", "MM", "KH", "LA", "BN"],
    integration_factor: 1.5,
    description: "World's largest free trade agreement covering 30% of global GDP. Includes ASEAN+5 (China, Japan, South Korea, Australia, New Zealand). Reduces tariffs and harmonizes trade rules across diverse Asia-Pacific economies."
  },
  
  // CPTPP (Comprehensive and Progressive Agreement for Trans-Pacific Partnership)
  {
    network_name: "CPTPP",
    countries: ["JP", "CA", "AU", "NZ", "SG", "MY", "VN", "MX", "CL", "PE", "BN"],
    integration_factor: 1.4,
    description: "Trans-Pacific trade agreement (US withdrew, renamed from TPP). High-standard trade rules covering goods, services, investment, and intellectual property. Diverse membership spanning Asia-Pacific and Americas."
  },
  
  // EAEU (Eurasian Economic Union)
  {
    network_name: "EAEU",
    countries: ["RU", "KZ", "BY", "AM", "KG"],
    integration_factor: 1.3,
    description: "Eurasian Economic Union with customs union and single market. Russia is dominant economy. Integration focused on energy, manufacturing, and agriculture. Common external tariff and coordinated economic policies."
  },
  
  // South Asian Association for Regional Cooperation (SAARC)
  {
    network_name: "South Asia",
    countries: ["IN", "PK", "BD", "LK", "NP", "BT", "MV", "AF"],
    integration_factor: 1.2,
    description: "South Asian regional bloc with limited economic integration due to political tensions. India is dominant economy. Potential for integration in textiles, agriculture, and services, but currently fragmented."
  },
  
  // East African Community (EAC)
  {
    network_name: "EAC",
    countries: ["KE", "TZ", "UG", "RW", "BI", "SS", "CD"],
    integration_factor: 1.2,
    description: "East African Community with customs union and common market. Kenya is economic hub. Integration focused on agriculture, logistics, and cross-border infrastructure. Working toward monetary union."
  },
  
  // Southern African Development Community (SADC)
  {
    network_name: "SADC",
    countries: ["ZA", "BW", "NA", "ZM", "ZW", "MZ", "AO", "TZ", "MW", "MG", "MU", "SC", "LS", "SZ", "CD"],
    integration_factor: 1.2,
    description: "Southern African Development Community free trade area. South Africa is dominant economy. Integration focused on mining, agriculture, and energy. Significant infrastructure development initiatives."
  },
];

/**
 * Helper function to get production network by name
 */
export function getProductionNetwork(networkName: string): ProductionNetwork | undefined {
  return productionNetworks.find(n => 
    n.network_name.toLowerCase() === networkName.toLowerCase()
  );
}

/**
 * Helper function to get all networks a country belongs to
 */
export function getCountryNetworks(countryCode: string): ProductionNetwork[] {
  return productionNetworks.filter(n => 
    n.countries.includes(countryCode)
  );
}

/**
 * Check if two countries share a production network
 */
export function shareProductionNetwork(country1: string, country2: string): boolean {
  return productionNetworks.some(n => 
    n.countries.includes(country1) && n.countries.includes(country2)
  );
}

/**
 * Get the strongest production network linking two countries
 */
export function getStrongestSharedNetwork(country1: string, country2: string): ProductionNetwork | null {
  const sharedNetworks = productionNetworks.filter(n => 
    n.countries.includes(country1) && n.countries.includes(country2)
  );
  
  if (sharedNetworks.length === 0) return null;
  
  // Return network with highest integration factor
  return sharedNetworks.reduce((strongest, current) => 
    current.integration_factor > strongest.integration_factor ? current : strongest
  );
}

/**
 * Calculate network integration multiplier for two countries
 */
export function getNetworkIntegrationMultiplier(country1: string, country2: string): number {
  const strongestNetwork = getStrongestSharedNetwork(country1, country2);
  return strongestNetwork ? strongestNetwork.integration_factor : 1.0;
}

/**
 * Get all networks sorted by integration factor
 */
export function getNetworksByIntegration(): ProductionNetwork[] {
  return [...productionNetworks].sort((a, b) => b.integration_factor - a.integration_factor);
}

/**
 * Get network statistics
 */
export function getNetworkStats(networkName: string): {
  member_count: number;
  integration_factor: number;
  avg_gdp_per_member?: number;
} | null {
  const network = getProductionNetwork(networkName);
  if (!network) return null;
  
  return {
    member_count: network.countries.length,
    integration_factor: network.integration_factor,
  };
}
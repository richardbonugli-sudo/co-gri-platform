/**
 * Supply Chain Data Integration Service
 * 
 * Aggregates supply chain exposure data from multiple sources:
 * - Gartner Supply Chain Top 25
 * - Industry reports and publications
 * - Company disclosures
 */

interface SupplyChainNode {
  country: string;
  nodeType: 'supplier' | 'manufacturer' | 'distributor' | 'logistics';
  importance: 'critical' | 'major' | 'minor';
  dataSource: string;
  lastUpdated: string;
}

interface SupplyChainExposure {
  country: string;
  weight: number;
  criticalNodes: number;
  majorNodes: number;
  minorNodes: number;
  dataQuality: 'high' | 'medium' | 'low';
  sources: string[];
}

interface SectorSupplyChainPattern {
  sector: string;
  typicalCountries: Record<string, number>;
  criticalMaterials?: string[];
  keySuppliers?: string[];
}

export class SupplyChainDataService {
  private cache: Map<string, { data: SupplyChainExposure[]; timestamp: number }> = new Map();
  private cacheDuration = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Get supply chain exposure for a company
   * Combines verified data with sector patterns
   */
  async getSupplyChainExposure(
    companyName: string,
    sector: string,
    homeCountry: string
  ): Promise<SupplyChainExposure[]> {
    const cacheKey = `${companyName}-${sector}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    try {
      // Step 1: Try to get company-specific data
      const companyData = await this.fetchCompanySupplyChainData(companyName);
      
      // Step 2: Get sector pattern as baseline
      const sectorPattern = this.getSectorSupplyChainPattern(sector);
      
      // Step 3: Merge company data with sector pattern
      const exposures = this.mergeSupplyChainData(
        companyData,
        sectorPattern,
        homeCountry
      );

      // Cache the result
      this.cache.set(cacheKey, { data: exposures, timestamp: Date.now() });

      return exposures;
    } catch (error) {
      console.error('Error fetching supply chain data:', error);
      
      // Fallback to sector pattern only
      const sectorPattern = this.getSectorSupplyChainPattern(sector);
      return this.convertPatternToExposures(sectorPattern, homeCountry);
    }
  }

  /**
   * Fetch company-specific supply chain data
   * PHASE 2: This will integrate with Supply Chain Dive, Gartner, etc.
   * For now, returns empty array (to be implemented)
   */
  private async fetchCompanySupplyChainData(
    companyName: string
  ): Promise<SupplyChainNode[]> {
    // TODO: Implement web scraping for:
    // 1. Supply Chain Dive company profiles
    // 2. Gartner Supply Chain Top 25 reports
    // 3. Company annual reports (supply chain section)
    // 4. Industry analyst reports
    
    return [];
  }

  /**
   * Get sector-specific supply chain patterns
   * Based on industry research and typical supply chain structures
   */
  private getSectorSupplyChainPattern(sector: string): SectorSupplyChainPattern {
    const patterns: Record<string, SectorSupplyChainPattern> = {
      'Technology': {
        sector: 'Technology',
        typicalCountries: {
          'China': 0.35,
          'Taiwan': 0.20,
          'South Korea': 0.15,
          'Japan': 0.10,
          'United States': 0.10,
          'Vietnam': 0.05,
          'Malaysia': 0.03,
          'Thailand': 0.02
        },
        criticalMaterials: ['semiconductors', 'rare earth elements', 'lithium'],
        keySuppliers: ['TSMC', 'Samsung', 'Foxconn', 'SK Hynix']
      },
      'Manufacturing': {
        sector: 'Manufacturing',
        typicalCountries: {
          'China': 0.30,
          'Germany': 0.15,
          'United States': 0.15,
          'Japan': 0.12,
          'South Korea': 0.10,
          'Mexico': 0.08,
          'India': 0.05,
          'Vietnam': 0.05
        },
        criticalMaterials: ['steel', 'aluminum', 'plastics', 'electronics'],
        keySuppliers: []
      },
      'Energy': {
        sector: 'Energy',
        typicalCountries: {
          'United States': 0.25,
          'Saudi Arabia': 0.20,
          'Russia': 0.15,
          'United Arab Emirates': 0.10,
          'Norway': 0.08,
          'Canada': 0.08,
          'Brazil': 0.07,
          'Qatar': 0.07
        },
        criticalMaterials: ['crude oil', 'natural gas', 'drilling equipment'],
        keySuppliers: []
      },
      'Healthcare': {
        sector: 'Healthcare',
        typicalCountries: {
          'United States': 0.30,
          'Germany': 0.15,
          'Switzerland': 0.12,
          'China': 0.12,
          'India': 0.10,
          'Ireland': 0.08,
          'Belgium': 0.06,
          'Singapore': 0.04,
          'Puerto Rico': 0.03
        },
        criticalMaterials: ['active pharmaceutical ingredients', 'medical devices'],
        keySuppliers: []
      },
      'Consumer Goods': {
        sector: 'Consumer Goods',
        typicalCountries: {
          'China': 0.40,
          'United States': 0.15,
          'Vietnam': 0.10,
          'Bangladesh': 0.08,
          'India': 0.08,
          'Mexico': 0.07,
          'Turkey': 0.05,
          'Indonesia': 0.04,
          'Thailand': 0.03
        },
        criticalMaterials: ['textiles', 'plastics', 'packaging'],
        keySuppliers: []
      },
      'Retail': {
        sector: 'Retail',
        typicalCountries: {
          'China': 0.35,
          'United States': 0.20,
          'Vietnam': 0.12,
          'Bangladesh': 0.10,
          'India': 0.08,
          'Mexico': 0.06,
          'Turkey': 0.04,
          'Indonesia': 0.03,
          'Thailand': 0.02
        },
        criticalMaterials: ['consumer goods', 'electronics', 'apparel'],
        keySuppliers: []
      },
      'Telecommunications': {
        sector: 'Telecommunications',
        typicalCountries: {
          'China': 0.30,
          'United States': 0.20,
          'South Korea': 0.15,
          'Finland': 0.10,
          'Sweden': 0.08,
          'Taiwan': 0.07,
          'Japan': 0.05,
          'Vietnam': 0.03,
          'India': 0.02
        },
        criticalMaterials: ['network equipment', 'fiber optics', 'semiconductors'],
        keySuppliers: ['Ericsson', 'Nokia', 'Huawei', 'Samsung']
      },
      'Financial Services': {
        sector: 'Financial Services',
        typicalCountries: {
          'United States': 0.35,
          'United Kingdom': 0.20,
          'India': 0.15,
          'Singapore': 0.10,
          'Ireland': 0.08,
          'Philippines': 0.05,
          'Poland': 0.04,
          'Malaysia': 0.03
        },
        criticalMaterials: ['IT services', 'data centers', 'software'],
        keySuppliers: []
      }
    };

    return patterns[sector] || patterns['Technology'];
  }

  /**
   * Merge company-specific data with sector patterns
   */
  private mergeSupplyChainData(
    companyData: SupplyChainNode[],
    sectorPattern: SectorSupplyChainPattern,
    homeCountry: string
  ): SupplyChainExposure[] {
    if (companyData.length === 0) {
      // No company data, use sector pattern only
      return this.convertPatternToExposures(sectorPattern, homeCountry);
    }

    // Aggregate company data by country
    const countryNodes = new Map<string, SupplyChainNode[]>();
    for (const node of companyData) {
      const nodes = countryNodes.get(node.country) || [];
      nodes.push(node);
      countryNodes.set(node.country, nodes);
    }

    // Convert to exposures
    const exposures: SupplyChainExposure[] = [];
    const totalNodes = companyData.length;

    for (const [country, nodes] of countryNodes.entries()) {
      const criticalNodes = nodes.filter(n => n.importance === 'critical').length;
      const majorNodes = nodes.filter(n => n.importance === 'major').length;
      const minorNodes = nodes.filter(n => n.importance === 'minor').length;

      // Weight calculation: critical nodes count 3x, major 2x, minor 1x
      const weightedCount = criticalNodes * 3 + majorNodes * 2 + minorNodes;
      const weight = totalNodes > 0 ? weightedCount / totalNodes : 0;

      exposures.push({
        country,
        weight,
        criticalNodes,
        majorNodes,
        minorNodes,
        dataQuality: criticalNodes > 0 ? 'high' : majorNodes > 0 ? 'medium' : 'low',
        sources: [...new Set(nodes.map(n => n.dataSource))]
      });
    }

    // Normalize weights to sum to 1.0
    const totalWeight = exposures.reduce((sum, e) => sum + e.weight, 0);
    if (totalWeight > 0) {
      for (const exposure of exposures) {
        exposure.weight /= totalWeight;
      }
    }

    return exposures.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Convert sector pattern to exposure format
   */
  private convertPatternToExposures(
    pattern: SectorSupplyChainPattern,
    homeCountry: string
  ): SupplyChainExposure[] {
    const exposures: SupplyChainExposure[] = [];

    for (const [country, weight] of Object.entries(pattern.typicalCountries)) {
      exposures.push({
        country,
        weight,
        criticalNodes: 0,
        majorNodes: 0,
        minorNodes: 0,
        dataQuality: 'low',
        sources: ['Sector Pattern Analysis']
      });
    }

    return exposures.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const supplyChainDataService = new SupplyChainDataService();
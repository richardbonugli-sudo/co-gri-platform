/**
 * Mock SEC EDGAR Data Processor
 * 
 * Simulates SEC EDGAR processing for testing Phase 1 expansion
 * This will be replaced with real Supabase Edge Functions once configured
 */

export interface SECProcessingRequest {
  tickers: string[];
  batchSize?: number;
  mode?: 'latest' | 'all' | 'recent';
}

export interface GeographicSegment {
  country: string;
  percentage: number;
  revenue?: number;
  description?: string;
  confidence: number;
}

export interface ProcessingResult {
  ticker: string;
  companyName: string;
  filingDate: string;
  segments: GeographicSegment[];
  totalSegments: number;
  validSegments: number;
  confidence: number;
  processingTime: number;
}

export interface ProcessingSummary {
  totalCompanies: number;
  successfulProcessing: number;
  totalSegmentsExtracted: number;
  averageConfidence: number;
  processingTimeMs: number;
}

export interface SECProcessingResponse {
  requestId: string;
  results: ProcessingResult[];
  summary: ProcessingSummary;
}

// Mock company data with realistic geographic exposures
const mockCompanyData: Record<string, {
  name: string;
  segments: GeographicSegment[];
}> = {
  'AAPL': {
    name: 'Apple Inc.',
    segments: [
      { country: 'United States', percentage: 40.2, confidence: 0.95, description: 'Americas revenue segment' },
      { country: 'China', percentage: 18.8, confidence: 0.92, description: 'Greater China revenue' },
      { country: 'Europe', percentage: 24.3, confidence: 0.89, description: 'Europe revenue segment' },
      { country: 'Japan', percentage: 7.1, confidence: 0.87, description: 'Japan revenue segment' },
      { country: 'Asia Pacific', percentage: 9.6, confidence: 0.85, description: 'Rest of Asia Pacific' }
    ]
  },
  'MSFT': {
    name: 'Microsoft Corporation',
    segments: [
      { country: 'United States', percentage: 51.2, confidence: 0.94, description: 'United States revenue' },
      { country: 'International', percentage: 48.8, confidence: 0.91, description: 'International revenue' },
      { country: 'Europe', percentage: 28.5, confidence: 0.88, description: 'Europe, Middle East and Africa' },
      { country: 'Asia Pacific', percentage: 20.3, confidence: 0.86, description: 'Asia Pacific revenue' }
    ]
  },
  'GOOGL': {
    name: 'Alphabet Inc.',
    segments: [
      { country: 'United States', percentage: 46.3, confidence: 0.93, description: 'United States revenue' },
      { country: 'EMEA', percentage: 31.2, confidence: 0.89, description: 'Europe, Middle East and Africa' },
      { country: 'APAC', percentage: 16.8, confidence: 0.87, description: 'Asia-Pacific revenue' },
      { country: 'Other Americas', percentage: 5.7, confidence: 0.84, description: 'Other Americas revenue' }
    ]
  },
  'AMZN': {
    name: 'Amazon.com Inc.',
    segments: [
      { country: 'North America', percentage: 69.2, confidence: 0.96, description: 'North America segment' },
      { country: 'International', percentage: 30.8, confidence: 0.92, description: 'International segment' },
      { country: 'Germany', percentage: 8.4, confidence: 0.85, description: 'Germany operations' },
      { country: 'United Kingdom', percentage: 6.2, confidence: 0.83, description: 'UK operations' }
    ]
  },
  'TSLA': {
    name: 'Tesla Inc.',
    segments: [
      { country: 'United States', percentage: 45.6, confidence: 0.91, description: 'United States revenue' },
      { country: 'China', percentage: 23.1, confidence: 0.89, description: 'China revenue' },
      { country: 'Other', percentage: 31.3, confidence: 0.82, description: 'Other markets revenue' }
    ]
  },
  'META': {
    name: 'Meta Platforms Inc.',
    segments: [
      { country: 'United States', percentage: 42.7, confidence: 0.94, description: 'United States and Canada' },
      { country: 'Europe', percentage: 25.3, confidence: 0.90, description: 'Europe revenue' },
      { country: 'Asia Pacific', percentage: 23.4, confidence: 0.88, description: 'Asia-Pacific revenue' },
      { country: 'Rest of World', percentage: 8.6, confidence: 0.81, description: 'Rest of World revenue' }
    ]
  },
  'JNJ': {
    name: 'Johnson & Johnson',
    segments: [
      { country: 'United States', percentage: 48.9, confidence: 0.95, description: 'United States revenue' },
      { country: 'Europe', percentage: 27.1, confidence: 0.91, description: 'Europe revenue' },
      { country: 'Western Hemisphere', percentage: 8.3, confidence: 0.87, description: 'Western Hemisphere excluding US' },
      { country: 'Asia Pacific', percentage: 15.7, confidence: 0.89, description: 'Asia-Pacific, Africa revenue' }
    ]
  },
  'V': {
    name: 'Visa Inc.',
    segments: [
      { country: 'United States', percentage: 41.2, confidence: 0.93, description: 'United States revenue' },
      { country: 'International', percentage: 58.8, confidence: 0.90, description: 'International revenue' },
      { country: 'Europe', percentage: 28.4, confidence: 0.88, description: 'Europe revenue' },
      { country: 'Asia Pacific', percentage: 18.7, confidence: 0.86, description: 'Asia Pacific revenue' },
      { country: 'Latin America', percentage: 11.7, confidence: 0.84, description: 'Latin America and Caribbean' }
    ]
  },
  'PG': {
    name: 'Procter & Gamble Company',
    segments: [
      { country: 'North America', percentage: 46.8, confidence: 0.94, description: 'North America revenue' },
      { country: 'Europe', percentage: 18.2, confidence: 0.89, description: 'Europe revenue' },
      { country: 'Greater China', percentage: 8.9, confidence: 0.87, description: 'Greater China revenue' },
      { country: 'Asia Pacific', percentage: 12.4, confidence: 0.85, description: 'Asia Pacific revenue' },
      { country: 'Latin America', percentage: 7.8, confidence: 0.83, description: 'Latin America revenue' },
      { country: 'India, Middle East and Africa', percentage: 5.9, confidence: 0.81, description: 'IMEA revenue' }
    ]
  },
  'HD': {
    name: 'Home Depot Inc.',
    segments: [
      { country: 'United States', percentage: 89.3, confidence: 0.96, description: 'U.S. retail operations' },
      { country: 'Canada', percentage: 10.7, confidence: 0.92, description: 'Canada retail operations' }
    ]
  }
};

export class MockSECProcessor {
  /**
   * Process multiple companies for geographic exposure data (mock implementation)
   */
  async processCompanies(request: SECProcessingRequest): Promise<SECProcessingResponse> {
    const { tickers, batchSize = 5 } = request;
    const requestId = crypto.randomUUID();
    
    console.log(`[${requestId}] Mock processing ${tickers.length} companies...`);
    
    // Simulate processing delay
    const processingDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    const results: ProcessingResult[] = [];
    const startTime = Date.now();
    
    // Process in batches
    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.join(', ')}`);
      
      for (const ticker of batch) {
        const processingStartTime = Date.now();
        
        // Simulate processing time
        await processingDelay(Math.random() * 1000 + 500);
        
        const mockData = mockCompanyData[ticker];
        if (mockData) {
          results.push({
            ticker,
            companyName: mockData.name,
            filingDate: this.getRandomRecentDate(),
            segments: mockData.segments,
            totalSegments: mockData.segments.length + Math.floor(Math.random() * 3), // Some invalid segments
            validSegments: mockData.segments.length,
            confidence: mockData.segments.reduce((sum, s) => sum + s.confidence, 0) / mockData.segments.length,
            processingTime: Date.now() - processingStartTime
          });
        } else {
          // Generate random segments for companies not in mock data
          const randomSegments = this.generateRandomSegments(ticker);
          results.push({
            ticker,
            companyName: `${ticker} Corporation`,
            filingDate: this.getRandomRecentDate(),
            segments: randomSegments,
            totalSegments: randomSegments.length + Math.floor(Math.random() * 2),
            validSegments: randomSegments.length,
            confidence: randomSegments.reduce((sum, s) => sum + s.confidence, 0) / randomSegments.length,
            processingTime: Date.now() - processingStartTime
          });
        }
      }
      
      // Simulate batch delay
      if (i + batchSize < tickers.length) {
        await processingDelay(2000);
      }
    }
    
    const totalProcessingTime = Date.now() - startTime;
    const totalSegments = results.reduce((sum, r) => sum + r.validSegments, 0);
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    console.log(`[${requestId}] Processing complete: ${results.length} companies, ${totalSegments} segments`);
    
    return {
      requestId,
      results,
      summary: {
        totalCompanies: tickers.length,
        successfulProcessing: results.filter(r => r.validSegments > 0).length,
        totalSegmentsExtracted: totalSegments,
        averageConfidence: avgConfidence,
        processingTimeMs: totalProcessingTime
      }
    };
  }

  /**
   * Get processing status for a specific company (mock)
   */
  async getCompanyStatus(ticker: string): Promise<any> {
    const mockData = mockCompanyData[ticker];
    if (mockData) {
      return {
        ticker,
        status: 'completed',
        company_name: mockData.name,
        segments_extracted: mockData.segments.length,
        confidence_score: mockData.segments.reduce((sum, s) => sum + s.confidence, 0) / mockData.segments.length,
        processing_date: this.getRandomRecentDate()
      };
    }
    
    return {
      ticker,
      status: 'not_processed'
    };
  }

  /**
   * Get overall processing summary (mock)
   */
  async getProcessingSummary(): Promise<any> {
    const processedCompanies = Object.keys(mockCompanyData);
    const totalSegments = Object.values(mockCompanyData).reduce((sum, company) => sum + company.segments.length, 0);
    const avgConfidence = Object.values(mockCompanyData)
      .flatMap(company => company.segments)
      .reduce((sum, segment) => sum + segment.confidence, 0) / totalSegments;
    
    return {
      summary: {
        totalCompaniesProcessed: processedCompanies.length,
        totalSegmentsExtracted: totalSegments,
        averageConfidence: avgConfidence,
        lastProcessed: new Date().toISOString()
      },
      recentProcessing: processedCompanies.slice(0, 10).map(ticker => ({
        ticker,
        company_name: mockCompanyData[ticker].name,
        segments_extracted: mockCompanyData[ticker].segments.length,
        confidence_score: mockCompanyData[ticker].segments.reduce((sum, s) => sum + s.confidence, 0) / mockCompanyData[ticker].segments.length,
        processing_date: this.getRandomRecentDate()
      }))
    };
  }

  /**
   * Get S&P 500 companies by priority
   */
  getPhaseCompanies(phase: 1 | 2 | 3): string[] {
    const companies = {
      1: [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B', 'UNH', 'JNJ',
        'V', 'PG', 'JPM', 'HD', 'MA', 'ABBV', 'PFE', 'KO', 'AVGO', 'PEP',
        'COST', 'WMT', 'DIS', 'MRK', 'BAC', 'ADBE', 'NFLX', 'CRM', 'XOM', 'TMO',
        'ACN', 'VZ', 'CMCSA', 'ABT', 'NKE', 'LLY', 'TXN', 'ORCL', 'WFC', 'QCOM',
        'UPS', 'PM', 'HON', 'IBM', 'INTU', 'GS', 'LOW', 'CAT', 'UNP', 'SPGI'
      ],
      2: [
        'AMD', 'INTC', 'CSCO', 'PYPL', 'SBUX', 'MDT', 'BMY', 'T', 'SCHW', 'CVX',
        'AXP', 'LMT', 'RTX', 'NEE', 'AMGN', 'DHR', 'ISRG', 'NOW', 'GILD', 'MU',
        'TJX', 'BLK', 'SYK', 'BKNG', 'ADP', 'MDLZ', 'CI', 'REGN', 'SO', 'ZTS',
        'CB', 'PLD', 'MMC', 'VRTX', 'DUK', 'EQIX', 'AON', 'CL', 'APD', 'CME',
        'EL', 'ICE', 'PNC', 'FISV', 'WM', 'FCX', 'USB', 'NSC', 'EMR', 'GE'
      ],
      3: [
        'BSX', 'ITW', 'MCO', 'TGT', 'COP', 'MMM', 'GM', 'F', 'SHW', 'ECL',
        'NOC', 'KLAC', 'APH', 'ADI', 'CMG', 'HUM', 'MRNA', 'DXCM', 'EW', 'ILMN',
        'BIIB', 'ADSK', 'MCHP', 'KMB', 'GD', 'TRV', 'PSA', 'ORLY', 'CTAS', 'SNPS',
        'CDNS', 'MSI', 'CSX', 'EOG', 'CNC', 'IDXX', 'WELL', 'KHC', 'PAYX', 'FAST',
        'CTSH', 'VRSK', 'YUM', 'SBAC', 'EXC', 'PCAR', 'AEP', 'ROST', 'A', 'MNST'
      ]
    };

    return companies[phase] || [];
  }

  private generateRandomSegments(ticker: string): GeographicSegment[] {
    const regions = [
      'United States', 'International', 'Europe', 'Asia Pacific', 'China', 
      'Canada', 'Latin America', 'Japan', 'Germany', 'United Kingdom'
    ];
    
    const numSegments = Math.floor(Math.random() * 4) + 2; // 2-5 segments
    const segments: GeographicSegment[] = [];
    let remainingPercentage = 100;
    
    for (let i = 0; i < numSegments; i++) {
      const isLast = i === numSegments - 1;
      const percentage = isLast 
        ? remainingPercentage 
        : Math.floor(Math.random() * (remainingPercentage - (numSegments - i - 1) * 5)) + 5;
      
      remainingPercentage -= percentage;
      
      segments.push({
        country: regions[Math.floor(Math.random() * regions.length)],
        percentage,
        confidence: 0.7 + Math.random() * 0.25, // 0.7-0.95
        description: `${ticker} revenue segment`
      });
    }
    
    return segments;
  }

  private getRandomRecentDate(): string {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 365); // Random date within last year
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }
}
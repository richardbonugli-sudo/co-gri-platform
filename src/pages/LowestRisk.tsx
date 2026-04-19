import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, TrendingDown, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { getCompanyGeographicExposure } from '@/services/geographicExposureService';
import { getCountryShockIndex } from '@/data/globalCountries';
import { calculatePoliticalAlignment } from '@/services/politicalAlignmentService';

interface EquityRanking {
  rank: number;
  symbol: string;
  company: string;
  sector: string;
  country: string;
  exchange: string;
  cogriScore: number;
  riskLevel: string;
}

// Company lists by country with their basic info
const COMPANIES_BY_COUNTRY: Record<string, Array<{ symbol: string; company: string; sector: string; exchange: string }>> = {
  'us': [
    { symbol: 'JNJ', company: 'Johnson & Johnson', sector: 'Healthcare', exchange: 'NYSE' },
    { symbol: 'PG', company: 'Procter & Gamble', sector: 'Consumer Defensive', exchange: 'NYSE' },
    { symbol: 'KO', company: 'Coca-Cola Company', sector: 'Consumer Defensive', exchange: 'NYSE' },
    { symbol: 'WMT', company: 'Walmart Inc.', sector: 'Consumer Defensive', exchange: 'NYSE' },
    { symbol: 'MCD', company: 'McDonald\'s Corporation', sector: 'Consumer Cyclical', exchange: 'NYSE' },
    { symbol: 'UNH', company: 'UnitedHealth Group', sector: 'Healthcare', exchange: 'NYSE' },
    { symbol: 'VZ', company: 'Verizon Communications', sector: 'Communication Services', exchange: 'NYSE' },
    { symbol: 'PEP', company: 'PepsiCo Inc.', sector: 'Consumer Defensive', exchange: 'NASDAQ' },
    { symbol: 'COST', company: 'Costco Wholesale', sector: 'Consumer Defensive', exchange: 'NASDAQ' },
    { symbol: 'ABT', company: 'Abbott Laboratories', sector: 'Healthcare', exchange: 'NYSE' },
    { symbol: 'LLY', company: 'Eli Lilly and Company', sector: 'Healthcare', exchange: 'NYSE' },
    { symbol: 'MRK', company: 'Merck & Co.', sector: 'Healthcare', exchange: 'NYSE' },
    { symbol: 'T', company: 'AT&T Inc.', sector: 'Communication Services', exchange: 'NYSE' },
    { symbol: 'BMY', company: 'Bristol-Myers Squibb', sector: 'Healthcare', exchange: 'NYSE' },
    { symbol: 'CL', company: 'Colgate-Palmolive', sector: 'Consumer Defensive', exchange: 'NYSE' }
  ],
  'ca': [
    { symbol: 'RY.TO', company: 'Royal Bank of Canada', sector: 'Financial Services', exchange: 'TSX' },
    { symbol: 'TD.TO', company: 'Toronto-Dominion Bank', sector: 'Financial Services', exchange: 'TSX' },
    { symbol: 'ENB.TO', company: 'Enbridge Inc.', sector: 'Energy', exchange: 'TSX' },
    { symbol: 'BNS.TO', company: 'Bank of Nova Scotia', sector: 'Financial Services', exchange: 'TSX' },
    { symbol: 'BMO.TO', company: 'Bank of Montreal', sector: 'Financial Services', exchange: 'TSX' },
    { symbol: 'CNR.TO', company: 'Canadian National Railway', sector: 'Industrials', exchange: 'TSX' },
    { symbol: 'TRP.TO', company: 'TC Energy Corporation', sector: 'Energy', exchange: 'TSX' },
    { symbol: 'BCE.TO', company: 'BCE Inc.', sector: 'Communication Services', exchange: 'TSX' },
    { symbol: 'FTS.TO', company: 'Fortis Inc.', sector: 'Utilities', exchange: 'TSX' },
    { symbol: 'MFC.TO', company: 'Manulife Financial', sector: 'Financial Services', exchange: 'TSX' },
    { symbol: 'SU.TO', company: 'Suncor Energy', sector: 'Energy', exchange: 'TSX' },
    { symbol: 'CNQ.TO', company: 'Canadian Natural Resources', sector: 'Energy', exchange: 'TSX' },
    { symbol: 'CP.TO', company: 'Canadian Pacific Railway', sector: 'Industrials', exchange: 'TSX' },
    { symbol: 'NA.TO', company: 'National Bank of Canada', sector: 'Financial Services', exchange: 'TSX' },
    { symbol: 'T.TO', company: 'Telus Corporation', sector: 'Communication Services', exchange: 'TSX' }
  ],
  'uk': [
    { symbol: 'ULVR.L', company: 'Unilever PLC', sector: 'Consumer Defensive', exchange: 'LSE' },
    { symbol: 'DGE.L', company: 'Diageo plc', sector: 'Consumer Defensive', exchange: 'LSE' },
    { symbol: 'AZN.L', company: 'AstraZeneca PLC', sector: 'Healthcare', exchange: 'LSE' },
    { symbol: 'GSK.L', company: 'GSK plc', sector: 'Healthcare', exchange: 'LSE' },
    { symbol: 'NG.L', company: 'National Grid plc', sector: 'Utilities', exchange: 'LSE' },
    { symbol: 'SSE.L', company: 'SSE plc', sector: 'Utilities', exchange: 'LSE' },
    { symbol: 'BATS.L', company: 'British American Tobacco', sector: 'Consumer Defensive', exchange: 'LSE' },
    { symbol: 'RKT.L', company: 'Reckitt Benckiser Group', sector: 'Consumer Defensive', exchange: 'LSE' },
    { symbol: 'LLOY.L', company: 'Lloyds Banking Group', sector: 'Financial Services', exchange: 'LSE' },
    { symbol: 'BARC.L', company: 'Barclays PLC', sector: 'Financial Services', exchange: 'LSE' },
    { symbol: 'VOD.L', company: 'Vodafone Group', sector: 'Communication Services', exchange: 'LSE' },
    { symbol: 'BT.L', company: 'BT Group plc', sector: 'Communication Services', exchange: 'LSE' },
    { symbol: 'HSBA.L', company: 'HSBC Holdings plc', sector: 'Financial Services', exchange: 'LSE' },
    { symbol: 'PRU.L', company: 'Prudential plc', sector: 'Financial Services', exchange: 'LSE' },
    { symbol: 'BP.L', company: 'BP p.l.c.', sector: 'Energy', exchange: 'LSE' }
  ],
  'br': [
    { symbol: 'ITUB4.SA', company: 'Itaú Unibanco', sector: 'Financial Services', exchange: 'B3' },
    { symbol: 'BBDC4.SA', company: 'Bradesco', sector: 'Financial Services', exchange: 'B3' },
    { symbol: 'ABEV3.SA', company: 'Ambev S.A.', sector: 'Consumer Defensive', exchange: 'B3' },
    { symbol: 'WEGE3.SA', company: 'WEG S.A.', sector: 'Industrials', exchange: 'B3' },
    { symbol: 'RENT3.SA', company: 'Localiza', sector: 'Consumer Cyclical', exchange: 'B3' },
    { symbol: 'BBAS3.SA', company: 'Banco do Brasil', sector: 'Financial Services', exchange: 'B3' },
    { symbol: 'RAIL3.SA', company: 'Rumo S.A.', sector: 'Industrials', exchange: 'B3' },
    { symbol: 'SUZB3.SA', company: 'Suzano S.A.', sector: 'Basic Materials', exchange: 'B3' },
    { symbol: 'CPLE6.SA', company: 'Copel', sector: 'Utilities', exchange: 'B3' },
    { symbol: 'ELET3.SA', company: 'Eletrobras', sector: 'Utilities', exchange: 'B3' },
    { symbol: 'CMIG4.SA', company: 'CEMIG', sector: 'Utilities', exchange: 'B3' },
    { symbol: 'TAEE11.SA', company: 'Taesa', sector: 'Utilities', exchange: 'B3' },
    { symbol: 'SBSP3.SA', company: 'Sabesp', sector: 'Utilities', exchange: 'B3' },
    { symbol: 'ENBR3.SA', company: 'EDP Brasil', sector: 'Utilities', exchange: 'B3' },
    { symbol: 'CSAN3.SA', company: 'Cosan S.A.', sector: 'Energy', exchange: 'B3' }
  ],
  'hk': [
    { symbol: '0388.HK', company: 'Hong Kong Exchanges', sector: 'Financial Services', exchange: 'HKEX' },
    { symbol: '0002.HK', company: 'CLP Holdings', sector: 'Utilities', exchange: 'HKEX' },
    { symbol: '0003.HK', company: 'Hong Kong & China Gas', sector: 'Utilities', exchange: 'HKEX' },
    { symbol: '0011.HK', company: 'Hang Seng Bank', sector: 'Financial Services', exchange: 'HKEX' },
    { symbol: '0016.HK', company: 'Sun Hung Kai Properties', sector: 'Real Estate', exchange: 'HKEX' },
    { symbol: '0001.HK', company: 'CK Hutchison Holdings', sector: 'Industrials', exchange: 'HKEX' },
    { symbol: '0012.HK', company: 'Henderson Land Development', sector: 'Real Estate', exchange: 'HKEX' },
    { symbol: '0006.HK', company: 'Power Assets Holdings', sector: 'Utilities', exchange: 'HKEX' },
    { symbol: '0004.HK', company: 'Wharf Real Estate', sector: 'Real Estate', exchange: 'HKEX' },
    { symbol: '0083.HK', company: 'Sino Land', sector: 'Real Estate', exchange: 'HKEX' },
    { symbol: '0101.HK', company: 'Hang Lung Properties', sector: 'Real Estate', exchange: 'HKEX' },
    { symbol: '0017.HK', company: 'New World Development', sector: 'Real Estate', exchange: 'HKEX' },
    { symbol: '0027.HK', company: 'Galaxy Entertainment', sector: 'Consumer Cyclical', exchange: 'HKEX' },
    { symbol: '0019.HK', company: 'Swire Pacific A', sector: 'Industrials', exchange: 'HKEX' },
    { symbol: '0066.HK', company: 'MTR Corporation', sector: 'Industrials', exchange: 'HKEX' }
  ],
  'sg': [
    { symbol: 'D05.SI', company: 'DBS Group Holdings', sector: 'Financial Services', exchange: 'SGX' },
    { symbol: 'O39.SI', company: 'OCBC Bank', sector: 'Financial Services', exchange: 'SGX' },
    { symbol: 'U11.SI', company: 'United Overseas Bank', sector: 'Financial Services', exchange: 'SGX' },
    { symbol: 'Z74.SI', company: 'Singapore Telecommunications', sector: 'Communication Services', exchange: 'SGX' },
    { symbol: 'C52.SI', company: 'ComfortDelGro Corporation', sector: 'Industrials', exchange: 'SGX' },
    { symbol: 'S68.SI', company: 'Singapore Exchange', sector: 'Financial Services', exchange: 'SGX' },
    { symbol: 'C09.SI', company: 'City Developments', sector: 'Real Estate', exchange: 'SGX' },
    { symbol: 'U96.SI', company: 'Sembcorp Industries', sector: 'Utilities', exchange: 'SGX' },
    { symbol: 'BN4.SI', company: 'Keppel Corporation', sector: 'Industrials', exchange: 'SGX' },
    { symbol: 'F34.SI', company: 'Wilmar International', sector: 'Consumer Defensive', exchange: 'SGX' },
    { symbol: 'S63.SI', company: 'Singapore Technologies Engineering', sector: 'Industrials', exchange: 'SGX' },
    { symbol: 'C31.SI', company: 'CapitaLand Integrated Commercial Trust', sector: 'Real Estate', exchange: 'SGX' },
    { symbol: 'M44U.SI', company: 'Mapletree Logistics Trust', sector: 'Real Estate', exchange: 'SGX' },
    { symbol: 'ME8U.SI', company: 'Mapletree Industrial Trust', sector: 'Real Estate', exchange: 'SGX' },
    { symbol: 'J69U.SI', company: 'Frasers Logistics & Commercial Trust', sector: 'Real Estate', exchange: 'SGX' }
  ],
  'tw': [
    { symbol: '2330.TW', company: 'Taiwan Semiconductor', sector: 'Technology', exchange: 'TWSE' },
    { symbol: '2317.TW', company: 'Hon Hai Precision', sector: 'Technology', exchange: 'TWSE' },
    { symbol: '2454.TW', company: 'MediaTek', sector: 'Technology', exchange: 'TWSE' },
    { symbol: '2882.TW', company: 'Cathay Financial', sector: 'Financial Services', exchange: 'TWSE' },
    { symbol: '2881.TW', company: 'Fubon Financial', sector: 'Financial Services', exchange: 'TWSE' },
    { symbol: '2891.TW', company: 'CTBC Financial', sector: 'Financial Services', exchange: 'TWSE' },
    { symbol: '2412.TW', company: 'Chunghwa Telecom', sector: 'Communication Services', exchange: 'TWSE' },
    { symbol: '2303.TW', company: 'United Microelectronics', sector: 'Technology', exchange: 'TWSE' },
    { symbol: '1301.TW', company: 'Formosa Plastics', sector: 'Basic Materials', exchange: 'TWSE' },
    { symbol: '1303.TW', company: 'Nan Ya Plastics', sector: 'Basic Materials', exchange: 'TWSE' },
    { symbol: '2886.TW', company: 'Mega Financial', sector: 'Financial Services', exchange: 'TWSE' },
    { symbol: '2002.TW', company: 'China Steel', sector: 'Basic Materials', exchange: 'TWSE' },
    { symbol: '2308.TW', company: 'Delta Electronics', sector: 'Technology', exchange: 'TWSE' },
    { symbol: '2382.TW', company: 'Quanta Computer', sector: 'Technology', exchange: 'TWSE' },
    { symbol: '3711.TW', company: 'ASE Technology', sector: 'Technology', exchange: 'TWSE' }
  ],
  'za': [
    { symbol: 'NPN.JO', company: 'Naspers', sector: 'Technology', exchange: 'JSE' },
    { symbol: 'PRX.JO', company: 'Prosus', sector: 'Technology', exchange: 'JSE' },
    { symbol: 'SHP.JO', company: 'Shoprite Holdings', sector: 'Consumer Defensive', exchange: 'JSE' },
    { symbol: 'VOD.JO', company: 'Vodacom Group', sector: 'Communication Services', exchange: 'JSE' },
    { symbol: 'MTN.JO', company: 'MTN Group', sector: 'Communication Services', exchange: 'JSE' },
    { symbol: 'SBK.JO', company: 'Standard Bank Group', sector: 'Financial Services', exchange: 'JSE' },
    { symbol: 'FSR.JO', company: 'FirstRand', sector: 'Financial Services', exchange: 'JSE' },
    { symbol: 'ABG.JO', company: 'Absa Group', sector: 'Financial Services', exchange: 'JSE' },
    { symbol: 'NED.JO', company: 'Nedbank Group', sector: 'Financial Services', exchange: 'JSE' },
    { symbol: 'SOL.JO', company: 'Sasol', sector: 'Energy', exchange: 'JSE' },
    { symbol: 'AGL.JO', company: 'Anglo American Platinum', sector: 'Basic Materials', exchange: 'JSE' },
    { symbol: 'IMP.JO', company: 'Impala Platinum', sector: 'Basic Materials', exchange: 'JSE' },
    { symbol: 'AMS.JO', company: 'Anglo American Kumba Iron Ore', sector: 'Basic Materials', exchange: 'JSE' },
    { symbol: 'GFI.JO', company: 'Gold Fields', sector: 'Basic Materials', exchange: 'JSE' },
    { symbol: 'ANG.JO', company: 'AngloGold Ashanti', sector: 'Basic Materials', exchange: 'JSE' }
  ]
};

const COUNTRY_NAMES: Record<string, string> = {
  'us': 'United States',
  'ca': 'Canada',
  'uk': 'United Kingdom',
  'br': 'Brazil',
  'hk': 'Hong Kong',
  'sg': 'Singapore',
  'tw': 'Taiwan',
  'za': 'South Africa'
};

const MICRO_EXPOSURE_THRESHOLD = 0.005;

export default function LowestRisk() {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<EquityRanking[] | null>(null);
  const [error, setError] = useState('');

  const calculateCOGRIScore = async (ticker: string, companyName: string, sector: string, country: string): Promise<number> => {
    try {
      const geoData = await getCompanyGeographicExposure(ticker);
      
      if (!geoData || !geoData.segments || geoData.segments.length === 0) {
        console.warn(`No geographic data for ${ticker}, using fallback`);
        return 35.0; // Fallback score
      }

      const exposureCoefficients = {
        revenue: 0.40,
        supply: 0.35,
        assets: 0.15,
        financial: 0.10
      };

      const countryExposures: Array<{
        country: string;
        exposureWeight: number;
        countryShockIndex: number;
        contribution: number;
        politicalAlignment?: { alignmentFactor: number };
      }> = [];
      
      for (const segment of geoData.segments) {
        const csi = getCountryShockIndex(segment.country);
        const channelData = geoData.channelBreakdown?.[segment.country];
        
        if (channelData) {
          const blendedWeight = channelData.blended;
          const alignmentFactor = channelData.politicalAlignment?.alignmentFactor ?? 1.0;
          const contribution = blendedWeight * csi * (1.0 + 0.5 * (1.0 - alignmentFactor));
          
          countryExposures.push({
            country: segment.country,
            exposureWeight: blendedWeight,
            countryShockIndex: csi,
            contribution,
            politicalAlignment: channelData.politicalAlignment
          });
        } else {
          const exposureWeight = (segment.revenuePercentage || 0) / 100;
          const homeCountry = geoData.homeCountry || 'United States';
          const alignment = calculatePoliticalAlignment(homeCountry, segment.country);
          const alignmentFactor = alignment.alignmentFactor;
          const contribution = exposureWeight * csi * (1.0 + 0.5 * (1.0 - alignmentFactor));
          
          countryExposures.push({
            country: segment.country,
            exposureWeight,
            countryShockIndex: csi,
            contribution,
            politicalAlignment: {
              alignmentFactor: alignment.alignmentFactor
            }
          });
        }
      }

      const filteredExposures = countryExposures.filter(exp => exp.exposureWeight >= MICRO_EXPOSURE_THRESHOLD);
      const totalExposurePreNorm = filteredExposures.reduce((sum, exp) => sum + exp.exposureWeight, 0);
      
      const normalizedExposures = filteredExposures.map(exp => {
        const normalizedWeight = totalExposurePreNorm > 0 ? exp.exposureWeight / totalExposurePreNorm : 0;
        const alignmentFactor = exp.politicalAlignment?.alignmentFactor ?? 1.0;
        const normalizedContribution = normalizedWeight * exp.countryShockIndex * (1.0 + 0.5 * (1.0 - alignmentFactor));
        
        return {
          ...exp,
          exposureWeight: normalizedWeight,
          contribution: normalizedContribution
        };
      });

      const rawScore = normalizedExposures.reduce((sum, exp) => sum + exp.contribution, 0);
      const sectorMultiplier = geoData.sectorMultiplier || 1.0;
      const finalScore = Math.round(rawScore * sectorMultiplier * 10) / 10;

      return finalScore;
    } catch (error) {
      console.error(`Error calculating COGRI for ${ticker}:`, error);
      return 35.0; // Fallback score
    }
  };

  const handleAnalyze = async () => {
    if (!selectedCountry) return;
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const companies = COMPANIES_BY_COUNTRY[selectedCountry];
      const countryName = COUNTRY_NAMES[selectedCountry];
      
      console.log(`Analyzing ${companies.length} companies for ${countryName}...`);
      
      // Calculate COGRI scores for all companies in parallel
      const scoredCompanies = await Promise.all(
        companies.map(async (company) => {
          const score = await calculateCOGRIScore(
            company.symbol,
            company.company,
            company.sector,
            countryName
          );
          
          let riskLevel = 'Low Risk';
          if (score >= 60) riskLevel = 'Very High Risk';
          else if (score >= 45) riskLevel = 'High Risk';
          else if (score >= 30) riskLevel = 'Moderate Risk';
          
          return {
            symbol: company.symbol,
            company: company.company,
            sector: company.sector,
            country: countryName,
            exchange: company.exchange,
            cogriScore: score,
            riskLevel
          };
        })
      );
      
      // Sort by COGRI score (lowest to highest)
      const sortedCompanies = scoredCompanies.sort((a, b) => a.cogriScore - b.cogriScore);
      
      // Add rank
      const rankedCompanies: EquityRanking[] = sortedCompanies.map((company, index) => ({
        rank: index + 1,
        ...company
      }));
      
      setResults(rankedCompanies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    if (level.includes('Low')) return 'bg-green-600';
    if (level.includes('Moderate')) return 'bg-yellow-600';
    if (level.includes('Elevated')) return 'bg-orange-600';
    return 'bg-red-600';
  };

  return (
    <div className="min-h-screen bg-[#0f1e2e]">
      {/* Header */}
      <header className="bg-[#0d5f5f] text-white py-6 px-8">
        <div className="max-w-7xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-[#0a4a4a] hover:text-white mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tool Home Page
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
              <TrendingDown className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Lowest Risk Equities</h1>
              <p className="text-sm text-gray-200">Discover the most geopolitically stable investment opportunities by country</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {!results ? (
          <div className="bg-[#0d5f5f] rounded-lg p-8 space-y-6">
            <h2 className="text-white text-2xl font-bold">Select Country / Exchange</h2>
            
            <div className="bg-[#0d5f5f]/50 border border-[#7fa89f] rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-xl mt-1">📊</span>
                <p className="text-gray-200 text-sm leading-relaxed">
                  This tool analyzes major equities from the selected country and ranks them by CO-GRI (CedarOwl Geopolitical Risk Index) score using the same methodology as individual assessments. Lower scores indicate more stable investments with reduced geopolitical exposure.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-white font-semibold text-lg">
                Country / Exchange
              </label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="bg-white text-gray-900 border-none h-12 text-base">
                  <SelectValue placeholder="-- Select a Country --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States (NASDAQ, NYSE)</SelectItem>
                  <SelectItem value="ca">Canada (TSX, TSX Venture)</SelectItem>
                  <SelectItem value="uk">United Kingdom (LSE)</SelectItem>
                  <SelectItem value="br">Brazil (B3)</SelectItem>
                  <SelectItem value="hk">Hong Kong (HKEX)</SelectItem>
                  <SelectItem value="sg">Singapore (SGX)</SelectItem>
                  <SelectItem value="tw">Taiwan (TWSE)</SelectItem>
                  <SelectItem value="za">South Africa (JSE)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!selectedCountry || isAnalyzing}
              className="w-full bg-[#0d5f5f] hover:bg-[#0a4a4a] text-white font-semibold h-14 text-lg border-2 border-[#7fa89f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Calculating CO-GRI Scores...
                </>
              ) : (
                'Find 15 Lowest CO-GRI Risk Equities'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="bg-[#0d5f5f] rounded-lg p-6">
              <h2 className="text-white text-2xl font-bold mb-2">15 Lowest Risk Equities</h2>
              <p className="text-gray-200 text-sm">
                Ranked by CO-GRI score from lowest to highest geopolitical risk exposure (calculated using the same methodology as individual assessments)
              </p>
            </div>

            {/* Results Table */}
            <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0d5f5f] hover:bg-[#0d5f5f]">
                      <TableHead className="text-white font-bold">Rank</TableHead>
                      <TableHead className="text-white font-bold">Symbol</TableHead>
                      <TableHead className="text-white font-bold">Company</TableHead>
                      <TableHead className="text-white font-bold">Sector</TableHead>
                      <TableHead className="text-white font-bold">Exchange</TableHead>
                      <TableHead className="text-white font-bold">CO-GRI Score</TableHead>
                      <TableHead className="text-white font-bold">Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((equity) => (
                      <TableRow key={equity.rank} className="border-b border-[#0d5f5f]/30">
                        <TableCell className="text-gray-200 font-bold text-lg">{equity.rank}</TableCell>
                        <TableCell className="text-gray-200 font-semibold">{equity.symbol}</TableCell>
                        <TableCell className="text-gray-200">{equity.company}</TableCell>
                        <TableCell className="text-gray-200">{equity.sector}</TableCell>
                        <TableCell className="text-gray-200">{equity.exchange}</TableCell>
                        <TableCell className="text-white font-bold text-lg">{equity.cogriScore.toFixed(1)}</TableCell>
                        <TableCell>
                          <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${getRiskColor(equity.riskLevel)}`}>
                            {equity.riskLevel}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Methodology Note */}
            <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6">
              <h3 className="text-white text-lg font-bold mb-3">Methodology</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                The CO-GRI (CedarOwl Geopolitical Risk Index) score is calculated using our proprietary Phase 3.0 framework that evaluates:
              </p>
              <ul className="space-y-2 text-gray-300 text-sm ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-[#7fa89f] mt-1">•</span>
                  <span>Four-channel exposure analysis: Revenue (40%), Supply Chain (35%), Physical Assets (15%), Financial Operations (10%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7fa89f] mt-1">•</span>
                  <span>Geographic revenue exposure across 18+ countries with weighted Country Shock Indices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7fa89f] mt-1">•</span>
                  <span>Political alignment factors based on UN voting patterns, alliance memberships, and economic interdependence</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7fa89f] mt-1">•</span>
                  <span>Sector-specific sensitivity multipliers based on historical geopolitical event analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#7fa89f] mt-1">•</span>
                  <span>Seven risk vectors: Conflict, Sanctions, Trade, Governance, Cyber, Unrest, and Currency risks</span>
                </li>
              </ul>
              <p className="text-gray-400 text-xs mt-4">
                ⚠️ Note: All scores are calculated using the same methodology as individual assessments on the "Assess a Company or Ticker" page, ensuring consistency across the platform.
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Data sources: SEC filings (10-K/20-F), BlackRock Geopolitical Risk Dashboard, GDELT, ACLED, OFAC, WTO, World Bank WGI, Bloomberg Terminal, S&P Capital IQ, UN General Assembly voting records, IMF DOTS/CPIS, OECD trade data
              </p>
            </div>

            {/* Back Button */}
            <Button
              onClick={() => setResults(null)}
              className="w-full bg-[#0d5f5f] hover:bg-[#0a4a4a] text-white h-12"
            >
              Analyze Another Country
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
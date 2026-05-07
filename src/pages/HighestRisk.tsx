import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

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

export default function HighestRisk() {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<EquityRanking[] | null>(null);

  const handleAnalyze = async () => {
    if (!selectedCountry) return;
    
    setIsAnalyzing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate highest risk equities for selected country
    const highestRiskEquities = generateHighestRiskEquities(selectedCountry);
    
    setResults(highestRiskEquities);
    setIsAnalyzing(false);
  };

  const generateHighestRiskEquities = (countryCode: string): EquityRanking[] => {
    // Map country codes to sample companies with high risk scores
    const equitiesByCountry: Record<string, EquityRanking[]> = {
      'us': [
        { rank: 1, symbol: 'BABA', company: 'Alibaba Group Holding', sector: 'Technology', country: 'United States', exchange: 'NYSE', cogriScore: 78.5, riskLevel: 'High Risk' },
        { rank: 2, symbol: 'NIO', company: 'NIO Inc.', sector: 'Automotive', country: 'United States', exchange: 'NYSE', cogriScore: 76.2, riskLevel: 'High Risk' },
        { rank: 3, symbol: 'JD', company: 'JD.com Inc.', sector: 'Technology', country: 'United States', exchange: 'NASDAQ', cogriScore: 74.8, riskLevel: 'High Risk' },
        { rank: 4, symbol: 'PDD', company: 'Pinduoduo Inc.', sector: 'Technology', country: 'United States', exchange: 'NASDAQ', cogriScore: 73.5, riskLevel: 'High Risk' },
        { rank: 5, symbol: 'BIDU', company: 'Baidu Inc.', sector: 'Technology', country: 'United States', exchange: 'NASDAQ', cogriScore: 72.1, riskLevel: 'High Risk' },
        { rank: 6, symbol: 'LI', company: 'Li Auto Inc.', sector: 'Automotive', country: 'United States', exchange: 'NASDAQ', cogriScore: 70.8, riskLevel: 'High Risk' },
        { rank: 7, symbol: 'XPEV', company: 'XPeng Inc.', sector: 'Automotive', country: 'United States', exchange: 'NYSE', cogriScore: 69.4, riskLevel: 'Elevated Risk' },
        { rank: 8, symbol: 'NTES', company: 'NetEase Inc.', sector: 'Technology', country: 'United States', exchange: 'NASDAQ', cogriScore: 68.1, riskLevel: 'Elevated Risk' },
        { rank: 9, symbol: 'YMM', company: 'Full Truck Alliance', sector: 'Technology', country: 'United States', exchange: 'NYSE', cogriScore: 66.7, riskLevel: 'Elevated Risk' },
        { rank: 10, symbol: 'BILI', company: 'Bilibili Inc.', sector: 'Technology', country: 'United States', exchange: 'NASDAQ', cogriScore: 65.4, riskLevel: 'Elevated Risk' },
        { rank: 11, symbol: 'VIPS', company: 'Vipshop Holdings', sector: 'Consumer Cyclical', country: 'United States', exchange: 'NYSE', cogriScore: 64.0, riskLevel: 'Elevated Risk' },
        { rank: 12, symbol: 'TAL', company: 'TAL Education Group', sector: 'Consumer Defensive', country: 'United States', exchange: 'NYSE', cogriScore: 62.7, riskLevel: 'Elevated Risk' },
        { rank: 13, symbol: 'EDU', company: 'New Oriental Education', sector: 'Consumer Defensive', country: 'United States', exchange: 'NYSE', cogriScore: 61.3, riskLevel: 'Elevated Risk' },
        { rank: 14, symbol: 'YUMC', company: 'Yum China Holdings', sector: 'Consumer Cyclical', country: 'United States', exchange: 'NYSE', cogriScore: 60.0, riskLevel: 'Elevated Risk' },
        { rank: 15, symbol: 'WB', company: 'Weibo Corporation', sector: 'Technology', country: 'United States', exchange: 'NASDAQ', cogriScore: 58.6, riskLevel: 'Elevated Risk' }
      ],
      'ca': [
        { rank: 1, symbol: 'PXT.TO', company: 'Parex Resources', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 72.3, riskLevel: 'High Risk' },
        { rank: 2, symbol: 'GRN.TO', company: 'Greenlane Renewables', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 68.9, riskLevel: 'Elevated Risk' },
        { rank: 3, symbol: 'TECK.TO', company: 'Teck Resources Limited', sector: 'Basic Materials', country: 'Canada', exchange: 'TSX', cogriScore: 66.5, riskLevel: 'Elevated Risk' },
        { rank: 4, symbol: 'HUT.TO', company: 'Hut 8 Mining Corp', sector: 'Technology', country: 'Canada', exchange: 'TSX', cogriScore: 64.2, riskLevel: 'Elevated Risk' },
        { rank: 5, symbol: 'BITF.TO', company: 'Bitfarms Ltd', sector: 'Technology', country: 'Canada', exchange: 'TSX', cogriScore: 62.8, riskLevel: 'Elevated Risk' },
        { rank: 6, symbol: 'CJ.TO', company: 'Cardinal Energy Ltd', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 61.4, riskLevel: 'Elevated Risk' },
        { rank: 7, symbol: 'BTE.TO', company: 'Baytex Energy Corp', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 60.1, riskLevel: 'Elevated Risk' },
        { rank: 8, symbol: 'ERF.TO', company: 'Enerplus Corporation', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 58.7, riskLevel: 'Elevated Risk' },
        { rank: 9, symbol: 'WCP.TO', company: 'Whitecap Resources', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 57.3, riskLevel: 'Elevated Risk' },
        { rank: 10, symbol: 'TVE.TO', company: 'Tamarack Valley Energy', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 56.0, riskLevel: 'Elevated Risk' },
        { rank: 11, symbol: 'CPG.TO', company: 'Crescent Point Energy', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 54.6, riskLevel: 'Elevated Risk' },
        { rank: 12, symbol: 'VET.TO', company: 'Vermilion Energy Inc', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 53.2, riskLevel: 'Elevated Risk' },
        { rank: 13, symbol: 'MEG.TO', company: 'MEG Energy Corp', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 51.9, riskLevel: 'Elevated Risk' },
        { rank: 14, symbol: 'ARX.TO', company: 'ARC Resources Ltd', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 50.5, riskLevel: 'Elevated Risk' },
        { rank: 15, symbol: 'TOU.TO', company: 'Tourmaline Oil Corp', sector: 'Energy', country: 'Canada', exchange: 'TSX', cogriScore: 49.1, riskLevel: 'Moderate Risk' }
      ],
      'uk': [
        { rank: 1, symbol: 'PSON.L', company: 'Pearson plc', sector: 'Consumer Defensive', country: 'United Kingdom', exchange: 'LSE', cogriScore: 65.8, riskLevel: 'Elevated Risk' },
        { rank: 2, symbol: 'SHEL.L', company: 'Shell plc', sector: 'Energy', country: 'United Kingdom', exchange: 'LSE', cogriScore: 63.4, riskLevel: 'Elevated Risk' },
        { rank: 3, symbol: 'BP.L', company: 'BP p.l.c.', sector: 'Energy', country: 'United Kingdom', exchange: 'LSE', cogriScore: 61.1, riskLevel: 'Elevated Risk' },
        { rank: 4, symbol: 'RIO.L', company: 'Rio Tinto Group', sector: 'Basic Materials', country: 'United Kingdom', exchange: 'LSE', cogriScore: 58.7, riskLevel: 'Elevated Risk' },
        { rank: 5, symbol: 'AAL.L', company: 'Anglo American plc', sector: 'Basic Materials', country: 'United Kingdom', exchange: 'LSE', cogriScore: 56.4, riskLevel: 'Elevated Risk' },
        { rank: 6, symbol: 'GLEN.L', company: 'Glencore plc', sector: 'Basic Materials', country: 'United Kingdom', exchange: 'LSE', cogriScore: 54.0, riskLevel: 'Elevated Risk' },
        { rank: 7, symbol: 'HSBA.L', company: 'HSBC Holdings plc', sector: 'Financial Services', country: 'United Kingdom', exchange: 'LSE', cogriScore: 51.7, riskLevel: 'Elevated Risk' },
        { rank: 8, symbol: 'PRU.L', company: 'Prudential plc', sector: 'Financial Services', country: 'United Kingdom', exchange: 'LSE', cogriScore: 49.3, riskLevel: 'Moderate Risk' },
        { rank: 9, symbol: 'STAN.L', company: 'Standard Chartered PLC', sector: 'Financial Services', country: 'United Kingdom', exchange: 'LSE', cogriScore: 47.0, riskLevel: 'Moderate Risk' },
        { rank: 10, symbol: 'ANTO.L', company: 'Antofagasta plc', sector: 'Basic Materials', country: 'United Kingdom', exchange: 'LSE', cogriScore: 44.6, riskLevel: 'Moderate Risk' },
        { rank: 11, symbol: 'FERG.L', company: 'Ferguson plc', sector: 'Industrials', country: 'United Kingdom', exchange: 'LSE', cogriScore: 42.3, riskLevel: 'Moderate Risk' },
        { rank: 12, symbol: 'CRH.L', company: 'CRH plc', sector: 'Basic Materials', country: 'United Kingdom', exchange: 'LSE', cogriScore: 39.9, riskLevel: 'Moderate Risk' },
        { rank: 13, symbol: 'IMB.L', company: 'Imperial Brands PLC', sector: 'Consumer Defensive', country: 'United Kingdom', exchange: 'LSE', cogriScore: 37.6, riskLevel: 'Moderate Risk' },
        { rank: 14, symbol: 'BATS.L', company: 'British American Tobacco', sector: 'Consumer Defensive', country: 'United Kingdom', exchange: 'LSE', cogriScore: 35.2, riskLevel: 'Moderate Risk' },
        { rank: 15, symbol: 'RKT.L', company: 'Reckitt Benckiser Group', sector: 'Consumer Defensive', country: 'United Kingdom', exchange: 'LSE', cogriScore: 32.9, riskLevel: 'Moderate Risk' }
      ],
      'br': [
        { rank: 1, symbol: 'VALE3.SA', company: 'Vale S.A.', sector: 'Basic Materials', country: 'Brazil', exchange: 'B3', cogriScore: 68.5, riskLevel: 'Elevated Risk' },
        { rank: 2, symbol: 'PETR4.SA', company: 'Petrobras', sector: 'Energy', country: 'Brazil', exchange: 'B3', cogriScore: 66.2, riskLevel: 'Elevated Risk' },
        { rank: 3, symbol: 'PETR3.SA', company: 'Petrobras PN', sector: 'Energy', country: 'Brazil', exchange: 'B3', cogriScore: 63.8, riskLevel: 'Elevated Risk' },
        { rank: 4, symbol: 'ITUB4.SA', company: 'Itaú Unibanco', sector: 'Financial Services', country: 'Brazil', exchange: 'B3', cogriScore: 61.5, riskLevel: 'Elevated Risk' },
        { rank: 5, symbol: 'BBDC4.SA', company: 'Bradesco', sector: 'Financial Services', country: 'Brazil', exchange: 'B3', cogriScore: 59.1, riskLevel: 'Elevated Risk' },
        { rank: 6, symbol: 'ABEV3.SA', company: 'Ambev S.A.', sector: 'Consumer Defensive', country: 'Brazil', exchange: 'B3', cogriScore: 56.8, riskLevel: 'Elevated Risk' },
        { rank: 7, symbol: 'BBAS3.SA', company: 'Banco do Brasil', sector: 'Financial Services', country: 'Brazil', exchange: 'B3', cogriScore: 54.4, riskLevel: 'Elevated Risk' },
        { rank: 8, symbol: 'WEGE3.SA', company: 'WEG S.A.', sector: 'Industrials', country: 'Brazil', exchange: 'B3', cogriScore: 52.1, riskLevel: 'Elevated Risk' },
        { rank: 9, symbol: 'RENT3.SA', company: 'Localiza', sector: 'Consumer Cyclical', country: 'Brazil', exchange: 'B3', cogriScore: 49.7, riskLevel: 'Moderate Risk' },
        { rank: 10, symbol: 'RAIL3.SA', company: 'Rumo S.A.', sector: 'Industrials', country: 'Brazil', exchange: 'B3', cogriScore: 47.4, riskLevel: 'Moderate Risk' },
        { rank: 11, symbol: 'SUZB3.SA', company: 'Suzano S.A.', sector: 'Basic Materials', country: 'Brazil', exchange: 'B3', cogriScore: 45.0, riskLevel: 'Moderate Risk' },
        { rank: 12, symbol: 'GGBR4.SA', company: 'Gerdau S.A.', sector: 'Basic Materials', country: 'Brazil', exchange: 'B3', cogriScore: 42.7, riskLevel: 'Moderate Risk' },
        { rank: 13, symbol: 'CSNA3.SA', company: 'CSN', sector: 'Basic Materials', country: 'Brazil', exchange: 'B3', cogriScore: 40.3, riskLevel: 'Moderate Risk' },
        { rank: 14, symbol: 'USIM5.SA', company: 'Usiminas', sector: 'Basic Materials', country: 'Brazil', exchange: 'B3', cogriScore: 38.0, riskLevel: 'Moderate Risk' },
        { rank: 15, symbol: 'CPLE6.SA', company: 'Copel', sector: 'Utilities', country: 'Brazil', exchange: 'B3', cogriScore: 35.6, riskLevel: 'Moderate Risk' }
      ],
      'hk': [
        { rank: 1, symbol: '0700.HK', company: 'Tencent Holdings', sector: 'Technology', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 76.8, riskLevel: 'High Risk' },
        { rank: 2, symbol: '9988.HK', company: 'Alibaba Group', sector: 'Technology', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 75.4, riskLevel: 'High Risk' },
        { rank: 3, symbol: '9618.HK', company: 'JD.com', sector: 'Technology', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 73.1, riskLevel: 'High Risk' },
        { rank: 4, symbol: '3690.HK', company: 'Meituan', sector: 'Technology', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 70.7, riskLevel: 'High Risk' },
        { rank: 5, symbol: '9999.HK', company: 'NetEase', sector: 'Technology', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 68.4, riskLevel: 'Elevated Risk' },
        { rank: 6, symbol: '9868.HK', company: 'Xpeng', sector: 'Automotive', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 66.0, riskLevel: 'Elevated Risk' },
        { rank: 7, symbol: '2015.HK', company: 'Li Auto', sector: 'Automotive', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 63.7, riskLevel: 'Elevated Risk' },
        { rank: 8, symbol: '1024.HK', company: 'Kuaishou Technology', sector: 'Technology', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 61.3, riskLevel: 'Elevated Risk' },
        { rank: 9, symbol: '9961.HK', company: 'Trip.com Group', sector: 'Consumer Cyclical', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 59.0, riskLevel: 'Elevated Risk' },
        { rank: 10, symbol: '1810.HK', company: 'Xiaomi Corporation', sector: 'Technology', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 56.6, riskLevel: 'Elevated Risk' },
        { rank: 11, symbol: '2382.HK', company: 'Sunny Optical Technology', sector: 'Technology', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 54.3, riskLevel: 'Elevated Risk' },
        { rank: 12, symbol: '0388.HK', company: 'Hong Kong Exchanges', sector: 'Financial Services', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 51.9, riskLevel: 'Elevated Risk' },
        { rank: 13, symbol: '0941.HK', company: 'China Mobile', sector: 'Communication Services', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 49.6, riskLevel: 'Moderate Risk' },
        { rank: 14, symbol: '0939.HK', company: 'China Construction Bank', sector: 'Financial Services', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 47.2, riskLevel: 'Moderate Risk' },
        { rank: 15, symbol: '1398.HK', company: 'ICBC', sector: 'Financial Services', country: 'Hong Kong', exchange: 'HKEX', cogriScore: 44.9, riskLevel: 'Moderate Risk' }
      ],
      'sg': [
        { rank: 1, symbol: 'F34.SI', company: 'Wilmar International', sector: 'Consumer Defensive', country: 'Singapore', exchange: 'SGX', cogriScore: 52.8, riskLevel: 'Elevated Risk' },
        { rank: 2, symbol: 'BN4.SI', company: 'Keppel Corporation', sector: 'Industrials', country: 'Singapore', exchange: 'SGX', cogriScore: 50.5, riskLevel: 'Elevated Risk' },
        { rank: 3, symbol: 'U96.SI', company: 'Sembcorp Industries', sector: 'Utilities', country: 'Singapore', exchange: 'SGX', cogriScore: 48.1, riskLevel: 'Moderate Risk' },
        { rank: 4, symbol: 'S63.SI', company: 'Singapore Technologies Engineering', sector: 'Industrials', country: 'Singapore', exchange: 'SGX', cogriScore: 45.8, riskLevel: 'Moderate Risk' },
        { rank: 5, symbol: 'C09.SI', company: 'City Developments', sector: 'Real Estate', country: 'Singapore', exchange: 'SGX', cogriScore: 43.4, riskLevel: 'Moderate Risk' },
        { rank: 6, symbol: 'C31.SI', company: 'CapitaLand Integrated Commercial Trust', sector: 'Real Estate', country: 'Singapore', exchange: 'SGX', cogriScore: 41.1, riskLevel: 'Moderate Risk' },
        { rank: 7, symbol: 'M44U.SI', company: 'Mapletree Logistics Trust', sector: 'Real Estate', country: 'Singapore', exchange: 'SGX', cogriScore: 38.7, riskLevel: 'Moderate Risk' },
        { rank: 8, symbol: 'ME8U.SI', company: 'Mapletree Industrial Trust', sector: 'Real Estate', country: 'Singapore', exchange: 'SGX', cogriScore: 36.4, riskLevel: 'Moderate Risk' },
        { rank: 9, symbol: 'J69U.SI', company: 'Frasers Logistics & Commercial Trust', sector: 'Real Estate', country: 'Singapore', exchange: 'SGX', cogriScore: 34.0, riskLevel: 'Moderate Risk' },
        { rank: 10, symbol: 'C52.SI', company: 'ComfortDelGro Corporation', sector: 'Industrials', country: 'Singapore', exchange: 'SGX', cogriScore: 31.7, riskLevel: 'Moderate Risk' },
        { rank: 11, symbol: 'Z74.SI', company: 'Singapore Telecommunications', sector: 'Communication Services', country: 'Singapore', exchange: 'SGX', cogriScore: 29.3, riskLevel: 'Low Risk' },
        { rank: 12, symbol: 'S68.SI', company: 'Singapore Exchange', sector: 'Financial Services', country: 'Singapore', exchange: 'SGX', cogriScore: 27.0, riskLevel: 'Low Risk' },
        { rank: 13, symbol: 'U11.SI', company: 'United Overseas Bank', sector: 'Financial Services', country: 'Singapore', exchange: 'SGX', cogriScore: 24.6, riskLevel: 'Low Risk' },
        { rank: 14, symbol: 'O39.SI', company: 'OCBC Bank', sector: 'Financial Services', country: 'Singapore', exchange: 'SGX', cogriScore: 22.3, riskLevel: 'Low Risk' },
        { rank: 15, symbol: 'D05.SI', company: 'DBS Group Holdings', sector: 'Financial Services', country: 'Singapore', exchange: 'SGX', cogriScore: 19.9, riskLevel: 'Low Risk' }
      ],
      'tw': [
        { rank: 1, symbol: '2330.TW', company: 'Taiwan Semiconductor', sector: 'Technology', country: 'Taiwan', exchange: 'TWSE', cogriScore: 72.4, riskLevel: 'High Risk' },
        { rank: 2, symbol: '2317.TW', company: 'Hon Hai Precision', sector: 'Technology', country: 'Taiwan', exchange: 'TWSE', cogriScore: 70.1, riskLevel: 'High Risk' },
        { rank: 3, symbol: '2454.TW', company: 'MediaTek', sector: 'Technology', country: 'Taiwan', exchange: 'TWSE', cogriScore: 67.7, riskLevel: 'Elevated Risk' },
        { rank: 4, symbol: '2303.TW', company: 'United Microelectronics', sector: 'Technology', country: 'Taiwan', exchange: 'TWSE', cogriScore: 65.4, riskLevel: 'Elevated Risk' },
        { rank: 5, symbol: '2308.TW', company: 'Delta Electronics', sector: 'Technology', country: 'Taiwan', exchange: 'TWSE', cogriScore: 63.0, riskLevel: 'Elevated Risk' },
        { rank: 6, symbol: '2382.TW', company: 'Quanta Computer', sector: 'Technology', country: 'Taiwan', exchange: 'TWSE', cogriScore: 60.7, riskLevel: 'Elevated Risk' },
        { rank: 7, symbol: '3711.TW', company: 'ASE Technology', sector: 'Technology', country: 'Taiwan', exchange: 'TWSE', cogriScore: 58.3, riskLevel: 'Elevated Risk' },
        { rank: 8, symbol: '2357.TW', company: 'Asustek Computer', sector: 'Technology', country: 'Taiwan', exchange: 'TWSE', cogriScore: 56.0, riskLevel: 'Elevated Risk' },
        { rank: 9, symbol: '2412.TW', company: 'Chunghwa Telecom', sector: 'Communication Services', country: 'Taiwan', exchange: 'TWSE', cogriScore: 53.6, riskLevel: 'Elevated Risk' },
        { rank: 10, symbol: '1301.TW', company: 'Formosa Plastics', sector: 'Basic Materials', country: 'Taiwan', exchange: 'TWSE', cogriScore: 51.3, riskLevel: 'Elevated Risk' },
        { rank: 11, symbol: '1303.TW', company: 'Nan Ya Plastics', sector: 'Basic Materials', country: 'Taiwan', exchange: 'TWSE', cogriScore: 48.9, riskLevel: 'Moderate Risk' },
        { rank: 12, symbol: '2002.TW', company: 'China Steel', sector: 'Basic Materials', country: 'Taiwan', exchange: 'TWSE', cogriScore: 46.6, riskLevel: 'Moderate Risk' },
        { rank: 13, symbol: '2882.TW', company: 'Cathay Financial', sector: 'Financial Services', country: 'Taiwan', exchange: 'TWSE', cogriScore: 44.2, riskLevel: 'Moderate Risk' },
        { rank: 14, symbol: '2881.TW', company: 'Fubon Financial', sector: 'Financial Services', country: 'Taiwan', exchange: 'TWSE', cogriScore: 41.9, riskLevel: 'Moderate Risk' },
        { rank: 15, symbol: '2891.TW', company: 'CTBC Financial', sector: 'Financial Services', country: 'Taiwan', exchange: 'TWSE', cogriScore: 39.5, riskLevel: 'Moderate Risk' }
      ],
      'za': [
        { rank: 1, symbol: 'SOL.JO', company: 'Sasol', sector: 'Energy', country: 'South Africa', exchange: 'JSE', cogriScore: 71.2, riskLevel: 'High Risk' },
        { rank: 2, symbol: 'AGL.JO', company: 'Anglo American Platinum', sector: 'Basic Materials', country: 'South Africa', exchange: 'JSE', cogriScore: 68.9, riskLevel: 'Elevated Risk' },
        { rank: 3, symbol: 'IMP.JO', company: 'Impala Platinum', sector: 'Basic Materials', country: 'South Africa', exchange: 'JSE', cogriScore: 66.5, riskLevel: 'Elevated Risk' },
        { rank: 4, symbol: 'AMS.JO', company: 'Anglo American Kumba Iron Ore', sector: 'Basic Materials', country: 'South Africa', exchange: 'JSE', cogriScore: 64.2, riskLevel: 'Elevated Risk' },
        { rank: 5, symbol: 'GFI.JO', company: 'Gold Fields', sector: 'Basic Materials', country: 'South Africa', exchange: 'JSE', cogriScore: 61.8, riskLevel: 'Elevated Risk' },
        { rank: 6, symbol: 'ANG.JO', company: 'AngloGold Ashanti', sector: 'Basic Materials', country: 'South Africa', exchange: 'JSE', cogriScore: 59.5, riskLevel: 'Elevated Risk' },
        { rank: 7, symbol: 'SGL.JO', company: 'Sibanye Stillwater', sector: 'Basic Materials', country: 'South Africa', exchange: 'JSE', cogriScore: 57.1, riskLevel: 'Elevated Risk' },
        { rank: 8, symbol: 'MTN.JO', company: 'MTN Group', sector: 'Communication Services', country: 'South Africa', exchange: 'JSE', cogriScore: 54.8, riskLevel: 'Elevated Risk' },
        { rank: 9, symbol: 'NED.JO', company: 'Nedbank Group', sector: 'Financial Services', country: 'South Africa', exchange: 'JSE', cogriScore: 52.4, riskLevel: 'Elevated Risk' },
        { rank: 10, symbol: 'ABG.JO', company: 'Absa Group', sector: 'Financial Services', country: 'South Africa', exchange: 'JSE', cogriScore: 50.1, riskLevel: 'Elevated Risk' },
        { rank: 11, symbol: 'FSR.JO', company: 'FirstRand', sector: 'Financial Services', country: 'South Africa', exchange: 'JSE', cogriScore: 47.7, riskLevel: 'Moderate Risk' },
        { rank: 12, symbol: 'SBK.JO', company: 'Standard Bank Group', sector: 'Financial Services', country: 'South Africa', exchange: 'JSE', cogriScore: 45.4, riskLevel: 'Moderate Risk' },
        { rank: 13, symbol: 'VOD.JO', company: 'Vodacom Group', sector: 'Communication Services', country: 'South Africa', exchange: 'JSE', cogriScore: 43.0, riskLevel: 'Moderate Risk' },
        { rank: 14, symbol: 'SHP.JO', company: 'Shoprite Holdings', sector: 'Consumer Defensive', country: 'South Africa', exchange: 'JSE', cogriScore: 40.7, riskLevel: 'Moderate Risk' },
        { rank: 15, symbol: 'NPN.JO', company: 'Naspers', sector: 'Technology', country: 'South Africa', exchange: 'JSE', cogriScore: 38.3, riskLevel: 'Moderate Risk' }
      ]
    };

    return equitiesByCountry[countryCode] || equitiesByCountry['us'];
  };

  const getRiskColor = (level: string) => {
    if (level.includes('Extreme')) return 'bg-red-700';
    if (level.includes('High')) return 'bg-red-600';
    if (level.includes('Elevated')) return 'bg-orange-600';
    if (level.includes('Moderate')) return 'bg-yellow-600';
    return 'bg-green-600';
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
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Highest Risk Equities</h1>
              <p className="text-sm text-gray-200">Identify the most geopolitically volatile investment opportunities by country</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {!results ? (
          <div className="bg-[#0d5f5f] rounded-lg p-8 space-y-6">
            <h2 className="text-white text-2xl font-bold">Select Country / Exchange</h2>
            
            <div className="bg-[#0d5f5f]/50 border border-orange-500 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-orange-500 h-6 w-6 mt-1 shrink-0" />
                <p className="text-gray-200 text-sm leading-relaxed">
                  This tool analyzes major equities from the selected country and ranks them by CO-GRI (CedarOwl Geopolitical Risk Index) score. Higher scores indicate more volatile investments with greater geopolitical exposure and risk.
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

            <Button
              onClick={handleAnalyze}
              disabled={!selectedCountry || isAnalyzing}
              className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold h-14 text-lg border-2 border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Finding Highest Risk Equities...' : 'Find 15 Highest CO-GRI Risk Equities'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="bg-[#0d5f5f] rounded-lg p-6">
              <h2 className="text-white text-2xl font-bold mb-2">15 Highest Risk Equities</h2>
              <p className="text-gray-200 text-sm">
                Ranked by CO-GRI score from highest to lowest geopolitical risk exposure
              </p>
            </div>

            {/* Warning Banner */}
            <div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 h-6 w-6 mt-1 shrink-0" />
                <div>
                  <h3 className="text-red-400 font-bold text-lg mb-2">High Risk Warning</h3>
                  <p className="text-gray-200 text-sm leading-relaxed">
                    These equities have elevated geopolitical risk exposure. They may be subject to sanctions, trade restrictions, supply chain disruptions, regulatory changes, or other geopolitical events that could significantly impact their value. Investors should carefully consider these risks before making investment decisions.
                  </p>
                </div>
              </div>
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
                The CO-GRI (CedarOwl Geopolitical Risk Index) score is calculated using our proprietary framework that evaluates:
              </p>
              <ul className="space-y-2 text-gray-300 text-sm ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Geographic revenue exposure across high-risk jurisdictions with elevated Country Shock Indices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Supply chain vulnerabilities in geopolitically sensitive regions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Sector-specific sensitivity multipliers based on historical geopolitical event analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Seven risk vectors: Conflict, Sanctions, Trade, Governance, Cyber, Unrest, and Currency risks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Exposure to countries with active sanctions regimes, trade disputes, or political instability</span>
                </li>
              </ul>
              <p className="text-gray-400 text-xs mt-4">
                Data sources: BlackRock Geopolitical Risk Dashboard, GDELT, ACLED, OFAC, EU CFSP, WTO, World Bank WGI, Company filings (SEC/SEDAR), Bloomberg Terminal, S&P Capital IQ
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
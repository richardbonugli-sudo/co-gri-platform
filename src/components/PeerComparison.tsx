import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';

interface PeerCompany {
  ticker: string;
  name: string;
  sector: string;
  marketCap: number;
  cogriScore: number;
  cogriChange: number;
  geographicExposure: {
    region: string;
    percentage: number;
  }[];
  riskVectors: {
    political: number;
    economic: number;
    social: number;
    technological: number;
    environmental: number;
    legal: number;
  };
}

interface PeerComparisonProps {
  currentCompany: {
    ticker: string;
    name: string;
    cogriScore: number;
    sector: string;
    marketCap: number;
  };
}

const PeerComparison: React.FC<PeerComparisonProps> = ({ currentCompany }) => {
  const [filterBy, setFilterBy] = useState<'sector' | 'size' | 'exposure'>('sector');
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');
  const activeLens = useGlobalState((state) => state.active_company_lens);

  // Generate mock peer data based on current company
  const peerCompanies: PeerCompany[] = useMemo(() => {
    const peers: PeerCompany[] = [];
    const baseCogri = currentCompany.cogriScore;
    
    const peerTickers = ['MSFT', 'GOOGL', 'META', 'NVDA', 'TSLA'];
    const peerNames = ['Microsoft', 'Alphabet', 'Meta Platforms', 'NVIDIA', 'Tesla'];
    
    peerTickers.forEach((ticker, idx) => {
      if (ticker !== currentCompany.ticker) {
        const variance = (Math.random() - 0.5) * 20;
        peers.push({
          ticker,
          name: peerNames[idx],
          sector: currentCompany.sector,
          marketCap: currentCompany.marketCap * (0.8 + Math.random() * 0.4),
          cogriScore: Math.max(0, Math.min(100, baseCogri + variance)),
          cogriChange: (Math.random() - 0.5) * 10,
          geographicExposure: [
            { region: 'North America', percentage: 30 + Math.random() * 20 },
            { region: 'Europe', percentage: 20 + Math.random() * 15 },
            { region: 'Asia Pacific', percentage: 25 + Math.random() * 20 },
            { region: 'Other', percentage: 10 + Math.random() * 10 },
          ],
          riskVectors: {
            political: 40 + Math.random() * 30,
            economic: 35 + Math.random() * 30,
            social: 30 + Math.random() * 25,
            technological: 45 + Math.random() * 30,
            environmental: 25 + Math.random() * 20,
            legal: 30 + Math.random() * 25,
          },
        });
      }
    });
    
    return peers.sort((a, b) => a.cogriScore - b.cogriScore);
  }, [currentCompany]);

  const barChartData = useMemo(() => {
    const data = peerCompanies.map(peer => ({
      name: peer.ticker,
      'CO-GRI Score': peer.cogriScore,
    }));
    
    data.push({
      name: `${currentCompany.ticker} (You)`,
      'CO-GRI Score': currentCompany.cogriScore,
    });
    
    return data.sort((a, b) => a['CO-GRI Score'] - b['CO-GRI Score']);
  }, [peerCompanies, currentCompany]);

  const radarChartData = useMemo(() => {
    const currentVectors = peerCompanies[0]?.riskVectors || {
      political: 50,
      economic: 45,
      social: 40,
      technological: 55,
      environmental: 35,
      legal: 40,
    };

    return [
      { vector: 'Political', [currentCompany.ticker]: currentVectors.political, 'Peer Avg': 45 },
      { vector: 'Economic', [currentCompany.ticker]: currentVectors.economic, 'Peer Avg': 42 },
      { vector: 'Social', [currentCompany.ticker]: currentVectors.social, 'Peer Avg': 38 },
      { vector: 'Tech', [currentCompany.ticker]: currentVectors.technological, 'Peer Avg': 48 },
      { vector: 'Environmental', [currentCompany.ticker]: currentVectors.environmental, 'Peer Avg': 32 },
      { vector: 'Legal', [currentCompany.ticker]: currentVectors.legal, 'Peer Avg': 37 },
    ];
  }, [peerCompanies, currentCompany.ticker]);

  const getRiskLevelColor = (score: number): string => {
    if (score < 30) return 'text-green-600';
    if (score < 50) return 'text-yellow-600';
    if (score < 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskLevelBg = (score: number): string => {
    if (score < 30) return 'bg-green-100';
    if (score < 50) return 'bg-yellow-100';
    if (score < 70) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getTrendIcon = (change: number) => {
    if (change > 1) return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (change < -1) return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <Card className="w-full" data-testid="peer-comparison">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Peer Comparison</CardTitle>
            <CardDescription>
              Compare {currentCompany.name} with similar companies in the {currentCompany.sector} sector
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sector">By Sector</SelectItem>
                <SelectItem value="size">By Size</SelectItem>
                <SelectItem value="exposure">By Exposure</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="radar">Radar Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart Visualization */}
        <div className="h-[300px]">
          {chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="CO-GRI Score" 
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="vector" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar 
                  name={currentCompany.ticker} 
                  dataKey={currentCompany.ticker} 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                />
                <Radar 
                  name="Peer Average" 
                  dataKey="Peer Avg" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3} 
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Peer Companies List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Peer Companies</h4>
          <div className="space-y-2">
            {peerCompanies.map((peer) => (
              <div 
                key={peer.ticker}
                className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{peer.ticker}</span>
                      <Badge variant="outline" className="text-xs">
                        {peer.sector}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{peer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className={`text-lg font-bold ${getRiskLevelColor(peer.cogriScore)}`}>
                        {peer.cogriScore.toFixed(1)}
                      </span>
                      {getTrendIcon(peer.cogriChange)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {peer.cogriChange > 0 ? '+' : ''}{peer.cogriChange.toFixed(1)}% vs last month
                    </p>
                  </div>
                  <Badge className={getRiskLevelBg(peer.cogriScore)}>
                    <span className={getRiskLevelColor(peer.cogriScore)}>
                      {peer.cogriScore < 30 ? 'Low' : peer.cogriScore < 50 ? 'Medium' : peer.cogriScore < 70 ? 'High' : 'Critical'}
                    </span>
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Company Highlight */}
        <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{currentCompany.ticker}</span>
                <Badge className="bg-blue-500 text-white">Your Company</Badge>
              </div>
              <p className="text-sm text-gray-600">{currentCompany.name}</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getRiskLevelColor(currentCompany.cogriScore)}`}>
                {currentCompany.cogriScore.toFixed(1)}
              </div>
              <p className="text-sm text-gray-600">CO-GRI Score</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PeerComparison;
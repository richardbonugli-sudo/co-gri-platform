import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Globe } from 'lucide-react';

interface TrendData {
  period: string;
  riskScore: number;
  volatility: number;
  events: string[];
}

interface GeopoliticalTrendsProps {
  companySymbol: string;
  currentScore: number;
  sector: string;
}

const GeopoliticalTrends: React.FC<GeopoliticalTrendsProps> = ({
  companySymbol,
  currentScore,
  sector
}) => {
  const [timeframe, setTimeframe] = useState<'3M' | '6M' | '1Y' | '2Y'>('1Y');

  // Mock historical data - in production this would come from your data service
  const generateHistoricalData = (months: number): TrendData[] => {
    const data: TrendData[] = [];
    const baseScore = currentScore;
    
    for (let i = months; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 10;
      const seasonalFactor = Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 3;
      const trendFactor = (months - i) * 0.2; // Slight upward trend
      
      const riskScore = Math.max(0, Math.min(100, 
        baseScore + variation + seasonalFactor + trendFactor
      ));
      
      const volatility = Math.abs(variation) + Math.random() * 5;
      
      // Mock events based on score changes
      const events: string[] = [];
      if (Math.abs(variation) > 5) {
        events.push(variation > 0 ? 'Geopolitical tension increase' : 'Diplomatic progress');
      }
      if (volatility > 8) {
        events.push('Market volatility spike');
      }
      
      data.push({
        period: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        riskScore: Math.round(riskScore * 10) / 10,
        volatility: Math.round(volatility * 10) / 10,
        events
      });
    }
    
    return data;
  };

  const timeframes = {
    '3M': 3,
    '6M': 6,
    '1Y': 12,
    '2Y': 24
  };

  const historicalData = useMemo(() => 
    generateHistoricalData(timeframes[timeframe]), 
    [timeframe, currentScore]
  );

  const trendAnalysis = useMemo(() => {
    if (historicalData.length < 2) return { direction: 'stable', change: 0 };
    
    const recent = historicalData.slice(-3).reduce((sum, d) => sum + d.riskScore, 0) / 3;
    const earlier = historicalData.slice(0, 3).reduce((sum, d) => sum + d.riskScore, 0) / 3;
    const change = recent - earlier;
    
    return {
      direction: Math.abs(change) < 2 ? 'stable' : change > 0 ? 'increasing' : 'decreasing',
      change: Math.round(change * 10) / 10
    };
  }, [historicalData]);

  const avgVolatility = useMemo(() => 
    historicalData.reduce((sum, d) => sum + d.volatility, 0) / historicalData.length,
    [historicalData]
  );

  const getTrendIcon = () => {
    switch (trendAnalysis.direction) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-400" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-400" />;
      default: return <Globe className="h-4 w-4 text-blue-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trendAnalysis.direction) {
      case 'increasing': return 'text-red-400';
      case 'decreasing': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <Card className="bg-[#0f1e2e] border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">Geopolitical Risk Trends</CardTitle>
          <div className="flex gap-2">
            {Object.keys(timeframes).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(tf as any)}
                className={timeframe === tf ? 
                  "bg-[#0d5f5f] hover:bg-[#0a4d4d]" : 
                  "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Trend Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1a2332] p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getTrendIcon()}
              <span className="text-gray-300 text-sm font-medium">Risk Trend</span>
            </div>
            <div className={`text-lg font-bold ${getTrendColor()}`}>
              {trendAnalysis.direction.charAt(0).toUpperCase() + trendAnalysis.direction.slice(1)}
            </div>
            <div className="text-xs text-gray-400">
              {trendAnalysis.change > 0 ? '+' : ''}{trendAnalysis.change} points
            </div>
          </div>
          
          <div className="bg-[#1a2332] p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="text-gray-300 text-sm font-medium">Avg Volatility</span>
            </div>
            <div className="text-lg font-bold text-yellow-400">
              {avgVolatility.toFixed(1)}
            </div>
            <div className="text-xs text-gray-400">
              {avgVolatility > 7 ? 'High' : avgVolatility > 4 ? 'Moderate' : 'Low'} volatility
            </div>
          </div>
          
          <div className="bg-[#1a2332] p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-blue-400" />
              <span className="text-gray-300 text-sm font-medium">Current Score</span>
            </div>
            <div className="text-lg font-bold text-white">
              {currentScore}
            </div>
            <div className="text-xs text-gray-400">
              {sector} sector
            </div>
          </div>
        </div>

        {/* Risk Score Chart */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="period" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a2332', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: any, name: string) => [
                  `${value}${name === 'riskScore' ? ' points' : ''}`, 
                  name === 'riskScore' ? 'Risk Score' : 'Volatility'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="riskScore" 
                stroke="#ef4444" 
                strokeWidth={2}
                fill="url(#riskGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Volatility Chart */}
        <div className="h-48 mb-6">
          <h4 className="text-white text-sm font-medium mb-3">Risk Volatility</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="period" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a2332', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: any) => [`${value} points`, 'Volatility']}
              />
              <Line 
                type="monotone" 
                dataKey="volatility" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Events */}
        <div className="bg-[#1a2332] p-4 rounded-lg">
          <h4 className="text-white text-sm font-medium mb-3">Recent Risk Events</h4>
          <div className="space-y-2">
            {historicalData
              .slice(-6)
              .filter(d => d.events.length > 0)
              .map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {data.period}
                    </Badge>
                    <span className="text-gray-300 text-sm">
                      {data.events.join(', ')}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs">
                    Score: {data.riskScore}
                  </span>
                </div>
              ))}
            {historicalData.slice(-6).every(d => d.events.length === 0) && (
              <div className="text-gray-400 text-sm text-center py-4">
                No significant risk events in recent periods
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          * Historical data is simulated for demonstration. In production, this would use real geopolitical risk tracking data.
        </div>
      </CardContent>
    </Card>
  );
};

export default GeopoliticalTrends;
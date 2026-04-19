/**
 * Executive Summary Component (F2)
 * Displays high-level forecast overview with key metrics
 * Part of CO-GRI Platform Phase 3 - Week 7
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, MapPin } from 'lucide-react';
import { ExecutiveSummary as ExecutiveSummaryType } from '@/types/forecast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryType;
}

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  const { global_risk_trajectory, top_geopolitical_themes, high_impact_events_count, regional_hotspots } = summary;

  // Prepare chart data
  const chartData = [
    ...global_risk_trajectory.historical_data.map(d => ({
      date: d.date,
      level: d.level,
      type: 'historical'
    })),
    ...global_risk_trajectory.forecast_data.map(d => ({
      date: d.date,
      level: d.level,
      lower: d.confidence_interval[0],
      upper: d.confidence_interval[1],
      type: 'forecast'
    }))
  ];

  const trendIcon = global_risk_trajectory.trend === 'Increasing' 
    ? <TrendingUp className="h-5 w-5 text-red-600" />
    : global_risk_trajectory.trend === 'Decreasing'
    ? <TrendingDown className="h-5 w-5 text-green-600" />
    : <TrendingUp className="h-5 w-5 text-yellow-600" />;

  const trendColor = global_risk_trajectory.trend === 'Increasing' 
    ? 'text-red-600'
    : global_risk_trajectory.trend === 'Decreasing'
    ? 'text-green-600'
    : 'text-yellow-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card 1: Global Risk Trajectory */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {trendIcon}
            Global Risk Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current vs Forecast */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Level</p>
                <p className="text-2xl font-bold">{global_risk_trajectory.current_level.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Trend</p>
                <p className={`text-lg font-semibold ${trendColor}`}>
                  {global_risk_trajectory.trend}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">6M Forecast</p>
                <p className="text-2xl font-bold">{global_risk_trajectory.forecast_level.toFixed(1)}</p>
              </div>
            </div>

            {/* Mini Chart */}
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value.substring(5)}
                />
                <YAxis domain={[50, 70]} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: number) => value.toFixed(1)}
                />
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="none"
                  fill="#fecaca"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="none"
                  fill="#fecaca"
                  fillOpacity={0.3}
                />
                <Line 
                  type="monotone" 
                  dataKey="level" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>

            <Badge variant="outline" className="text-xs">
              Confidence: {global_risk_trajectory.confidence}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Top Geopolitical Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Top Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {top_geopolitical_themes.slice(0, 3).map((theme) => (
              <div key={theme.theme_id} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{theme.theme_name}</p>
                  <Badge 
                    variant={theme.priority === 'Critical' ? 'destructive' : 'default'}
                    className="text-xs shrink-0"
                  >
                    {theme.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {theme.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  Probability: {(theme.probability * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: High-Impact Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            High-Impact Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-red-600">{high_impact_events_count}</p>
              <p className="text-sm text-muted-foreground mt-1">Critical & High Impact</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Top Sectors Affected:</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Technology</Badge>
                <Badge variant="outline" className="text-xs">Energy</Badge>
                <Badge variant="outline" className="text-xs">Manufacturing</Badge>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Events with expected |ΔCO-GRI| &gt; 5 or probability &gt; 60%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Regional Hotspots */}
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-purple-600" />
            Regional Hotspots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {regional_hotspots.map((hotspot) => {
              const riskColors = {
                'Critical': 'bg-red-100 text-red-800 border-red-200',
                'High': 'bg-orange-100 text-orange-800 border-orange-200',
                'Elevated': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                'Moderate': 'bg-blue-100 text-blue-800 border-blue-200'
              };

              const trendColors = {
                'Escalating': 'text-red-600',
                'Stable': 'text-yellow-600',
                'De-escalating': 'text-green-600'
              };

              return (
                <div key={hotspot.region} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{hotspot.region}</h4>
                    <Badge className={riskColors[hotspot.risk_level]}>
                      {hotspot.risk_level}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {hotspot.countries.slice(0, 3).join(', ')}
                    {hotspot.countries.length > 3 && ` +${hotspot.countries.length - 3}`}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Trend:</span>
                    <span className={`font-medium ${trendColors[hotspot.trend]}`}>
                      {hotspot.trend}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {hotspot.expected_impact}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 pt-1">
                    {hotspot.affected_sectors.slice(0, 2).map(sector => (
                      <Badge key={sector} variant="secondary" className="text-xs">
                        {sector}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
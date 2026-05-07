/**
 * Scenario Results Component
 * 
 * Detailed visualization of a single scenario's impact with:
 * - Summary metrics card
 * - Channel impact breakdown (bar chart)
 * - Country impact breakdown (table)
 * - Timeline projection (line chart)
 * - Export functionality (CSV, PNG)
 * 
 * Part of CO-GRI Platform Week 8 Scenario Engine
 */

import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ScenarioDefinition, ScenarioImpactResult } from '@/services/engines/ScenarioEngine';

interface ScenarioResultsProps {
  scenario: ScenarioDefinition;
  result: ScenarioImpactResult;
  companyName: string;
}

export default function ScenarioResults({ 
  scenario, 
  result, 
  companyName 
}: ScenarioResultsProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Prepare channel data for bar chart
  const channelData = [
    { name: 'Revenue', delta: result.channel_impacts.revenue, color: '#3b82f6' },
    { name: 'Supply Chain', delta: result.channel_impacts.supply_chain, color: '#10b981' },
    { name: 'Physical Assets', delta: result.channel_impacts.physical_assets, color: '#f59e0b' },
    { name: 'Financial', delta: result.channel_impacts.financial, color: '#8b5cf6' }
  ];

  // Calculate channel contribution percentages
  const totalAbsoluteImpact = Math.abs(result.channel_impacts.revenue) +
    Math.abs(result.channel_impacts.supply_chain) +
    Math.abs(result.channel_impacts.physical_assets) +
    Math.abs(result.channel_impacts.financial);

  const channelContributions = channelData.map(ch => ({
    ...ch,
    contribution: totalAbsoluteImpact > 0 
      ? (Math.abs(ch.delta) / totalAbsoluteImpact * 100).toFixed(1) 
      : '0.0'
  }));

  // Sort countries by delta (descending)
  const sortedCountries = [...result.country_impacts].sort((a, b) => 
    Math.abs(b.delta_contribution) - Math.abs(a.delta_contribution)
  );

  const exportToCSV = () => {
    const headers = ['Metric', 'Value'];
    const summaryRows = [
      ['Scenario Name', scenario.name],
      ['Event Type', scenario.event_type],
      ['Severity', scenario.severity],
      ['Probability', `${(scenario.probability * 100).toFixed(0)}%`],
      ['Duration', `${scenario.duration_months} months`],
      ['Delta CO-GRI', result.delta_CO_GRI.toFixed(2)],
      ['Probability-Weighted Delta', result.probability_weighted_delta.toFixed(2)],
      ['', ''],
      ['Channel Impacts', ''],
      ['Revenue', result.channel_impacts.revenue.toFixed(2)],
      ['Supply Chain', result.channel_impacts.supply_chain.toFixed(2)],
      ['Physical Assets', result.channel_impacts.physical_assets.toFixed(2)],
      ['Financial', result.channel_impacts.financial.toFixed(2)],
      ['', ''],
      ['Country Impacts', ''],
      ['Country', 'Delta Contribution', 'Affected Channels']
    ];

    const countryRows = result.country_impacts.map(c => [
      c.country,
      c.delta_contribution.toFixed(2),
      c.affected_channels.join('; ')
    ]);

    const csv = [...summaryRows, ...countryRows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario_results_${scenario.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'High': return 'bg-orange-500';
      case 'Critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0.5) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (delta < -0.5) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getBarColor = (delta: number) => {
    if (delta > 0) return '#ef4444'; // red
    if (delta < 0) return '#10b981'; // green
    return '#6b7280'; // gray
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{scenario.name}</CardTitle>
              <CardDescription className="mt-2">
                {scenario.description}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Event Type</p>
              <p className="text-lg font-semibold">{scenario.event_type}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Severity</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getSeverityColor(scenario.severity)}`} />
                <p className="text-lg font-semibold">{scenario.severity}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Probability</p>
              <p className="text-lg font-semibold">{(scenario.probability * 100).toFixed(0)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">{scenario.duration_months} months</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Delta CO-GRI</p>
                <div className="flex items-center gap-3">
                  {getDeltaIcon(result.delta_CO_GRI)}
                  <p className="text-3xl font-bold">{result.delta_CO_GRI.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Probability-Weighted Delta</p>
                <div className="flex items-center gap-3">
                  {getDeltaIcon(result.probability_weighted_delta)}
                  <p className="text-3xl font-bold">{result.probability_weighted_delta.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Affected Countries</p>
                <p className="text-lg font-semibold">{scenario.affected_countries.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Affected Channels</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {scenario.affected_channels.map((channel) => (
                    <Badge key={channel} variant="secondary">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="channels">Channel Impact</TabsTrigger>
          <TabsTrigger value="countries">Country Impact</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Channel Impact Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Impact Breakdown</CardTitle>
              <CardDescription>
                Impact distribution across exposure channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80" ref={chartRef}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Delta CO-GRI', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={(value: number) => value.toFixed(2)}
                      labelStyle={{ color: '#000' }}
                    />
                    <Bar dataKey="delta" radius={[8, 8, 0, 0]}>
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.delta)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">Delta</TableHead>
                      <TableHead className="text-right">Contribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channelContributions.map((ch) => (
                      <TableRow key={ch.name}>
                        <TableCell className="font-medium">{ch.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {getDeltaIcon(ch.delta)}
                            <span className="font-semibold">{ch.delta.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{ch.contribution}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Country Impact Tab */}
        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Country Impact Breakdown</CardTitle>
              <CardDescription>
                Impact by country sorted by magnitude
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Delta Contribution</TableHead>
                      <TableHead>Affected Channels</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCountries.map((country) => (
                      <TableRow key={country.country}>
                        <TableCell className="font-medium">{country.country}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {getDeltaIcon(country.delta_contribution)}
                            <span className="font-semibold">
                              {country.delta_contribution.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {country.affected_channels.map((channel) => (
                              <Badge key={channel} variant="secondary" className="text-xs">
                                {channel}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Projection</CardTitle>
              <CardDescription>
                Cumulative impact over {scenario.duration_months} months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Cumulative ΔCO-GRI', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => value.toFixed(2)}
                      labelFormatter={(label) => `Month ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative_delta" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Cumulative ΔCO-GRI"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This timeline shows the projected cumulative impact over the scenario duration.
                  The impact is modeled to build up gradually over time based on the scenario parameters.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
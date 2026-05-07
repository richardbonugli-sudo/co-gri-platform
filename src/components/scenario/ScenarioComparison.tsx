/**
 * Scenario Comparison Component
 * 
 * Side-by-side comparison of multiple scenarios with:
 * - Comparison table with key metrics
 * - Statistical summary
 * - Sorting and filtering
 * - CSV export functionality
 * 
 * Part of CO-GRI Platform Week 8 Scenario Engine
 */

import React, { useState, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, Minus, ArrowUpDown } from 'lucide-react';
import { ScenarioDefinition, ScenarioImpactResult } from '@/services/engines/ScenarioEngine';

interface ScenarioComparisonProps {
  scenarios: ScenarioDefinition[];
  results: Map<string, ScenarioImpactResult>;
  companyTicker: string;
}

type SortField = 'name' | 'severity' | 'probability' | 'delta';
type SortOrder = 'asc' | 'desc';

export default function ScenarioComparison({ 
  scenarios, 
  results, 
  companyTicker 
}: ScenarioComparisonProps) {
  const [sortField, setSortField] = useState<SortField>('delta');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Calculate statistics
  const statistics = useMemo(() => {
    const deltas = scenarios
      .map(s => results.get(s.scenario_id)?.delta_CO_GRI)
      .filter((d): d is number => d !== undefined);

    if (deltas.length === 0) {
      return {
        avgDelta: 0,
        minDelta: 0,
        maxDelta: 0,
        stdDev: 0,
        mostCommonEventType: 'N/A'
      };
    }

    const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    const minDelta = Math.min(...deltas);
    const maxDelta = Math.max(...deltas);
    
    // Calculate standard deviation
    const variance = deltas.reduce((sum, d) => sum + Math.pow(d - avgDelta, 2), 0) / deltas.length;
    const stdDev = Math.sqrt(variance);

    // Find most common event type
    const eventTypeCounts = scenarios.reduce((acc, s) => {
      acc[s.event_type] = (acc[s.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonEventType = Object.entries(eventTypeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    return {
      avgDelta,
      minDelta,
      maxDelta,
      stdDev,
      mostCommonEventType
    };
  }, [scenarios, results]);

  // Sort scenarios
  const sortedScenarios = useMemo(() => {
    return [...scenarios].sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'severity':
          const severityOrder = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
          compareValue = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'probability':
          compareValue = a.probability - b.probability;
          break;
        case 'delta':
          const deltaA = results.get(a.scenario_id)?.delta_CO_GRI || 0;
          const deltaB = results.get(b.scenario_id)?.delta_CO_GRI || 0;
          compareValue = deltaA - deltaB;
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  }, [scenarios, results, sortField, sortOrder]);

  // Find best and worst scenarios
  const { bestScenario, worstScenario } = useMemo(() => {
    if (scenarios.length === 0) return { bestScenario: null, worstScenario: null };

    const scenariosWithDeltas = scenarios
      .map(s => ({
        scenario: s,
        delta: results.get(s.scenario_id)?.delta_CO_GRI || 0
      }))
      .filter(({ delta }) => delta !== 0);

    if (scenariosWithDeltas.length === 0) return { bestScenario: null, worstScenario: null };

    const best = scenariosWithDeltas.reduce((min, curr) => 
      curr.delta < min.delta ? curr : min
    );
    const worst = scenariosWithDeltas.reduce((max, curr) => 
      curr.delta > max.delta ? curr : max
    );

    return {
      bestScenario: best.scenario.scenario_id,
      worstScenario: worst.scenario.scenario_id
    };
  }, [scenarios, results]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Scenario', 'Event Type', 'Severity', 'Probability', 'Delta CO-GRI', 'Probability-Weighted Delta', 'Affected Countries', 'Affected Channels'];
    const rows = sortedScenarios.map(s => {
      const result = results.get(s.scenario_id);
      return [
        s.name,
        s.event_type,
        s.severity,
        (s.probability * 100).toFixed(0) + '%',
        result?.delta_CO_GRI.toFixed(2) || 'N/A',
        result?.probability_weighted_delta.toFixed(2) || 'N/A',
        s.affected_countries.join('; '),
        s.affected_channels.join('; ')
      ];
    });
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario_comparison_${companyTicker}_${new Date().toISOString().split('T')[0]}.csv`;
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

  if (scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            No scenarios to compare. Create and apply scenarios to see comparison.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistical Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average ΔCO-GRI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.avgDelta.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Min ΔCO-GRI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.minDelta.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Max ΔCO-GRI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics.maxDelta.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Std Deviation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.stdDev.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Most Common Type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {statistics.mostCommonEventType}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scenario Comparison</CardTitle>
              <CardDescription>
                Comparing {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''} for {companyTicker}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="severity">Severity</SelectItem>
                  <SelectItem value="probability">Probability</SelectItem>
                  <SelectItem value="delta">ΔCO-GRI</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Scenario Name
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort('severity')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Severity
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort('probability')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      Probability
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort('delta')}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      ΔCO-GRI
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Weighted Δ</TableHead>
                  <TableHead>Countries</TableHead>
                  <TableHead>Channels</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedScenarios.map((scenario) => {
                  const result = results.get(scenario.scenario_id);
                  const isBest = scenario.scenario_id === bestScenario;
                  const isWorst = scenario.scenario_id === worstScenario;

                  return (
                    <TableRow
                      key={scenario.scenario_id}
                      className={
                        isBest
                          ? 'bg-green-50 dark:bg-green-950/20'
                          : isWorst
                          ? 'bg-red-50 dark:bg-red-950/20'
                          : ''
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {scenario.name}
                          {isBest && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Best
                            </Badge>
                          )}
                          {isWorst && (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              Worst
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{scenario.event_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(scenario.severity)}`} />
                          {scenario.severity}
                        </div>
                      </TableCell>
                      <TableCell>{(scenario.probability * 100).toFixed(0)}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {result && getDeltaIcon(result.delta_CO_GRI)}
                          <span className="font-semibold">
                            {result?.delta_CO_GRI.toFixed(2) || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {result?.probability_weighted_delta.toFixed(2) || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {scenario.affected_countries.length} countries
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {scenario.affected_channels.map((channel) => (
                            <Badge key={channel} variant="secondary" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
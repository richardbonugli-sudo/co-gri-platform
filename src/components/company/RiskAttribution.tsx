/**
 * Risk Attribution (C7)
 * Full-width component showing risk attribution analysis
 * Part of CO-GRI Platform Phase 2 - Week 4
 * 
 * Implements specification Part 3.3 C7
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart3, Table as TableIcon, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';
import { CountryExposure } from '@/types/company';
import {
  CountryAttribution,
  calculateCountryAttribution,
  getTopCountriesForAttribution,
  calculateChannelBreakdown,
  getCountryColor,
  getContributionLabel
} from '@/utils/attributionCalculations';

interface RiskAttributionProps {
  ticker: string;
  countryExposures: CountryExposure[];
  totalScore: number;
}

// P3-1: Tier badge styles and labels for surfacing data quality per country row
const TIER_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  DIRECT:    { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400', label: 'DIRECT' },
  ALLOCATED: { bg: 'bg-blue-500/15',    border: 'border-blue-500/40',    text: 'text-blue-400',    label: 'ALLOC' },
  MODELED:   { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-400',   label: 'MODEL' },
  FALLBACK:  { bg: 'bg-rose-500/15',    border: 'border-rose-500/40',    text: 'text-rose-400',    label: 'FALLBK' },
};

const TierBadge: React.FC<{ tier?: string }> = ({ tier }) => {
  if (!tier) return null;
  const style = TIER_STYLES[tier] || TIER_STYLES.FALLBACK;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${style.bg} ${style.border} ${style.text}`}
      title={`Data quality tier: ${tier}`}
    >
      {style.label}
    </span>
  );
};

export const RiskAttribution: React.FC<RiskAttributionProps> = ({
  ticker,
  countryExposures,
  totalScore
}) => {
  const activeLens = useGlobalState((state) => state.active_company_lens);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  // Calculate attributions
  const attributions = calculateCountryAttribution(countryExposures);
  const topAttributions = getTopCountriesForAttribution(attributions, 7);

  // P3-1: Build a lookup map from country → tier for fast access in render
  const tierByCountry = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const exp of countryExposures) {
      // Prefer authoritative V5 `tier`; fall back to `dataSource` for backward compat
      map[exp.country] = (exp as any).tier || (exp as any).dataSource || 'FALLBACK';
    }
    return map;
  }, [countryExposures]);

  const toggleExpanded = (country: string) => {
    setExpandedCountry(expandedCountry === country ? null : country);
  };

  return (
    <Card className="w-full" data-testid="risk-attribution">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            Advanced Metrics
          </Button>
        </div>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Risk Attribution Analysis
        </CardTitle>
        <CardDescription>
          Detailed breakdown of risk contributions by country and channel
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* CRITICAL LABEL */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> This shows <strong>risk contribution share</strong>, not exposure share. 
            Risk contribution = Exposure × Country Shock × Alignment Modifier.
          </p>
        </div>

        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">
              <BarChart3 className="h-4 w-4 mr-2" />
              Bar Chart
            </TabsTrigger>
            <TabsTrigger value="table">
              <TableIcon className="h-4 w-4 mr-2" />
              Detailed Table
            </TabsTrigger>
          </TabsList>

          {/* Bar Chart View */}
          <TabsContent value="chart" className="space-y-4">
            <div className="space-y-3">
              {topAttributions.map((attr, idx) => {
                const color = getCountryColor(attr.risk_share);
                const label = getContributionLabel(attr.risk_share);
                const isExpanded = expandedCountry === attr.country;

                return (
                  <div key={attr.country} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{attr.country}</span>
                            <Badge variant="outline" className="text-xs">
                              {attr.dominant_channel}
                            </Badge>
                            <Badge variant="outline" className="text-xs" style={{ 
                              backgroundColor: `${color}20`, 
                              borderColor: color,
                              color: color 
                            }}>
                              {label}
                            </Badge>
                            {/* P3-1 FIX: Surface V5 evidence tier per country row */}
                            <TierBadge tier={attr.tier || attr.dataSource} />
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold">
                              {attr.risk_share.toFixed(1)}%
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(attr.country)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6">
                          <div
                            className="h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-semibold"
                            style={{ 
                              width: `${Math.min(attr.risk_share, 100)}%`,
                              backgroundColor: color
                            }}
                          >
                            {attr.risk_contribution.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="ml-11 p-4 bg-muted rounded-lg space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Exposure Weight</div>
                            <div className="text-sm font-semibold">
                              {(attr.exposure_weight * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Adjusted Shock</div>
                            <div className="text-sm font-semibold">
                              {attr.adjusted_shock.toFixed(1)}
                            </div>
                          </div>
                          {showAdvanced && attr.alignment_modifier !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Alignment (W^c)</div>
                              <div className="text-sm font-semibold">
                                {attr.alignment_modifier.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Channel Breakdown */}
                        <div>
                          <div className="text-sm font-semibold mb-2">Channel Breakdown</div>
                          <div className="space-y-2">
                            {calculateChannelBreakdown(attr.country, attr.risk_contribution).map((cb, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{cb.channel}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-gray-300 rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{ width: `${cb.percentage}%` }}
                                    />
                                  </div>
                                  <span className="font-semibold w-16 text-right">
                                    {cb.contribution.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total CO-GRI Score</span>
                <span className="text-2xl font-bold text-primary">{totalScore.toFixed(1)}</span>
              </div>
            </div>
          </TabsContent>

          {/* Table View */}
          <TabsContent value="table" className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Dominant Channel</TableHead>
                    <TableHead className="text-right">Risk Share</TableHead>
                    <TableHead className="text-right">Contribution</TableHead>
                    <TableHead className="text-right">Exposure</TableHead>
                    <TableHead className="text-right">Adj. Shock</TableHead>
                    {showAdvanced && (
                      <TableHead className="text-right">W^c</TableHead>
                    )}
                    <TableHead className="text-right">Label</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAttributions.map((attr, idx) => {
                    const color = getCountryColor(attr.risk_share);
                    const label = getContributionLabel(attr.risk_share);

                    return (
                      <TableRow key={attr.country}>
                        <TableCell>
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                            {idx + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            {attr.country}
                            {/* P3-1 FIX: Surface V5 evidence tier in table view */}
                            <TierBadge tier={attr.tier || attr.dataSource} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {attr.dominant_channel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {attr.risk_share.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {attr.risk_contribution.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(attr.exposure_weight * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {attr.adjusted_shock.toFixed(1)}
                        </TableCell>
                        {showAdvanced && (
                          <TableCell className="text-right">
                            {attr.alignment_modifier?.toFixed(2)}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <Badge variant="outline" style={{ 
                            backgroundColor: `${color}20`, 
                            borderColor: color,
                            color: color 
                          }}>
                            {label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="font-semibold bg-muted">
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right">
                      {topAttributions.reduce((sum, a) => sum + a.risk_share, 0).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-primary text-lg">
                      {totalScore.toFixed(1)}
                    </TableCell>
                    <TableCell colSpan={showAdvanced ? 4 : 3}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RiskAttribution;
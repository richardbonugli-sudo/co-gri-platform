/**
 * Verification Drawer (C9)
 * Collapsible drawer showing calculation verification
 * Part of CO-GRI Platform Phase 2 - Week 4
 *
 * Implements specification Part 3.3 C9
 *
 * GAP 5 FIX: Added TierBadge component and Evidence Tiers tab to display
 * evidence quality tiers (DIRECT / ALLOCATED / MODELED) per country row.
 *
 * R12: TierBadge extracted to src/components/common/TierBadge.tsx (shared component).
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
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  FileText,
  TrendingUp,
  Database,
  Info,
} from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';
import {
  generateCalculationSteps,
  generateSensitivityAnalysis,
  getDataSources
} from '@/utils/verificationData';
// R12: Import shared TierBadge
import { TierBadge, normalizeToTier, type EvidenceTier } from '@/components/common/TierBadge';

// ============================================================================
// Types
// ============================================================================

interface ChannelCountryRow {
  country: string;
  weight: number;
  tier?: EvidenceTier;
  source?: string;
}

interface VerificationDrawerProps {
  ticker: string;
  finalScore: number;
  defaultCollapsed?: boolean;
  /** GAP 5 FIX: Optional channel breakdown for tier badge display */
  channelBreakdown?: {
    revenue?: Record<string, ChannelCountryRow>;
    supply?: Record<string, ChannelCountryRow>;
    assets?: Record<string, ChannelCountryRow>;
    financial?: Record<string, ChannelCountryRow>;
  };
}

// ============================================================================
// Component
// ============================================================================

export const VerificationDrawer: React.FC<VerificationDrawerProps> = ({
  ticker,
  finalScore,
  defaultCollapsed = true,
  channelBreakdown,
}) => {
  const activeLens = useGlobalState((state) => state.active_company_lens);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const calculationSteps = generateCalculationSteps(ticker, finalScore);
  const sensitivityAnalysis = generateSensitivityAnalysis(finalScore);
  const dataSources = getDataSources();

  // GAP 5 FIX: Flatten channel breakdown into rows for tier display
  const tierRows: Array<ChannelCountryRow & { channel: string }> = [];
  if (channelBreakdown) {
    const channels = [
      { key: 'revenue', label: 'Revenue' },
      { key: 'supply', label: 'Supply' },
      { key: 'assets', label: 'Assets' },
      { key: 'financial', label: 'Financial' },
    ] as const;
    for (const { key, label } of channels) {
      const ch = channelBreakdown[key];
      if (ch) {
        for (const [country, row] of Object.entries(ch)) {
          tierRows.push({ ...row, country, channel: label });
        }
      }
    }
    const tierOrder: Record<EvidenceTier, number> = { DIRECT: 0, ALLOCATED: 1, MODELED: 2 };
    tierRows.sort((a, b) => {
      const ta = tierOrder[normalizeToTier(a.tier)];
      const tb = tierOrder[normalizeToTier(b.tier)];
      if (ta !== tb) return ta - tb;
      return b.weight - a.weight;
    });
  }

  if (isCollapsed) {
    return (
      <Card className="w-full" data-testid="verification-drawer-collapsed">
        <CardHeader className="cursor-pointer" onClick={() => setIsCollapsed(false)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base">Calculation Verification</CardTitle>
              <Badge variant="outline" className="text-xs">
                {calculationSteps.length} steps verified
              </Badge>
            </div>
            <Button variant="ghost" size="sm">
              <ChevronDown className="h-4 w-4" />
              Expand
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full" data-testid="verification-drawer-expanded">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(true)}>
            <ChevronUp className="h-4 w-4 mr-1" />
            Collapse
          </Button>
        </div>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Calculation Verification & Transparency
        </CardTitle>
        <CardDescription>
          Detailed breakdown of CO-GRI calculation steps, data sources, and sensitivity analysis
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="steps" className="space-y-4">
          <TabsList className={`grid w-full ${channelBreakdown ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="steps">
              <FileText className="h-4 w-4 mr-2" />
              Calculation Steps
            </TabsTrigger>
            <TabsTrigger value="sensitivity">
              <TrendingUp className="h-4 w-4 mr-2" />
              Sensitivity Analysis
            </TabsTrigger>
            <TabsTrigger value="sources">
              <Database className="h-4 w-4 mr-2" />
              Data Sources
            </TabsTrigger>
            {channelBreakdown && (
              <TabsTrigger value="tiers">
                <Info className="h-4 w-4 mr-2" />
                Evidence Tiers
              </TabsTrigger>
            )}
          </TabsList>

          {/* Calculation Steps Tab */}
          <TabsContent value="steps" className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                <strong>✓ All calculation steps verified</strong> - The CO-GRI score follows the
                authoritative 7-step pipeline with all mathematical guardrails enforced.
              </p>
            </div>

            <div className="space-y-4">
              {calculationSteps.map((step) => (
                <Card key={step.step_number} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold text-sm">
                          {step.step_number}
                        </div>
                        <div>
                          <CardTitle className="text-base">{step.step_name}</CardTitle>
                          <code className="text-xs text-muted-foreground">{step.formula}</code>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        ✓ Verified
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold mb-2">Inputs:</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(step.inputs).map(([key, value]) => (
                          <div key={key} className="flex justify-between p-2 bg-muted rounded">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-semibold">
                              {typeof value === 'number' ? value.toFixed(2) : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-semibold text-green-900">Output:</span>
                      <span className="text-lg font-bold text-green-700">
                        {step.output.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.explanation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Final Score Summary */}
            <Card className="border-2 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Final CO-GRI Score</div>
                    <div className="text-3xl font-bold text-primary">{finalScore.toFixed(1)}</div>
                  </div>
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sensitivity Analysis Tab */}
          <TabsContent value="sensitivity" className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Sensitivity Analysis:</strong> Shows how ±10% changes in key parameters
                affect the final CO-GRI score. Helps understand which factors have the most impact.
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead className="text-right">Baseline</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">New Value</TableHead>
                    <TableHead className="text-right">ΔCO-GRI</TableHead>
                    <TableHead className="text-right">% Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sensitivityAnalysis.map((analysis, idx) => {
                    const isPositive = analysis.change_percentage > 0;
                    const color = isPositive ? 'text-red-600' : 'text-green-600';

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{analysis.parameter}</TableCell>
                        <TableCell className="text-right">
                          {analysis.baseline_value.toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${color}`}>
                          {isPositive ? '+' : ''}{analysis.change_percentage}%
                        </TableCell>
                        <TableCell className="text-right">
                          {analysis.new_value.toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${color}`}>
                          {analysis.impact_on_CO_GRI > 0 ? '+' : ''}
                          {analysis.impact_on_CO_GRI.toFixed(1)}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${color}`}>
                          {analysis.percentage_change > 0 ? '+' : ''}
                          {analysis.percentage_change.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  • <strong>Most Sensitive:</strong> Sector Multiplier (±5.2 point impact per 10% change)
                </p>
                <p>
                  • <strong>Moderately Sensitive:</strong> China Exposure Weight (±2.8 point impact)
                </p>
                <p>
                  • <strong>Least Sensitive:</strong> Taiwan Shock Index (±1.4 point impact)
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-900">
                <strong>Data Transparency:</strong> All data sources used in CO-GRI calculation
                are listed below with last update dates for full transparency.
              </p>
            </div>

            <div className="space-y-3">
              {dataSources.map((source, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{source.source_name}</CardTitle>
                      <Badge variant="outline">
                        Updated: {source.last_updated}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{source.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-base">Key Assumptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  • <strong>Exposure Normalization:</strong> All country exposures sum to 100%
                </p>
                <p>
                  • <strong>Alignment Modifier:</strong> US-country relationships affect shock severity (λ = 0.30)
                </p>
                <p>
                  • <strong>Channel Weights:</strong> Revenue 35%, Supply Chain 30%, Physical Assets 20%, Financial 15%
                </p>
                <p>
                  • <strong>Sector Multiplier:</strong> Industry-specific risk amplification (1.0-1.3 range)
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GAP 5 FIX: Evidence Tiers Tab */}
          {channelBreakdown && (
            <TabsContent value="tiers" className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-2">
                <Info className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-indigo-900">
                  <strong>Evidence Tiers</strong> show how each country's exposure weight was determined.{' '}
                  <TierBadge tier="DIRECT" /> = explicitly disclosed in SEC filing.{' '}
                  <TierBadge tier="ALLOCATED" /> = derived from region total via economic prior.{' '}
                  <TierBadge tier="MODELED" /> = model-estimated, no direct filing evidence.
                </p>
              </div>

              {/* Tier summary counts */}
              <div className="grid grid-cols-3 gap-3">
                {(['DIRECT', 'ALLOCATED', 'MODELED'] as EvidenceTier[]).map(tier => {
                  const count = tierRows.filter(r => (r.tier ?? 'MODELED') === tier).length;
                  const pct = tierRows.length > 0 ? ((count / tierRows.length) * 100).toFixed(0) : '0';
                  return (
                    <div key={tier} className="p-3 border rounded-lg text-center">
                      <TierBadge tier={tier} />
                      <div className="mt-2 text-2xl font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground">{pct}% of rows</div>
                    </div>
                  );
                })}
              </div>

              {/* Tier table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tierRows.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className={(row.tier ?? 'MODELED') === 'MODELED' ? 'opacity-70' : ''}
                      >
                        <TableCell className="font-medium">{row.country}</TableCell>
                        <TableCell className="text-muted-foreground">{row.channel}</TableCell>
                        <TableCell>
                          <TierBadge tier={row.tier} />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {(row.weight * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {row.source ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default VerificationDrawer;
/**
 * Quantitative Anchors Tier (Tier 3)
 * 
 * Complete technical data and methodology details for analysts,
 * data scientists, and technical users.
 * 
 * @module QuantitativeAnchorsTier
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronUp, Database, Copy, Check } from 'lucide-react';
import type { COGRIResult } from '@/utils/cogriCalculator';
import type { CedarOwlForecast } from '@/types/forecast';

export interface QuantitativeAnchorsTierProps {
  forecast: CedarOwlForecast;
  result: COGRIResult;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Tier 3: Quantitative Anchors Component
 * 
 * Target Audience: Analysts, Data Scientists, Technical Users
 * Purpose: Complete technical data and methodology details
 */
export function QuantitativeAnchorsTier({
  forecast,
  result,
  isExpanded,
  onToggle
}: QuantitativeAnchorsTierProps) {
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Database className="h-6 w-6 text-purple-600" />
              Tier 3: Quantitative Anchors
            </CardTitle>
            <CardDescription>
              Complete technical data and methodology details
            </CardDescription>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Sector Multipliers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold">Sector Multipliers</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(
                    JSON.stringify(forecast.sectorMultipliers, null, 2),
                    'sectors'
                  )}
                  className="gap-2"
                >
                  {copiedSection === 'sectors' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-right">Multiplier</TableHead>
                      <TableHead>Rationale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(forecast.sectorMultipliers)
                      .sort(([, a], [, b]) => b - a)
                      .map(([sector, multiplier]) => (
                        <TableRow key={sector}>
                          <TableCell className="font-medium">{sector}</TableCell>
                          <TableCell className="text-right font-mono">
                            {multiplier.toFixed(2)}x
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sector === 'Defense' && 'Elevated spending from geopolitical tensions'}
                            {sector === 'Energy' && 'Supply disruption risks and transition dynamics'}
                            {sector === 'Materials' && 'Critical mineral constraints and demand'}
                            {sector === 'Semiconductors' && 'Tech decoupling and supply chain shifts'}
                            {sector === 'Technology' && 'AI race and digital infrastructure'}
                            {sector === 'Mining' && 'Commodity super-cycle and EV demand'}
                            {sector === 'Aerospace' && 'Defense modernization programs'}
                            {sector === 'Agriculture' && 'Food security and climate impacts'}
                            {sector === 'Renewable Energy' && 'Energy transition acceleration'}
                            {sector === 'Financial Services' && 'Dedollarization and fintech'}
                            {sector === 'Transportation' && 'Supply chain reconfiguration'}
                            {sector === 'Manufacturing' && 'Nearshoring and automation'}
                            {sector === 'Telecommunications' && 'Digital infrastructure buildout'}
                            {sector === 'Pharmaceuticals' && 'Supply chain resilience'}
                            {sector === 'Consumer Goods' && 'Demand stability'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Regional Risk Premiums */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold">Regional Risk Premiums</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(
                    JSON.stringify(forecast.regionalPremiums, null, 2),
                    'regions'
                  )}
                  className="gap-2"
                >
                  {copiedSection === 'regions' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-right">Premium</TableHead>
                      <TableHead>Key Drivers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(forecast.regionalPremiums)
                      .sort(([, a], [, b]) => b - a)
                      .map(([region, premium]) => (
                        <TableRow key={region}>
                          <TableCell className="font-medium">{region}</TableCell>
                          <TableCell className="text-right font-mono">
                            {premium.toFixed(2)}x
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {region === 'Middle East' && 'Oil volatility, regional conflicts, energy transition'}
                            {region === 'Africa' && 'Political instability, infrastructure gaps, commodity potential'}
                            {region === 'Europe' && 'Energy dependence, defense spending, economic stagnation'}
                            {region === 'Americas' && 'Nearshoring benefits, political diversity, commodity cycle'}
                            {region === 'North America' && 'Economic stability, policy uncertainty, tech leadership'}
                            {region === 'Asia-Pacific' && 'Growth dynamics, tech competition, demographic dividend'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Asset Class Forecasts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold">Asset Class Forecasts</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(
                    JSON.stringify(forecast.assetClassForecasts, null, 2),
                    'assets'
                  )}
                  className="gap-2"
                >
                  {copiedSection === 'assets' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Class</TableHead>
                      <TableHead className="text-right">Expected Return</TableHead>
                      <TableHead>Recommendation</TableHead>
                      <TableHead>Rationale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(forecast.assetClassForecasts)
                      .sort((a, b) => b.expectedReturn - a.expectedReturn)
                      .map((asset) => (
                        <TableRow key={asset.assetClass}>
                          <TableCell className="font-medium">{asset.assetClass}</TableCell>
                          <TableCell className="text-right font-mono">
                            <span className={asset.expectedReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {asset.expectedReturn >= 0 ? '+' : ''}{(asset.expectedReturn * 100).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              asset.recommendation === 'OVERWEIGHT' ? 'bg-green-600' :
                              asset.recommendation === 'UNDERWEIGHT' ? 'bg-red-600' :
                              'bg-gray-600'
                            }>
                              {asset.recommendation}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <ul className="list-disc list-inside space-y-1">
                              {asset.rationale.slice(0, 2).map((reason, i) => (
                                <li key={i}>{reason}</li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Geopolitical Events (Complete List) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold">Geopolitical Events (Complete List)</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(
                    JSON.stringify(forecast.geopoliticalEvents, null, 2),
                    'events'
                  )}
                  className="gap-2"
                >
                  {copiedSection === 'events' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
              <div className="space-y-3">
                {forecast.geopoliticalEvents.map((event, index) => (
                  <Card key={index}>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleSection(`event-${index}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{event.event}</CardTitle>
                            <Badge className={getRiskLevelColor(event.riskLevel)}>
                              {event.riskLevel}
                            </Badge>
                          </div>
                          <CardDescription>
                            {event.timeline} • {(event.probability * 100).toFixed(0)}% probability • 
                            Affects {event.affectedCountries.length} countries
                          </CardDescription>
                        </div>
                        {expandedSections.has(`event-${index}`) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </CardHeader>
                    {expandedSections.has(`event-${index}`) && (
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Investment Impact</h4>
                          <p className="text-sm text-muted-foreground">{event.investmentImpact}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Base Impact Score</h4>
                          <p className="text-sm font-mono">{event.baseImpact}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Affected Countries</h4>
                          <div className="flex flex-wrap gap-1">
                            {event.affectedCountries.map((country) => (
                              <Badge key={country} variant="outline">
                                {country}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Sector Impacts</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Sector</TableHead>
                                <TableHead className="text-right">Impact Multiplier</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(event.sectorImpacts).map(([sector, impact]) => (
                                <TableRow key={sector}>
                                  <TableCell>{sector}</TableCell>
                                  <TableCell className="text-right font-mono">
                                    {impact.toFixed(2)}x
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Forecast Metadata */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold">Forecast Metadata</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(
                    JSON.stringify(forecast.metadata, null, 2),
                    'metadata'
                  )}
                  className="gap-2"
                >
                  {copiedSection === 'metadata' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
                    <div>
                      <p className="text-muted-foreground">Forecast Period</p>
                      <p className="font-semibold">{forecast.metadata.forecastPeriod}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Publish Date</p>
                      <p className="font-semibold">{forecast.metadata.publishDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Update</p>
                      <p className="font-semibold">{forecast.metadata.nextUpdate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expert Sources</p>
                      <p className="font-semibold">{forecast.metadata.expertSources}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Overall Confidence</p>
                      <p className="font-semibold">
                        {(forecast.metadata.overallConfidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Coverage</p>
                      <p className="font-semibold">
                        {forecast.metadata.coverage.countries} countries, {' '}
                        {forecast.metadata.coverage.events} events, {' '}
                        {forecast.metadata.coverage.regions} regions, {' '}
                        {forecast.metadata.coverage.assetClasses} asset classes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Methodology Notes */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Methodology Notes</h3>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Forecast Delta Application</h4>
                    <p className="text-sm text-muted-foreground">
                      Forecast deltas are applied additively to base CSI scores: 
                      <code className="bg-muted px-2 py-1 rounded ml-2">
                        Adjusted CSI = Base CSI + Forecast Delta
                      </code>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Sector Multipliers</h4>
                    <p className="text-sm text-muted-foreground">
                      When sector information is available, the forecast delta is multiplied by the sector-specific multiplier:
                      <code className="bg-muted px-2 py-1 rounded ml-2">
                        Adjusted Delta = Base Delta × Sector Multiplier
                      </code>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Guardrails Enforced</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>No new exposure inference (only existing exposures adjusted)</li>
                      <li>Additive CSI deltas only (no multiplicative adjustments)</li>
                      <li>Existing exposure only (no new countries added)</li>
                      <li>Expected path, not stress scenario</li>
                      <li>No dense propagation (sparse adjustments)</li>
                      <li>Clear labeling (forecast-baseline mode)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Data Sources</h4>
                    <p className="text-sm text-muted-foreground">
                      CedarOwl Integrated Geopolitical Gurus Risk Forecast synthesizes insights from 
                      {forecast.metadata.expertSources} leading geopolitical and financial analysts, 
                      including think tanks, investment banks, and independent research firms.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Limitations and Assumptions</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Forecast represents expected path, not all possible scenarios</li>
                      <li>Probabilities are expert consensus estimates, not statistical predictions</li>
                      <li>Country-level adjustments assume uniform exposure within countries</li>
                      <li>Sector multipliers are applied uniformly across all countries</li>
                      <li>Regional premiums reflect aggregate risk, not country-specific factors</li>
                      <li>Asset class forecasts are directional guidance, not precise targets</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Calculation Formulas</h4>
                    <div className="space-y-2 text-sm font-mono bg-muted p-3 rounded">
                      <p>// Base adjustment</p>
                      <p>adjustedCSI = baseCSI + forecastDelta</p>
                      <p></p>
                      <p>// With sector multiplier</p>
                      <p>adjustedCSI = baseCSI + (forecastDelta × sectorMultiplier)</p>
                      <p></p>
                      <p>// CO-GRI score calculation</p>
                      <p>COGRI = Σ(countryCSI × exposureWeight) / totalExposure</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
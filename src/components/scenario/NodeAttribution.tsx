/**
 * Node Attribution Component (S4)
 * Displays top impacted countries with detailed metrics
 * Shows country-level ΔCO-GRI contributions and risk changes
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Download,
  Copy,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { ScenarioResult } from '@/types/scenario';

interface NodeAttributionProps {
  result: ScenarioResult | null;
  isLoading?: boolean;
  actorCountry?: string;
  targetCountries?: string[];
}

type SortColumn = 'rank' | 'country' | 'baseline' | 'scenario' | 'delta' | 'percentage' | 'exposure';
type SortDirection = 'asc' | 'desc';
type ImpactFilter = 'all' | 'direct' | 'actor' | 'spillover';
type RiskChangeFilter = 'all' | 'increased' | 'decreased' | 'stable';

// Country flag emojis mapping
const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'China': '🇨🇳',
  'Japan': '🇯🇵',
  'Germany': '🇩🇪',
  'United Kingdom': '🇬🇧',
  'France': '🇫🇷',
  'India': '🇮🇳',
  'Italy': '🇮🇹',
  'Brazil': '🇧🇷',
  'Canada': '🇨🇦',
  'South Korea': '🇰🇷',
  'Russia': '🇷🇺',
  'Spain': '🇪🇸',
  'Australia': '🇦🇺',
  'Mexico': '🇲🇽',
  'Indonesia': '🇮🇩',
  'Netherlands': '🇳🇱',
  'Saudi Arabia': '🇸🇦',
  'Turkey': '🇹🇷',
  'Switzerland': '🇨🇭',
  'Taiwan': '🇹🇼',
  'Poland': '🇵🇱',
  'Belgium': '🇧🇪',
  'Argentina': '🇦🇷',
  'Sweden': '🇸🇪',
  'Ireland': '🇮🇪',
  'Israel': '🇮🇱',
  'Norway': '🇳🇴',
  'Austria': '🇦🇹',
  'United Arab Emirates': '🇦🇪',
  'Singapore': '🇸🇬',
  'Hong Kong': '🇭🇰',
  'Vietnam': '🇻🇳',
  'Malaysia': '🇲🇾',
  'Thailand': '🇹🇭',
  'Philippines': '🇵🇭',
  'Bangladesh': '🇧🇩',
  'Egypt': '🇪🇬',
  'Iran': '🇮🇷',
  'Iraq': '🇮🇶',
  'Qatar': '🇶🇦',
  'Kuwait': '🇰🇼',
};

function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🏳️';
}

function getRiskLevelColor(delta: number): string {
  const absDelta = Math.abs(delta);
  if (absDelta >= 10) return 'text-red-600 bg-red-50';
  if (absDelta >= 5) return 'text-orange-600 bg-orange-50';
  if (absDelta >= 2) return 'text-yellow-600 bg-yellow-50';
  if (delta < 0) return 'text-green-600 bg-green-50';
  return 'text-gray-600 bg-gray-50';
}

function getDirectionIcon(delta: number) {
  if (delta > 0.5) return <TrendingUp className="h-4 w-4 text-red-600" />;
  if (delta < -0.5) return <TrendingDown className="h-4 w-4 text-green-600" />;
  return <Minus className="h-4 w-4 text-gray-600" />;
}

export default function NodeAttribution({
  result,
  isLoading = false,
  actorCountry,
  targetCountries = [],
}: NodeAttributionProps) {
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('delta');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('all');
  const [riskChangeFilter, setRiskChangeFilter] = useState<RiskChangeFilter>('all');
  const [displayLimit, setDisplayLimit] = useState(10);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  // Process and sort country data
  const processedCountries = useMemo(() => {
    if (!result || !result.countryExposures) return [];

    return result.countryExposures.map((exposure, index) => {
      const delta = exposure.scenarioContribution - exposure.baseContribution;
      const percentage =
        exposure.baseContribution > 0
          ? (delta / exposure.baseContribution) * 100
          : 0;

      // Determine impact type
      let impactType: 'direct' | 'actor' | 'spillover' = 'spillover';
      if (targetCountries.includes(exposure.country)) {
        impactType = 'direct';
      } else if (actorCountry === exposure.country) {
        impactType = 'actor';
      }

      // Determine risk change
      let riskChange: 'increased' | 'decreased' | 'stable' = 'stable';
      if (delta > 0.5) riskChange = 'increased';
      else if (delta < -0.5) riskChange = 'decreased';

      return {
        ...exposure,
        rank: index + 1,
        delta,
        percentage,
        impactType,
        riskChange,
      };
    });
  }, [result, actorCountry, targetCountries]);

  // Apply filters
  const filteredCountries = useMemo(() => {
    let filtered = [...processedCountries];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Impact type filter
    if (impactFilter !== 'all') {
      filtered = filtered.filter((c) => c.impactType === impactFilter);
    }

    // Risk change filter
    if (riskChangeFilter !== 'all') {
      filtered = filtered.filter((c) => c.riskChange === riskChangeFilter);
    }

    return filtered;
  }, [processedCountries, searchQuery, impactFilter, riskChangeFilter]);

  // Sort countries
  const sortedCountries = useMemo(() => {
    const sorted = [...filteredCountries];

    sorted.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortColumn) {
        case 'rank':
          aVal = a.rank;
          bVal = b.rank;
          break;
        case 'country':
          aVal = a.country;
          bVal = b.country;
          break;
        case 'baseline':
          aVal = a.baseContribution;
          bVal = b.baseContribution;
          break;
        case 'scenario':
          aVal = a.scenarioContribution;
          bVal = b.scenarioContribution;
          break;
        case 'delta':
          aVal = Math.abs(a.delta);
          bVal = Math.abs(b.delta);
          break;
        case 'percentage':
          aVal = Math.abs(a.percentage);
          bVal = Math.abs(b.percentage);
          break;
        case 'exposure':
          aVal = a.exposureWeight;
          bVal = b.exposureWeight;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return sorted;
  }, [filteredCountries, sortColumn, sortDirection]);

  // Display limited countries
  const displayedCountries = sortedCountries.slice(0, displayLimit);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Rank',
      'Country',
      'Baseline CO-GRI',
      'Scenario CO-GRI',
      'ΔCO-GRI',
      '% Change',
      'Exposure Weight',
      'Impact Type',
    ];

    const rows = sortedCountries.map((c) => [
      c.rank,
      c.country,
      c.baseContribution.toFixed(2),
      c.scenarioContribution.toFixed(2),
      c.delta.toFixed(2),
      c.percentage.toFixed(1) + '%',
      (c.exposureWeight * 100).toFixed(1) + '%',
      c.impactType,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'node-attribution.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const headers = [
      'Rank',
      'Country',
      'Baseline',
      'Scenario',
      'Delta',
      '% Change',
      'Exposure',
      'Type',
    ];

    const rows = sortedCountries.map((c) => [
      c.rank,
      c.country,
      c.baseContribution.toFixed(2),
      c.scenarioContribution.toFixed(2),
      c.delta.toFixed(2),
      c.percentage.toFixed(1) + '%',
      (c.exposureWeight * 100).toFixed(1) + '%',
      c.impactType,
    ]);

    const text = [headers, ...rows].map((row) => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Node Attribution</CardTitle>
            <LensBadge lens="Scenario Shock" />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Analyzing country impacts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result || !result.countryExposures || result.countryExposures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Node Attribution</CardTitle>
            <LensBadge lens="Scenario Shock" />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="text-center space-y-2">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No country exposure data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Node Attribution</CardTitle>
          <LensBadge lens="Scenario Shock" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Top impacted countries by ΔCO-GRI contribution
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={impactFilter} onValueChange={(v) => setImpactFilter(v as ImpactFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Impact Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="direct">Direct Targets</SelectItem>
              <SelectItem value="actor">Actor Countries</SelectItem>
              <SelectItem value="spillover">Spillover</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={riskChangeFilter}
            onValueChange={(v) => setRiskChangeFilter(v as RiskChangeFilter)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Risk Change" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Changes</SelectItem>
              <SelectItem value="increased">Risk Increased</SelectItem>
              <SelectItem value="decreased">Risk Decreased</SelectItem>
              <SelectItem value="stable">No Change</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {displayedCountries.length} of {sortedCountries.length} countries
          {sortedCountries.length !== processedCountries.length &&
            ` (${processedCountries.length} total)`}
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('rank')}
                >
                  Rank {getSortIcon('rank')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('country')}
                >
                  Country {getSortIcon('country')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort('baseline')}
                >
                  Baseline {getSortIcon('baseline')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort('scenario')}
                >
                  Scenario {getSortIcon('scenario')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort('delta')}
                >
                  ΔCO-GRI {getSortIcon('delta')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort('percentage')}
                >
                  % Change {getSortIcon('percentage')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-right hidden md:table-cell"
                  onClick={() => handleSort('exposure')}
                >
                  Exposure {getSortIcon('exposure')}
                </TableHead>
                <TableHead className="hidden lg:table-cell">Type</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedCountries.map((country) => (
                <React.Fragment key={country.country}>
                  <TableRow
                    className="cursor-pointer hover:bg-orange-50/50"
                    onClick={() =>
                      setExpandedCountry(
                        expandedCountry === country.country ? null : country.country
                      )
                    }
                  >
                    <TableCell className="font-medium">{country.rank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCountryFlag(country.country)}</span>
                        <span className="font-medium">{country.country}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {country.baseContribution.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {country.scenarioContribution.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getDirectionIcon(country.delta)}
                        <span className={`font-semibold ${getRiskLevelColor(country.delta)}`}>
                          {country.delta > 0 ? '+' : ''}
                          {country.delta.toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-medium ${
                          country.percentage > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {country.percentage > 0 ? '+' : ''}
                        {country.percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {(country.exposureWeight * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant="outline"
                        className={
                          country.impactType === 'direct'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : country.impactType === 'actor'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }
                      >
                        {country.impactType === 'direct'
                          ? 'Direct'
                          : country.impactType === 'actor'
                          ? 'Actor'
                          : 'Spillover'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expandedCountry === country.country ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details */}
                  {expandedCountry === country.country && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/30 p-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg">
                            {getCountryFlag(country.country)} {country.country} - Detailed Metrics
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Risk Metrics */}
                            <div className="space-y-2">
                              <p className="text-sm font-semibold">Risk Metrics</p>
                              <div className="bg-card rounded p-3 space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Baseline CSI:</span>
                                  <span className="font-medium">{country.baseCSI.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Scenario CSI:</span>
                                  <span className="font-medium">
                                    {country.scenarioCSI.toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">CSI Delta:</span>
                                  <span className="font-semibold text-orange-600">
                                    {(country.scenarioCSI - country.baseCSI).toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Exposure Weight:</span>
                                  <span className="font-medium">
                                    {(country.exposureWeight * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Contribution Breakdown */}
                            <div className="space-y-2">
                              <p className="text-sm font-semibold">Contribution Breakdown</p>
                              <div className="bg-card rounded p-3 space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Baseline Contribution:
                                  </span>
                                  <span className="font-medium">
                                    {country.baseContribution.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Scenario Contribution:
                                  </span>
                                  <span className="font-medium">
                                    {country.scenarioContribution.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Delta:</span>
                                  <span className="font-semibold text-orange-600">
                                    {country.delta > 0 ? '+' : ''}
                                    {country.delta.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Percentage Change:</span>
                                  <span className="font-semibold text-orange-600">
                                    {country.percentage > 0 ? '+' : ''}
                                    {country.percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Impact Type Badge */}
                          <div>
                            <p className="text-sm font-semibold mb-2">Impact Classification</p>
                            <Badge
                              variant="outline"
                              className={
                                country.impactType === 'direct'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : country.impactType === 'actor'
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }
                            >
                              {country.impactType === 'direct'
                                ? 'Direct Target - Full scenario impact applied'
                                : country.impactType === 'actor'
                                ? 'Actor Country - Initiating the scenario'
                                : 'Spillover - Indirect impact through exposure channels'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {sortedCountries.length > displayLimit && (
          <div className="flex justify-center gap-2">
            {displayLimit === 10 && (
              <Button variant="outline" onClick={() => setDisplayLimit(25)}>
                Show Top 25
              </Button>
            )}
            {displayLimit === 25 && sortedCountries.length > 25 && (
              <Button variant="outline" onClick={() => setDisplayLimit(sortedCountries.length)}>
                Show All ({sortedCountries.length})
              </Button>
            )}
            {displayLimit > 10 && (
              <Button variant="outline" onClick={() => setDisplayLimit(10)}>
                Show Less
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
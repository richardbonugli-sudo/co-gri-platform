/**
 * Exposure Mapping Tier (Tier 2)
 * 
 * Detailed country-by-country exposure analysis for risk managers
 * and portfolio managers. Includes filterable table with expandable rows.
 * 
 * @module ExposureMappingTier
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { ChevronDown, ChevronUp, Search, Download, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import type { CedarOwlForecast } from '@/types/forecast';
import type { AdjustedExposure } from '@/services/forecastEngine';

export interface ExposureMappingTierProps {
  exposures: AdjustedExposure[];
  forecast: CedarOwlForecast;
  isExpanded: boolean;
  onToggle: () => void;
}

type SortField = 'country' | 'baseCsi' | 'delta' | 'adjustedCsi' | 'outlook' | 'riskTrend';
type SortDirection = 'asc' | 'desc';

/**
 * Tier 2: Exposure Mapping Component
 * 
 * Target Audience: Risk Managers, Portfolio Managers
 * Purpose: Detailed country-by-country exposure analysis
 */
export function ExposureMappingTier({
  exposures,
  forecast,
  isExpanded,
  onToggle
}: ExposureMappingTierProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [outlookFilter, setOutlookFilter] = React.useState<string>('all');
  const [trendFilter, setTrendFilter] = React.useState<string>('all');
  const [sortField, setSortField] = React.useState<SortField>('delta');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 20;

  // Filter and sort exposures
  const filteredExposures = React.useMemo(() => {
    const filtered = exposures.filter(exp => {
      const matchesSearch = exp.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exp.countryCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOutlook = outlookFilter === 'all' || exp.outlook === outlookFilter;
      const matchesTrend = trendFilter === 'all' || exp.riskTrend === trendFilter;
      return matchesSearch && matchesOutlook && matchesTrend;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case 'country':
          aVal = a.countryName;
          bVal = b.countryName;
          break;
        case 'baseCsi':
          aVal = a.baseCsi;
          bVal = b.baseCsi;
          break;
        case 'delta':
          aVal = a.delta;
          bVal = b.delta;
          break;
        case 'adjustedCsi':
          aVal = a.adjustedCsi;
          bVal = b.adjustedCsi;
          break;
        case 'outlook':
          aVal = a.outlook;
          bVal = b.outlook;
          break;
        case 'riskTrend':
          aVal = a.riskTrend;
          bVal = b.riskTrend;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      }
    });

    return filtered;
  }, [exposures, searchTerm, outlookFilter, trendFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredExposures.length / rowsPerPage);
  const paginatedExposures = filteredExposures.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleRow = (countryCode: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(countryCode)) {
      newExpanded.delete(countryCode);
    } else {
      newExpanded.add(countryCode);
    }
    setExpandedRows(newExpanded);
  };

  const handleExportCSV = () => {
    const headers = ['Country', 'Country Code', 'Original CSI', 'Delta', 'Adjusted CSI', 'Change %', 'Outlook', 'Risk Trend', 'Expected Return'];
    const rows = filteredExposures.map(exp => [
      exp.countryName,
      exp.countryCode,
      exp.baseCsi.toFixed(2),
      exp.delta.toFixed(2),
      exp.adjustedCsi.toFixed(2),
      (((exp.adjustedCsi - exp.baseCsi) / exp.baseCsi) * 100).toFixed(2),
      exp.outlook,
      exp.riskTrend,
      (exp.expectedReturn * 100).toFixed(2)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exposure-mapping.csv';
    a.click();
  };

  const getOutlookColor = (outlook: string) => {
    switch (outlook) {
      case 'STRONG_BUY': return 'bg-green-700 text-white';
      case 'BUY': return 'bg-green-600 text-white';
      case 'OUTPERFORM': return 'bg-green-500 text-white';
      case 'SELECTIVE': return 'bg-blue-500 text-white';
      case 'NEUTRAL': return 'bg-gray-500 text-white';
      case 'UNDERPERFORM': return 'bg-orange-500 text-white';
      case 'AVOID': return 'bg-red-600 text-white';
      case 'HIGH_RISK': return 'bg-red-700 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  // Summary statistics
  const avgChange = filteredExposures.reduce((sum, exp) => sum + exp.delta, 0) / filteredExposures.length;
  const improving = filteredExposures.filter(exp => exp.riskTrend === 'IMPROVING').length;
  const deteriorating = filteredExposures.filter(exp => exp.riskTrend === 'DETERIORATING').length;

  return (
    <Card className="border-2 border-green-200">
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <MapPin className="h-6 w-6 text-green-600" />
              Tier 2: Exposure Mapping
            </CardTitle>
            <CardDescription>
              Detailed country-by-country exposure analysis
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
          <CardContent className="space-y-4">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Countries</p>
                  <p className="text-2xl font-bold">{filteredExposures.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Average Change</p>
                  <p className="text-2xl font-bold">
                    {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Improving</p>
                  <p className="text-2xl font-bold text-green-600">{improving}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Deteriorating</p>
                  <p className="text-2xl font-bold text-red-600">{deteriorating}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by country name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={outlookFilter} onValueChange={setOutlookFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by outlook" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outlooks</SelectItem>
                  <SelectItem value="STRONG_BUY">Strong Buy</SelectItem>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="OUTPERFORM">Outperform</SelectItem>
                  <SelectItem value="SELECTIVE">Selective</SelectItem>
                  <SelectItem value="NEUTRAL">Neutral</SelectItem>
                  <SelectItem value="UNDERPERFORM">Underperform</SelectItem>
                  <SelectItem value="AVOID">Avoid</SelectItem>
                  <SelectItem value="HIGH_RISK">High Risk</SelectItem>
                </SelectContent>
              </Select>
              <Select value={trendFilter} onValueChange={setTrendFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by trend" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trends</SelectItem>
                  <SelectItem value="IMPROVING">Improving</SelectItem>
                  <SelectItem value="STABLE">Stable</SelectItem>
                  <SelectItem value="DETERIORATING">Deteriorating</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>

            {/* Exposure Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleSort('country')}
                    >
                      Country {sortField === 'country' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-accent text-right"
                      onClick={() => handleSort('baseCsi')}
                    >
                      Original CSI {sortField === 'baseCsi' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-accent text-right"
                      onClick={() => handleSort('delta')}
                    >
                      Delta {sortField === 'delta' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-accent text-right"
                      onClick={() => handleSort('adjustedCsi')}
                    >
                      Adjusted CSI {sortField === 'adjustedCsi' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Change %</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleSort('outlook')}
                    >
                      Outlook {sortField === 'outlook' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleSort('riskTrend')}
                    >
                      Trend {sortField === 'riskTrend' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-center">Events</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExposures.map((exp) => (
                    <React.Fragment key={exp.countryCode}>
                      <TableRow 
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => toggleRow(exp.countryCode)}
                      >
                        <TableCell>
                          {expandedRows.has(exp.countryCode) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {exp.countryName}
                          <span className="text-xs text-muted-foreground ml-2">
                            {exp.countryCode}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{exp.baseCsi.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <span className={exp.delta >= 0 ? 'text-red-600' : 'text-green-600'}>
                            {exp.delta >= 0 ? '+' : ''}{exp.delta.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {exp.adjustedCsi.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={exp.delta >= 0 ? 'text-red-600' : 'text-green-600'}>
                            {(((exp.adjustedCsi - exp.baseCsi) / exp.baseCsi) * 100).toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getOutlookColor(exp.outlook)}>
                            {exp.outlook.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {exp.riskTrend === 'IMPROVING' && <TrendingUp className="h-4 w-4 text-green-600" />}
                            {exp.riskTrend === 'DETERIORATING' && <TrendingDown className="h-4 w-4 text-red-600" />}
                            <span className="text-sm">{exp.riskTrend}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {exp.applicableEvents.length}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(exp.countryCode) && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-accent/20">
                            <div className="p-4 space-y-3">
                              <div>
                                <h4 className="font-semibold mb-2">Key Risk Drivers</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  {exp.forecastDrivers.map((driver, i) => (
                                    <li key={i}>{driver}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Expected Return</h4>
                                <p className="text-sm">
                                  {(exp.expectedReturn * 100).toFixed(2)}% annual return expected
                                </p>
                              </div>
                              {exp.applicableEvents.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">Applicable Events</h4>
                                  <div className="space-y-2">
                                    {exp.applicableEvents.map((event, i) => (
                                      <div key={i} className="text-sm border-l-2 border-blue-500 pl-3">
                                        <p className="font-medium">{event.event}</p>
                                        <p className="text-muted-foreground">
                                          {event.timeline} • {(event.probability * 100).toFixed(0)}% probability
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredExposures.length)} of {filteredExposures.length} countries
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
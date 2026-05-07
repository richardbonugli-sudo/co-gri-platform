/**
 * Audit Trail Panel Component
 * 
 * Shows which events drove each CSI change, displays calculation breakdown,
 * enables drill-down into specific country/event combinations, and provides
 * export capability.
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Layers
} from 'lucide-react';
import { backtestingEngine, type BacktestResult } from '@/services/csi/backtestingEngine';
import { plausibilityChecker, type PlausibilityCheck } from '@/services/csi/plausibilityChecker';
import type { EventCategory } from '@/data/geopoliticalEvents';

interface AuditTrailPanelProps {
  selectedCountry?: string | null;
  selectedEventId?: string | null;
  onEventSelect?: (eventId: string) => void;
  onCountrySelect?: (country: string) => void;
}

interface AuditEntry {
  result: BacktestResult;
  plausibilityCheck?: PlausibilityCheck;
}

export const AuditTrailPanel: React.FC<AuditTrailPanelProps> = ({
  selectedCountry,
  selectedEventId,
  onEventSelect,
  onCountrySelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Get audit entries
  const auditEntries = useMemo((): AuditEntry[] => {
    const results = backtestingEngine.getResults();
    
    return results.map(result => {
      // Run plausibility check if not already done
      let check = plausibilityChecker.getCheckResult(result.eventId);
      if (!check) {
        check = plausibilityChecker.checkEvent(
          result.eventId,
          result.event.category,
          result.event.severity,
          result.modelPrediction.deltaCSI,
          result.modelPrediction.classification,
          result.modelPrediction.propagation
        );
      }
      
      return {
        result,
        plausibilityCheck: check
      };
    });
  }, []);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return auditEntries.filter(entry => {
      // Country filter
      if (selectedCountry && 
          entry.result.event.primaryCountry !== selectedCountry &&
          !entry.result.event.affectedCountries.includes(selectedCountry)) {
        return false;
      }
      
      // Category filter
      if (categoryFilter !== 'all' && entry.result.event.category !== categoryFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          entry.result.event.title.toLowerCase().includes(query) ||
          entry.result.event.primaryCountry.toLowerCase().includes(query) ||
          entry.result.eventId.toLowerCase().includes(query)
        );
      }
      
      return true;
    }).sort((a, b) => b.result.event.date.getTime() - a.result.event.date.getTime());
  }, [auditEntries, selectedCountry, categoryFilter, searchQuery]);

  // Toggle event expansion
  const toggleExpand = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  // Export to JSON
  const exportToJSON = () => {
    const data = filteredEntries.map(entry => ({
      eventId: entry.result.eventId,
      date: entry.result.event.date.toISOString(),
      title: entry.result.event.title,
      country: entry.result.event.primaryCountry,
      category: entry.result.event.category,
      severity: entry.result.event.severity,
      predicted: entry.result.modelPrediction.deltaCSI,
      actual: entry.result.actual.deltaCSI,
      error: entry.result.error,
      direction: entry.result.direction,
      classification: entry.result.modelPrediction.classification,
      propagation: entry.result.modelPrediction.propagation,
      plausibility: entry.plausibilityCheck
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csi-audit-trail-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Event ID', 'Date', 'Title', 'Country', 'Category', 'Severity',
      'Predicted ΔCSI', 'Actual ΔCSI', 'Error', 'Direction', 'Plausibility'
    ];
    
    const rows = filteredEntries.map(entry => [
      entry.result.eventId,
      entry.result.event.date.toISOString().split('T')[0],
      `"${entry.result.event.title.replace(/"/g, '""')}"`,
      entry.result.event.primaryCountry,
      entry.result.event.category,
      entry.result.event.severity,
      entry.result.modelPrediction.deltaCSI.toFixed(2),
      entry.result.actual.deltaCSI.toFixed(2),
      entry.result.error.toFixed(2),
      entry.result.direction,
      entry.plausibilityCheck?.overallStatus || 'N/A'
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csi-audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  const getCategoryColor = (category: EventCategory) => {
    const colors: Record<EventCategory, string> = {
      'Conflict': 'bg-red-500/20 text-red-400 border-red-500',
      'Sanctions': 'bg-orange-500/20 text-orange-400 border-orange-500',
      'Trade': 'bg-blue-500/20 text-blue-400 border-blue-500',
      'Governance': 'bg-purple-500/20 text-purple-400 border-purple-500',
      'Cyber': 'bg-cyan-500/20 text-cyan-400 border-cyan-500',
      'Unrest': 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
      'Currency': 'bg-green-500/20 text-green-400 border-green-500'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500';
  };

  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#7fa89f]" />
            <CardTitle className="text-white text-lg font-semibold">
              Audit Trail
            </CardTitle>
            <Badge className="text-xs bg-[#0d5f5f]/30 text-[#7fa89f]">
              {filteredEntries.length} events
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="border-[#0d5f5f] text-[#7fa89f] hover:bg-[#0d5f5f] hover:text-white"
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToJSON}
              className="border-[#0d5f5f] text-[#7fa89f] hover:bg-[#0d5f5f] hover:text-white"
            >
              <Download className="h-4 w-4 mr-1" />
              JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-[#0a0f0d] border-[#0d5f5f]/30 text-white placeholder:text-gray-500"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] bg-[#0a0f0d] border-[#0d5f5f]/30 text-white">
              <Filter className="h-4 w-4 mr-1 text-gray-400" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1512] border-[#0d5f5f]/30">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Conflict">Conflict</SelectItem>
              <SelectItem value="Sanctions">Sanctions</SelectItem>
              <SelectItem value="Trade">Trade</SelectItem>
              <SelectItem value="Governance">Governance</SelectItem>
              <SelectItem value="Cyber">Cyber</SelectItem>
              <SelectItem value="Unrest">Unrest</SelectItem>
              <SelectItem value="Currency">Currency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Event List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No events found</p>
              <p className="text-xs mt-1">Run backtest to populate audit trail</p>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <Collapsible
                key={entry.result.eventId}
                open={expandedEvents.has(entry.result.eventId)}
                onOpenChange={() => toggleExpand(entry.result.eventId)}
              >
                <CollapsibleTrigger asChild>
                  <div className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-3 cursor-pointer hover:border-[#0d5f5f]/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {expandedEvents.has(entry.result.eventId) ? (
                          <ChevronDown className="h-4 w-4 text-gray-400 mt-1" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${getCategoryColor(entry.result.event.category)}`}>
                              {entry.result.event.category}
                            </Badge>
                            {entry.plausibilityCheck && getStatusIcon(entry.plausibilityCheck.overallStatus)}
                          </div>
                          <p className="text-sm text-white font-medium">
                            {entry.result.event.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>{entry.result.event.date.toLocaleDateString()}</span>
                            <span>•</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCountrySelect?.(entry.result.event.primaryCountry);
                              }}
                              className="text-[#7fa89f] hover:underline"
                            >
                              {entry.result.event.primaryCountry}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Predicted:</span>
                          <span className={entry.result.modelPrediction.deltaCSI > 0 ? 'text-red-400' : 'text-green-400'}>
                            {entry.result.modelPrediction.deltaCSI > 0 ? '+' : ''}
                            {entry.result.modelPrediction.deltaCSI.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Actual:</span>
                          <span className={entry.result.actual.deltaCSI > 0 ? 'text-red-400' : 'text-green-400'}>
                            {entry.result.actual.deltaCSI > 0 ? '+' : ''}
                            {entry.result.actual.deltaCSI.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Error: {entry.result.absoluteError.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="bg-[#0a0f0d]/50 border border-t-0 border-[#0d5f5f]/30 rounded-b-lg p-4 space-y-4">
                    {/* Vector Contributions */}
                    <div>
                      <h5 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Vector Contributions
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#0d1512] rounded p-2">
                          <div className="text-xs text-gray-400">Primary Vector</div>
                          <div className="text-sm text-white font-medium">
                            {entry.result.modelPrediction.classification.primaryVector.vector}
                          </div>
                          <div className="text-xs text-[#7fa89f]">
                            Weight: {(entry.result.modelPrediction.classification.primaryVector.weight * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="bg-[#0d1512] rounded p-2">
                          <div className="text-xs text-gray-400">Confidence</div>
                          <div className="text-sm text-white font-medium">
                            {(entry.result.modelPrediction.classification.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-[#7fa89f]">
                            Severity: {entry.result.modelPrediction.classification.severityScore.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      
                      {entry.result.modelPrediction.classification.secondaryVectors.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-400 mb-1">Secondary Vectors</div>
                          <div className="flex flex-wrap gap-1">
                            {entry.result.modelPrediction.classification.secondaryVectors.map((v, idx) => (
                              <Badge key={idx} className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f]">
                                {v.vector}: {(v.confidence * 100).toFixed(0)}%
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Regional Propagation */}
                    {entry.result.modelPrediction.propagation.effects.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Regional Propagation
                        </h5>
                        <div className="space-y-1">
                          {entry.result.modelPrediction.propagation.effects.slice(0, 5).map((effect, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-400">{entry.result.event.primaryCountry}</span>
                              <ArrowRight className="h-3 w-3 text-gray-500" />
                              <button
                                onClick={() => onCountrySelect?.(effect.targetCountry)}
                                className="text-[#7fa89f] hover:underline"
                              >
                                {effect.targetCountry}
                              </button>
                              <Badge className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f]">
                                {effect.relationship}
                              </Badge>
                              <span className="text-gray-500">
                                Decay: {(effect.decayFactor * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                          {entry.result.modelPrediction.propagation.effects.length > 5 && (
                            <div className="text-xs text-gray-500">
                              +{entry.result.modelPrediction.propagation.effects.length - 5} more countries
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Plausibility Checks */}
                    {entry.plausibilityCheck && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                          {getStatusIcon(entry.plausibilityCheck.overallStatus)}
                          Plausibility Checks
                        </h5>
                        <div className="space-y-1">
                          {entry.plausibilityCheck.checks.map((check, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">{check.checkName}</span>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(check.status)}
                                <span className={
                                  check.status === 'pass' ? 'text-green-400' :
                                  check.status === 'warning' ? 'text-yellow-400' :
                                  'text-red-400'
                                }>
                                  {check.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {entry.plausibilityCheck.explanation}
                        </p>
                      </div>
                    )}

                    {/* Market Impact */}
                    <div>
                      <h5 className="text-xs font-medium text-gray-400 mb-2">Market Impact</h5>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="bg-[#0d1512] rounded p-2 text-center">
                          <div className="text-gray-400">Equity</div>
                          <div className={entry.result.event.marketImpact.equityChange < 0 ? 'text-red-400' : 'text-green-400'}>
                            {entry.result.event.marketImpact.equityChange > 0 ? '+' : ''}
                            {entry.result.event.marketImpact.equityChange.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-[#0d1512] rounded p-2 text-center">
                          <div className="text-gray-400">Currency</div>
                          <div className={entry.result.event.marketImpact.currencyChange < 0 ? 'text-red-400' : 'text-green-400'}>
                            {entry.result.event.marketImpact.currencyChange > 0 ? '+' : ''}
                            {entry.result.event.marketImpact.currencyChange.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-[#0d1512] rounded p-2 text-center">
                          <div className="text-gray-400">Spread</div>
                          <div className={entry.result.event.marketImpact.bondSpreadChange > 0 ? 'text-red-400' : 'text-green-400'}>
                            {entry.result.event.marketImpact.bondSpreadChange > 0 ? '+' : ''}
                            {entry.result.event.marketImpact.bondSpreadChange}bps
                          </div>
                        </div>
                        <div className="bg-[#0d1512] rounded p-2 text-center">
                          <div className="text-gray-400">Commodity</div>
                          <div className={entry.result.event.marketImpact.commodityImpact > 0 ? 'text-red-400' : 'text-green-400'}>
                            {entry.result.event.marketImpact.commodityImpact > 0 ? '+' : ''}
                            {entry.result.event.marketImpact.commodityImpact.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditTrailPanel;
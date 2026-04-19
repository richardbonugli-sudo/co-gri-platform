/**
 * Relevant Forecast Drivers Component (C5 Enhanced)
 * Displays only material forecast events for the company
 * Part of CO-GRI Platform Phase 2 Implementation - Task 2
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, TrendingDown, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { eventRelevanceFilter } from '@/services/forecast/eventRelevanceFilter';
import { forecastEngine } from '@/services/forecast/forecastEngine';

interface RelevantForecastDriversProps {
  ticker: string;
  sector: string;
  countryExposures: { country: string; exposureWeight: number }[];
  currentCOGRI: number;
}

export const RelevantForecastDrivers: React.FC<RelevantForecastDriversProps> = ({
  ticker,
  sector,
  countryExposures,
  currentCOGRI
}) => {
  const [minRelevance, setMinRelevance] = useState(0.3);
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());

  const allForecasts = forecastEngine.getAllForecasts();
  const relevantDrivers = eventRelevanceFilter.filterRelevantEvents(
    allForecasts,
    { ticker, sector, countryExposures },
    minRelevance
  );

  const toggleExpanded = (eventId: string) => {
    setExpandedDrivers(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const getImpactBadge = (deltaCsi: number) => {
    if (deltaCsi > 10) {
      return <Badge className="bg-red-500 text-white">High Impact</Badge>;
    } else if (deltaCsi > 5) {
      return <Badge className="bg-orange-500 text-white">Medium Impact</Badge>;
    } else if (deltaCsi < -5) {
      return <Badge className="bg-green-500 text-white">Risk Reduction</Badge>;
    }
    return <Badge variant="outline">Low Impact</Badge>;
  };

  const calculateExpectedCOGRI = (deltaCsi: number, probability: number) => {
    const affectedExposure = countryExposures
      .filter(ce => relevantDrivers[0]?.affected_countries && Array.isArray(relevantDrivers[0].affected_countries) && relevantDrivers[0].affected_countries.includes(ce.country))
      .reduce((sum, ce) => sum + ce.exposureWeight, 0);
    
    const expectedChange = deltaCsi * affectedExposure * probability;
    return currentCOGRI + expectedChange;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Relevant Forecast Drivers
            </CardTitle>
            <CardDescription>
              Material forecast events filtered by relevance to {ticker}
            </CardDescription>
          </div>
          <LensBadge lens="Forecast Overlay" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Min Relevance:</span>
            <select
              value={minRelevance}
              onChange={(e) => setMinRelevance(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={0.2}>20%</option>
              <option value={0.3}>30%</option>
              <option value={0.4}>40%</option>
              <option value={0.5}>50%</option>
            </select>
          </div>
          <Badge variant="outline">
            {relevantDrivers.length} relevant events
          </Badge>
        </div>

        {relevantDrivers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No forecast events meet the minimum relevance threshold
          </div>
        ) : (
          <div className="space-y-3">
            {relevantDrivers.map((driver) => {
              const isExpanded = expandedDrivers.has(driver.event_id);
              const expectedCOGRI = calculateExpectedCOGRI(driver.delta_csi, driver.probability);
              const cogrIChange = expectedCOGRI - currentCOGRI;

              return (
                <div
                  key={driver.event_id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{driver.event_name}</h4>
                        {getImpactBadge(driver.delta_csi)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{driver.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(driver.event_id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="text-xs">
                      Relevance: {(driver.relevanceScore * 100).toFixed(0)}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Probability: {(driver.probability * 100).toFixed(0)}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Confidence: {(driver.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Expected COGRI:</span>
                    <span className="font-semibold">{currentCOGRI.toFixed(1)}</span>
                    <span className="text-gray-400">→</span>
                    <span className={`font-semibold ${cogrIChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {expectedCOGRI.toFixed(1)}
                    </span>
                    <span className={`text-xs ${cogrIChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ({cogrIChange > 0 ? '+' : ''}{cogrIChange.toFixed(1)})
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <h5 className="text-sm font-semibold mb-2">Relevance Reasons:</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {driver.relevanceReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold mb-2">Affected Countries:</h5>
                        <div className="flex flex-wrap gap-2">
                          {driver.affected_countries.map((country) => (
                            <Badge key={country} variant="outline" className="text-xs">
                              {country}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold mb-2">Affected Sectors:</h5>
                        <div className="flex flex-wrap gap-2">
                          {driver.affected_sectors.map((sec) => (
                            <Badge key={sec} variant="outline" className="text-xs">
                              {sec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
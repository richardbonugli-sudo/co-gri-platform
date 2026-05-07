/**
 * Forecast Output Renderer
 * 
 * Orchestrates the display of Strategic Forecast Baseline results
 * across three hierarchical tiers for different stakeholder audiences.
 * 
 * @module ForecastOutputRenderer
 */

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { StrategicOutlookTier } from './StrategicOutlookTier';
import { ExposureMappingTier } from './ExposureMappingTier';
import { QuantitativeAnchorsTier } from './QuantitativeAnchorsTier';
import type { COGRIResult } from '@/utils/cogriCalculator';
import type { CedarOwlForecast } from '@/types/forecast';
import type { Exposure, AdjustedExposure } from '@/services/forecastEngine';

export interface ForecastOutputRendererProps {
  /** Result from CO-GRI calculator with forecast applied */
  result: COGRIResult;
  /** The forecast data used */
  forecast: CedarOwlForecast;
  /** Company being analyzed */
  companyName: string;
  /** Original exposures before forecast */
  exposures: Exposure[];
  /** Exposures after forecast applied */
  adjustedExposures: AdjustedExposure[];
}

interface TierExpandState {
  strategic: boolean;
  exposure: boolean;
  quantitative: boolean;
}

/**
 * Main output renderer for Strategic Forecast Baseline results
 * 
 * Manages three tiers of output:
 * - Tier 1: Strategic Outlook (C-Suite)
 * - Tier 2: Exposure Mapping (Risk Managers)
 * - Tier 3: Quantitative Anchors (Analysts)
 * 
 * @example
 * ```tsx
 * <ForecastOutputRenderer
 *   result={cogriResult}
 *   forecast={cedarOwlForecast}
 *   companyName="Acme Corp"
 *   exposures={originalExposures}
 *   adjustedExposures={adjustedExposures}
 * />
 * ```
 */
export function ForecastOutputRenderer({
  result,
  forecast,
  companyName,
  exposures,
  adjustedExposures
}: ForecastOutputRendererProps) {
  const [expandedTiers, setExpandedTiers] = React.useState<TierExpandState>({
    strategic: true,      // Tier 1 expanded by default
    exposure: false,      // Tier 2 collapsed by default
    quantitative: false   // Tier 3 collapsed by default
  });

  const toggleTier = (tier: keyof TierExpandState) => {
    setExpandedTiers(prev => ({
      ...prev,
      [tier]: !prev[tier]
    }));
  };

  const handleExport = () => {
    // TODO: Implement export to PDF/CSV
    console.log('Export functionality to be implemented');
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate summary metrics
  const totalCountries = adjustedExposures.length;
  const countriesWithChanges = adjustedExposures.filter(exp => exp.delta !== 0).length;
  const averageDelta = adjustedExposures.reduce((sum, exp) => sum + exp.delta, 0) / totalCountries;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-3xl font-bold">Strategic Forecast Baseline</h2>
          <p className="text-muted-foreground mt-1">
            {companyName} • {forecast.metadata.forecastPeriod}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Forecast Metadata Banner */}
      <Card className="p-4 bg-blue-50 border-blue-200 print:bg-white">
        <div className="flex items-start gap-3">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-blue-900">Forecast Period</p>
              <p className="text-lg font-semibold text-blue-700">
                {forecast.metadata.forecastPeriod}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Countries Analyzed</p>
              <p className="text-lg font-semibold text-blue-700">
                {totalCountries} ({countriesWithChanges} adjusted)
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Average Delta</p>
              <p className="text-lg font-semibold text-blue-700">
                {averageDelta >= 0 ? '+' : ''}{averageDelta.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Confidence</p>
              <p className="text-lg font-semibold text-blue-700">
                {(forecast.metadata.overallConfidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tier 1: Strategic Outlook */}
      <StrategicOutlookTier
        result={result}
        forecast={forecast}
        exposures={adjustedExposures}
        isExpanded={expandedTiers.strategic}
        onToggle={() => toggleTier('strategic')}
      />

      {/* Tier 2: Exposure Mapping */}
      <ExposureMappingTier
        exposures={adjustedExposures}
        forecast={forecast}
        isExpanded={expandedTiers.exposure}
        onToggle={() => toggleTier('exposure')}
      />

      {/* Tier 3: Quantitative Anchors */}
      <QuantitativeAnchorsTier
        forecast={forecast}
        result={result}
        isExpanded={expandedTiers.quantitative}
        onToggle={() => toggleTier('quantitative')}
      />

      {/* Additional Geopolitical Risk Timelines and Investment Implications */}
      <Card className="p-6 bg-[#0d5f5f]/10 border-[#0d5f5f]">
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-white">
            Additional Geopolitical Risk Timelines and Investment Implications
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Link here to view the Strategic Baseline Report in detail to understand additional considerations of geopolitical risk timelines and investment implications
          </p>
          <div className="pt-2">
            <a
              href="https://c6gh24.atoms.world/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white rounded-lg transition-colors font-semibold"
            >
              View Strategic Forecast Baseline Report →
            </a>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-sm text-muted-foreground text-center py-4 print:text-xs">
        <p>
          Generated on {new Date().toLocaleDateString()} • 
          CedarOwl Integrated Geopolitical Gurus Risk Forecast • 
          {forecast.metadata.expertSources} Expert Sources
        </p>
        <p className="mt-1">
          Next Update: {forecast.metadata.nextUpdate}
        </p>
      </div>
    </div>
  );
}
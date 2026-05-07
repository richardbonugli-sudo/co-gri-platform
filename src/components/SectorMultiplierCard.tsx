/**
 * Sector Multiplier Card Component - Phase 1 UI
 * 
 * Displays sector multiplier information with full transparency:
 * - Multiplier value and confidence score
 * - Rationale and risk factors
 * - Historical values
 * - Validation warnings
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SectorMultiplierCardProps {
  sectorMultiplierDetails: {
    value: number;
    confidence: number;
    warnings: string[];
    rationale: string;
    dataSource: string;
    lastReviewed: string;
    adjustmentFactors: {
      concentrationRisk: number;
      volatilityRisk: number;
      geopoliticalRisk: number;
    };
    validationBadge: {
      icon: string;
      label: string;
      color: string;
      description: string;
    };
    historicalValues: Array<{
      value: number;
      effectiveDate: string;
      reason: string;
    }>;
    riskFactors: string[];
    validationNotes: string[];
  };
  sector: string;
  rawScore: number;
  finalScore: number;
}

export function SectorMultiplierCard({ sectorMultiplierDetails, sector, rawScore, finalScore }: SectorMultiplierCardProps) {
  const { 
    value, 
    confidence, 
    warnings, 
    rationale, 
    dataSource, 
    lastReviewed,
    adjustmentFactors,
    validationBadge,
    historicalValues,
    riskFactors,
    validationNotes
  } = sectorMultiplierDetails;

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800 border-green-300';
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'red': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return 'text-red-600';
    if (risk >= 0.4) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Sector Risk Multiplier</CardTitle>
          <Badge className={getBadgeColor(validationBadge.color)}>
            {validationBadge.icon} {validationBadge.label}
          </Badge>
        </div>
        <CardDescription>
          {sector} sector • Confidence: {(confidence * 100).toFixed(0)}%
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Multiplier Value */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600">Multiplier</div>
            <div className="text-2xl font-bold text-blue-600">{value.toFixed(2)}x</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Raw Score</div>
            <div className="text-2xl font-bold">{rawScore.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Final Score</div>
            <div className="text-2xl font-bold text-red-600">{finalScore.toFixed(1)}</div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertDescription>
              <div className="font-semibold mb-2">⚠️ Validation Warnings ({warnings.length})</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Rationale */}
        <div>
          <h4 className="font-semibold mb-2">📋 Rationale</h4>
          <p className="text-sm text-gray-700">{rationale}</p>
        </div>

        {/* Accordion for detailed information */}
        <Accordion type="single" collapsible className="w-full">
          {/* Risk Factors */}
          <AccordionItem value="risk-factors">
            <AccordionTrigger>
              <span className="font-semibold">📊 Risk Factors ({riskFactors.length})</span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside space-y-2 text-sm">
                {riskFactors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Adjustment Factors */}
          <AccordionItem value="adjustment-factors">
            <AccordionTrigger>
              <span className="font-semibold">🔍 Risk Adjustment Factors</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Concentration Risk</span>
                  <span className={`font-semibold ${getRiskColor(adjustmentFactors.concentrationRisk)}`}>
                    {(adjustmentFactors.concentrationRisk * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Volatility Risk</span>
                  <span className={`font-semibold ${getRiskColor(adjustmentFactors.volatilityRisk)}`}>
                    {(adjustmentFactors.volatilityRisk * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Geopolitical Risk</span>
                  <span className={`font-semibold ${getRiskColor(adjustmentFactors.geopoliticalRisk)}`}>
                    {(adjustmentFactors.geopoliticalRisk * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Historical Values */}
          <AccordionItem value="historical">
            <AccordionTrigger>
              <span className="font-semibold">📈 Historical Values ({historicalValues.length})</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {historicalValues.map((hist, index) => (
                  <div key={index} className="border-l-2 border-blue-300 pl-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-sm">{hist.effectiveDate}</div>
                        <div className="text-xs text-gray-600">{hist.reason}</div>
                      </div>
                      <Badge variant="outline">{hist.value.toFixed(2)}x</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Validation Notes */}
          {validationNotes.length > 0 && (
            <AccordionItem value="validation-notes">
              <AccordionTrigger>
                <span className="font-semibold">📝 Validation Notes ({validationNotes.length})</span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  {validationNotes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Data Source */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <div><strong>Data Source:</strong> {dataSource}</div>
          <div><strong>Last Reviewed:</strong> {lastReviewed}</div>
          <div><strong>Confidence:</strong> {validationBadge.description}</div>
        </div>
      </CardContent>
    </Card>
  );
}

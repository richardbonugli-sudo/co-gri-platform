/**
 * Step-by-Step Calculation Breakdown Component
 * 
 * Displays a comprehensive 7-step calculation methodology for COGRI assessment
 * with detailed country-by-country analysis, formulas, and data sources.
 */

import React, { useState, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText, Calculator, TrendingUp } from 'lucide-react';

interface CalculationStep {
  step: string;
  formula: string;
  values: Record<string, string | number>;
  result: number;
  explanation: string;
  countryDetails?: string;
}

interface StepByStepBreakdownProps {
  steps: CalculationStep[];
  phase2Steps?: CalculationStep[];
}

export const StepByStepBreakdown = memo(({ steps, phase2Steps = [] }: StepByStepBreakdownProps) => {
  const [expandedAll, setExpandedAll] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const allSteps = [...steps, ...phase2Steps];

  const handleExpandAll = () => {
    if (expandedAll) {
      setExpandedItems([]);
    } else {
      setExpandedItems(allSteps.map((_, idx) => `step-${idx}`));
    }
    setExpandedAll(!expandedAll);
  };

  const formatValue = (value: string | number): string => {
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    return value.toString();
  };

  const renderCountryDetails = (details: string) => {
    // Split by double newlines to get sections
    const sections = details.split('\n\n').filter(s => s.trim());
    
    return (
      <div className="mt-4 space-y-4 font-mono text-xs">
        {sections.map((section, idx) => {
          const lines = section.split('\n').filter(l => l.trim());
          
          // Check if this is a header section (contains ═ or COUNTRY)
          const isHeader = lines.some(l => l.includes('═') || l.includes('COUNTRY'));
          const isCountryHeader = lines.some(l => l.includes('COUNTRY') && l.includes('OF'));
          
          if (isHeader) {
            return (
              <div key={idx} className={`${isCountryHeader ? 'border-t-2 border-teal-600 pt-4 mt-6' : ''}`}>
                {lines.map((line, lineIdx) => {
                  if (line.includes('═')) {
                    return <div key={lineIdx} className="text-teal-500">{line}</div>;
                  } else if (line.includes('COUNTRY') && line.includes('OF')) {
                    return <div key={lineIdx} className="text-yellow-400 font-bold text-sm">{line}</div>;
                  } else {
                    return <div key={lineIdx} className="text-cyan-400 font-semibold">{line}</div>;
                  }
                })}
              </div>
            );
          }
          
          // Regular content section
          return (
            <div key={idx} className="pl-3 border-l-2 border-gray-700">
              {lines.map((line, lineIdx) => {
                // Highlight different types of content
                if (line.includes('🔍') || line.includes('💰') || line.includes('🏭') || line.includes('🚚') || line.includes('🏢') || line.includes('⚖️') || line.includes('🌐')) {
                  return <div key={lineIdx} className="text-blue-400 font-semibold mt-2">{line}</div>;
                } else if (line.includes('Formula:') || line.includes('Calculation:')) {
                  return <div key={lineIdx} className="text-green-400 font-semibold">{line}</div>;
                } else if (line.includes('✅') || line.includes('✓')) {
                  return <div key={lineIdx} className="text-green-500">{line}</div>;
                } else if (line.includes(':')) {
                  const [label, value] = line.split(':');
                  return (
                    <div key={lineIdx} className="text-gray-300">
                      <span className="text-gray-400">{label}:</span>
                      <span className="text-white ml-1">{value}</span>
                    </div>
                  );
                } else {
                  return <div key={lineIdx} className="text-gray-300">{line}</div>;
                }
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="border-2 border-blue-300 bg-gradient-to-br from-slate-900 to-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <div>
              <CardTitle className="text-xl font-bold text-white">
                v3.4 Step-by-Step Calculation Methodology
              </CardTitle>
              <CardDescription className="text-gray-300 mt-1">
                Comprehensive breakdown of all {allSteps.length} calculation steps with detailed country-by-country analysis
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
            className="bg-blue-900 text-blue-100 border-blue-700 hover:bg-blue-800"
          >
            {expandedAll ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Expand All
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Accordion 
          type="multiple" 
          value={expandedItems}
          onValueChange={setExpandedItems}
          className="space-y-3"
        >
          {allSteps.map((step, idx) => {
            const stepNumber = idx + 1;
            const isPhase2Step = idx >= steps.length;
            
            return (
              <AccordionItem
                key={`step-${idx}`}
                value={`step-${idx}`}
                className="border border-gray-700 rounded-lg bg-slate-800/50 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3 text-left w-full">
                    <Badge 
                      variant="outline" 
                      className={`${isPhase2Step ? 'bg-purple-900 text-purple-100 border-purple-600' : 'bg-teal-900 text-teal-100 border-teal-600'} font-mono`}
                    >
                      {stepNumber}
                    </Badge>
                    <span className="text-cyan-300 font-semibold flex-1">
                      {step.step}
                    </span>
                    {isPhase2Step && (
                      <Badge variant="outline" className="bg-purple-800 text-purple-200 border-purple-600">
                        Phase 2
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 py-4 bg-slate-900/50">
                  <div className="space-y-4">
                    {/* Formula */}
                    <div className="p-3 bg-slate-800 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="w-4 h-4 text-green-400" />
                        <h4 className="text-sm font-semibold text-green-400">Formula</h4>
                      </div>
                      <code className="text-sm text-green-300 font-mono">{step.formula}</code>
                    </div>

                    {/* Values */}
                    <div className="p-3 bg-slate-800 rounded-lg border border-gray-700">
                      <h4 className="text-sm font-semibold text-blue-400 mb-2">Input Values</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(step.values).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">{key}:</span>
                            <span className="text-white font-mono ml-2">{formatValue(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Result */}
                    <div className="p-3 bg-gradient-to-r from-blue-900/50 to-teal-900/50 rounded-lg border border-blue-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-yellow-400" />
                          <h4 className="text-sm font-semibold text-yellow-400">Result</h4>
                        </div>
                        <span className="text-2xl font-bold text-white font-mono">
                          {step.result.toFixed(4)}
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="p-3 bg-slate-800 rounded-lg border border-gray-700">
                      <h4 className="text-sm font-semibold text-purple-400 mb-2">Explanation</h4>
                      <p className="text-sm text-gray-300">{step.explanation}</p>
                    </div>

                    {/* Country Details */}
                    {step.countryDetails && (
                      <div className="p-4 bg-slate-950 rounded-lg border border-gray-700">
                        <h4 className="text-sm font-semibold text-cyan-400 mb-3">
                          📊 Detailed Breakdown
                        </h4>
                        {renderCountryDetails(step.countryDetails)}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Summary Footer */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/30 to-teal-900/30 rounded-lg border border-blue-700">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>
              This methodology provides complete transparency into the COGRI calculation process,
              showing all {allSteps.length} steps with detailed country-by-country analysis, data sources, and mathematical formulas.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StepByStepBreakdown.displayName = 'StepByStepBreakdown';
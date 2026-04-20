/**
 * Forecast Header Component (F1)
 * Displays forecast horizon, metadata, and export options
 * Part of CO-GRI Platform Phase 3 - Week 7
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Calendar, Database, TrendingUp } from 'lucide-react';
import { ConfidenceLevel } from '@/types/forecast';

interface ForecastHeaderProps {
  horizon: string;
  lastUpdated: Date;
  confidence: ConfidenceLevel;
  dataSources: string[];
  onExport?: () => void;
}

export function ForecastHeader({
  horizon,
  lastUpdated,
  confidence,
  dataSources,
  onExport
}: ForecastHeaderProps) {
  const confidenceColors: Record<ConfidenceLevel, string> = {
    'High': 'bg-green-100 text-green-800 border-green-200',
    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Low': 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* Left: Title and Metadata */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Geopolitical Forecast</h1>
                <p className="text-sm text-muted-foreground">
                  Forward-looking risk intelligence and strategic outlook
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              {/* Forecast Horizon */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Horizon:</span>
                <span>{horizon}</span>
              </div>

              {/* Last Updated */}
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Updated:</span>
                <span>{lastUpdated.toLocaleDateString()}</span>
              </div>

              {/* Confidence Level */}
              <div className="flex items-center gap-2">
                <span className="font-medium">Confidence:</span>
                <Badge className={confidenceColors[confidence]}>
                  {confidence}
                </Badge>
              </div>
            </div>

            {/* Data Sources */}
            <div className="flex items-start gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Sources:</span>
              <span className="text-muted-foreground">
                {dataSources.join(', ')}
              </span>
            </div>
          </div>

          {/* Right: Export Button */}
          <Button
            variant="outline"
            onClick={onExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
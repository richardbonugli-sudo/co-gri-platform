/**
 * Composite CSI Card Component
 * Displays composite CSI score with vector breakdown
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useCompositeCSI } from '@/hooks/useCompositeCSI';
import type { CompositeCSIResult } from '@/services/csi/compositeCSICalculator';

interface CompositeCSICardProps {
  country: string;
  showBreakdown?: boolean;
  className?: string;
}

export function CompositeCSICard({ 
  country, 
  showBreakdown = true,
  className = '' 
}: CompositeCSICardProps) {
  const { result, loading, error } = useCompositeCSI({ country });

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (score >= 50) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    if (score >= 30) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-green-500 bg-green-500/10 border-green-500/20';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 30) return 'Moderate';
    return 'Low';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Composite CSI Score</span>
          <Badge variant="outline" className={getRiskColor(result.compositeCSI)}>
            {getRiskLevel(result.compositeCSI)}
          </Badge>
        </CardTitle>
        <CardDescription>
          {country} - Calculated from {result.vectorBreakdown.length} risk vectors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Score */}
          <div className="text-center">
            <div className={`text-5xl font-bold ${getRiskColor(result.compositeCSI).split(' ')[0]}`}>
              {result.compositeCSI.toFixed(1)}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Composite Country Shock Index
            </p>
          </div>

          {/* Vector Breakdown */}
          {showBreakdown && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Vector Breakdown</h4>
              {result.vectorBreakdown.map((vector) => (
                <div key={vector.vectorName} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{vector.vectorName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{vector.vectorScore.toFixed(1)}</span>
                      <span className="text-gray-400">
                        ({(vector.weight * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getRiskColor(vector.vectorScore).split(' ')[1]}`}
                      style={{ width: `${(vector.vectorScore / 100) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Contribution: {vector.contribution.toFixed(2)}</span>
                    <span>Baseline: {vector.baselineValue.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200 space-y-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Data Source:</span>
              <span className="font-medium">{result.metadata.dataSource}</span>
            </div>
            <div className="flex justify-between">
              <span>Calculation Method:</span>
              <span className="font-medium">{result.metadata.calculationMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span className="font-medium">
                {new Date(result.metadata.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
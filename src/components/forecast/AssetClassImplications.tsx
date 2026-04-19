/**
 * Asset Class Implications Component (F4)
 * Shows forecast impact across different asset classes
 * Part of CO-GRI Platform Phase 3 - Week 7
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, DollarSign, Building2, Coins, Globe } from 'lucide-react';
import { AssetClassForecast } from '@/types/forecast';

interface AssetClassImplicationsProps {
  forecasts: AssetClassForecast[];
}

export const AssetClassImplications: React.FC<AssetClassImplicationsProps> = ({
  forecasts
}) => {
  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'Positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'Negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'Mixed':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Negative':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Mixed':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAssetClassIcon = (assetClass: string) => {
    switch (assetClass) {
      case 'Equities':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'Fixed Income':
        return <Building2 className="h-5 w-5 text-purple-600" />;
      case 'Commodities':
        return <Coins className="h-5 w-5 text-orange-600" />;
      case 'Currencies':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      default:
        return <Globe className="h-5 w-5 text-gray-600" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      'High': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-gray-100 text-gray-800'
    };
    return colors[confidence as keyof typeof colors] || colors['Medium'];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Asset Class Implications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {forecasts.map((forecast) => (
            <div key={forecast.asset_class} className="space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="p-2 bg-blue-50 rounded-lg">
                  {getAssetClassIcon(forecast.asset_class)}
                </div>
                <h3 className="font-semibold text-lg">{forecast.asset_class}</h3>
              </div>

              <div className="space-y-3">
                {(forecast.breakdown || []).map((item, index) => (
                  <div
                    key={`${forecast.asset_class}-${index}`}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{item.category}</h4>
                          <Badge className={getImpactColor(item.impact)}>
                            {getImpactIcon(item.impact)}
                            <span className="ml-1">{item.impact}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.reasoning}</p>
                      </div>
                      <Badge className={getConfidenceBadge(item.confidence)}>
                        {item.confidence}
                      </Badge>
                    </div>

                    {item.related_events && item.related_events.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Related Events: {item.related_events.length}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Cross-Asset Diversification Insight</h4>
          <p className="text-xs text-gray-700">
            Based on forecast analysis, consider diversifying across asset classes with negative correlations 
            to mitigate geopolitical risk exposure. Monitor sector-specific impacts and adjust positioning accordingly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
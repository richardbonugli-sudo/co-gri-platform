/**
 * Strategic Recommendations Component (F6)
 * Displays actionable recommendations based on forecast
 * Part of CO-GRI Platform Phase 3 - Week 7
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, Shield, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { StrategicRecommendation, RecommendationCategory } from '@/types/forecast';

interface StrategicRecommendationsProps {
  recommendations: StrategicRecommendation[];
}

export function StrategicRecommendations({ recommendations }: StrategicRecommendationsProps) {
  const categorizeRecommendations = (category: RecommendationCategory) => {
    return recommendations.filter(r => r.category === category);
  };

  const portfolioRecs = categorizeRecommendations('Portfolio Positioning');
  const riskMitigationRecs = categorizeRecommendations('Risk Mitigation');
  const opportunityRecs = categorizeRecommendations('Opportunities');

  const priorityColors = {
    'High': 'bg-red-100 text-red-800 border-red-200',
    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Low': 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const confidenceColors = {
    'High': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-gray-100 text-gray-800'
  };

  const RecommendationCard = ({ rec }: { rec: StrategicRecommendation }) => (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-semibold flex-1">{rec.action}</h4>
          <Badge className={priorityColors[rec.priority]}>
            {rec.priority}
          </Badge>
        </div>

        {/* Rationale */}
        <p className="text-sm text-muted-foreground">{rec.rationale}</p>

        {/* Metadata Row */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{rec.time_horizon}</span>
          </div>
          <Badge className={confidenceColors[rec.confidence]} variant="outline">
            {rec.confidence} Confidence
          </Badge>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {rec.affected_sectors.slice(0, 3).map(sector => (
            <Badge key={sector} variant="secondary" className="text-xs">
              {sector}
            </Badge>
          ))}
          {rec.affected_regions.slice(0, 2).map(region => (
            <Badge key={region} variant="outline" className="text-xs">
              {region}
            </Badge>
          ))}
        </div>

        {/* Related Events Count */}
        {rec.related_events.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <AlertCircle className="h-3 w-3" />
            <span>Based on {rec.related_events.length} forecast event{rec.related_events.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Strategic Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="portfolio" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Portfolio
              <Badge variant="secondary" className="ml-1">
                {portfolioRecs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-2">
              <Shield className="h-4 w-4" />
              Risk Mitigation
              <Badge variant="secondary" className="ml-1">
                {riskMitigationRecs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Opportunities
              <Badge variant="secondary" className="ml-1">
                {opportunityRecs.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-4">
            <div className="space-y-3">
              {portfolioRecs.length > 0 ? (
                portfolioRecs.map(rec => (
                  <RecommendationCard key={rec.recommendation_id} rec={rec} />
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No portfolio positioning recommendations at this time
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="risk" className="mt-4">
            <div className="space-y-3">
              {riskMitigationRecs.length > 0 ? (
                riskMitigationRecs.map(rec => (
                  <RecommendationCard key={rec.recommendation_id} rec={rec} />
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No risk mitigation recommendations at this time
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="opportunities" className="mt-4">
            <div className="space-y-3">
              {opportunityRecs.length > 0 ? (
                opportunityRecs.map(rec => (
                  <RecommendationCard key={rec.recommendation_id} rec={rec} />
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No opportunity recommendations at this time
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
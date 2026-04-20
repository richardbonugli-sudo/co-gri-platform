/**
 * Country Detail Modal
 * 
 * Displays detailed risk information for a selected country including:
 * - All channel exposures (revenue, supply chain, assets, financial)
 * - Related geopolitical events
 * - Risk vectors and transmission paths
 * - Historical trends
 * 
 * Part of Company Mode cross-component interactions
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Building,
  Landmark,
  AlertTriangle
} from 'lucide-react';

interface CountryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: string;
  data: {
    exposureWeight: number;
    countryShockIndex: number;
    contribution: number;
    region: string;
    channelBreakdown?: {
      revenue: number;
      supplyChain: number;
      physicalAssets: number;
      financial: number;
    };
    relatedEvents?: Array<{
      title: string;
      date: string;
      severity: string;
      impact: number;
    }>;
    riskVectors?: Array<{
      type: string;
      description: string;
      severity: 'Low' | 'Medium' | 'High' | 'Critical';
    }>;
  };
}

export default function CountryDetailModal({
  isOpen,
  onClose,
  country,
  data
}: CountryDetailModalProps) {
  const channelBreakdown = data.channelBreakdown || {
    revenue: data.exposureWeight * 0.4,
    supplyChain: data.exposureWeight * 0.35,
    physicalAssets: data.exposureWeight * 0.15,
    financial: data.exposureWeight * 0.1
  };

  const relatedEvents = data.relatedEvents || [];
  const riskVectors = data.riskVectors || [
    {
      type: 'Trade Policy',
      description: 'Potential tariff changes affecting exports',
      severity: 'Medium' as const
    },
    {
      type: 'Supply Chain',
      description: 'Logistics and transportation vulnerabilities',
      severity: 'Low' as const
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="h-6 w-6" />
            {country}
          </DialogTitle>
          <DialogDescription>
            Detailed risk analysis and exposure breakdown
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Exposure</p>
              <p className="text-2xl font-bold">{(data.exposureWeight * 100).toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Country Risk Score</p>
              <p className="text-2xl font-bold">{data.countryShockIndex.toFixed(1)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Risk Contribution</p>
              <p className="text-2xl font-bold">{data.contribution.toFixed(2)}</p>
            </div>
          </div>

          <Separator />

          {/* Channel Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Channel Exposure Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Revenue</span>
                  </div>
                  <span className="text-sm font-semibold">{(channelBreakdown.revenue * 100).toFixed(1)}%</span>
                </div>
                <Progress value={channelBreakdown.revenue * 100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Supply Chain</span>
                  </div>
                  <span className="text-sm font-semibold">{(channelBreakdown.supplyChain * 100).toFixed(1)}%</span>
                </div>
                <Progress value={channelBreakdown.supplyChain * 100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Physical Assets</span>
                  </div>
                  <span className="text-sm font-semibold">{(channelBreakdown.physicalAssets * 100).toFixed(1)}%</span>
                </div>
                <Progress value={channelBreakdown.physicalAssets * 100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Financial</span>
                  </div>
                  <span className="text-sm font-semibold">{(channelBreakdown.financial * 100).toFixed(1)}%</span>
                </div>
                <Progress value={channelBreakdown.financial * 100} className="h-2" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Risk Vectors */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Vectors
            </h3>
            <div className="space-y-3">
              {riskVectors.map((vector, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium">{vector.type}</span>
                    <Badge variant="outline" className={getSeverityColor(vector.severity)}>
                      {vector.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{vector.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related Events */}
          {relatedEvents.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Related Geopolitical Events</h3>
                <div className="space-y-2">
                  {relatedEvents.map((event, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <span className={`text-sm font-semibold ${event.impact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {event.impact > 0 ? '+' : ''}{event.impact.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
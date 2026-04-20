/**
 * Channel Attribution Component (S3)
 * Displays ΔCO-GRI breakdown by transmission channel
 * Shows Trade, Alignment, and Sector channel contributions
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  Package,
  Users,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
} from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { ScenarioResult, ChannelDelta } from '@/types/scenario';

interface ChannelAttributionProps {
  result: ScenarioResult | null;
  isLoading?: boolean;
}

// Channel configuration with icons and colors
const CHANNEL_CONFIG = {
  Trade: {
    icon: TrendingUp,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    description: 'Import/export exposure to affected countries',
    weight: 0.45,
  },
  Alignment: {
    icon: Users,
    color: 'bg-orange-600',
    lightColor: 'bg-orange-200',
    textColor: 'text-orange-800',
    description: 'Geopolitical alignment shifts',
    weight: 0.35,
  },
  Sector: {
    icon: Package,
    color: 'bg-orange-700',
    lightColor: 'bg-orange-300',
    textColor: 'text-orange-900',
    description: 'Industry-specific sensitivities',
    weight: 0.20,
  },
};

// Evidence level colors
const EVIDENCE_COLORS: Record<string, string> = {
  'A+': 'bg-green-100 text-green-800 border-green-300',
  'A': 'bg-green-50 text-green-700 border-green-200',
  'B': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'C': 'bg-orange-50 text-orange-700 border-orange-200',
  'D': 'bg-red-50 text-red-700 border-red-200',
  'None': 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function ChannelAttribution({ result, isLoading = false }: ChannelAttributionProps) {
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());

  const toggleChannel = (channel: string) => {
    const newExpanded = new Set(expandedChannels);
    if (newExpanded.has(channel)) {
      newExpanded.delete(channel);
    } else {
      newExpanded.add(channel);
    }
    setExpandedChannels(newExpanded);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Channel Attribution</CardTitle>
            <LensBadge lens="Scenario Shock" />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Analyzing channel contributions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result || !result.channelAttribution || result.channelAttribution.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Channel Attribution</CardTitle>
            <LensBadge lens="Scenario Shock" />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="text-center space-y-2">
            <Package className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              No channel attribution data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { channelAttribution, deltaCOGRI } = result;

  // Calculate total absolute contribution for percentage calculation
  const totalAbsoluteContribution = channelAttribution.reduce(
    (sum, channel) => sum + Math.abs(channel.deltaContribution),
    0
  );

  // Calculate percentage contribution for each channel
  const channelsWithPercentage = channelAttribution.map((channel) => ({
    ...channel,
    percentageContribution:
      totalAbsoluteContribution > 0
        ? (Math.abs(channel.deltaContribution) / totalAbsoluteContribution) * 100
        : 0,
    percentageOfTotal:
      deltaCOGRI !== 0 ? (channel.deltaContribution / deltaCOGRI) * 100 : 0,
  }));

  // Sort by absolute contribution (descending)
  const sortedChannels = [...channelsWithPercentage].sort(
    (a, b) => Math.abs(b.deltaContribution) - Math.abs(a.deltaContribution)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Channel Attribution</CardTitle>
          <LensBadge lens="Scenario Shock" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          ΔCO-GRI breakdown by transmission channel
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mathematical Formula */}
        <div className="bg-muted/50 rounded-lg p-4 border">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Attribution Formula:</p>
              <p className="text-muted-foreground font-mono text-xs">
                ΔCO-GRI = α·ΔTrade + β·ΔAlignment + γ·ΔSector
              </p>
              <p className="text-muted-foreground text-xs">
                where α={CHANNEL_CONFIG.Trade.weight}, β={CHANNEL_CONFIG.Alignment.weight}, γ=
                {CHANNEL_CONFIG.Sector.weight}
              </p>
            </div>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Total ΔCO-GRI: {deltaCOGRI.toFixed(2)} points</span>
            <span className="text-muted-foreground">100%</span>
          </div>
          <div className="h-8 w-full bg-gray-200 rounded-full overflow-hidden flex">
            {sortedChannels.map((channel, index) => {
              const config = CHANNEL_CONFIG[channel.channelName as keyof typeof CHANNEL_CONFIG];
              if (!config) return null;

              const width = Math.abs(channel.percentageOfTotal);
              if (width === 0) return null;

              return (
                <TooltipProvider key={channel.channelName}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`${config.color} transition-all cursor-pointer hover:opacity-80`}
                        style={{ width: `${width}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{channel.channelName}</p>
                      <p className="text-xs">
                        {channel.deltaContribution.toFixed(2)} points ({width.toFixed(1)}%)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Channel Cards */}
        <div className="space-y-3">
          {sortedChannels.map((channel) => {
            const config = CHANNEL_CONFIG[channel.channelName as keyof typeof CHANNEL_CONFIG];
            if (!config) return null;

            const Icon = config.icon;
            const isExpanded = expandedChannels.has(channel.channelName);
            const isPositive = channel.deltaContribution > 0;
            const isNegative = channel.deltaContribution < 0;

            return (
              <div
                key={channel.channelName}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Channel Header */}
                <div
                  className={`${config.lightColor} p-4 cursor-pointer`}
                  onClick={() => toggleChannel(channel.channelName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`${config.color} p-2 rounded-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold ${config.textColor}`}>
                            {channel.channelName}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Weight: {config.weight}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {config.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${
                            isPositive
                              ? 'text-red-600'
                              : isNegative
                              ? 'text-green-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {channel.deltaContribution.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.abs(channel.percentageOfTotal).toFixed(1)}% of total
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <Progress
                      value={Math.abs(channel.percentageOfTotal)}
                      className="h-2"
                      indicatorClassName={config.color}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-card border-t space-y-4">
                    {/* Baseline vs Scenario */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Baseline Score</p>
                        <p className="text-lg font-semibold">
                          {channel.baselineScore.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Scenario Score</p>
                        <p className="text-lg font-semibold">
                          {channel.scenarioScore.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Evidence Level */}
                    {channel.evidenceLevel && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold">Data Quality</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={EVIDENCE_COLORS[channel.evidenceLevel] || EVIDENCE_COLORS.None}
                          >
                            Evidence: {channel.evidenceLevel}
                          </Badge>
                          <Badge variant="outline">
                            Confidence: {(channel.confidence * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Data Source */}
                    {channel.dataSource && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold">Data Source</p>
                        <p className="text-xs text-muted-foreground">{channel.dataSource}</p>
                      </div>
                    )}

                    {/* Calculation Details */}
                    <div className="bg-muted/30 rounded p-3 space-y-1 text-xs font-mono">
                      <p>
                        Δ{channel.channelName} = {channel.scenarioScore.toFixed(2)} -{' '}
                        {channel.baselineScore.toFixed(2)} ={' '}
                        {(channel.scenarioScore - channel.baselineScore).toFixed(2)}
                      </p>
                      <p>
                        Contribution = {config.weight} × {(channel.scenarioScore - channel.baselineScore).toFixed(2)} ={' '}
                        {channel.deltaContribution.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Statistics */}
        <div className="bg-muted/50 rounded-lg p-4 border space-y-2">
          <p className="text-sm font-semibold">Summary Statistics</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Largest Contributor</p>
              <p className="font-semibold">{sortedChannels[0]?.channelName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Channels</p>
              <p className="font-semibold">{channelAttribution.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Confidence</p>
              <p className="font-semibold">
                {(
                  (channelAttribution.reduce((sum, c) => sum + (c.confidence || 0), 0) /
                    channelAttribution.length) *
                  100
                ).toFixed(0)}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Warning for Low Confidence */}
        {channelAttribution.some((c) => (c.confidence || 0) < 0.6) && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              Some channels have low confidence scores (&lt;60%). Results should be interpreted
              with caution.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
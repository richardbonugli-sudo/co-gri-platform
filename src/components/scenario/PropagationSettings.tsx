/**
 * Propagation Settings (S3)
 * Configure shock propagation parameters
 * Part of CO-GRI Platform Phase 3 - Week 9
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PropagationSettings as PropagationSettingsType, PropagationDepth, TransmissionChannel } from '@/types/scenario';

interface PropagationSettingsProps {
  settings: PropagationSettingsType;
  onSettingsChange: (settings: PropagationSettingsType) => void;
}

const AVAILABLE_SECTORS = [
  'Technology', 'Finance', 'Healthcare', 'Energy', 'Industrials',
  'Consumer Discretionary', 'Consumer Staples', 'Materials', 'Utilities',
  'Real Estate', 'Communication Services', 'Transportation'
];

const TRANSMISSION_CHANNELS: TransmissionChannel[] = [
  'Revenue', 'Supply Chain', 'Physical Assets', 'Financial'
];

export const PropagationSettings: React.FC<PropagationSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const handleChannelToggle = (channel: TransmissionChannel) => {
    const newChannels = settings.transmission_channels.includes(channel)
      ? settings.transmission_channels.filter(c => c !== channel)
      : [...settings.transmission_channels, channel];

    onSettingsChange({
      ...settings,
      transmission_channels: newChannels
    });
  };

  const handleSectorToggle = (sector: string) => {
    const newSectors = settings.sector_filters.includes(sector)
      ? settings.sector_filters.filter(s => s !== sector)
      : [...settings.sector_filters, sector];

    onSettingsChange({
      ...settings,
      sector_filters: newSectors
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Propagation Settings</CardTitle>
        <CardDescription>
          Configure how the shock propagates through the global economy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Propagation Depth */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Propagation Depth (Network Hops)</Label>
            <Badge>{settings.propagation_depth} hops</Badge>
          </div>
          <Slider
            value={[settings.propagation_depth]}
            onValueChange={([value]) => onSettingsChange({ ...settings, propagation_depth: value as PropagationDepth })}
            min={1}
            max={5}
            step={1}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 (Direct)</span>
            <span>3 (Moderate)</span>
            <span>5 (Deep)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Higher depth captures more indirect effects but increases computation time
          </p>
        </div>

        {/* Amplification Factor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Amplification Factor</Label>
            <Badge>{settings.amplification_factor.toFixed(2)}x</Badge>
          </div>
          <Slider
            value={[settings.amplification_factor]}
            onValueChange={([value]) => onSettingsChange({ ...settings, amplification_factor: value })}
            min={0.5}
            max={2.0}
            step={0.1}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5x (Dampened)</span>
            <span>1.0x (Neutral)</span>
            <span>2.0x (Amplified)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Controls whether shocks amplify or dampen as they propagate
          </p>
        </div>

        {/* Transmission Channels */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Transmission Channels</Label>
            <Badge>{settings.transmission_channels.length} / 4 selected</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TRANSMISSION_CHANNELS.map(channel => (
              <div key={channel} className="flex items-center space-x-2 p-3 border rounded-lg">
                <Checkbox
                  id={`channel-${channel}`}
                  checked={settings.transmission_channels.includes(channel)}
                  onCheckedChange={() => handleChannelToggle(channel)}
                />
                <label
                  htmlFor={`channel-${channel}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {channel}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Sector Filters (Empty = All Sectors)</Label>
            <Badge variant={settings.sector_filters.length === 0 ? 'secondary' : 'default'}>
              {settings.sector_filters.length === 0 ? 'All' : `${settings.sector_filters.length} selected`}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg">
            {AVAILABLE_SECTORS.map(sector => (
              <div key={sector} className="flex items-center space-x-2">
                <Checkbox
                  id={`sector-${sector}`}
                  checked={settings.sector_filters.includes(sector)}
                  onCheckedChange={() => handleSectorToggle(sector)}
                />
                <label
                  htmlFor={`sector-${sector}`}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {sector}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Company Filters */}
        <div className="space-y-3">
          <Label>Company Filters</Label>
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label className="text-sm">Minimum ΔCO-GRI Threshold</Label>
              <Input
                type="number"
                value={settings.company_filters.threshold_delta_CO_GRI || ''}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  company_filters: {
                    ...settings.company_filters,
                    threshold_delta_CO_GRI: e.target.value ? parseFloat(e.target.value) : undefined
                  }
                })}
                placeholder="e.g., 2.0"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground">
                Only include companies with ΔCO-GRI above this threshold
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Specific Tickers (comma-separated)</Label>
              <Input
                value={settings.company_filters.specific_tickers?.join(', ') || ''}
                onChange={(e) => onSettingsChange({
                  ...settings,
                  company_filters: {
                    ...settings.company_filters,
                    specific_tickers: e.target.value ? e.target.value.split(',').map(t => t.trim().toUpperCase()) : undefined
                  }
                })}
                placeholder="e.g., AAPL, MSFT, GOOGL"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to analyze all companies
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-3">
          <Label>Advanced Options</Label>
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="second-order"
                checked={settings.advanced_options.enable_second_order_effects}
                onCheckedChange={(checked) => onSettingsChange({
                  ...settings,
                  advanced_options: {
                    ...settings.advanced_options,
                    enable_second_order_effects: checked as boolean
                  }
                })}
              />
              <label
                htmlFor="second-order"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Enable Second-Order Effects
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="feedback-loops"
                checked={settings.advanced_options.enable_feedback_loops}
                onCheckedChange={(checked) => onSettingsChange({
                  ...settings,
                  advanced_options: {
                    ...settings.advanced_options,
                    enable_feedback_loops: checked as boolean
                  }
                })}
              />
              <label
                htmlFor="feedback-loops"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Enable Feedback Loops
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="time-decay"
                  checked={settings.advanced_options.time_decay_enabled}
                  onCheckedChange={(checked) => onSettingsChange({
                    ...settings,
                    advanced_options: {
                      ...settings.advanced_options,
                      time_decay_enabled: checked as boolean
                    }
                  })}
                />
                <label
                  htmlFor="time-decay"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Enable Time Decay
                </label>
              </div>

              {settings.advanced_options.time_decay_enabled && (
                <div className="ml-6 space-y-2">
                  <Label className="text-sm">Decay Rate</Label>
                  <Slider
                    value={[settings.advanced_options.time_decay_rate || 0.1]}
                    onValueChange={([value]) => onSettingsChange({
                      ...settings,
                      advanced_options: {
                        ...settings.advanced_options,
                        time_decay_rate: value
                      }
                    })}
                    min={0}
                    max={1}
                    step={0.05}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 (No decay)</span>
                    <span>1 (Fast decay)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
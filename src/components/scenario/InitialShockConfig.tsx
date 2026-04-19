/**
 * Initial Shock Configuration (S2)
 * Configure shock parameters: countries, intensity, channels, duration
 * Part of CO-GRI Platform Phase 3 - Week 9
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, X, Search } from 'lucide-react';
import { InitialShock, DurationMonths } from '@/types/scenario';

interface InitialShockConfigProps {
  shock: InitialShock;
  onShockChange: (shock: InitialShock) => void;
}

// Available countries for selection
const AVAILABLE_COUNTRIES = [
  'China', 'United States', 'Taiwan', 'Japan', 'S. Korea', 'Germany', 'France', 'UK',
  'India', 'Brazil', 'Mexico', 'Canada', 'Australia', 'Singapore', 'Vietnam',
  'Thailand', 'Indonesia', 'Malaysia', 'Philippines', 'Saudi Arabia', 'UAE',
  'Russia', 'Turkey', 'South Africa', 'Argentina', 'Chile', 'Poland', 'Spain',
  'Italy', 'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Denmark', 'Switzerland'
];

export const InitialShockConfig: React.FC<InitialShockConfigProps> = ({
  shock,
  onShockChange
}) => {
  const [countrySearch, setCountrySearch] = useState('');

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return AVAILABLE_COUNTRIES;
    return AVAILABLE_COUNTRIES.filter(country =>
      country.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countrySearch]);

  // Calculate channel distribution sum
  const channelSum = useMemo(() => {
    return (
      shock.channel_distribution.revenue +
      shock.channel_distribution.supply_chain +
      shock.channel_distribution.physical_assets +
      shock.channel_distribution.financial
    );
  }, [shock.channel_distribution]);

  const isChannelSumValid = Math.abs(channelSum - 100) < 0.1;

  // Handle country selection
  const handleCountryToggle = (country: string) => {
    const affectedCountries = shock.affected_countries || [];
    const newCountries = affectedCountries.includes(country)
      ? affectedCountries.filter(c => c !== country)
      : [...affectedCountries, country];

    if (newCountries.length <= 10) {
      onShockChange({
        ...shock,
        affected_countries: newCountries
      });
    }
  };

  // Handle channel distribution change
  const handleChannelChange = (channel: keyof typeof shock.channel_distribution, value: number) => {
    onShockChange({
      ...shock,
      channel_distribution: {
        ...shock.channel_distribution,
        [channel]: value
      }
    });
  };

  // Auto-normalize channels
  const handleNormalizeChannels = () => {
    const total = channelSum;
    if (total === 0) return;

    const normalized = {
      revenue: Math.round((shock.channel_distribution.revenue / total) * 100),
      supply_chain: Math.round((shock.channel_distribution.supply_chain / total) * 100),
      physical_assets: Math.round((shock.channel_distribution.physical_assets / total) * 100),
      financial: Math.round((shock.channel_distribution.financial / total) * 100)
    };

    // Adjust for rounding errors
    const newTotal = normalized.revenue + normalized.supply_chain + normalized.physical_assets + normalized.financial;
    if (newTotal !== 100) {
      normalized.revenue += (100 - newTotal);
    }

    onShockChange({
      ...shock,
      channel_distribution: normalized
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initial Shock Configuration</CardTitle>
        <CardDescription>
          Define the initial geopolitical shock parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Country Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Affected Countries (1-10)</Label>
            <Badge variant={shock.affected_countries.length === 0 ? 'destructive' : 'default'}>
              {shock.affected_countries.length} / 10 selected
            </Badge>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Countries */}
          {shock.affected_countries.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/50">
              {shock.affected_countries.map(country => (
                <Badge key={country} variant="secondary" className="gap-1">
                  {country}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleCountryToggle(country)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Available Countries */}
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg">
            {filteredCountries.map(country => {
              const affectedCountries = shock.affected_countries || [];
              const isSelected = affectedCountries.includes(country);
              return (
                <Button
                  key={country}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCountryToggle(country)}
                  disabled={!isSelected && affectedCountries.length >= 10}
                  className="justify-start"
                >
                  {country}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Shock Intensity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Shock Intensity</Label>
            <Badge variant={shock.shock_intensity > 0 ? 'destructive' : shock.shock_intensity < 0 ? 'default' : 'secondary'}>
              {shock.shock_intensity > 0 ? '+' : ''}{shock.shock_intensity}
            </Badge>
          </div>
          <Slider
            value={[shock.shock_intensity]}
            onValueChange={([value]) => onShockChange({ ...shock, shock_intensity: value })}
            min={-100}
            max={100}
            step={1}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-100 (Tailwind)</span>
            <span>0 (Neutral)</span>
            <span>+100 (Headwind)</span>
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Channel Distribution</Label>
            <div className="flex items-center gap-2">
              <Badge variant={isChannelSumValid ? 'default' : 'destructive'}>
                Sum: {channelSum.toFixed(1)}%
              </Badge>
              {!isChannelSumValid && (
                <Button size="sm" variant="outline" onClick={handleNormalizeChannels}>
                  Normalize
                </Button>
              )}
            </div>
          </div>

          {!isChannelSumValid && (
            <div className="flex items-center gap-2 p-3 border border-yellow-200 rounded-lg bg-yellow-50 text-yellow-900">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Channel weights must sum to 100%</span>
            </div>
          )}

          {/* Revenue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Revenue</Label>
              <span className="text-sm font-medium">{shock.channel_distribution.revenue}%</span>
            </div>
            <Slider
              value={[shock.channel_distribution.revenue]}
              onValueChange={([value]) => handleChannelChange('revenue', value)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          {/* Supply Chain */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Supply Chain</Label>
              <span className="text-sm font-medium">{shock.channel_distribution.supply_chain}%</span>
            </div>
            <Slider
              value={[shock.channel_distribution.supply_chain]}
              onValueChange={([value]) => handleChannelChange('supply_chain', value)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          {/* Physical Assets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Physical Assets</Label>
              <span className="text-sm font-medium">{shock.channel_distribution.physical_assets}%</span>
            </div>
            <Slider
              value={[shock.channel_distribution.physical_assets]}
              onValueChange={([value]) => handleChannelChange('physical_assets', value)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          {/* Financial */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Financial</Label>
              <span className="text-sm font-medium">{shock.channel_distribution.financial}%</span>
            </div>
            <Slider
              value={[shock.channel_distribution.financial]}
              onValueChange={([value]) => handleChannelChange('financial', value)}
              min={0}
              max={100}
              step={1}
            />
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <Label>Shock Duration</Label>
          <Select
            value={shock.duration_months.toString()}
            onValueChange={(v) => onShockChange({ ...shock, duration_months: parseInt(v) as DurationMonths })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 month</SelectItem>
              <SelectItem value="3">3 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <Label>Shock Description</Label>
          <Input
            value={shock.description}
            onChange={(e) => onShockChange({ ...shock, description: e.target.value })}
            placeholder="Describe the shock scenario..."
          />
        </div>
      </CardContent>
    </Card>
  );
};
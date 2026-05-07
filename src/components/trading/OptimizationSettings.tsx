/**
 * Optimization Settings (T5)
 * Configure portfolio optimization parameters
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Play } from 'lucide-react';
import { useTradingState } from '@/store/tradingState';
import { OptimizationSettings as OptSettings } from '@/types/trading';

export default function OptimizationSettings() {
  const { currentPortfolio, optimizePortfolio, isOptimizing } = useTradingState();
  
  const [settings, setSettings] = useState<OptSettings>({
    objective: 'Minimize Risk',
    cogri_weight: 50,
    risk_tolerance: 'Moderate',
    rebalancing_frequency: 'Monthly',
    max_position_size: 25,
    min_position_size: 2,
    max_sector_exposure: 40,
    min_holdings: 5,
    max_holdings: 20,
    transaction_costs: 0.1,
    tax_loss_harvesting: false,
    esg_screening: false,
  });

  const handleOptimize = async () => {
    if (!currentPortfolio) return;
    await optimizePortfolio(currentPortfolio, settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimization Settings</CardTitle>
        <CardDescription>Configure optimization parameters and constraints</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Optimization Objective */}
        <div className="space-y-2">
          <Label>Optimization Objective</Label>
          <Select
            value={settings.objective}
            onValueChange={(value: any) => setSettings({ ...settings, objective: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Minimize Risk">Minimize Risk</SelectItem>
              <SelectItem value="Maximize Return">Maximize Return</SelectItem>
              <SelectItem value="Maximize Sharpe">Maximize Sharpe Ratio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CO-GRI Weight */}
        <div className="space-y-2">
          <Label>CO-GRI Weight: {settings.cogri_weight}%</Label>
          <Slider
            value={[settings.cogri_weight]}
            onValueChange={(value) => setSettings({ ...settings, cogri_weight: value[0] })}
            max={100}
            step={5}
          />
          <p className="text-xs text-muted-foreground">
            Higher weight prioritizes geopolitical risk reduction
          </p>
        </div>

        {/* Risk Tolerance */}
        <div className="space-y-2">
          <Label>Risk Tolerance</Label>
          <Select
            value={settings.risk_tolerance}
            onValueChange={(value: any) => setSettings({ ...settings, risk_tolerance: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Conservative">Conservative</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Aggressive">Aggressive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rebalancing Frequency */}
        <div className="space-y-2">
          <Label>Rebalancing Frequency</Label>
          <Select
            value={settings.rebalancing_frequency}
            onValueChange={(value: any) => setSettings({ ...settings, rebalancing_frequency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Position Size Constraints */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Max Position: {settings.max_position_size}%</Label>
            <Slider
              value={[settings.max_position_size]}
              onValueChange={(value) => setSettings({ ...settings, max_position_size: value[0] })}
              min={10}
              max={50}
              step={5}
            />
          </div>
          <div className="space-y-2">
            <Label>Min Position: {settings.min_position_size}%</Label>
            <Slider
              value={[settings.min_position_size]}
              onValueChange={(value) => setSettings({ ...settings, min_position_size: value[0] })}
              min={1}
              max={10}
              step={1}
            />
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-3 pt-2 border-t">
          <Label className="text-sm font-semibold">Advanced Options</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="tax-loss" className="text-sm font-normal">Tax Loss Harvesting</Label>
            <Switch
              id="tax-loss"
              checked={settings.tax_loss_harvesting}
              onCheckedChange={(checked) => setSettings({ ...settings, tax_loss_harvesting: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="esg" className="text-sm font-normal">ESG Screening</Label>
            <Switch
              id="esg"
              checked={settings.esg_screening}
              onCheckedChange={(checked) => setSettings({ ...settings, esg_screening: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Transaction Costs: {settings.transaction_costs}%</Label>
            <Slider
              value={[settings.transaction_costs]}
              onValueChange={(value) => setSettings({ ...settings, transaction_costs: value[0] })}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        </div>

        {/* Optimize Button */}
        <Button
          className="w-full"
          onClick={handleOptimize}
          disabled={!currentPortfolio || isOptimizing}
        >
          {isOptimizing ? (
            <>Optimizing...</>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Optimize Portfolio
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
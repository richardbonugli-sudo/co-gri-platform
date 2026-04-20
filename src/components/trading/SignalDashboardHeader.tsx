/**
 * Signal Dashboard Header (T1)
 * Filter and sort controls for trading signals
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RefreshCw, Download, Filter } from 'lucide-react';
import { useTradingState } from '@/store/tradingState';
import { SignalType } from '@/types/trading';
import { generateMockSignals } from '@/services/mockData/tradingDataGenerator';

export default function SignalDashboardHeader() {
  const { signalFilters, setSignalFilters, signalSort, setSignalSort, setSignals } = useTradingState();

  const handleRefresh = async () => {
    const newSignals = generateMockSignals(25);
    setSignals(newSignals);
  };

  const handleExport = () => {
    // Export functionality
    console.log('Exporting signals...');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Signal Type Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Filter className="h-3 w-3" />
              Signal Type
            </Label>
            <Select
              value={signalFilters.signal_types.length === 3 ? 'all' : signalFilters.signal_types[0]}
              onValueChange={(value) => {
                if (value === 'all') {
                  setSignalFilters({ ...signalFilters, signal_types: ['BUY', 'SELL', 'HOLD'] });
                } else {
                  setSignalFilters({ ...signalFilters, signal_types: [value as SignalType] });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Signals</SelectItem>
                <SelectItem value="BUY">BUY Only</SelectItem>
                <SelectItem value="SELL">SELL Only</SelectItem>
                <SelectItem value="HOLD">HOLD Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Min Confidence: {signalFilters.confidence_threshold}%
            </Label>
            <Slider
              value={[signalFilters.confidence_threshold]}
              onValueChange={(value) => setSignalFilters({ ...signalFilters, confidence_threshold: value[0] })}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Sort By</Label>
            <Select
              value={signalSort.sort_by}
              onValueChange={(value: any) => setSignalSort({ ...signalSort, sort_by: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="signal_strength">Signal Strength</SelectItem>
                <SelectItem value="confidence">Confidence</SelectItem>
                <SelectItem value="cogri">CO-GRI Score</SelectItem>
                <SelectItem value="expected_return">Expected Return</SelectItem>
                <SelectItem value="generated_at">Date Generated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Actions</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="flex-1">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
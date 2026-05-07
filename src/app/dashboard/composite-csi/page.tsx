/**
 * Composite CSI Dashboard Page
 * Main dashboard for viewing and comparing composite CSI scores
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CompositeCSICard } from '@/components/csi/CompositeCSICard';
import { CompositeCSIComparison } from '@/components/csi/CompositeCSIComparison';
import { Search, Plus, X } from 'lucide-react';

export default function CompositeCSIDashboard() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    'United States',
    'China',
    'Russia',
    'Germany',
    'India'
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedCountry, setFocusedCountry] = useState<string>('United States');

  const handleAddCountry = () => {
    if (searchQuery && !selectedCountries.includes(searchQuery)) {
      setSelectedCountries([...selectedCountries, searchQuery]);
      setSearchQuery('');
    }
  };

  const handleRemoveCountry = (country: string) => {
    setSelectedCountries(selectedCountries.filter(c => c !== country));
    if (focusedCountry === country && selectedCountries.length > 0) {
      setFocusedCountry(selectedCountries[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Composite CSI Dashboard
          </h1>
          <p className="text-gray-400">
            Comprehensive country risk analysis using composite Country Shock Index methodology
          </p>
        </div>

        {/* Country Selection */}
        <Card className="bg-[#0d5f5f]/20 border-[#0d5f5f]/30">
          <CardHeader>
            <CardTitle className="text-white">Selected Countries</CardTitle>
            <CardDescription className="text-gray-400">
              Add or remove countries to compare their composite CSI scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter country name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCountry()}
                className="bg-[#0a1628] border-[#0d5f5f]/30 text-white"
              />
              <Button
                onClick={handleAddCountry}
                disabled={!searchQuery}
                className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedCountries.map((country) => (
                <Button
                  key={country}
                  variant={focusedCountry === country ? 'default' : 'outline'}
                  onClick={() => setFocusedCountry(country)}
                  className={
                    focusedCountry === country
                      ? 'bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white'
                      : 'border-[#0d5f5f]/30 text-white hover:bg-[#0d5f5f]/20'
                  }
                >
                  {country}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCountry(country);
                    }}
                    className="ml-2 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Focused Country Detail */}
          <CompositeCSICard
            country={focusedCountry}
            showBreakdown={true}
            className="bg-[#0d5f5f]/20 border-[#0d5f5f]/30"
          />

          {/* Comparison Chart */}
          <CompositeCSIComparison
            countries={selectedCountries}
            className="bg-[#0d5f5f]/20 border-[#0d5f5f]/30"
          />
        </div>

        {/* All Countries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedCountries
            .filter(c => c !== focusedCountry)
            .map((country) => (
              <CompositeCSICard
                key={country}
                country={country}
                showBreakdown={false}
                className="bg-[#0d5f5f]/20 border-[#0d5f5f]/30"
              />
            ))}
        </div>

        {/* Documentation */}
        <Card className="bg-[#0d5f5f]/20 border-[#0d5f5f]/30">
          <CardHeader>
            <CardTitle className="text-white">About Composite CSI</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <p>
              The Composite Country Shock Index (CSI) provides a comprehensive measure of geopolitical 
              risk by aggregating multiple risk vectors with their respective weights and baseline values.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Calculation Method</h4>
                <p className="text-sm">
                  Composite CSI = Σ(Vector Score × Vector Weight × Baseline Adjustment)
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Risk Vectors</h4>
                <p className="text-sm">
                  Includes 7 vectors: Conflict, Sanctions, Trade, Governance, Cyber, Unrest, Currency
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
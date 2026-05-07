/**
 * Unified Dashboard - Main Landing Page with Interactive Map Visualizations
 * Accessible via "Get Started" button
 * Phase 1 + Priority 2 + Priority 3: Full Dashboard with All Components
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Globe, 
  Building2, 
  TrendingUp, 
  Zap, 
  BarChart3,
  ArrowRight,
  Activity,
  MapPin,
  LineChart,
  AlertCircle,
  Search
} from 'lucide-react';
import { GlobalRiskHeatmap } from '@/components/dashboard/GlobalRiskHeatmap';
import { TopRiskCountries } from '@/components/dashboard/TopRiskCountries';
import { RegionalRiskPanel } from '@/components/dashboard/RegionalRiskPanel';
import { GlobalRiskIndex } from '@/components/dashboard/GlobalRiskIndex';
import { CountrySummaryPanel } from '@/components/dashboard/CountrySummaryPanel';
import { RiskVectorBreakdown } from '@/components/dashboard/RiskVectorBreakdown';
import { TopRiskMovers } from '@/components/dashboard/TopRiskMovers';
import { GLOBAL_COUNTRIES } from '@/data/globalCountries';

const UnifiedDashboard = () => {
  // State management
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<'7D' | '30D' | '90D' | '12M'>('30D');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Mode configurations
  const modes = [
    {
      id: 'country',
      title: 'Country Mode',
      description: 'Comprehensive country-level geopolitical risk analysis',
      icon: Globe,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      route: '/country',
      features: [
        'CSI scores for 195 countries',
        'Regional risk aggregation',
        'Interactive global heatmap',
        'Historical trend analysis'
      ],
      status: 'active'
    },
    {
      id: 'company',
      title: 'Company Mode',
      description: 'Company-specific geopolitical risk assessment',
      icon: Building2,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      route: '/company',
      features: [
        'CO-GRI scores for 500+ companies',
        'Geographic exposure mapping',
        'Channel-specific risk breakdown',
        'Peer comparison analysis'
      ],
      status: 'active'
    },
    {
      id: 'forecast',
      title: 'Forecast Mode',
      description: 'Forward-looking geopolitical risk forecasting',
      icon: TrendingUp,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      route: '/forecast',
      features: [
        '16 expert consensus forecasts',
        'Regional impact assessment',
        'Asset class implications',
        'Strategic recommendations'
      ],
      status: 'active'
    },
    {
      id: 'scenario',
      title: 'Scenario Mode',
      description: 'Custom scenario modeling and impact analysis',
      icon: Zap,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      route: '/scenario',
      features: [
        'Custom shock configuration',
        'Multi-hop propagation (1-5 layers)',
        'Transmission graph visualization',
        'Company impact assessment'
      ],
      status: 'active'
    },
    {
      id: 'trading',
      title: 'Trading Mode',
      description: 'Trading signal generation and backtesting',
      icon: BarChart3,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      route: '/trading',
      features: [
        'Advanced signal generation',
        'Monte Carlo backtesting',
        'ML prediction integration',
        'Risk management tools'
      ],
      status: 'active'
    }
  ];

  // Quick stats
  const stats = [
    { label: 'Countries Monitored', value: '195', icon: MapPin, color: 'text-blue-500' },
    { label: 'Companies Tracked', value: '500+', icon: Building2, color: 'text-green-500' },
    { label: 'Active Events', value: '47', icon: Activity, color: 'text-orange-500' },
    { label: 'Data Sources', value: '10+', icon: LineChart, color: 'text-purple-500' }
  ];

  // Time window options
  const timeWindows: Array<'7D' | '30D' | '90D' | '12M'> = ['7D', '30D', '90D', '12M'];

  // Country search filtering
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return GLOBAL_COUNTRIES
      .filter(country => country.country.toLowerCase().includes(query))
      .slice(0, 10);
  }, [searchQuery]);

  // Handlers
  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleClearSelection = () => {
    setSelectedCountry(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(e.target.value.length > 0);
  };

  const handleRegionHover = (region: string | null) => {
    setHoveredRegion(region);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0d1512] to-[#0a0f0d]">
      {/* Header */}
      <header className="border-b border-[#0d5f5f]/30 bg-[#0d1512]/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">CO-GRI Intelligence Platform</h1>
              <p className="text-[#7fa89f] text-sm mt-1">Geopolitical Risk Analysis & Forecasting</p>
            </div>
            <Link href="/">
              <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Top Bar: Global Risk Index + Search + Time Window */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Global Risk Index */}
            <div className="lg:col-span-2">
              <GlobalRiskIndex timeWindow={timeWindow} />
            </div>

            {/* Search and Time Window */}
            <div className="space-y-4">
              {/* Country Search */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowSearchResults(searchQuery.length > 0)}
                    className="pl-10 bg-[#0d1512] border-[#0d5f5f]/30 text-white placeholder:text-gray-400"
                  />
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && filteredCountries.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-[#0d1512] border border-[#0d5f5f] rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    {filteredCountries.map((country, index) => (
                      <button
                        key={index}
                        onClick={() => handleCountrySelect(country.country)}
                        className="w-full text-left px-4 py-3 hover:bg-[#0d5f5f]/20 transition-colors border-b border-[#0d5f5f]/20 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white">{country.country}</span>
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]"
                          >
                            {country.region}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time Window Selector */}
              <div className="flex gap-2">
                {timeWindows.map((window) => (
                  <Button
                    key={window}
                    variant={timeWindow === window ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeWindow(window)}
                    className={
                      timeWindow === window
                        ? "bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white flex-1"
                        : "border-[#0d5f5f]/50 text-[#7fa89f] hover:bg-[#0d5f5f]/20 flex-1"
                    }
                  >
                    {window}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-[#0d1512] border-[#0d5f5f]/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#7fa89f] text-sm mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                    <Icon className={`h-10 w-10 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Dashboard Grid: 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          {/* Left Column: Top Risk Movers */}
          <div className="lg:col-span-3">
            <TopRiskMovers 
              timeWindow={timeWindow}
              maxCountries={10}
            />
          </div>

          {/* Center Column: Global Risk Heatmap */}
          <div className="lg:col-span-6">
            <GlobalRiskHeatmap 
              title="Global CSI Heatmap"
              showRegionFilter={true}
              maxCountries={30}
              highlightedRegion={hoveredRegion}
            />
          </div>

          {/* Right Column: Country Summary + Risk Vector + Top Risk Countries */}
          <div className="lg:col-span-3 space-y-6">
            <CountrySummaryPanel 
              selectedCountry={selectedCountry}
              timeWindow={timeWindow}
              onClearSelection={handleClearSelection}
            />
            
            <RiskVectorBreakdown 
              selectedCountry={selectedCountry}
              timeWindow={timeWindow}
            />
            
            <TopRiskCountries 
              maxCountries={10}
              title="Top Risk Countries"
              selectedCountry={selectedCountry}
              onCountryHover={(country) => {
                // Optional: could implement hover highlighting
              }}
            />
          </div>
        </div>

        {/* Regional Risk Panel - Full Width */}
        <div className="mb-12">
          <RegionalRiskPanel 
            title="Regional Risk Overview"
            onRegionClick={(region) => {
              // Optional: could filter map by region
            }}
            onRegionHover={handleRegionHover}
          />
        </div>

        {/* Mode Selection */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Select Your Analysis Mode
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Card 
                  key={mode.id} 
                  className="bg-[#0d1512] border-[#0d5f5f]/30 hover:border-[#0d5f5f] transition-all duration-300 hover:shadow-xl hover:shadow-[#0d5f5f]/20"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${mode.color} p-3 rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      {mode.status === 'active' && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Active
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-white text-xl font-semibold mb-2">{mode.title}</h3>
                    <p className="text-[#7fa89f] text-sm mb-4">
                      {mode.description}
                    </p>
                    <ul className="space-y-2 mb-6">
                      {mode.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <ArrowRight className="h-4 w-4 text-[#7fa89f] mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={mode.route}>
                      <Button 
                        className={`w-full ${mode.color} ${mode.hoverColor} text-white`}
                      >
                        Launch {mode.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info Banner */}
        <Card className="bg-[#0d5f5f]/10 border-[#0d5f5f]/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-[#7fa89f] flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-semibold mb-2">Platform Features</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  The CO-GRI platform integrates data from 10+ authoritative sources including OECD, IMF, BIS, 
                  and UN Comtrade to provide comprehensive geopolitical risk analysis. All modes feature interactive 
                  visualizations, real-time data updates, and export capabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#0d5f5f]/30 bg-[#0d1512]/50 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2026 CO-GRI Platform. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/disclaimer">
                <Button variant="ghost" className="text-gray-400 hover:text-white text-sm">
                  Disclaimer
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" className="text-gray-400 hover:text-white text-sm">
                  Contact
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UnifiedDashboard;
/**
 * Global Navigation Bar Component
 * Persistent top bar with mode tabs, search, time controls, and utilities
 * Phase 1: Foundation - Unified Workspace Navigation
 *
 * UPDATED: Hybrid company search — local companyDatabase.ts (256 companies, instant)
 *          with automatic live API fallback (Marketstack / Yahoo Finance / Alpha Vantage)
 *          for any company not found locally. Supports both company name AND ticker symbol.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  Building2,
  TrendingUp,
  Zap,
  BarChart3,
  Search,
  Download,
  Save,
  Star,
  Settings,
  X,
  Loader2,
} from 'lucide-react';
import { useGlobalDashboardStore } from '@/store/globalDashboardState';
import { GLOBAL_COUNTRIES } from '@/data/globalCountries';
import { searchCompanies } from '@/services/tickerResolution';
import type { PlatformMode, TimeWindow } from '@/store/globalDashboardState';

// Shape returned by tickerResolution.searchCompanies()
interface CompanySearchResult {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  sector: string;
  source: 'yahoo' | 'alphavantage' | 'marketstack' | 'local';
}

export const GlobalNavigationBar: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Hybrid search state
  const [filteredCompanies, setFilteredCompanies] = useState<CompanySearchResult[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global state
  const {
    activeMode,
    setActiveMode,
    selectedEntity,
    setSelectedEntity,
    timeWindow,
    setTimeWindow,
    searchQuery,
    setSearchQuery,
    clearSelection,
  } = useGlobalDashboardStore();

  // Mode configurations
  const modes: Array<{
    id: PlatformMode;
    label: string;
    icon: typeof Globe;
    route: string;
  }> = [
    { id: 'Country', label: 'Country', icon: Globe, route: '/dashboard' },
    { id: 'Company', label: 'Company', icon: Building2, route: '/company' },
    { id: 'Forecast', label: 'Forecast', icon: TrendingUp, route: '/forecast' },
    { id: 'Scenario', label: 'Scenario', icon: Zap, route: '/scenario' },
    { id: 'Trading', label: 'Trading', icon: BarChart3, route: '/trading' },
  ];

  // Time window options
  const timeWindows: TimeWindow[] = ['7D', '30D', '90D', '12M'];

  // Country search filtering (synchronous — countries are a small static list)
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return GLOBAL_COUNTRIES.filter((country) =>
      country.country.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [searchQuery]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Hybrid company search:
  //   1. tickerResolution.searchCompanies() first checks the local companyDatabase
  //      (256 companies, instant ~0ms) — covers AAPL, MSFT, GOOGL, TSX, LSE, etc.
  //   2. If no local results, it automatically falls back to live APIs:
  //      Marketstack → Yahoo Finance → Alpha Vantage (async, ~300–1500ms)
  //   Debounced at 300ms to avoid firing on every keystroke.
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      setFilteredCompanies([]);
      setIsSearchingCompanies(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsSearchingCompanies(true);
      try {
        const results = await searchCompanies(searchQuery.trim());
        setFilteredCompanies(results.slice(0, 8));
      } catch (err) {
        console.error('Company search error:', err);
        setFilteredCompanies([]);
      } finally {
        setIsSearchingCompanies(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Handlers
  const handleModeChange = (mode: PlatformMode, route: string) => {
    setActiveMode(mode);
    setLocation(route);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(e.target.value.length > 0);
  };

  const handleCountrySelect = (country: string) => {
    setSelectedEntity({
      type: 'country',
      name: country,
    });
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Updated to use CompanySearchResult fields: symbol + name (not ticker + companyName)
  const handleCompanySelect = (company: CompanySearchResult) => {
    setSelectedEntity({
      type: 'company',
      name: company.name,
    });
    setSearchQuery('');
    setShowSearchResults(false);
    // Navigate to company mode with the selected ticker symbol
    setActiveMode('Company');
    setLocation(`/company?ticker=${company.symbol}`);
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  // Determine if dropdown should be visible
  const hasResults =
    filteredCountries.length > 0 || filteredCompanies.length > 0 || isSearchingCompanies;

  return (
    <div className="border-b border-[#0d5f5f]/30 bg-[#0d1512]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6">
        {/* Top Row: Logo and Utilities */}
        <div className="flex items-center justify-between py-3 border-b border-[#0d5f5f]/20">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="bg-[#0d5f5f] p-2 rounded-lg group-hover:bg-[#0a4d4d] transition-colors">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white group-hover:text-[#7fa89f] transition-colors">
                  CO-GRI Platform
                </h1>
                <p className="text-xs text-[#7fa89f]">Intelligence Workspace</p>
              </div>
            </div>
          </Link>

          {/* Workspace Utilities */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-[#0d5f5f]/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-[#0d5f5f]/20"
            >
              <Save className="h-4 w-4 mr-2" />
              Save View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-[#0d5f5f]/20"
            >
              <Star className="h-4 w-4 mr-2" />
              Watchlist
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-[#0d5f5f]/20"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bottom Row: Mode Tabs, Search, and Time Controls */}
        <div className="flex items-center justify-between py-3">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isActive = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeChange(mode.id, mode.route)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#0d5f5f] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#0d5f5f]/20'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search and Time Controls */}
          <div className="flex items-center gap-4">
            {/* Selected Entity Display */}
            {selectedEntity && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0d5f5f]/20 border border-[#0d5f5f] rounded-lg">
                <Badge
                  variant="outline"
                  className="text-xs bg-[#0d5f5f]/30 text-[#7fa89f] border-[#0d5f5f]"
                >
                  {selectedEntity.type}
                </Badge>
                <span className="text-white text-sm font-medium">{selectedEntity.name}</span>
                <button
                  onClick={handleClearSelection}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Universal Search */}
            <div className="relative w-72">
              <div className="relative">
                {isSearchingCompanies ? (
                  <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7fa89f] animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
                <Input
                  type="text"
                  placeholder="Search countries or companies..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchResults(searchQuery.length > 0)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="pl-10 bg-[#0a0f0d] border-[#0d5f5f]/30 text-white placeholder:text-gray-400 h-9"
                />
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && hasResults && (
                <div className="absolute top-full mt-2 w-full bg-[#0d1512] border border-[#0d5f5f] rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                  {/* Countries Section */}
                  {filteredCountries.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-[#0a0f0d] border-b border-[#0d5f5f]/30">
                        <span className="text-xs font-semibold text-[#7fa89f] uppercase tracking-wider flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          Countries
                        </span>
                      </div>
                      {filteredCountries.map((country, index) => (
                        <button
                          key={`country-${index}`}
                          onClick={() => handleCountrySelect(country.country)}
                          className="w-full text-left px-4 py-3 hover:bg-[#0d5f5f]/20 transition-colors border-b border-[#0d5f5f]/20"
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

                  {/* Companies Section */}
                  {(filteredCompanies.length > 0 || isSearchingCompanies) && (
                    <div>
                      <div className="px-4 py-2 bg-[#0a0f0d] border-b border-[#0d5f5f]/30">
                        <span className="text-xs font-semibold text-[#7fa89f] uppercase tracking-wider flex items-center gap-2">
                          <Building2 className="h-3 w-3" />
                          Companies
                          {isSearchingCompanies && (
                            <span className="text-[#7fa89f]/60 normal-case font-normal ml-1">
                              — searching live…
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Loading skeleton while API fallback is in progress */}
                      {isSearchingCompanies && filteredCompanies.length === 0 && (
                        <div className="px-4 py-3 flex items-center gap-3">
                          <Loader2 className="h-4 w-4 text-[#7fa89f] animate-spin flex-shrink-0" />
                          <span className="text-sm text-gray-400">
                            Searching global markets…
                          </span>
                        </div>
                      )}

                      {filteredCompanies.map((company, index) => (
                        <button
                          key={`company-${index}`}
                          onClick={() => handleCompanySelect(company)}
                          className="w-full text-left px-4 py-3 hover:bg-[#0d5f5f]/20 transition-colors border-b border-[#0d5f5f]/20 last:border-b-0"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                              {/* Ticker symbol — primary identifier */}
                              <span className="text-white font-medium">{company.symbol}</span>
                              {/* Full company name */}
                              <span className="text-xs text-gray-400 truncate max-w-[180px]">
                                {company.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Source badge: local = instant, others = live API */}
                              {company.source !== 'local' && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-blue-900/20 text-blue-400 border-blue-800/40 px-1 py-0"
                                >
                                  live
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]"
                              >
                                {company.sector}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Time Window Controls */}
            <div className="flex items-center gap-1 bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-1">
              {timeWindows.map((window) => (
                <button
                  key={window}
                  onClick={() => setTimeWindow(window)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    timeWindow === window
                      ? 'bg-[#0d5f5f] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {window}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalNavigationBar;
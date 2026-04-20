/**
 * Unified Search Bar Component
 * Cross-mode entity search with type selector
 * Part of CO-GRI Platform Phase 3 - Week 6
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Globe, Building2, Layers, Briefcase } from 'lucide-react';
import { useGlobalState } from '@/store/globalState';

type SearchType = 'country' | 'company' | 'sector' | 'portfolio';

const SEARCH_TYPE_CONFIG: Record<SearchType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  placeholder: string;
}> = {
  country: {
    icon: Globe,
    label: 'Country',
    placeholder: 'Search countries (e.g., China, United States)...'
  },
  company: {
    icon: Building2,
    label: 'Company',
    placeholder: 'Search companies (e.g., AAPL, MSFT, TSLA)...'
  },
  sector: {
    icon: Layers,
    label: 'Sector',
    placeholder: 'Search sectors (e.g., Technology, Energy)...'
  },
  portfolio: {
    icon: Briefcase,
    label: 'Portfolio',
    placeholder: 'Search portfolios...'
  }
};

export function UnifiedSearchBar() {
  const [, setLocation] = useLocation();
  const [searchType, setSearchType] = useState<SearchType>('company');
  const [searchQuery, setSearchQuery] = useState('');
  
  const setSelectedCountry = useGlobalState((state) => state.setSelectedCountry);
  const setSelectedCompany = useGlobalState((state) => state.setSelectedCompany);
  const setSelectedSector = useGlobalState((state) => state.setSelectedSector);
  const setSelectedPortfolio = useGlobalState((state) => state.setSelectedPortfolio);
  const setActiveMode = useGlobalState((state) => state.setActiveMode);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;

    // Update global state based on search type
    switch (searchType) {
      case 'country':
        setSelectedCountry(searchQuery);
        setActiveMode('Country');
        setLocation('/country');
        break;
      case 'company':
        setSelectedCompany(searchQuery.toUpperCase());
        setActiveMode('Company');
        setLocation(`/company?ticker=${searchQuery.toUpperCase()}`);
        break;
      case 'sector':
        setSelectedSector(searchQuery);
        setActiveMode('Company');
        setLocation(`/company?sector=${searchQuery}`);
        break;
      case 'portfolio':
        setSelectedPortfolio(searchQuery);
        setActiveMode('Trading');
        setLocation(`/trading?portfolio=${searchQuery}`);
        break;
    }
  };

  const config = SEARCH_TYPE_CONFIG[searchType];
  const Icon = config.icon;

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-2xl">
      <Select value={searchType} onValueChange={(v) => setSearchType(v as SearchType)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(SEARCH_TYPE_CONFIG) as [SearchType, typeof SEARCH_TYPE_CONFIG[SearchType]][]).map(([type, cfg]) => {
            const TypeIcon = cfg.icon;
            return (
              <SelectItem key={type} value={type}>
                <div className="flex items-center gap-2">
                  <TypeIcon className="h-4 w-4" />
                  <span>{cfg.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <div className="relative flex-1">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={config.placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Button type="submit" size="icon">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
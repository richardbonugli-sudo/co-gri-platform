import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Loader2, Building2, Globe, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchCompanies } from '@/services/tickerResolution';

interface CompanySearchResult {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  sector: string;
  source: 'yahoo' | 'alphavantage' | 'marketstack' | 'local';
}

interface TickerSearchInputProps {
  value: string;
  onChange: (value: string, companyData?: CompanySearchResult) => void;
  placeholder?: string;
}

export function TickerSearchInput({ value, onChange, placeholder = 'Search ticker or company name...' }: TickerSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update search query when value prop changes
  useEffect(() => {
    if (value !== searchQuery) {
      setSearchQuery(value);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await searchCompanies(query);
      console.log('🔍 Search results:', searchResults.length);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSelect = (company: CompanySearchResult) => {
    console.log('✅ SELECTED:', company.symbol, company.exchange);
    setSelectedCompany(company);
    setSearchQuery(company.symbol);
    onChange(company.symbol, company);
    setOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setOpen(true);
    setHighlightedIndex(-1);
    
    // Immediately update parent with typed value (uppercase)
    const trimmedValue = newValue.trim().toUpperCase();
    onChange(trimmedValue);
    
    // Clear selected company if user is typing manually
    if (selectedCompany && newValue !== selectedCompany.symbol) {
      setSelectedCompany(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setOpen(true);
        return;
      }
    }

    if (e.key === 'Escape') {
      setOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
        handleSelect(results[highlightedIndex]);
      } else {
        const trimmedValue = searchQuery.trim().toUpperCase();
        if (trimmedValue) {
          onChange(trimmedValue);
          setOpen(false);
        }
      }
    } else if (e.key === 'Tab') {
      const trimmedValue = searchQuery.trim().toUpperCase();
      if (trimmedValue) {
        onChange(trimmedValue);
      }
      setOpen(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedCompany(null);
    onChange('');
    setResults([]);
    inputRef.current?.focus();
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      marketstack: { label: 'Marketstack', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
      yahoo: { label: 'Yahoo Finance', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      alphavantage: { label: 'Alpha Vantage', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      local: { label: 'Local DB', className: 'bg-green-500/10 text-green-400 border-green-500/20' }
    };
    const badge = badges[source as keyof typeof badges] || badges.local;
    return <Badge variant="outline" className={cn('text-xs', badge.className)}>{badge.label}</Badge>;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full h-12 px-4 pr-20 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
              type="button"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-1 hover:bg-gray-100 rounded"
            type="button"
          >
            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-[400px] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-300">Searching...</span>
            </div>
          ) : results.length === 0 && searchQuery.length >= 2 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-300">No companies found</p>
              <p className="text-xs text-gray-400 mt-1">Press Enter to use "{searchQuery.trim().toUpperCase()}" anyway</p>
              {searchQuery.trim() && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                  onClick={() => {
                    const trimmedValue = searchQuery.trim().toUpperCase();
                    onChange(trimmedValue);
                    setOpen(false);
                  }}
                >
                  Use "{searchQuery.trim().toUpperCase()}"
                </Button>
              )}
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-300">Start typing to search</p>
              <p className="text-xs text-gray-400 mt-1">Or type a ticker and press Enter</p>
            </div>
          ) : (
            <div className="py-1">
              {results.map((company, index) => {
                const uniqueKey = `${index}-${company.symbol}-${company.exchange}-${company.source}`;
                const isSelected = selectedCompany?.symbol === company.symbol && 
                                  selectedCompany?.exchange === company.exchange;
                const isHighlighted = highlightedIndex === index;
                
                return (
                  <div
                    key={uniqueKey}
                    onClick={() => {
                      console.log('🎯 CLICKED:', company.symbol, company.exchange);
                      handleSelect(company);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                      isHighlighted ? "bg-gray-800" : "hover:bg-gray-800",
                      "text-white"
                    )}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0 text-white',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{company.symbol}</span>
                        {getSourceBadge(company.source)}
                      </div>
                      <span className="text-sm text-gray-300 truncate">{company.name}</span>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {company.exchange}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {company.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {company.sector}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
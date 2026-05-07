import React from 'react';
import { useGlobalState, TimeWindow } from '@/store/globalState';
import { ModeNavigation } from './ModeNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Download, 
  Save, 
  Star, 
  Settings, 
  Search 
} from 'lucide-react';

/**
 * TopBar Component
 * Persistent global navigation bar across all modes
 * Implements specification Part 1.2 - Global UI Framework
 */

const timeWindows: Array<{ value: TimeWindow; label: string }> = [
  { value: '7D', label: '7 Days' },
  { value: '30D', label: '30 Days' },
  { value: '90D', label: '90 Days' },
  { value: '12M', label: '12 Months' },
];

export const TopBar: React.FC = () => {
  const { 
    time_window, 
    setTimeWindow,
    selected,
    setSelectedCompany,
    setSelectedCountry,
  } = useGlobalState();

  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search logic will be implemented in later phases
    console.log('Search:', searchQuery);
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-lg font-bold text-lg">
              CG
            </div>
            <span className="hidden md:inline font-semibold text-lg">CO-GRI</span>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search: Country | Company | Sector | Portfolio"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
        </div>

        {/* Mode Navigation */}
        <div className="flex items-center gap-4">
          <ModeNavigation />

          {/* Time Window Selector */}
          <Select value={time_window} onValueChange={(value) => setTimeWindow(value as TimeWindow)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeWindows.map((window) => (
                <SelectItem key={window.value} value={window.value}>
                  {window.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Export">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Save">
              <Save className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Watchlist">
              <Star className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
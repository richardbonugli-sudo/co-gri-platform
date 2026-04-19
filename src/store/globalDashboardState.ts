/**
 * Global Dashboard State Management
 * Zustand store for managing unified workspace state across all modes
 * Phase 1: Foundation - Global State Management
 * UPDATED: Extended TimeWindow to include 3Y, 5Y, 10Y for full chart support
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Mode types
export type PlatformMode = 'Country' | 'Company' | 'Forecast' | 'Scenario' | 'Trading';

// Entity types
export type EntityType = 'country' | 'company' | 'sector' | 'portfolio';

// Time window options - extended to support historical analysis
export type TimeWindow = '7D' | '30D' | '90D' | '12M' | '3Y' | '5Y' | '10Y';

// View state
export type ViewState = 'global' | 'focused';

// Entity selection
export interface SelectedEntity {
  type: EntityType;
  name: string;
  metadata?: Record<string, any>;
}

// Global Dashboard State
export interface GlobalDashboardState {
  // Active mode
  activeMode: PlatformMode;
  setActiveMode: (mode: PlatformMode) => void;

  // Selected entity (country/company/sector/portfolio)
  selectedEntity: SelectedEntity | null;
  setSelectedEntity: (entity: SelectedEntity | null) => void;

  // Time window
  timeWindow: TimeWindow;
  setTimeWindow: (window: TimeWindow) => void;

  // View state (global vs focused)
  viewState: ViewState;
  setViewState: (state: ViewState) => void;

  // Search query
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Watchlist
  watchlist: string[];
  addToWatchlist: (item: string) => void;
  removeFromWatchlist: (item: string) => void;

  // Clear selection
  clearSelection: () => void;

  // Reset to defaults
  reset: () => void;
}

// Default state
const defaultState = {
  activeMode: 'Country' as PlatformMode,
  selectedEntity: null,
  timeWindow: '30D' as TimeWindow,
  viewState: 'global' as ViewState,
  searchQuery: '',
  watchlist: [],
};

// Create the store with persistence
export const useGlobalDashboardStore = create<GlobalDashboardState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setActiveMode: (mode) => set({ activeMode: mode }),

      setSelectedEntity: (entity) => {
        set({ 
          selectedEntity: entity,
          viewState: entity ? 'focused' : 'global'
        });
      },

      setTimeWindow: (window) => set({ timeWindow: window }),

      setViewState: (state) => set({ viewState: state }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      addToWatchlist: (item) => {
        const { watchlist } = get();
        if (!watchlist.includes(item)) {
          set({ watchlist: [...watchlist, item] });
        }
      },

      removeFromWatchlist: (item) => {
        const { watchlist } = get();
        set({ watchlist: watchlist.filter(i => i !== item) });
      },

      clearSelection: () => {
        set({ 
          selectedEntity: null,
          viewState: 'global',
          searchQuery: ''
        });
      },

      reset: () => set(defaultState),
    }),
    {
      name: 'cogri-global-dashboard-state',
      partialize: (state) => ({
        activeMode: state.activeMode,
        timeWindow: state.timeWindow,
        watchlist: state.watchlist,
      }),
    }
  )
);

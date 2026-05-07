/**
 * Global State Management - Unified Framework
 * Centralized state for the CO-GRI Platform with 5 operational modes
 * Part of CO-GRI Platform Phase 3 - Week 6
 * 
 * Implements Part 1.2: Unified Dashboard Specification
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimelineEvent } from '@/utils/timelineEvents';

// ============================================================================
// TYPE DEFINITIONS - Part 1.2 Specification
// ============================================================================

/**
 * Five operational modes of the platform
 */
export type Mode = 'Country' | 'Company' | 'Forecast' | 'Scenario' | 'Trading';

/**
 * Company Mode analytical lenses
 */
export type CompanyLens = 'Structural' | 'Forecast Overlay' | 'Scenario Shock' | 'Trading Signal';

/**
 * Time window options
 */
export type TimeWindow = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'All';

/**
 * Bottom row view options (Company Mode)
 */
export type BottomRowView = 'attribution' | 'timeline';

/**
 * Selected entity across all modes
 * Supports cross-mode navigation and context prefill
 */
export interface SelectedEntity {
  country: string | null;      // Country Mode selection
  company: string | null;       // Company Mode selection (ticker)
  sector: string | null;        // Sector analysis
  portfolio: string | null;     // Portfolio analysis
}

/**
 * User preferences (persisted to localStorage)
 */
export interface UserPreferences {
  defaultMode: Mode;
  defaultCompanyLens: CompanyLens;
  defaultTimeWindow: TimeWindow;
  defaultBottomRowView: BottomRowView;
}

// ============================================================================
// GLOBAL STATE INTERFACE
// ============================================================================

export interface GlobalState {
  // ========== UNIFIED FRAMEWORK STATE (Week 6) ==========
  
  /**
   * Active operational mode
   * Controls which mode page is displayed
   */
  active_mode: Mode;
  
  /**
   * Selected entity across all modes
   * Enables cross-mode navigation with context
   */
  selected: SelectedEntity;
  
  /**
   * Time window for temporal analysis
   * Shared across all modes
   */
  time_window: TimeWindow;
  
  // ========== COMPANY MODE STATE (Weeks 1-5) ==========
  
  /**
   * Active analytical lens in Company Mode
   */
  active_company_lens: CompanyLens;
  
  /**
   * C3-C8 Interactive State
   * Countries highlighted on Risk Contribution Map
   */
  highlightedCountries: string[];
  
  /**
   * Selected timeline event (C8)
   */
  selectedEvent: TimelineEvent | null;
  
  /**
   * Bottom row layout toggle (C7 vs C8+C9)
   */
  bottomRowView: BottomRowView;
  
  // ========== UI STATE ==========
  
  /**
   * Loading state for async operations
   */
  isLoading: boolean;
  
  /**
   * Verification drawer open state
   */
  verification_drawer_open: boolean;
  
  // ========== USER PREFERENCES ==========
  
  /**
   * User preferences (persisted to localStorage)
   */
  preferences: UserPreferences;
  
  // ========== ACTIONS - UNIFIED FRAMEWORK ==========
  
  /**
   * Set active operational mode
   */
  setActiveMode: (mode: Mode) => void;
  
  /**
   * Set time window
   */
  setTimeWindow: (window: TimeWindow) => void;
  
  /**
   * Set selected country
   */
  setSelectedCountry: (country: string | null) => void;
  
  /**
   * Set selected company (ticker)
   */
  setSelectedCompany: (company: string | null) => void;
  
  /**
   * Set selected sector
   */
  setSelectedSector: (sector: string | null) => void;
  
  /**
   * Set selected portfolio
   */
  setSelectedPortfolio: (portfolio: string | null) => void;
  
  /**
   * Clear all selections
   */
  clearSelection: () => void;
  
  // ========== ACTIONS - COMPANY MODE ==========
  
  /**
   * Set active Company Mode lens
   */
  setActiveCompanyLens: (lens: CompanyLens) => void;
  
  /**
   * Set highlighted countries (C3-C8 interaction)
   */
  setHighlightedCountries: (countries: string[]) => void;
  
  /**
   * Set selected timeline event (C8)
   */
  setSelectedEvent: (event: TimelineEvent | null) => void;
  
  /**
   * Clear highlights and selected event
   */
  clearHighlights: () => void;
  
  /**
   * Set bottom row view (attribution vs timeline)
   */
  setBottomRowView: (view: BottomRowView) => void;
  
  // ========== ACTIONS - UI STATE ==========
  
  /**
   * Set loading state
   */
  setIsLoading: (loading: boolean) => void;
  
  /**
   * Set verification drawer open state
   */
  setVerificationDrawerOpen: (open: boolean) => void;
  
  /**
   * Update user preferences
   */
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

// ============================================================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================================================

export const useGlobalState = create<GlobalState>()(
  persist(
    (set) => ({
      // ========== INITIAL STATE ==========
      
      // Unified Framework
      active_mode: 'Company',
      selected: {
        country: null,
        company: null,
        sector: null,
        portfolio: null
      },
      time_window: '1Y',
      
      // Company Mode
      active_company_lens: 'Structural',
      highlightedCountries: [],
      selectedEvent: null,
      bottomRowView: 'attribution',
      
      // UI State
      isLoading: false,
      verification_drawer_open: false,
      
      // User Preferences
      preferences: {
        defaultMode: 'Company',
        defaultCompanyLens: 'Structural',
        defaultTimeWindow: '1Y',
        defaultBottomRowView: 'attribution'
      },
      
      // ========== ACTIONS - UNIFIED FRAMEWORK ==========
      
      setActiveMode: (mode) => set({ active_mode: mode }),
      
      setTimeWindow: (window) => set({ time_window: window }),
      
      setSelectedCountry: (country) =>
        set((state) => ({
          selected: { ...state.selected, country }
        })),
      
      setSelectedCompany: (company) =>
        set((state) => ({
          selected: { ...state.selected, company }
        })),
      
      setSelectedSector: (sector) =>
        set((state) => ({
          selected: { ...state.selected, sector }
        })),
      
      setSelectedPortfolio: (portfolio) =>
        set((state) => ({
          selected: { ...state.selected, portfolio }
        })),
      
      clearSelection: () =>
        set({
          selected: {
            country: null,
            company: null,
            sector: null,
            portfolio: null
          }
        }),
      
      // ========== ACTIONS - COMPANY MODE ==========
      
      setActiveCompanyLens: (lens) => set({ active_company_lens: lens }),
      
      setHighlightedCountries: (countries) => set({ highlightedCountries: countries }),
      
      setSelectedEvent: (event) => set({ selectedEvent: event }),
      
      clearHighlights: () => set({ highlightedCountries: [], selectedEvent: null }),
      
      setBottomRowView: (view) => set({ bottomRowView: view }),
      
      // ========== ACTIONS - UI STATE ==========
      
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      setVerificationDrawerOpen: (open) => set({ verification_drawer_open: open }),
      
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs }
        }))
    }),
    {
      name: 'cogri-global-state',
      partialize: (state) => ({
        active_mode: state.active_mode,
        selected: state.selected,
        time_window: state.time_window,
        active_company_lens: state.active_company_lens,
        preferences: state.preferences
      })
    }
  )
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get mode display name
 */
export function getModeDisplayName(mode: Mode): string {
  const names: Record<Mode, string> = {
    'Country': 'Country Mode',
    'Company': 'Company Mode',
    'Forecast': 'Forecast Mode',
    'Scenario': 'Scenario Mode',
    'Trading': 'Trading Mode'
  };
  return names[mode];
}

/**
 * Get mode description
 */
export function getModeDescription(mode: Mode): string {
  const descriptions: Record<Mode, string> = {
    'Country': 'Analyze country-level geopolitical risk profiles',
    'Company': 'Assess company-level geopolitical risk exposure',
    'Forecast': 'Forward-looking risk projections and event analysis',
    'Scenario': 'Custom scenario modeling and stress testing',
    'Trading': 'Investment decision support and portfolio optimization'
  };
  return descriptions[mode];
}

/**
 * Get mode route path
 */
export function getModeRoute(mode: Mode): string {
  const routes: Record<Mode, string> = {
    'Country': '/country',
    'Company': '/company',
    'Forecast': '/forecast',
    'Scenario': '/scenario',
    'Trading': '/trading'
  };
  return routes[mode];
}
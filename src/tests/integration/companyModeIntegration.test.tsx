/**
 * Company Mode Integration Tests
 * Tests cross-component interactions and state management
 * Part of CO-GRI Platform Phase 2 - Week 5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlobalState } from '@/store/globalState';
import { TimelineEvent } from '@/utils/timelineEvents';

describe('Company Mode Integration Tests', () => {
  beforeEach(() => {
    // Reset global state before each test
    const { result } = renderHook(() => useGlobalState());
    act(() => {
      result.current.clearHighlights();
      result.current.setActiveLens('Structural');
      result.current.setBottomRowView('attribution');
    });
  });

  describe('Global State Management', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useGlobalState());
      
      expect(result.current.active_lens).toBe('Structural');
      expect(result.current.time_window).toBe('1Y');
      expect(result.current.highlightedCountries).toEqual([]);
      expect(result.current.selectedEvent).toBeNull();
      expect(result.current.bottomRowView).toBe('attribution');
    });

    it('should update active lens', () => {
      const { result } = renderHook(() => useGlobalState());
      
      act(() => {
        result.current.setActiveLens('Forecast Overlay');
      });
      
      expect(result.current.active_lens).toBe('Forecast Overlay');
    });

    it('should update time window', () => {
      const { result } = renderHook(() => useGlobalState());
      
      act(() => {
        result.current.setTimeWindow('6M');
      });
      
      expect(result.current.time_window).toBe('6M');
    });

    it('should update bottom row view', () => {
      const { result } = renderHook(() => useGlobalState());
      
      act(() => {
        result.current.setBottomRowView('timeline');
      });
      
      expect(result.current.bottomRowView).toBe('timeline');
    });
  });

  describe('C3-C8 Interactive State', () => {
    it('should set highlighted countries', () => {
      const { result } = renderHook(() => useGlobalState());
      
      act(() => {
        result.current.setHighlightedCountries(['China', 'Taiwan']);
      });
      
      expect(result.current.highlightedCountries).toEqual(['China', 'Taiwan']);
    });

    it('should set selected event', () => {
      const { result } = renderHook(() => useGlobalState());
      
      const mockEvent: TimelineEvent = {
        event_id: 'E1',
        date: new Date('2024-01-15'),
        title: 'Test Event',
        description: 'Test description',
        event_type: 'Historical',
        impact_level: 'High',
        affected_countries: ['China', 'Taiwan'],
        affected_channels: ['Supply Chain']
      };
      
      act(() => {
        result.current.setSelectedEvent(mockEvent);
      });
      
      expect(result.current.selectedEvent).toEqual(mockEvent);
      expect(result.current.selectedEvent?.event_id).toBe('E1');
    });

    it('should clear highlights and selected event', () => {
      const { result } = renderHook(() => useGlobalState());
      
      const mockEvent: TimelineEvent = {
        event_id: 'E1',
        date: new Date('2024-01-15'),
        title: 'Test Event',
        description: 'Test description',
        event_type: 'Historical',
        impact_level: 'High',
        affected_countries: ['China'],
        affected_channels: ['Supply Chain']
      };
      
      act(() => {
        result.current.setHighlightedCountries(['China', 'Taiwan']);
        result.current.setSelectedEvent(mockEvent);
      });
      
      expect(result.current.highlightedCountries).toHaveLength(2);
      expect(result.current.selectedEvent).not.toBeNull();
      
      act(() => {
        result.current.clearHighlights();
      });
      
      expect(result.current.highlightedCountries).toEqual([]);
      expect(result.current.selectedEvent).toBeNull();
    });
  });

  describe('C3-C8 Interaction Flow', () => {
    it('should simulate timeline event click → map highlight', () => {
      const { result } = renderHook(() => useGlobalState());
      
      const timelineEvent: TimelineEvent = {
        event_id: 'E1',
        date: new Date('2024-01-15'),
        title: 'Supply Chain Disruption',
        description: 'Major disruption in Asia',
        event_type: 'Historical',
        impact_level: 'High',
        affected_countries: ['China', 'Taiwan', 'S. Korea'],
        affected_channels: ['Supply Chain', 'Revenue']
      };
      
      // Simulate clicking event in C8
      act(() => {
        result.current.setHighlightedCountries(timelineEvent.affected_countries);
        result.current.setSelectedEvent(timelineEvent);
      });
      
      // Verify C3 map should highlight these countries
      expect(result.current.highlightedCountries).toEqual(['China', 'Taiwan', 'S. Korea']);
      expect(result.current.selectedEvent?.title).toBe('Supply Chain Disruption');
    });

    it('should simulate map country click → timeline filter', () => {
      const { result } = renderHook(() => useGlobalState());
      
      // Simulate clicking China on C3 map
      act(() => {
        result.current.setHighlightedCountries(['China']);
      });
      
      // Verify C8 timeline should filter to show China-related events
      expect(result.current.highlightedCountries).toEqual(['China']);
    });

    it('should clear highlights when switching views', () => {
      const { result } = renderHook(() => useGlobalState());
      
      act(() => {
        result.current.setHighlightedCountries(['China', 'Taiwan']);
        result.current.setBottomRowView('timeline');
      });
      
      expect(result.current.highlightedCountries).toHaveLength(2);
      expect(result.current.bottomRowView).toBe('timeline');
      
      // User clears highlights
      act(() => {
        result.current.clearHighlights();
      });
      
      expect(result.current.highlightedCountries).toEqual([]);
    });
  });

  describe('Lens Switching', () => {
    it('should maintain highlighted countries when switching lenses', () => {
      const { result } = renderHook(() => useGlobalState());
      
      act(() => {
        result.current.setHighlightedCountries(['China', 'Taiwan']);
        result.current.setActiveLens('Structural');
      });
      
      expect(result.current.highlightedCountries).toHaveLength(2);
      
      act(() => {
        result.current.setActiveLens('Forecast Overlay');
      });
      
      // Highlights should persist across lens changes
      expect(result.current.highlightedCountries).toHaveLength(2);
      expect(result.current.active_lens).toBe('Forecast Overlay');
    });

    it('should update content based on active lens', () => {
      const { result } = renderHook(() => useGlobalState());
      
      const lenses: Array<typeof result.current.active_lens> = [
        'Structural',
        'Forecast Overlay',
        'Scenario Shock',
        'Trading Signal'
      ];
      
      lenses.forEach(lens => {
        act(() => {
          result.current.setActiveLens(lens);
        });
        
        expect(result.current.active_lens).toBe(lens);
      });
    });
  });

  describe('User Preferences Persistence', () => {
    it('should update user preferences', () => {
      const { result } = renderHook(() => useGlobalState());
      
      act(() => {
        result.current.updatePreferences({
          defaultLens: 'Forecast Overlay',
          defaultTimeWindow: '6M',
          defaultBottomRowView: 'timeline'
        });
      });
      
      expect(result.current.preferences.defaultLens).toBe('Forecast Overlay');
      expect(result.current.preferences.defaultTimeWindow).toBe('6M');
      expect(result.current.preferences.defaultBottomRowView).toBe('timeline');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle rapid state updates', () => {
      const { result } = renderHook(() => useGlobalState());
      
      // Simulate rapid clicks
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.setHighlightedCountries([`Country${i}`]);
        }
      });
      
      // Should only have the last update
      expect(result.current.highlightedCountries).toEqual(['Country9']);
    });

    it('should handle multiple simultaneous state updates', () => {
      const { result } = renderHook(() => useGlobalState());
      
      act(() => {
        result.current.setActiveLens('Forecast Overlay');
        result.current.setTimeWindow('3M');
        result.current.setHighlightedCountries(['China', 'Taiwan']);
        result.current.setBottomRowView('timeline');
      });
      
      expect(result.current.active_lens).toBe('Forecast Overlay');
      expect(result.current.time_window).toBe('3M');
      expect(result.current.highlightedCountries).toHaveLength(2);
      expect(result.current.bottomRowView).toBe('timeline');
    });
  });
});
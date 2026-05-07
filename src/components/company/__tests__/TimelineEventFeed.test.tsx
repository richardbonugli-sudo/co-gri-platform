/**
 * Unit Tests for TimelineEventFeed Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TimelineEventFeed, { GeopoliticalEvent } from '../TimelineEventFeed';

const mockEvents: GeopoliticalEvent[] = [
  {
    id: '1',
    date: new Date(2024, 2, 1).toISOString(),
    title: 'US-China Trade Tensions',
    description: 'New tariffs announced on semiconductor imports.',
    eventType: 'Trade Embargo',
    impactSeverity: 'High',
    affectedCountries: ['China', 'Taiwan'],
    actorCountry: 'United States',
    cogriImpact: 3.2,
    source: 'Reuters'
  },
  {
    id: '2',
    date: new Date(2024, 1, 15).toISOString(),
    title: 'Russia Sanctions Extended',
    description: 'EU extends sanctions on Russian energy sector.',
    eventType: 'Sanctions',
    impactSeverity: 'Medium',
    affectedCountries: ['Russia', 'Germany'],
    actorCountry: 'European Union',
    cogriImpact: 1.8,
    source: 'Financial Times'
  },
  {
    id: '3',
    date: new Date(2024, 0, 10).toISOString(),
    title: 'Middle East Conflict',
    description: 'Regional tensions affect oil supply routes.',
    eventType: 'Conflict',
    impactSeverity: 'Critical',
    affectedCountries: ['Israel', 'Iran', 'Saudi Arabia'],
    cogriImpact: 5.4,
    source: 'Bloomberg'
  }
];

describe('TimelineEventFeed', () => {
  it('should render component with title', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    expect(screen.getByText('Timeline / Event Feed')).toBeInTheDocument();
    expect(screen.getByText(/Geopolitical events affecting Apple Inc./)).toBeInTheDocument();
  });

  it('should display all events', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    expect(screen.getByText('US-China Trade Tensions')).toBeInTheDocument();
    expect(screen.getByText('Russia Sanctions Extended')).toBeInTheDocument();
    expect(screen.getByText('Middle East Conflict')).toBeInTheDocument();
  });

  it('should display event count', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    expect(screen.getByText('Showing 3 of 3 events')).toBeInTheDocument();
  });

  it('should display severity badges', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('should expand event on click', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    // Find the event title and get its parent button
    const eventTitle = screen.getByText('US-China Trade Tensions');
    const eventCard = eventTitle.closest('button') || eventTitle.parentElement?.closest('button');
    expect(eventCard).toBeInTheDocument();
    
    // Click to expand
    if (eventCard) {
      fireEvent.click(eventCard);
    }
    
    // Now description should be in the document (may be visible or in expanded state)
    expect(screen.getByText('New tariffs announced on semiconductor imports.')).toBeInTheDocument();
  });

  it('should display affected countries when expanded', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    const eventTitle = screen.getByText('US-China Trade Tensions');
    const eventCard = eventTitle.closest('button') || eventTitle.parentElement?.closest('button');
    if (eventCard) {
      fireEvent.click(eventCard);
    }
    
    expect(screen.getAllByText('China').length).toBeGreaterThan(0);
    expect(screen.getByText('Taiwan')).toBeInTheDocument();
  });

  it('should display CO-GRI impact when expanded', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    const eventTitle = screen.getByText('US-China Trade Tensions');
    const eventCard = eventTitle.closest('button') || eventTitle.parentElement?.closest('button');
    if (eventCard) {
      fireEvent.click(eventCard);
    }
    
    expect(screen.getByText('+3.2')).toBeInTheDocument();
  });

  it('should display actor country when expanded', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    const eventTitle = screen.getByText('US-China Trade Tensions');
    const eventCard = eventTitle.closest('button') || eventTitle.parentElement?.closest('button');
    if (eventCard) {
      fireEvent.click(eventCard);
    }
    
    expect(screen.getAllByText('United States').length).toBeGreaterThan(0);
  });

  it('should filter by event type', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    // Open event type filter
    const eventTypeFilter = screen.getAllByRole('combobox')[0];
    fireEvent.click(eventTypeFilter);
    
    // Select "Sanctions"
    const sanctionsOption = screen.getByText('Sanctions');
    fireEvent.click(sanctionsOption);
    
    // Should show only sanctions event
    expect(screen.getByText('Russia Sanctions Extended')).toBeInTheDocument();
    expect(screen.queryByText('US-China Trade Tensions')).not.toBeInTheDocument();
    expect(screen.queryByText('Middle East Conflict')).not.toBeInTheDocument();
    
    expect(screen.getByText('Showing 1 of 3 events')).toBeInTheDocument();
  });

  it('should filter by severity', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    // Open severity filter
    const severityFilter = screen.getAllByRole('combobox')[1];
    fireEvent.click(severityFilter);
    
    // Select "Critical"
    const criticalOption = screen.getByText('Critical');
    fireEvent.click(criticalOption);
    
    // Should show only critical event
    expect(screen.getByText('Middle East Conflict')).toBeInTheDocument();
    expect(screen.queryByText('US-China Trade Tensions')).not.toBeInTheDocument();
    expect(screen.queryByText('Russia Sanctions Extended')).not.toBeInTheDocument();
  });

  it('should expand all events', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    const expandAllButton = screen.getByRole('button', { name: /Expand All/i });
    fireEvent.click(expandAllButton);
    
    // All descriptions should be visible
    expect(screen.getByText('New tariffs announced on semiconductor imports.')).toBeVisible();
    expect(screen.getByText('EU extends sanctions on Russian energy sector.')).toBeVisible();
    expect(screen.getByText('Regional tensions affect oil supply routes.')).toBeVisible();
  });

  it('should collapse all events', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    // First expand all
    const expandAllButton = screen.getByRole('button', { name: /Expand All/i });
    fireEvent.click(expandAllButton);
    
    // Then collapse all
    const collapseAllButton = screen.getByRole('button', { name: /Collapse All/i });
    fireEvent.click(collapseAllButton);
    
    // All descriptions should not be visible
    expect(screen.queryByText('New tariffs announced on semiconductor imports.')).not.toBeVisible();
    expect(screen.queryByText('EU extends sanctions on Russian energy sector.')).not.toBeVisible();
    expect(screen.queryByText('Regional tensions affect oil supply routes.')).not.toBeVisible();
  });

  it('should show loading state', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        isLoading={true}
      />
    );
    expect(screen.getByText('Loading events...')).toBeInTheDocument();
  });

  it('should show empty state when no events match filters', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={[]}
      />
    );
    expect(screen.getByText('No events found matching the selected filters')).toBeInTheDocument();
  });

  it('should clear all filters', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    // Apply filters
    const eventTypeFilter = screen.getAllByRole('combobox')[0];
    fireEvent.click(eventTypeFilter);
    fireEvent.click(screen.getByText('Sanctions'));
    
    // Should show Clear Filters button
    const clearButton = screen.getByRole('button', { name: /Clear Filters/i });
    expect(clearButton).toBeInTheDocument();
    
    // Click clear
    fireEvent.click(clearButton);
    
    // Should show all events again
    expect(screen.getByText('Showing 3 of 3 events')).toBeInTheDocument();
  });

  it('should generate mock events when none provided', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
      />
    );
    
    // Should have some events displayed
    const eventCountText = screen.getByText(/Showing \d+ of \d+ events/);
    expect(eventCountText).toBeInTheDocument();
  });

  it('should apply correct severity colors', () => {
    const { container } = render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    // Check for severity badge colors
    const criticalBadge = screen.getByText('Critical').closest('.bg-red-100');
    expect(criticalBadge).toBeInTheDocument();
    
    const highBadge = screen.getByText('High').closest('.bg-orange-100');
    expect(highBadge).toBeInTheDocument();
    
    const mediumBadge = screen.getByText('Medium').closest('.bg-yellow-100');
    expect(mediumBadge).toBeInTheDocument();
  });

  it('should display event source', () => {
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    const eventTitle = screen.getByText('US-China Trade Tensions');
    const eventCard = eventTitle.closest('button') || eventTitle.parentElement?.closest('button');
    if (eventCard) {
      fireEvent.click(eventCard);
    }
    
    expect(screen.getByText(/Source: Reuters/)).toBeInTheDocument();
  });

  it('should handle export timeline', () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock createElement and click
    const mockClick = vi.fn();
    const mockAnchor = { click: mockClick, href: '', download: '' };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    
    render(
      <TimelineEventFeed
        companyTicker="AAPL"
        companyName="Apple Inc."
        events={mockEvents}
      />
    );
    
    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);
    
    expect(mockClick).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
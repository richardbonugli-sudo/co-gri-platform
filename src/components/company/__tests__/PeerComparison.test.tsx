/**
 * Unit Tests for PeerComparison Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PeerComparison from '../PeerComparison';

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/company-mode', vi.fn()]
}));

const mockCurrentCompany = {
  ticker: 'AAPL',
  name: 'Apple Inc.',
  sector: 'Technology',
  cogriScore: 62.4,
  riskLevel: 'High Risk'
};

const mockPeers = [
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    cogriScore: 58.3,
    riskLevel: 'High Risk' as const,
    trend: 'down' as const,
    trendChange: -2.5,
    country: 'United States'
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Technology',
    cogriScore: 54.7,
    riskLevel: 'High Risk' as const,
    trend: 'stable' as const,
    trendChange: 0,
    country: 'United States'
  },
  {
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    sector: 'Technology',
    cogriScore: 61.2,
    riskLevel: 'Very High Risk' as const,
    trend: 'up' as const,
    trendChange: 3.8,
    country: 'United States'
  }
];

describe('PeerComparison', () => {
  it('should render component with title', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} peers={mockPeers} />);
    expect(screen.getByText('Peer Comparison')).toBeInTheDocument();
  });

  it('should display current company with "Current" badge', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} peers={mockPeers} />);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('62.4')).toBeInTheDocument();
  });

  it('should display all peer companies', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} peers={mockPeers} />);
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
    expect(screen.getByText('GOOGL')).toBeInTheDocument();
    expect(screen.getByText('Alphabet Inc.')).toBeInTheDocument();
    expect(screen.getByText('META')).toBeInTheDocument();
    expect(screen.getByText('Meta Platforms Inc.')).toBeInTheDocument();
  });

  it('should display CO-GRI scores for peers', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} peers={mockPeers} />);
    expect(screen.getByText('58.3')).toBeInTheDocument();
    expect(screen.getAllByText('54.7').length).toBeGreaterThan(0); // May appear multiple times
    expect(screen.getByText('61.2')).toBeInTheDocument();
  });

  it('should display risk levels for peers', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} peers={mockPeers} />);
    const highRiskBadges = screen.getAllByText('High Risk');
    expect(highRiskBadges.length).toBeGreaterThan(0);
    expect(screen.getByText('Very High Risk')).toBeInTheDocument();
  });

  it('should display trend indicators', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} peers={mockPeers} />);
    expect(screen.getByText('-2.5%')).toBeInTheDocument();
    expect(screen.getByText('Stable')).toBeInTheDocument();
    expect(screen.getByText('+3.8%')).toBeInTheDocument();
  });

  it('should sort by CO-GRI score by default (descending)', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} peers={mockPeers} />);
    const rows = screen.getAllByRole('row');
    // Skip header row (index 0) and current company row
    const firstPeerRow = rows[2]; // First peer row after header
    expect(firstPeerRow).toHaveTextContent('META'); // Highest score (61.2)
  });

  it('should allow sorting by company name', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} peers={mockPeers} />);
    const companyHeader = screen.getByRole('button', { name: /Company/i });
    fireEvent.click(companyHeader);
    
    const rows = screen.getAllByRole('row');
    const firstPeerRow = rows[2];
    expect(firstPeerRow).toHaveTextContent('GOOGL'); // Alphabetically first
  });

  it('should display summary statistics', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} peers={mockPeers} />);
    expect(screen.getByText('Avg CO-GRI')).toBeInTheDocument();
    expect(screen.getByText('Lowest')).toBeInTheDocument();
    expect(screen.getByText('Highest')).toBeInTheDocument();
    
    // Check calculated values
    const avgScore = (58.3 + 54.7 + 61.2) / 3;
    expect(screen.getByText(avgScore.toFixed(1))).toBeInTheDocument();
    expect(screen.getByText('54.7')).toBeInTheDocument(); // Lowest
    expect(screen.getByText('61.2')).toBeInTheDocument(); // Highest
  });

  it('should show loading state', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} isLoading={true} />);
    expect(screen.getByText('Loading peer companies...')).toBeInTheDocument();
  });

  it('should show empty state when no peers', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} peers={[]} />);
    expect(screen.getByText('No peer companies found')).toBeInTheDocument();
  });

  it('should apply correct risk level colors', () => {
    const { container } = render(<PeerComparison currentCompany={mockCurrentCompany} peers={mockPeers} />);
    
    // Check for risk level badge colors
    const veryHighRiskBadge = screen.getByText('Very High Risk').closest('.bg-red-100');
    expect(veryHighRiskBadge).toBeInTheDocument();
    
    const highRiskBadges = screen.getAllByText('High Risk');
    highRiskBadges.forEach(badge => {
      const parent = badge.closest('.bg-orange-100');
      expect(parent).toBeInTheDocument();
    });
  });

  it('should generate mock peers when none provided', () => {
    render(<PeerComparison currentCompany={mockCurrentCompany} />);
    
    // Should have at least some peer rows
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(2); // Header + current company + at least 1 peer
  });

  it('should filter peers by sector', () => {
    const mixedPeers = [
      ...mockPeers,
      {
        ticker: 'JPM',
        name: 'JPMorgan Chase',
        sector: 'Financial Services',
        cogriScore: 45.0,
        riskLevel: 'Moderate Risk' as const,
        trend: 'stable' as const,
        trendChange: 0,
        country: 'United States'
      }
    ];

    render(<PeerComparison currentCompany={mockCurrentCompany} peers={mixedPeers} />);
    
    // Initially should show all peers
    expect(screen.getByText('JPM')).toBeInTheDocument();
    
    // Filter by Technology sector
    const sectorFilter = screen.getByRole('combobox');
    fireEvent.click(sectorFilter);
    
    const technologyOption = screen.getByText('Technology');
    fireEvent.click(technologyOption);
    
    // JPM should be filtered out
    expect(screen.queryByText('JPM')).not.toBeInTheDocument();
  });
});
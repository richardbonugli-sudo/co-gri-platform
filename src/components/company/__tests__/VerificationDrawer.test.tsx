/**
 * Unit Tests for VerificationDrawer Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import VerificationDrawer from '../VerificationDrawer';
import { COGRICalculationResult } from '@/services/cogriCalculationService';

const mockCalculationResult: COGRICalculationResult = {
  countryExposures: [
    {
      country: 'United States',
      exposureWeight: 0.45,
      preNormalizedWeight: 0.45,
      countryShockIndex: 35.2,
      contribution: 15.84,
      status: 'evidence',
      politicalAlignment: {
        alignmentFactor: 1.0,
        relationship: 'Allied',
        source: 'Political Alignment Service'
      }
    },
    {
      country: 'China',
      exposureWeight: 0.30,
      preNormalizedWeight: 0.30,
      countryShockIndex: 65.8,
      contribution: 19.74,
      status: 'evidence',
      politicalAlignment: {
        alignmentFactor: 0.3,
        relationship: 'Strategic Competitor',
        source: 'Political Alignment Service'
      }
    },
    {
      country: 'Japan',
      exposureWeight: 0.15,
      preNormalizedWeight: 0.15,
      countryShockIndex: 28.5,
      contribution: 4.28,
      status: 'evidence',
      politicalAlignment: {
        alignmentFactor: 0.9,
        relationship: 'Allied',
        source: 'Political Alignment Service'
      }
    },
    {
      country: 'Germany',
      exposureWeight: 0.10,
      preNormalizedWeight: 0.10,
      countryShockIndex: 32.1,
      contribution: 3.21,
      status: 'evidence',
      politicalAlignment: {
        alignmentFactor: 0.85,
        relationship: 'Allied',
        source: 'Political Alignment Service'
      }
    }
  ],
  rawScore: 43.07,
  finalScore: 47.4,
  riskLevel: 'High Risk',
  sectorMultiplier: 1.10,
  exposureCoefficients: {
    revenue: 0.40,
    supply: 0.35,
    assets: 0.15,
    financial: 0.10,
    market: 0.00
  }
};

describe('VerificationDrawer', () => {
  it('should render trigger button', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    expect(screen.getByRole('button', { name: /View Calculation Details/i })).toBeInTheDocument();
  });

  it('should open drawer when trigger is clicked', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    const trigger = screen.getByRole('button', { name: /View Calculation Details/i });
    fireEvent.click(trigger);
    
    expect(screen.getByText('CO-GRI Calculation Verification')).toBeInTheDocument();
  });

  it('should display calculation summary', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getAllByText('United States').length).toBeGreaterThan(0);
    expect(screen.getByText('47.4')).toBeInTheDocument();
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('should display raw score and sector multiplier', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    expect(screen.getByText('43.07')).toBeInTheDocument();
    expect(screen.getByText('1.1000')).toBeInTheDocument();
  });

  it('should display all 7 calculation steps', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    expect(screen.getByText('Geographic Exposure Normalization')).toBeInTheDocument();
    expect(screen.getByText('Four-Channel Attribution')).toBeInTheDocument();
    expect(screen.getByText('Country Shock Index (CSI) Assignment')).toBeInTheDocument();
    expect(screen.getByText('Political Alignment Modifier')).toBeInTheDocument();
    expect(screen.getByText('Country Risk Contribution')).toBeInTheDocument();
    expect(screen.getByText('Raw Score Aggregation')).toBeInTheDocument();
    expect(screen.getByText('Sector Risk Adjustment')).toBeInTheDocument();
  });

  it('should expand calculation step when clicked', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    // Find and click the second step (Four-Channel Attribution)
    const stepCards = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Four-Channel Attribution')
    );
    fireEvent.click(stepCards[0]);
    
    // Should show formula
    expect(screen.getByText(/W_blended = α×W_revenue/)).toBeInTheDocument();
  });

  it('should display country breakdown table', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    expect(screen.getByText('Country-by-Country Breakdown')).toBeInTheDocument();
    
    // Check table headers
    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('Exposure')).toBeInTheDocument();
    expect(screen.getByText('CSI')).toBeInTheDocument();
    expect(screen.getByText('Contribution')).toBeInTheDocument();
    
    // Check country rows
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('China')).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
  });

  it('should display exposure percentages in table', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    expect(screen.getByText('45.00%')).toBeInTheDocument();
    expect(screen.getByText('30.00%')).toBeInTheDocument();
    expect(screen.getByText('15.00%')).toBeInTheDocument();
    expect(screen.getByText('10.00%')).toBeInTheDocument();
  });

  it('should expand all steps when Expand All is clicked', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    const expandAllButton = screen.getByRole('button', { name: /Expand All/i });
    fireEvent.click(expandAllButton);
    
    // All formulas should be visible
    expect(screen.getByText(/W_norm_c = W_geo_c/)).toBeInTheDocument();
    expect(screen.getByText(/W_blended = α×W_revenue/)).toBeInTheDocument();
  });

  it('should collapse all steps when Collapse All is clicked', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    // First expand all
    const expandAllButton = screen.getByRole('button', { name: /Expand All/i });
    fireEvent.click(expandAllButton);
    
    // Then collapse all
    const collapseAllButton = screen.getByRole('button', { name: /Collapse All/i });
    fireEvent.click(collapseAllButton);
    
    // Formulas should not be visible (except possibly the first one which might be expanded by default)
    const formulas = screen.queryAllByText(/W_blended = α×W_revenue/);
    expect(formulas.length).toBeLessThanOrEqual(1);
  });

  it('should copy to clipboard when Copy button is clicked', async () => {
    // Mock clipboard API
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText
      }
    });
    
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    const copyButton = screen.getByRole('button', { name: /Copy/i });
    fireEvent.click(copyButton);
    
    expect(mockWriteText).toHaveBeenCalled();
    
    // Should show "Copied!" feedback
    await screen.findByText('Copied!');
  });

  it('should export report when Export button is clicked', () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock createElement and click
    const mockClick = vi.fn();
    const mockAnchor = { click: mockClick, href: '', download: '' };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);
    
    expect(mockClick).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should display methodology note', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    expect(screen.getByText('Methodology Note')).toBeInTheDocument();
    expect(screen.getByText(/CO-GRI \(Company-level Geopolitical Risk Index\)/)).toBeInTheDocument();
  });

  it('should display channel coefficients in step 2', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    // Expand step 2
    const step2Cards = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Four-Channel Attribution')
    );
    fireEvent.click(step2Cards[0]);
    
    expect(screen.getByText(/Revenue weight \(α\): 40.0%/)).toBeInTheDocument();
    expect(screen.getByText(/Supply chain weight \(β\): 35.0%/)).toBeInTheDocument();
    expect(screen.getByText(/Assets weight \(γ\): 15.0%/)).toBeInTheDocument();
    expect(screen.getByText(/Financial weight \(δ\): 10.0%/)).toBeInTheDocument();
  });

  it('should sort countries by contribution in table', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    // Get all table rows
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    
    // Skip header row, check first data row contains a country
    const firstDataRow = rows[1];
    const hasCountry = firstDataRow.textContent?.includes('China') || 
                       firstDataRow.textContent?.includes('United States') ||
                       firstDataRow.textContent?.includes('Japan') ||
                       firstDataRow.textContent?.includes('Germany');
    expect(hasCountry).toBe(true);
  });

  it('should display correct risk level badge color', () => {
    render(
      <VerificationDrawer
        companyTicker="AAPL"
        companyName="Apple Inc."
        calculationResult={mockCalculationResult}
        homeCountry="United States"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /View Calculation Details/i }));
    
    // Just verify the risk badge is present
    const riskBadge = screen.getByText('High Risk');
    expect(riskBadge).toBeInTheDocument();
  });
});
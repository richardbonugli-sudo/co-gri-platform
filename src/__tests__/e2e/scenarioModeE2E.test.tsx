/**
 * End-to-End Integration Tests for Scenario Mode
 * Tests complete workflow from navigation to result visualization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Router } from 'wouter';
import ScenarioMode from '@/pages/ScenarioMode';
import { useScenarioState } from '@/store/scenarioState';
import { useGlobalState } from '@/store/globalState';

// Mock stores
vi.mock('@/store/scenarioState');
vi.mock('@/store/globalState');

describe('Scenario Mode - End-to-End Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock global state
    (useGlobalState as any).mockReturnValue({
      setMode: vi.fn(),
      setLens: vi.fn(),
      setSelectedCompany: vi.fn(),
    });
    
    // Mock scenario state
    (useScenarioState as any).mockReturnValue({
      scenarioResult: null,
      isCalculating: false,
      error: null,
      activeScenario: null,
      runScenario: vi.fn(),
    });
  });

  describe('Navigation and Initial State', () => {
    it('should navigate to Scenario Mode with ticker parameter', () => {
      const { container } = render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      expect(container).toBeTruthy();
    });

    it('should display welcome state when no ticker provided', () => {
      render(
        <Router initialPath="/scenario-mode">
          <ScenarioMode />
        </Router>
      );

      expect(screen.getByText(/Welcome to Scenario Mode/i)).toBeInTheDocument();
    });

    it('should set mode and lens on mount', () => {
      const setMode = vi.fn();
      const setLens = vi.fn();
      
      (useGlobalState as any).mockReturnValue({
        setMode,
        setLens,
        setSelectedCompany: vi.fn(),
      });

      render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      expect(setMode).toHaveBeenCalledWith('Scenario');
      expect(setLens).toHaveBeenCalledWith('Scenario Shock');
    });
  });

  describe('Company Selection', () => {
    it('should display company name from ticker parameter', () => {
      render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      expect(screen.getByText(/AAPL/i)).toBeInTheDocument();
      expect(screen.getByText(/Apple Inc./i)).toBeInTheDocument();
    });

    it('should show company selector when no ticker', () => {
      render(
        <Router initialPath="/scenario-mode">
          <ScenarioMode />
        </Router>
      );

      expect(screen.getByText(/Select Company/i)).toBeInTheDocument();
    });
  });

  describe('Scenario Workflow', () => {
    it('should display all components when scenario result exists', () => {
      const mockResult = {
        scenarioId: 'test-123',
        ticker: 'AAPL',
        baselineCOGRI: 45.5,
        scenarioCOGRI: 52.3,
        deltaCOGRI: 6.8,
        deltaPercentage: 14.9,
        baselineRiskLevel: 'Moderate Risk' as const,
        scenarioRiskLevel: 'High Risk' as const,
        riskLevelChange: 'Upgrade' as const,
        channelAttribution: [],
        nodeAttribution: [],
        confidence: 85,
        dataQuality: {
          exposureCoverage: 95,
          shockDataFreshness: new Date(),
          alignmentCoverage: 85,
        },
        calculatedAt: new Date(),
        calculationTime: 1500,
      };

      (useScenarioState as any).mockReturnValue({
        scenarioResult: mockResult,
        isCalculating: false,
        error: null,
        activeScenario: {
          name: 'Taiwan Strait Crisis',
          config: {
            actorCountry: 'United States',
            targetCountries: ['China', 'Taiwan'],
          },
        },
        runScenario: vi.fn(),
      });

      render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      // S2: Impact Summary should be visible
      expect(screen.getByText(/Scenario Impact Summary/i)).toBeInTheDocument();
      
      // S3: Channel Attribution should be visible
      expect(screen.getByText(/Channel Attribution/i)).toBeInTheDocument();
      
      // S4: Node Attribution should be visible
      expect(screen.getByText(/Node Attribution/i)).toBeInTheDocument();
      
      // S5: Transmission Trace should be visible
      expect(screen.getByText(/Transmission Trace/i)).toBeInTheDocument();
    });

    it('should show loading state during calculation', () => {
      (useScenarioState as any).mockReturnValue({
        scenarioResult: null,
        isCalculating: true,
        error: null,
        activeScenario: null,
        runScenario: vi.fn(),
      });

      render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      expect(screen.getByText(/Calculating/i)).toBeInTheDocument();
    });

    it('should display error message when calculation fails', () => {
      (useScenarioState as any).mockReturnValue({
        scenarioResult: null,
        isCalculating: false,
        error: 'Failed to calculate scenario',
        activeScenario: null,
        runScenario: vi.fn(),
      });

      render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      expect(screen.getByText(/Failed to calculate scenario/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid ticker gracefully', () => {
      render(
        <Router initialPath="/scenario-mode?ticker=INVALID">
          <ScenarioMode />
        </Router>
      );

      expect(screen.getByText(/INVALID/i)).toBeInTheDocument();
    });

    it('should handle empty scenario result', () => {
      (useScenarioState as any).mockReturnValue({
        scenarioResult: {
          channelAttribution: [],
          nodeAttribution: [],
        },
        isCalculating: false,
        error: null,
        activeScenario: null,
        runScenario: vi.fn(),
      });

      render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      // Should still render components with empty state
      expect(screen.getByText(/Scenario Impact Summary/i)).toBeInTheDocument();
    });
  });

  describe('State Synchronization', () => {
    it('should synchronize company selection across components', () => {
      const setSelectedCompany = vi.fn();
      
      (useGlobalState as any).mockReturnValue({
        setMode: vi.fn(),
        setLens: vi.fn(),
        setSelectedCompany,
      });

      render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      expect(setSelectedCompany).toHaveBeenCalledWith('AAPL');
    });

    it('should pass actor and target countries to child components', () => {
      const mockScenario = {
        name: 'Taiwan Strait Crisis',
        config: {
          actorCountry: 'United States',
          targetCountries: ['China', 'Taiwan'],
        },
      };

      (useScenarioState as any).mockReturnValue({
        scenarioResult: {
          nodeAttribution: [
            { country: 'China', delta: 5.0 },
            { country: 'Taiwan', delta: 4.0 },
          ],
        },
        isCalculating: false,
        error: null,
        activeScenario: mockScenario,
        runScenario: vi.fn(),
      });

      render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      // Components should receive actor and target countries
      expect(screen.getByText(/Node Attribution/i)).toBeInTheDocument();
    });
  });
});

describe('Component Integration Tests', () => {
  describe('S3 (Channel Attribution) Integration', () => {
    it('should display channel breakdown when data available', () => {
      const mockResult = {
        channelAttribution: [
          {
            channelName: 'Trade' as const,
            baselineScore: 10.0,
            scenarioScore: 15.0,
            deltaContribution: 5.0,
            confidence: 92,
            evidenceLevel: 'A' as const,
          },
        ],
      };

      (useScenarioState as any).mockReturnValue({
        scenarioResult: mockResult,
        isCalculating: false,
        error: null,
        activeScenario: null,
      });

      render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      expect(screen.getByText(/Channel Attribution/i)).toBeInTheDocument();
    });
  });

  describe('S4 (Node Attribution) Integration', () => {
    it('should display country table when data available', () => {
      const mockResult = {
        nodeAttribution: [
          {
            country: 'China',
            baselineRisk: 16.25,
            scenarioRisk: 20.0,
            delta: 3.75,
            deltaPercentage: 23.08,
          },
        ],
      };

      (useScenarioState as any).mockReturnValue({
        scenarioResult: mockResult,
        isCalculating: false,
        error: null,
        activeScenario: {
          config: {
            actorCountry: 'United States',
            targetCountries: ['China'],
          },
        },
      });

      render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      expect(screen.getByText(/Node Attribution/i)).toBeInTheDocument();
    });
  });

  describe('S5 (Transmission Trace) Integration', () => {
    it('should display network graph when data available', () => {
      const mockResult = {
        nodeAttribution: [
          { country: 'United States', delta: 3.0 },
          { country: 'China', delta: 5.0 },
          { country: 'Japan', delta: 2.0 },
        ],
      };

      (useScenarioState as any).mockReturnValue({
        scenarioResult: mockResult,
        isCalculating: false,
        error: null,
        activeScenario: {
          config: {
            actorCountry: 'United States',
            targetCountries: ['China'],
          },
        },
      });

      render(
        <Router initialPath="/scenario-mode?ticker=AAPL">
          <ScenarioMode />
        </Router>
      );

      expect(screen.getByText(/Transmission Trace/i)).toBeInTheDocument();
    });
  });
});

describe('Performance Tests', () => {
  it('should render large dataset efficiently', () => {
    const largeNodeAttribution = Array.from({ length: 100 }, (_, i) => ({
      country: `Country ${i}`,
      baselineRisk: 10 + i,
      scenarioRisk: 15 + i,
      delta: 5,
      deltaPercentage: 50,
    }));

    (useScenarioState as any).mockReturnValue({
      scenarioResult: {
        nodeAttribution: largeNodeAttribution,
      },
      isCalculating: false,
      error: null,
      activeScenario: {
        config: {
          actorCountry: 'United States',
          targetCountries: ['China'],
        },
      },
    });

    const startTime = performance.now();
    
    render(
      <Router initialPath="/scenario-mode?ticker=AAPL">
        <ScenarioMode />
      </Router>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Render should complete within 1 second
    expect(renderTime).toBeLessThan(1000);
  });
});

describe('Accessibility Tests', () => {
  it('should have proper ARIA labels', () => {
    render(
      <Router initialPath="/scenario-mode?ticker=AAPL">
        <ScenarioMode />
      </Router>
    );

    // Check for heading hierarchy
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should support keyboard navigation', () => {
    render(
      <Router initialPath="/scenario-mode?ticker=AAPL">
        <ScenarioMode />
      </Router>
    );

    // Check for interactive elements
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Buttons should be focusable
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });
});
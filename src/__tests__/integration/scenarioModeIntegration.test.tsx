/**
 * Integration Tests for Scenario Mode Page
 * Tests full workflow from scenario configuration to results display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScenarioMode from '@/pages/ScenarioMode';
import { useScenarioState } from '@/store/scenarioState';
import { useGlobalState } from '@/store/globalState';

// Mock the stores
vi.mock('@/store/scenarioState');
vi.mock('@/store/globalState');

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/scenario-mode?ticker=AAPL', vi.fn()],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock components
vi.mock('@/components/scenario/ScenarioBuilder', () => ({
  default: ({ ticker }: { ticker: string }) => (
    <div data-testid="scenario-builder">Scenario Builder for {ticker}</div>
  ),
}));

vi.mock('@/components/scenario/ScenarioImpactSummary', () => ({
  default: ({ result, isLoading }: { result: any; isLoading: boolean }) => (
    <div data-testid="impact-summary">
      {isLoading ? 'Loading...' : result ? 'Results' : 'No Results'}
    </div>
  ),
}));

vi.mock('@/components/common/LensBadge', () => ({
  default: ({ lens }: { lens: string }) => (
    <div data-testid="lens-badge">{lens}</div>
  ),
}));

describe('Scenario Mode Integration', () => {
  const mockSetMode = vi.fn();
  const mockSetLens = vi.fn();
  const mockSetSelectedCompany = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useGlobalState
    (useGlobalState as any).mockReturnValue({
      setMode: mockSetMode,
      setLens: mockSetLens,
      setSelectedCompany: mockSetSelectedCompany,
    });

    // Mock useScenarioState
    (useScenarioState as any).mockReturnValue({
      scenarioResult: null,
      isCalculating: false,
      error: null,
      activeScenario: null,
    });
  });

  describe('Page Initialization', () => {
    it('should set mode to Scenario on mount', () => {
      render(<ScenarioMode />);
      expect(mockSetMode).toHaveBeenCalledWith('Scenario');
    });

    it('should set lens to Scenario Shock on mount', () => {
      render(<ScenarioMode />);
      expect(mockSetLens).toHaveBeenCalledWith('Scenario Shock');
    });

    it('should set selected company from URL parameter', () => {
      render(<ScenarioMode />);
      expect(mockSetSelectedCompany).toHaveBeenCalledWith('AAPL');
    });

    it('should display lens badge with Scenario Shock', () => {
      render(<ScenarioMode />);
      const badge = screen.getByTestId('lens-badge');
      expect(badge).toHaveTextContent('Scenario Shock');
    });
  });

  describe('Header and Navigation', () => {
    it('should display page title', () => {
      render(<ScenarioMode />);
      expect(screen.getByText('Scenario Mode: Stress Testing')).toBeInTheDocument();
    });

    it('should display breadcrumb navigation', () => {
      render(<ScenarioMode />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Scenario Mode')).toBeInTheDocument();
    });

    it('should display back button', () => {
      render(<ScenarioMode />);
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should display company name when ticker provided', () => {
      render(<ScenarioMode />);
      expect(screen.getByText(/AAPL/)).toBeInTheDocument();
      expect(screen.getByText(/Apple Inc./)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render Scenario Builder component', () => {
      render(<ScenarioMode />);
      const builder = screen.getByTestId('scenario-builder');
      expect(builder).toBeInTheDocument();
      expect(builder).toHaveTextContent('Scenario Builder for AAPL');
    });

    it('should render Impact Summary component', () => {
      render(<ScenarioMode />);
      const summary = screen.getByTestId('impact-summary');
      expect(summary).toBeInTheDocument();
    });

    it('should pass ticker to Scenario Builder', () => {
      render(<ScenarioMode />);
      const builder = screen.getByTestId('scenario-builder');
      expect(builder).toHaveTextContent('AAPL');
    });
  });

  describe('Loading States', () => {
    it('should show loading state in Impact Summary when calculating', () => {
      (useScenarioState as any).mockReturnValue({
        scenarioResult: null,
        isCalculating: true,
        error: null,
        activeScenario: null,
      });

      render(<ScenarioMode />);
      const summary = screen.getByTestId('impact-summary');
      expect(summary).toHaveTextContent('Loading...');
    });

    it('should show results when calculation complete', () => {
      (useScenarioState as any).mockReturnValue({
        scenarioResult: { deltaCOGRI: 10.5 },
        isCalculating: false,
        error: null,
        activeScenario: { name: 'Test Scenario' },
      });

      render(<ScenarioMode />);
      const summary = screen.getByTestId('impact-summary');
      expect(summary).toHaveTextContent('Results');
    });
  });

  describe('Error Handling', () => {
    it('should display error alert when error occurs', () => {
      (useScenarioState as any).mockReturnValue({
        scenarioResult: null,
        isCalculating: false,
        error: 'Calculation failed',
        activeScenario: null,
      });

      render(<ScenarioMode />);
      expect(screen.getByText('Calculation failed')).toBeInTheDocument();
    });

    it('should not display error alert when no error', () => {
      render(<ScenarioMode />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Welcome State', () => {
    beforeEach(() => {
      // Mock no ticker in URL
      vi.mocked(require('wouter').useLocation).mockReturnValue([
        '/scenario-mode',
        vi.fn(),
      ]);
    });

    it('should show welcome message when no ticker selected', () => {
      render(<ScenarioMode />);
      expect(screen.getByText('Welcome to Scenario Mode')).toBeInTheDocument();
    });

    it('should show quick start guide', () => {
      render(<ScenarioMode />);
      expect(screen.getByText('Quick Start Guide:')).toBeInTheDocument();
    });

    it('should list quick-start templates', () => {
      render(<ScenarioMode />);
      expect(screen.getByText(/Taiwan Strait Crisis/)).toBeInTheDocument();
      expect(screen.getByText(/US-China Decoupling/)).toBeInTheDocument();
    });

    it('should not show Scenario Builder in welcome state', () => {
      render(<ScenarioMode />);
      expect(screen.queryByTestId('scenario-builder')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should render two-column layout on desktop', () => {
      render(<ScenarioMode />);
      const container = screen.getByTestId('scenario-builder').parentElement;
      expect(container?.className).toContain('lg:col-span-5');
    });

    it('should render sticky Scenario Builder on desktop', () => {
      render(<ScenarioMode />);
      const stickyContainer = screen.getByTestId('scenario-builder').parentElement;
      expect(stickyContainer?.className).toContain('lg:sticky');
    });
  });

  describe('Future Components Placeholders', () => {
    it('should show placeholders when results available', () => {
      (useScenarioState as any).mockReturnValue({
        scenarioResult: { deltaCOGRI: 10.5 },
        isCalculating: false,
        error: null,
        activeScenario: { name: 'Test Scenario' },
      });

      render(<ScenarioMode />);
      expect(screen.getByText(/Channel Attribution \(S3\)/)).toBeInTheDocument();
      expect(screen.getByText(/Node Attribution \(S4\)/)).toBeInTheDocument();
      expect(screen.getByText(/Transmission Trace \(S5\)/)).toBeInTheDocument();
    });

    it('should not show placeholders when no results', () => {
      render(<ScenarioMode />);
      expect(screen.queryByText(/Channel Attribution/)).not.toBeInTheDocument();
    });

    it('should not show placeholders when calculating', () => {
      (useScenarioState as any).mockReturnValue({
        scenarioResult: null,
        isCalculating: true,
        error: null,
        activeScenario: null,
      });

      render(<ScenarioMode />);
      expect(screen.queryByText(/Channel Attribution/)).not.toBeInTheDocument();
    });
  });
});

describe('Scenario Mode Workflow', () => {
  it('should complete full workflow: configure → run → view results', async () => {
    const mockRunScenario = vi.fn();
    
    // Initial state: no results
    (useScenarioState as any).mockReturnValue({
      scenarioResult: null,
      isCalculating: false,
      error: null,
      activeScenario: null,
      runScenario: mockRunScenario,
    });

    const { rerender } = render(<ScenarioMode />);
    
    // Verify initial state
    expect(screen.getByTestId('impact-summary')).toHaveTextContent('No Results');

    // Simulate scenario calculation
    (useScenarioState as any).mockReturnValue({
      scenarioResult: null,
      isCalculating: true,
      error: null,
      activeScenario: { name: 'Taiwan Strait Crisis' },
      runScenario: mockRunScenario,
    });

    rerender(<ScenarioMode />);
    expect(screen.getByTestId('impact-summary')).toHaveTextContent('Loading...');

    // Simulate results ready
    (useScenarioState as any).mockReturnValue({
      scenarioResult: {
        deltaCOGRI: 16.5,
        baselineCOGRI: 62.4,
        scenarioCOGRI: 78.9,
      },
      isCalculating: false,
      error: null,
      activeScenario: { name: 'Taiwan Strait Crisis' },
      runScenario: mockRunScenario,
    });

    rerender(<ScenarioMode />);
    expect(screen.getByTestId('impact-summary')).toHaveTextContent('Results');
  });
});
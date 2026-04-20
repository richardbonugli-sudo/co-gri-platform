/**
 * Unit Tests for LensBadge Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LensBadge, { LensBadgeGroup } from '../LensBadge';
import { Lens } from '@/types/global';

describe('LensBadge', () => {
  it('should render Structural lens badge', () => {
    render(<LensBadge lens="Structural" />);
    expect(screen.getByText('Structural')).toBeInTheDocument();
  });

  it('should render Forecast Overlay lens badge', () => {
    render(<LensBadge lens="Forecast Overlay" />);
    expect(screen.getByText('Forecast Overlay')).toBeInTheDocument();
  });

  it('should render Scenario Shock lens badge', () => {
    render(<LensBadge lens="Scenario Shock" />);
    expect(screen.getByText('Scenario Shock')).toBeInTheDocument();
  });

  it('should render Trading Signal lens badge', () => {
    render(<LensBadge lens="Trading Signal" />);
    expect(screen.getByText('Trading Signal')).toBeInTheDocument();
  });

  it('should render with small size', () => {
    const { container } = render(<LensBadge lens="Structural" size="sm" />);
    expect(container.querySelector('.text-xs')).toBeInTheDocument();
  });

  it('should render with medium size (default)', () => {
    const { container } = render(<LensBadge lens="Structural" size="md" />);
    expect(container.querySelector('.text-sm')).toBeInTheDocument();
  });

  it('should render with large size', () => {
    const { container } = render(<LensBadge lens="Structural" size="lg" />);
    expect(container.querySelector('.text-base')).toBeInTheDocument();
  });

  it('should render with icon by default', () => {
    const { container } = render(<LensBadge lens="Structural" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render without icon when showIcon is false', () => {
    const { container } = render(<LensBadge lens="Structural" showIcon={false} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should apply correct color classes for Structural lens', () => {
    const { container } = render(<LensBadge lens="Structural" />);
    expect(container.querySelector('.text-blue-700')).toBeInTheDocument();
    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
  });

  it('should apply correct color classes for Forecast Overlay lens', () => {
    const { container } = render(<LensBadge lens="Forecast Overlay" />);
    expect(container.querySelector('.text-purple-700')).toBeInTheDocument();
    expect(container.querySelector('.bg-purple-50')).toBeInTheDocument();
  });

  it('should apply correct color classes for Scenario Shock lens', () => {
    const { container } = render(<LensBadge lens="Scenario Shock" />);
    expect(container.querySelector('.text-orange-700')).toBeInTheDocument();
    expect(container.querySelector('.bg-orange-50')).toBeInTheDocument();
  });

  it('should apply correct color classes for Trading Signal lens', () => {
    const { container } = render(<LensBadge lens="Trading Signal" />);
    expect(container.querySelector('.text-green-700')).toBeInTheDocument();
    expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<LensBadge lens="Structural" className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});

describe('LensBadgeGroup', () => {
  it('should render all available lenses', () => {
    render(<LensBadgeGroup activeLens="Structural" />);
    expect(screen.getByText('Structural')).toBeInTheDocument();
    expect(screen.getByText('Forecast Overlay')).toBeInTheDocument();
    expect(screen.getByText('Scenario Shock')).toBeInTheDocument();
    expect(screen.getByText('Trading Signal')).toBeInTheDocument();
  });

  it('should highlight active lens', () => {
    const { container } = render(<LensBadgeGroup activeLens="Structural" />);
    const structuralButton = screen.getByText('Structural').closest('button');
    expect(structuralButton).toHaveClass('text-blue-700');
  });

  it('should render only specified lenses', () => {
    const availableLenses: Lens[] = ['Structural', 'Scenario Shock'];
    render(
      <LensBadgeGroup 
        activeLens="Structural" 
        availableLenses={availableLenses}
      />
    );
    expect(screen.getByText('Structural')).toBeInTheDocument();
    expect(screen.getByText('Scenario Shock')).toBeInTheDocument();
    expect(screen.queryByText('Forecast Overlay')).not.toBeInTheDocument();
    expect(screen.queryByText('Trading Signal')).not.toBeInTheDocument();
  });

  it('should call onLensChange when lens is clicked', () => {
    let changedLens: Lens | null = null;
    const handleChange = (lens: Lens) => {
      changedLens = lens;
    };

    render(
      <LensBadgeGroup 
        activeLens="Structural" 
        onLensChange={handleChange}
      />
    );

    const forecastButton = screen.getByText('Forecast Overlay').closest('button');
    forecastButton?.click();

    expect(changedLens).toBe('Forecast Overlay');
  });

  it('should not be clickable when onLensChange is not provided', () => {
    const { container } = render(<LensBadgeGroup activeLens="Structural" />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('cursor-default');
    });
  });

  it('should be clickable when onLensChange is provided', () => {
    const { container } = render(
      <LensBadgeGroup 
        activeLens="Structural" 
        onLensChange={() => {}}
      />
    );
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('cursor-pointer');
    });
  });
});
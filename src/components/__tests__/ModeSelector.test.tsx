/**
 * Unit tests for ModeSelector component
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeSelector } from '../ModeSelector';
import type { AnalysisMode } from '../ModeSelector';

describe('ModeSelector', () => {
  test('renders with event-driven mode selected by default', () => {
    const onModeChange = vi.fn();
    render(
      <ModeSelector
        selectedMode="event-driven"
        onModeChange={onModeChange}
      />
    );

    expect(screen.getByText('Analysis Mode')).toBeInTheDocument();
    expect(screen.getByText('Event-Driven Scenario')).toBeInTheDocument();
    expect(screen.getByText('Strategic Forecast Baseline')).toBeInTheDocument();
  });

  test('renders with forecast-baseline mode selected', () => {
    const onModeChange = vi.fn();
    render(
      <ModeSelector
        selectedMode="forecast-baseline"
        onModeChange={onModeChange}
      />
    );

    const forecastRadio = screen.getByRole('radio', {
      name: /strategic forecast baseline/i
    });
    expect(forecastRadio).toBeChecked();
  });

  test('calls onModeChange when mode is changed', () => {
    const onModeChange = vi.fn();
    render(
      <ModeSelector
        selectedMode="event-driven"
        onModeChange={onModeChange}
      />
    );

    const forecastRadio = screen.getByRole('radio', {
      name: /strategic forecast baseline/i
    });
    fireEvent.click(forecastRadio);

    expect(onModeChange).toHaveBeenCalledWith('forecast-baseline');
  });

  test('displays forecast info when forecast-baseline is selected', () => {
    const onModeChange = vi.fn();
    render(
      <ModeSelector
        selectedMode="forecast-baseline"
        onModeChange={onModeChange}
      />
    );

    expect(screen.getByText(/Forecast Baseline Active/i)).toBeInTheDocument();
    expect(screen.getByText(/195 Countries/i)).toBeInTheDocument();
    expect(screen.getByText(/6 Major Events/i)).toBeInTheDocument();
    expect(screen.getByText(/85% Confidence/i)).toBeInTheDocument();
  });

  test('does not display forecast info when event-driven is selected', () => {
    const onModeChange = vi.fn();
    render(
      <ModeSelector
        selectedMode="event-driven"
        onModeChange={onModeChange}
      />
    );

    expect(screen.queryByText(/Forecast Baseline Active/i)).not.toBeInTheDocument();
  });

  test('respects disabled prop', () => {
    const onModeChange = vi.fn();
    render(
      <ModeSelector
        selectedMode="event-driven"
        onModeChange={onModeChange}
        disabled={true}
      />
    );

    const eventRadio = screen.getByRole('radio', {
      name: /event-driven scenario/i
    });
    const forecastRadio = screen.getByRole('radio', {
      name: /strategic forecast baseline/i
    });

    expect(eventRadio).toBeDisabled();
    expect(forecastRadio).toBeDisabled();
  });

  test('has proper accessibility attributes', () => {
    const onModeChange = vi.fn();
    render(
      <ModeSelector
        selectedMode="event-driven"
        onModeChange={onModeChange}
      />
    );

    const eventRadio = screen.getByRole('radio', {
      name: /event-driven scenario/i
    });
    const forecastRadio = screen.getByRole('radio', {
      name: /strategic forecast baseline/i
    });

    expect(eventRadio).toHaveAttribute('aria-label');
    expect(forecastRadio).toHaveAttribute('aria-label');
  });

  test('applies custom className', () => {
    const onModeChange = vi.fn();
    const { container } = render(
      <ModeSelector
        selectedMode="event-driven"
        onModeChange={onModeChange}
        className="custom-class"
      />
    );

    const modeSelector = container.firstChild;
    expect(modeSelector).toHaveClass('custom-class');
  });
});
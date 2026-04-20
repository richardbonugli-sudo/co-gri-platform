/**
 * useCompositeCSI Hook
 * Connects dashboard components to the composite CSI calculator
 */

import { useState, useEffect, useMemo } from 'react';
import { calculateCompositeCSI } from '@/services/csi/compositeCSICalculator';
import type { CompositeCSIResult } from '@/services/csi/compositeCSICalculator';

interface UseCompositeCSIOptions {
  country: string;
  autoCalculate?: boolean;
}

interface UseCompositeCSIReturn {
  result: CompositeCSIResult | null;
  loading: boolean;
  error: string | null;
  calculate: () => void;
  refresh: () => void;
}

export function useCompositeCSI({ 
  country, 
  autoCalculate = true 
}: UseCompositeCSIOptions): UseCompositeCSIReturn {
  const [result, setResult] = useState<CompositeCSIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useMemo(() => {
    return () => {
      if (!country) {
        setError('Country is required');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const csiResult = calculateCompositeCSI(country);
        setResult(csiResult);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to calculate composite CSI';
        setError(errorMessage);
        console.error('[useCompositeCSI] Error:', err);
      } finally {
        setLoading(false);
      }
    };
  }, [country]);

  const refresh = useMemo(() => {
    return () => {
      calculate();
    };
  }, [calculate]);

  useEffect(() => {
    if (autoCalculate && country) {
      calculate();
    }
  }, [autoCalculate, country, calculate]);

  return {
    result,
    loading,
    error,
    calculate,
    refresh
  };
}
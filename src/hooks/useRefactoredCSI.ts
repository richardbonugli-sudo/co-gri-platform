/**
 * React Hook for Refactored CSI Engine
 * Provides real-time CSI data with polling
 * Part of Phase 2C: Real-time Updates
 */

import { useState, useEffect, useCallback } from 'react';
import { refactoredCSIEngineOrchestrator } from '@/services/csi/engine/RefactoredCSIEngineOrchestrator';

interface CSIScore {
  country: string;
  timestamp: Date;
  compositeScore: number;
  components: {
    baseline: number;
    drift: number;
    delta: number;
  };
  metadata: {
    activeSignals: number;
    confirmedEvents: number;
    confidence: number;
  };
}

interface CSIAttribution {
  country: string;
  as_of_date: Date;
  composite_csi: number;
  baseline: {
    value: number;
    source: string;
    last_updated: Date;
  };
  drift: {
    total: number;
    signals: Array<{
      signal_id: string;
      contribution: number;
      probability: number;
    }>;
  };
  events: {
    total: number;
    deltas: Array<{
      event_id: string;
      vector: any;
      impact: number;
    }>;
  };
}

export function useRefactoredCSI(country: string, pollingInterval: number = 30000) {
  const [score, setScore] = useState<CSIScore | null>(null);
  const [attribution, setAttribution] = useState<CSIAttribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchCSIData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch CSI score
      const scoreData = await refactoredCSIEngineOrchestrator.getCSIScore(country);
      setScore(scoreData);

      // Fetch attribution
      const attributionData = await refactoredCSIEngineOrchestrator.getCSIAttribution(country);
      setAttribution(attributionData);

      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch CSI data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch CSI data');
      setLoading(false);
    }
  }, [country]);

  // Initial fetch
  useEffect(() => {
    fetchCSIData();
  }, [fetchCSIData]);

  // Polling
  useEffect(() => {
    if (pollingInterval <= 0) return;

    const interval = setInterval(() => {
      fetchCSIData();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [fetchCSIData, pollingInterval]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchCSIData();
  }, [fetchCSIData]);

  return {
    score,
    attribution,
    loading,
    error,
    lastUpdate,
    refresh
  };
}

export function useSystemHealth() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(() => {
    try {
      const healthData = refactoredCSIEngineOrchestrator.getSystemHealth();
      setHealth(healthData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return { health, loading, refresh: fetchHealth };
}
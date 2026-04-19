/**
 * Real-Time Data Hooks
 * Custom React hooks for fetching and managing real-time data
 * Includes loading states, error handling, and auto-refresh capabilities
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchCountries,
  fetchCountryDetail,
  fetchGlobalSectors,
  fetchCountrySectors,
  fetchEvents,
  fetchCountryEvents,
} from '@/services/dataService';
import type { CountryRiskData } from '@/data/globalCountries';
import type { SectorExposure } from '@/data/sectorData';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Generic data fetching hook with loading and error states
 */
function useData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  autoRefresh: number | null = null
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      
      if (isMountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    // Set up auto-refresh if specified
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh && autoRefresh > 0) {
      intervalId = setInterval(fetchData, autoRefresh);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for fetching all countries data
 * @param autoRefresh - Auto-refresh interval in milliseconds (null to disable)
 */
export function useCountries(autoRefresh: number | null = null): UseDataResult<CountryRiskData[]> {
  return useData<CountryRiskData[]>(fetchCountries, [], autoRefresh);
}

/**
 * Hook for fetching single country data
 * @param country - Country name
 * @param autoRefresh - Auto-refresh interval in milliseconds (null to disable)
 */
export function useCountryDetail(
  country: string | null,
  autoRefresh: number | null = null
): UseDataResult<CountryRiskData | null> {
  return useData<CountryRiskData | null>(
    () => country ? fetchCountryDetail(country) : Promise.resolve(null),
    [country],
    autoRefresh
  );
}

/**
 * Hook for fetching global sector data
 * @param autoRefresh - Auto-refresh interval in milliseconds (null to disable)
 */
export function useGlobalSectors(autoRefresh: number | null = null): UseDataResult<SectorExposure[]> {
  return useData<SectorExposure[]>(fetchGlobalSectors, [], autoRefresh);
}

/**
 * Hook for fetching country-specific sector data
 * @param country - Country name
 * @param autoRefresh - Auto-refresh interval in milliseconds (null to disable)
 */
export function useCountrySectors(
  country: string | null,
  autoRefresh: number | null = null
): UseDataResult<SectorExposure[]> {
  return useData<SectorExposure[]>(
    () => country ? fetchCountrySectors(country) : Promise.resolve([]),
    [country],
    autoRefresh
  );
}

/**
 * Hook for fetching recent events
 * @param limit - Maximum number of events to fetch
 * @param autoRefresh - Auto-refresh interval in milliseconds (null to disable)
 */
export function useEvents(
  limit: number = 20,
  autoRefresh: number | null = 60000 // Default: refresh every 60 seconds
): UseDataResult<any[]> {
  return useData<any[]>(() => fetchEvents(limit), [limit], autoRefresh);
}

/**
 * Hook for fetching country-specific events
 * @param country - Country name
 * @param limit - Maximum number of events to fetch
 * @param autoRefresh - Auto-refresh interval in milliseconds (null to disable)
 */
export function useCountryEvents(
  country: string | null,
  limit: number = 20,
  autoRefresh: number | null = 60000 // Default: refresh every 60 seconds
): UseDataResult<any[]> {
  return useData<any[]>(
    () => country ? fetchCountryEvents(country, limit) : Promise.resolve([]),
    [country, limit],
    autoRefresh
  );
}

/**
 * WebSocket connection hook (structure only, not live connection)
 * Ready for implementation when WebSocket backend is available
 */
export function useWebSocket(url: string | null, onMessage?: (data: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!url) return;

    // TODO: Implement WebSocket connection when backend is ready
    // const ws = new WebSocket(url);
    // 
    // ws.onopen = () => {
    //   setIsConnected(true);
    // };
    // 
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   setLastMessage(data);
    //   onMessage?.(data);
    // };
    // 
    // ws.onerror = (error) => {
    //   console.error('WebSocket error:', error);
    // };
    // 
    // ws.onclose = () => {
    //   setIsConnected(false);
    // };
    // 
    // wsRef.current = ws;
    // 
    // return () => {
    //   ws.close();
    // };

    // Mock implementation
    console.log('WebSocket connection prepared for:', url);
  }, [url, onMessage]);

  return {
    isConnected,
    lastMessage,
    send: (data: any) => {
      // TODO: Implement send when WebSocket is ready
      // wsRef.current?.send(JSON.stringify(data));
      console.log('WebSocket send prepared:', data);
    },
  };
}
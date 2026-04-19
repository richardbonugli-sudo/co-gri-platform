/**
 * CSI Refactored Dashboard
 * Integrates the three-component CSI architecture with full UI
 * Part of Phase 2: Complete UI Integration
 */

import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Home,
  RefreshCw,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Layers,
  Info
} from 'lucide-react';
import { CSIComponentsPanel } from '@/components/csi/CSIComponentsPanel';
import { CSIAttributionPanel } from '@/components/csi/CSIAttributionPanel';
import { ActiveSignalsList } from '@/components/csi/ActiveSignalsList';
import { ConfirmedEventsList } from '@/components/csi/ConfirmedEventsList';
import { useRefactoredCSI, useSystemHealth } from '@/hooks/useRefactoredCSI';
import { refactoredCSIEngineOrchestrator } from '@/services/csi/engine/RefactoredCSIEngineOrchestrator';
import { escalationDriftEngine } from '@/services/csi/engine/calculation/refactored/EscalationDriftEngine';
import { eventDeltaEngine } from '@/services/csi/engine/calculation/refactored/EventDeltaEngine';

const TRACKED_COUNTRIES = [
  'China',
  'United States',
  'Germany',
  'Japan',
  'United Kingdom',
  'France',
  'India',
  'Brazil',
  'Russia',
  'South Korea'
];

export default function CSIRefactoredDashboard() {
  const [selectedCountry, setSelectedCountry] = useState('China');
  const [signalContributions, setSignalContributions] = useState<any[]>([]);
  const [eventDetails, setEventDetails] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { score, attribution, loading, error, lastUpdate, refresh } = useRefactoredCSI(
    selectedCountry,
    autoRefresh ? 30000 : 0 // Poll every 30 seconds if auto-refresh is on
  );

  const { health } = useSystemHealth();

  // Fetch signal contributions and event details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const signals = await escalationDriftEngine.getActiveSignalsWithContributions(selectedCountry);
        setSignalContributions(signals);

        const events = await eventDeltaEngine.getActiveEventsWithDetails(selectedCountry);
        setEventDetails(events);
      } catch (err) {
        console.error('Failed to fetch details:', err);
      }
    };

    fetchDetails();
  }, [selectedCountry, lastUpdate]);

  const handleRefresh = () => {
    refresh();
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 50) return 'text-orange-500';
    if (score >= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 30) return 'Moderate';
    return 'Low';
  };

  if (loading && !score) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-[#7fa89f] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading Refactored CSI Engine...</p>
          <p className="text-gray-400 text-sm mt-2">Initializing three-component architecture</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Error Loading CSI Data</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <Button 
            onClick={handleRefresh}
            className="mt-4 bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e]"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628]">
      {/* Header */}
      <div className="bg-[#0d5f5f]/95 backdrop-blur-sm border-b border-[#0d5f5f]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Layers className="h-8 w-8 text-[#7fa89f]" />
                CSI Refactored Dashboard
              </h1>
              <p className="text-gray-300 mt-2">
                Three-Component Architecture: Baseline + Drift + Delta
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/">
                <Button 
                  variant="outline"
                  className="border-[#7fa89f] text-[#7fa89f] hover:bg-[#7fa89f] hover:text-[#0f1e2e]"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Button 
                onClick={handleRefresh}
                className="bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e]"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Health Banner */}
        {health && (
          <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-white font-semibold">System Status: Operational</p>
                    <p className="text-sm text-gray-400">
                      Engine: {health.engineType} | {health.activeCountries} countries tracked
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-white font-semibold">{health.totalSignals}</div>
                    <div className="text-gray-400">Signals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{health.activeCandidates}</div>
                    <div className="text-gray-400">Candidates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{health.validatedEvents}</div>
                    <div className="text-gray-400">Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{health.avgCompositeScore.toFixed(1)}</div>
                    <div className="text-gray-400">Avg CSI</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Country Selector */}
        <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Select Country</CardTitle>
            <CardDescription className="text-gray-400">
              View detailed CSI breakdown for any tracked country
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {TRACKED_COUNTRIES.map((country) => (
                <Button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  variant={selectedCountry === country ? 'default' : 'outline'}
                  className={
                    selectedCountry === country
                      ? 'bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e]'
                      : 'border-[#7fa89f]/30 text-[#7fa89f] hover:bg-[#7fa89f]/10'
                  }
                >
                  {country}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main CSI Components Panel */}
        {score && (
          <div className="mb-6">
            <CSIComponentsPanel
              country={selectedCountry}
              components={score.components}
              metadata={score.metadata}
              timestamp={score.timestamp}
            />
          </div>
        )}

        {/* Tabs for Different Views */}
        <Tabs defaultValue="attribution" className="space-y-6">
          <TabsList className="bg-[#0d5f5f]/30 border border-[#7fa89f]/30">
            <TabsTrigger 
              value="attribution" 
              className="data-[state=active]:bg-[#7fa89f] data-[state=active]:text-[#0f1e2e]"
            >
              <Info className="h-4 w-4 mr-2" />
              Attribution
            </TabsTrigger>
            <TabsTrigger 
              value="signals" 
              className="data-[state=active]:bg-[#7fa89f] data-[state=active]:text-[#0f1e2e]"
            >
              <Activity className="h-4 w-4 mr-2" />
              Active Signals
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="data-[state=active]:bg-[#7fa89f] data-[state=active]:text-[#0f1e2e]"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmed Events
            </TabsTrigger>
          </TabsList>

          {/* Attribution Tab */}
          <TabsContent value="attribution">
            {attribution && <CSIAttributionPanel attribution={attribution} />}
          </TabsContent>

          {/* Active Signals Tab */}
          <TabsContent value="signals">
            <ActiveSignalsList
              country={selectedCountry}
              signals={signalContributions}
              totalDrift={score?.components.drift || 0}
            />
          </TabsContent>

          {/* Confirmed Events Tab */}
          <TabsContent value="events">
            <ConfirmedEventsList
              country={selectedCountry}
              events={eventDetails}
              totalDelta={score?.components.delta || 0}
            />
          </TabsContent>
        </Tabs>

        {/* Auto-refresh Toggle */}
        <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30 mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Auto-Refresh</p>
                <p className="text-sm text-gray-400">
                  Updates every 30 seconds | Last update: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? 'default' : 'outline'}
                className={
                  autoRefresh
                    ? 'bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e]'
                    : 'border-[#7fa89f]/30 text-[#7fa89f] hover:bg-[#7fa89f]/10'
                }
              >
                {autoRefresh ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
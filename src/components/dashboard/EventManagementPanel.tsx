/**
 * Event Management Panel
 * 
 * Dashboard component for managing real-time event ingestion,
 * classification, and simulation controls.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Square,
  Zap,
  Activity,
  Radio,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Settings
} from 'lucide-react';
import { eventIngestionPipeline, type IngestionStats } from '@/services/csi/eventIngestionPipeline';
import { realTimeEventProcessor, type ProcessedEvent, type RealTimeUpdate } from '@/services/csi/realTimeEventProcessor';
import { eventSimulationService } from '@/services/csi/eventSimulationService';
import type { EventCategory, EventSeverity } from '@/data/geopoliticalEvents';

interface EventManagementPanelProps {
  onEventClick?: (eventId: string) => void;
}

export const EventManagementPanel: React.FC<EventManagementPanelProps> = ({
  onEventClick
}) => {
  // State
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [isProcessorRunning, setIsProcessorRunning] = useState(false);
  const [ingestionStats, setIngestionStats] = useState<IngestionStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<ProcessedEvent[]>([]);
  const [simulationSpeed, setSimulationSpeed] = useState(5000);
  const [eventProbability, setEventProbability] = useState(0.7);

  // Manual event form state
  const [manualHeadline, setManualHeadline] = useState('');
  const [manualCountry, setManualCountry] = useState('');
  const [manualCategory, setManualCategory] = useState<EventCategory>('Conflict');
  const [manualSeverity, setManualSeverity] = useState<EventSeverity>('Moderate');

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setIngestionStats(eventIngestionPipeline.getStats());
      setRecentEvents(realTimeEventProcessor.getRecentEvents(5));
      
      const simStatus = eventSimulationService.getStatus();
      setIsSimulationRunning(simStatus.isRunning && !simStatus.isPaused);
      setIsProcessorRunning(realTimeEventProcessor.isActive());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = realTimeEventProcessor.subscribe((update: RealTimeUpdate) => {
      if (update.type === 'event_processed') {
        setRecentEvents(realTimeEventProcessor.getRecentEvents(5));
      }
    });

    return unsubscribe;
  }, []);

  // Handlers
  const handleStartSimulation = useCallback(() => {
    eventSimulationService.start({
      intervalMs: simulationSpeed,
      eventProbability
    });
    realTimeEventProcessor.start();
    setIsSimulationRunning(true);
    setIsProcessorRunning(true);
  }, [simulationSpeed, eventProbability]);

  const handleStopSimulation = useCallback(() => {
    eventSimulationService.stop();
    realTimeEventProcessor.stop();
    setIsSimulationRunning(false);
    setIsProcessorRunning(false);
  }, []);

  const handlePauseSimulation = useCallback(() => {
    eventSimulationService.pause();
    realTimeEventProcessor.pause();
    setIsSimulationRunning(false);
  }, []);

  const handleResumeSimulation = useCallback(() => {
    eventSimulationService.resume();
    realTimeEventProcessor.resume();
    setIsSimulationRunning(true);
  }, []);

  const handleManualEventSubmit = useCallback(() => {
    if (!manualHeadline.trim() || !manualCountry.trim()) {
      return;
    }

    eventSimulationService.injectEvent({
      source: 'MANUAL',
      timestamp: new Date(),
      headline: manualHeadline,
      country: manualCountry,
      category: manualCategory,
      severity: manualSeverity,
      confidence: 0.95
    });

    // Clear form
    setManualHeadline('');
    setManualCountry('');
  }, [manualHeadline, manualCountry, manualCategory, manualSeverity]);

  const handleReset = useCallback(() => {
    handleStopSimulation();
    eventIngestionPipeline.reset();
    realTimeEventProcessor.clear();
    eventSimulationService.reset();
  }, [handleStopSimulation]);

  const getSeverityColor = (severity: EventSeverity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'Moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getLifecycleColor = (state: string) => {
    switch (state) {
      case 'detected': return 'bg-blue-500/20 text-blue-400';
      case 'provisional': return 'bg-yellow-500/20 text-yellow-400';
      case 'confirmed': return 'bg-green-500/20 text-green-400';
      case 'resolved': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#7fa89f]" />
            <CardTitle className="text-white text-lg font-semibold">
              Event Management
            </CardTitle>
            {isProcessorRunning && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500 animate-pulse">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1 inline-block" />
                LIVE
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="border-[#0d5f5f] text-[#7fa89f] hover:bg-[#0d5f5f]"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Real-time event ingestion, classification, and simulation
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs defaultValue="control" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#0a0f0d]">
            <TabsTrigger value="control" className="data-[state=active]:bg-[#0d5f5f]">
              Control
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-[#0d5f5f]">
              Stats
            </TabsTrigger>
            <TabsTrigger value="feed" className="data-[state=active]:bg-[#0d5f5f]">
              Feed
            </TabsTrigger>
            <TabsTrigger value="manual" className="data-[state=active]:bg-[#0d5f5f]">
              Manual
            </TabsTrigger>
          </TabsList>

          {/* Control Tab */}
          <TabsContent value="control" className="mt-4 space-y-4">
            {/* Simulation Controls */}
            <div className="p-4 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#7fa89f]" />
                Simulation Controls
              </h4>
              
              <div className="flex items-center gap-2 mb-4">
                {!isSimulationRunning ? (
                  <Button
                    onClick={handleStartSimulation}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                ) : (
                  <Button
                    onClick={handlePauseSimulation}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
                
                {!isSimulationRunning && isProcessorRunning && (
                  <Button
                    onClick={handleResumeSimulation}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                )}
                
                <Button
                  onClick={handleStopSimulation}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/20"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </div>

              {/* Speed Control */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400 text-sm">Event Interval</Label>
                  <span className="text-[#7fa89f] text-sm">{simulationSpeed / 1000}s</span>
                </div>
                <Slider
                  value={[simulationSpeed]}
                  onValueChange={(v) => setSimulationSpeed(v[0])}
                  min={1000}
                  max={15000}
                  step={1000}
                  className="w-full"
                />
              </div>

              {/* Probability Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400 text-sm">Event Probability</Label>
                  <span className="text-[#7fa89f] text-sm">{(eventProbability * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[eventProbability * 100]}
                  onValueChange={(v) => setEventProbability(v[0] / 100)}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className={`h-4 w-4 ${isProcessorRunning ? 'text-green-400' : 'text-gray-500'}`} />
                  <span className="text-gray-400 text-sm">Processor</span>
                </div>
                <p className={`font-semibold ${isProcessorRunning ? 'text-green-400' : 'text-gray-500'}`}>
                  {isProcessorRunning ? 'Running' : 'Stopped'}
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20">
                <div className="flex items-center gap-2 mb-1">
                  <Radio className={`h-4 w-4 ${isSimulationRunning ? 'text-green-400 animate-pulse' : 'text-gray-500'}`} />
                  <span className="text-gray-400 text-sm">Simulation</span>
                </div>
                <p className={`font-semibold ${isSimulationRunning ? 'text-green-400' : 'text-gray-500'}`}>
                  {isSimulationRunning ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-4 space-y-4">
            {ingestionStats && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20 text-center">
                    <p className="text-[#7fa89f] font-bold text-xl">{ingestionStats.totalIngested}</p>
                    <p className="text-gray-400 text-xs">Ingested</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20 text-center">
                    <p className="text-green-400 font-bold text-xl">{ingestionStats.totalProcessed}</p>
                    <p className="text-gray-400 text-xs">Processed</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20 text-center">
                    <p className="text-orange-400 font-bold text-xl">{ingestionStats.queueSize}</p>
                    <p className="text-gray-400 text-xs">In Queue</p>
                  </div>
                </div>

                {/* By Category */}
                <div className="p-4 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20">
                  <h4 className="text-white font-medium mb-3">Events by Category</h4>
                  <div className="space-y-2">
                    {Object.entries(ingestionStats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">{category}</span>
                        <Badge variant="outline" className="bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]">
                          {count}
                        </Badge>
                      </div>
                    ))}
                    {Object.keys(ingestionStats.byCategory).length === 0 && (
                      <p className="text-gray-500 text-sm text-center">No events yet</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Feed Tab */}
          <TabsContent value="feed" className="mt-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentEvents.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No events processed yet</p>
                  <p className="text-gray-500 text-xs mt-1">Start the simulation to see events</p>
                </div>
              ) : (
                recentEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event.id)}
                    className="p-3 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20 hover:border-[#0d5f5f]/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {event.normalizedEvent.headline}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[#7fa89f] text-xs">{event.normalizedEvent.country}</span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-gray-400 text-xs">{event.normalizedEvent.region}</span>
                        </div>
                      </div>
                      <Badge className={`text-xs shrink-0 ${getSeverityColor(event.classification.severity)}`}>
                        {event.classification.severity}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#0d5f5f]/20">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${getLifecycleColor(event.lifecycleState)}`}>
                          {event.lifecycleState}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]">
                          {event.classification.primaryVector.vector}
                        </Badge>
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-semibold ${
                        event.classification.estimatedDeltaCSI > 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {event.classification.estimatedDeltaCSI > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {event.classification.estimatedDeltaCSI > 0 ? '+' : ''}
                        {event.classification.estimatedDeltaCSI.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="mt-4 space-y-4">
            <div className="p-4 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#7fa89f]" />
                Create Manual Event
              </h4>

              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400 text-sm">Headline</Label>
                  <Input
                    value={manualHeadline}
                    onChange={(e) => setManualHeadline(e.target.value)}
                    placeholder="Enter event headline..."
                    className="bg-[#0d1512] border-[#0d5f5f]/30 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Country</Label>
                  <Input
                    value={manualCountry}
                    onChange={(e) => setManualCountry(e.target.value)}
                    placeholder="Enter country name..."
                    className="bg-[#0d1512] border-[#0d5f5f]/30 text-white mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-400 text-sm">Category</Label>
                    <Select value={manualCategory} onValueChange={(v) => setManualCategory(v as EventCategory)}>
                      <SelectTrigger className="bg-[#0d1512] border-[#0d5f5f]/30 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1512] border-[#0d5f5f]/30">
                        <SelectItem value="Conflict">Conflict</SelectItem>
                        <SelectItem value="Sanctions">Sanctions</SelectItem>
                        <SelectItem value="Trade">Trade</SelectItem>
                        <SelectItem value="Governance">Governance</SelectItem>
                        <SelectItem value="Cyber">Cyber</SelectItem>
                        <SelectItem value="Unrest">Unrest</SelectItem>
                        <SelectItem value="Currency">Currency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-400 text-sm">Severity</Label>
                    <Select value={manualSeverity} onValueChange={(v) => setManualSeverity(v as EventSeverity)}>
                      <SelectTrigger className="bg-[#0d1512] border-[#0d5f5f]/30 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1512] border-[#0d5f5f]/30">
                        <SelectItem value="Critical">Critical</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleManualEventSubmit}
                  disabled={!manualHeadline.trim() || !manualCountry.trim()}
                  className="w-full bg-[#0d5f5f] hover:bg-[#0d5f5f]/80 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Event
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EventManagementPanel;
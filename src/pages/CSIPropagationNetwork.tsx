import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Network, RefreshCw, AlertCircle, TrendingUp, Home } from 'lucide-react';
import { csiEventStore, CSIEvent, PropagatedEvent } from '@/services/csi/eventStore';
import * as d3 from 'd3';

interface NetworkNode {
  id: string;
  country: string;
  eventType?: string;
  severity?: string;
  depth: number;
  impactScore: number;
}

interface NetworkLink {
  source: string;
  target: string;
  strength: number;
}

export default function CSIPropagationNetwork() {
  const [events, setEvents] = useState<CSIEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<CSIEvent | null>(null);
  const [propagatedEvents, setPropagatedEvents] = useState<PropagatedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadEvents();
    
    // Subscribe to event updates
    const unsubscribe = csiEventStore.subscribe((updatedEvents) => {
      setEvents(updatedEvents);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadPropagationData(selectedEventId);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (selectedEvent && propagatedEvents.length > 0) {
      renderNetwork();
    }
  }, [selectedEvent, propagatedEvents]);

  const loadEvents = () => {
    setLoading(true);
    try {
      const allEvents = csiEventStore.getAllEvents();
      setEvents(allEvents);
      
      // Auto-select first event if available
      if (allEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(allEvents[0].id);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPropagationData = (eventId: string) => {
    const event = csiEventStore.getEvent(eventId);
    setSelectedEvent(event || null);
    
    const propagated = csiEventStore.getPropagatedEvents(eventId);
    setPropagatedEvents(propagated);
  };

  const renderNetwork = () => {
    if (!svgRef.current || !selectedEvent) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Create nodes and links
    const nodes: NetworkNode[] = [
      {
        id: selectedEvent.id,
        country: selectedEvent.country,
        eventType: selectedEvent.eventType,
        severity: selectedEvent.severity,
        depth: 0,
        impactScore: 10
      },
      ...propagatedEvents.map(pe => ({
        id: pe.id,
        country: pe.country,
        eventType: pe.eventType,
        severity: pe.severity,
        depth: pe.propagationDepth,
        impactScore: pe.impactScore
      }))
    ];

    const links: NetworkLink[] = propagatedEvents.map(pe => ({
      source: selectedEvent.id,
      target: pe.id,
      strength: pe.impactScore / 10
    }));

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#7fa89f')
      .attr('stroke-opacity', (d) => d.strength)
      .attr('stroke-width', (d) => Math.max(1, d.strength * 3));

    // Create nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add circles to nodes
    node.append('circle')
      .attr('r', (d) => 20 + (d.impactScore * 2))
      .attr('fill', (d) => {
        if (d.depth === 0) return '#7fa89f';
        switch (d.severity) {
          case 'critical': return '#ef4444';
          case 'high': return '#f97316';
          case 'medium': return '#eab308';
          case 'low': return '#22c55e';
          default: return '#6b7280';
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
      .text((d) => d.country)
      .attr('text-anchor', 'middle')
      .attr('dy', 40)
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');

    // Add tooltips
    node.append('title')
      .text((d) => `${d.country}\nDepth: ${d.depth}\nImpact: ${d.impactScore.toFixed(2)}`);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-[#7fa89f] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading Propagation Network...</p>
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
                <Network className="h-8 w-8 text-[#7fa89f]" />
                CSI Propagation Network
              </h1>
              <p className="text-gray-300 mt-2">
                Visualize event propagation through trade networks
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/">
                <Button 
                  variant="outline"
                  className="border-[#7fa89f] text-[#7fa89f] hover:bg-[#7fa89f] hover:text-[#0f1e2e]"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Return to Home
                </Button>
              </Link>
              <Button 
                onClick={loadEvents}
                className="bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Selection */}
        <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Choose Event</CardTitle>
            <CardDescription className="text-gray-400">
              Select an event to visualize its propagation through the network
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="bg-[#0d5f5f]/30 border-[#7fa89f]/30 text-white">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f1e2e] border-[#7fa89f]/30">
                  {events.map((event) => (
                    <SelectItem 
                      key={event.id} 
                      value={event.id}
                      className="text-white hover:bg-[#0d5f5f]/30 focus:bg-[#0d5f5f]/30"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{event.country} - {event.description.substring(0, 50)}...</span>
                        <Badge className={`${getSeverityColor(event.severity)} text-white ml-2`}>
                          {event.severity}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No events available. Please add events to visualize propagation.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Event Details */}
        {selectedEvent && (
          <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Event Details</span>
                <Badge className={`${getSeverityColor(selectedEvent.severity)} text-white`}>
                  {selectedEvent.severity}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Country:</span>
                  <p className="text-white font-semibold">{selectedEvent.country}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Description:</span>
                  <p className="text-white">{selectedEvent.description}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Affected Sectors:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedEvent.affectedSectors.map((sector) => (
                      <Badge
                        key={sector}
                        variant="outline"
                        className="border-[#7fa89f]/30 text-[#7fa89f]"
                      >
                        {sector}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Network Visualization */}
        <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#7fa89f]" />
              Propagation Network
            </CardTitle>
            <CardDescription className="text-gray-400">
              Interactive visualization of event propagation paths
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <div className="bg-[#0a1628] rounded-lg p-4 border border-[#7fa89f]/20">
                <svg
                  ref={svgRef}
                  className="w-full"
                  style={{ height: '600px' }}
                />
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#7fa89f]" />
                    <span className="text-gray-300">Source Event</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                    <span className="text-gray-300">Critical Impact</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500" />
                    <span className="text-gray-300">High Impact</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500" />
                    <span className="text-gray-300">Medium Impact</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Network className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Select an event to visualize its propagation network</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Propagation Statistics */}
        {selectedEvent && propagatedEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Propagated Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{propagatedEvents.length}</div>
                <p className="text-xs text-gray-400 mt-1">Affected countries</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Max Depth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {Math.max(...propagatedEvents.map(pe => pe.propagationDepth), 0)}
                </div>
                <p className="text-xs text-gray-400 mt-1">Propagation levels</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Avg Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {(propagatedEvents.reduce((sum, pe) => sum + pe.impactScore, 0) / propagatedEvents.length).toFixed(1)}
                </div>
                <p className="text-xs text-gray-400 mt-1">Impact score</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
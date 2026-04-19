/**
 * Transmission Trace Component (S5)
 * Visualizes shock propagation paths through network graph
 * Shows how geopolitical risk transmits from actor to targets to spillover countries
 */

import React, { useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Layers,
  Filter,
  RotateCcw,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { ScenarioResult } from '@/types/scenario';

interface TransmissionTraceProps {
  result: ScenarioResult | null;
  isLoading?: boolean;
  actorCountry?: string;
  targetCountries?: string[];
}

type GraphLayout = 'force' | 'radial' | 'hierarchical';
type ChannelFilter = 'all' | 'trade' | 'supply' | 'financial';

// Country flag emojis
const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'China': '🇨🇳',
  'Japan': '🇯🇵',
  'Germany': '🇩🇪',
  'United Kingdom': '🇬🇧',
  'France': '🇫🇷',
  'India': '🇮🇳',
  'Italy': '🇮🇹',
  'Brazil': '🇧🇷',
  'Canada': '🇨🇦',
  'South Korea': '🇰🇷',
  'Russia': '🇷🇺',
  'Spain': '🇪🇸',
  'Australia': '🇦🇺',
  'Mexico': '🇲🇽',
  'Taiwan': '🇹🇼',
};

function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🏳️';
}

// Calculate node positions based on layout
function calculateNodePositions(
  countries: Array<{
    country: string;
    delta: number;
    layer: number;
    impactType: 'actor' | 'direct' | 'spillover';
  }>,
  layout: GraphLayout,
  width: number,
  height: number
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  if (layout === 'hierarchical') {
    // Top-down hierarchical layout
    const layers = new Map<number, typeof countries>();
    countries.forEach((c) => {
      if (!layers.has(c.layer)) {
        layers.set(c.layer, []);
      }
      layers.get(c.layer)!.push(c);
    });

    const layerHeight = height / (layers.size + 1);
    layers.forEach((layerCountries, layerNum) => {
      const layerWidth = width / (layerCountries.length + 1);
      layerCountries.forEach((country, index) => {
        positions[country.country] = {
          x: layerWidth * (index + 1),
          y: layerHeight * (layerNum + 1),
        };
      });
    });
  } else if (layout === 'radial') {
    // Radial/concentric layout
    const layers = new Map<number, typeof countries>();
    countries.forEach((c) => {
      if (!layers.has(c.layer)) {
        layers.set(c.layer, []);
      }
      layers.get(c.layer)!.push(c);
    });

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 100;

    layers.forEach((layerCountries, layerNum) => {
      const radius = layerNum === 0 ? 0 : (maxRadius / layers.size) * (layerNum + 1);
      const angleStep = (2 * Math.PI) / Math.max(layerCountries.length, 1);

      layerCountries.forEach((country, index) => {
        if (layerNum === 0) {
          // Center node (actor)
          positions[country.country] = { x: centerX, y: centerY };
        } else {
          const angle = angleStep * index - Math.PI / 2;
          positions[country.country] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          };
        }
      });
    });
  } else {
    // Force-directed layout (simple grid as fallback)
    const cols = Math.ceil(Math.sqrt(countries.length));
    const cellWidth = width / (cols + 1);
    const cellHeight = height / (Math.ceil(countries.length / cols) + 1);

    countries.forEach((country, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      positions[country.country] = {
        x: cellWidth * (col + 1),
        y: cellHeight * (row + 1),
      };
    });
  }

  return positions;
}

export default function TransmissionTrace({
  result,
  isLoading = false,
  actorCountry,
  targetCountries = [],
}: TransmissionTraceProps) {
  const [layout, setLayout] = useState<GraphLayout>('radial');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [showLayers, setShowLayers] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
  });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(30);

  // Build graph data
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!result || !result.nodeAttribution) {
      return { nodes: [], edges: [] };
    }

    // Process countries and determine layers
    const processedCountries = result.nodeAttribution
      .map((node) => {
        let impactType: 'actor' | 'direct' | 'spillover' = 'spillover';
        let layer = 2;

        if (actorCountry === node.country) {
          impactType = 'actor';
          layer = 0;
        } else if (targetCountries.includes(node.country)) {
          impactType = 'direct';
          layer = 1;
        }

        return {
          country: node.country,
          delta: node.delta,
          baselineRisk: node.baselineRisk,
          scenarioRisk: node.scenarioRisk,
          impactType,
          layer,
        };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, displayLimit);

    // Calculate positions
    const positions = calculateNodePositions(processedCountries, layout, 800, 600);

    // Create nodes
    const nodes: Node[] = processedCountries
      .filter((c) => showLayers[c.layer])
      .map((country) => {
        const absDelta = Math.abs(country.delta);
        const nodeSize = Math.max(40, Math.min(100, 40 + absDelta * 5));

        const nodeColor = country.impactType === 'actor' 
          ? '#dc2626' // Red
          : country.impactType === 'direct' 
          ? '#ea580c' // Dark orange
          : '#fb923c'; // Light orange

        const pos = positions[country.country] || { x: 400, y: 300 };

        return {
          id: country.country,
          type: 'default',
          position: pos,
          data: {
            label: (
              <div className="text-center">
                <div className="text-2xl mb-1">{getCountryFlag(country.country)}</div>
                <div className="text-xs font-semibold">{country.country}</div>
                <div className="text-xs text-gray-600">
                  Δ{country.delta > 0 ? '+' : ''}
                  {country.delta.toFixed(1)}
                </div>
              </div>
            ),
          },
          style: {
            background: nodeColor,
            color: 'white',
            border: selectedNode === country.country ? '3px solid #000' : '2px solid #fff',
            borderRadius: '50%',
            width: nodeSize,
            height: nodeSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            padding: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };
      });

    // Create edges (simplified - connect actor to targets, targets to spillover)
    const edges: Edge[] = [];
    const actor = processedCountries.find((c) => c.impactType === 'actor');
    const targets = processedCountries.filter((c) => c.impactType === 'direct');
    const spillovers = processedCountries.filter((c) => c.impactType === 'spillover');

    // Actor to targets
    if (actor) {
      targets.forEach((target) => {
        if (showLayers[0] && showLayers[1]) {
          edges.push({
            id: `${actor.country}-${target.country}`,
            source: actor.country,
            target: target.country,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#ea580c', strokeWidth: 3 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ea580c' },
            label: 'Direct Impact',
            labelStyle: { fontSize: 10, fill: '#ea580c' },
          });
        }
      });
    }

    // Targets to spillovers (top 5 spillovers per target)
    targets.forEach((target) => {
      spillovers.slice(0, 5).forEach((spillover) => {
        if (showLayers[1] && showLayers[2]) {
          const edgeWeight = Math.abs(spillover.delta) / 10;
          edges.push({
            id: `${target.country}-${spillover.country}`,
            source: target.country,
            target: spillover.country,
            type: 'smoothstep',
            style: {
              stroke: '#fb923c',
              strokeWidth: Math.max(1, edgeWeight),
              opacity: 0.6,
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#fb923c' },
            label: 'Spillover',
            labelStyle: { fontSize: 8, fill: '#fb923c' },
          });
        }
      });
    });

    return { nodes, edges };
  }, [result, actorCountry, targetCountries, layout, showLayers, selectedNode, displayLimit]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const handleReset = () => {
    setSelectedNode(null);
    setLayout('radial');
    setChannelFilter('all');
    setShowLayers({ 0: true, 1: true, 2: true });
  };

  const toggleLayer = (layer: number) => {
    setShowLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Transmission Trace</CardTitle>
            <LensBadge lens="Scenario Shock" />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Building transmission graph...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result || !result.nodeAttribution || result.nodeAttribution.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Transmission Trace</CardTitle>
            <LensBadge lens="Scenario Shock" />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-2">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No transmission data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Transmission Trace</CardTitle>
          <LensBadge lens="Scenario Shock" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive network graph showing shock propagation paths
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <Select value={layout} onValueChange={(v) => setLayout(v as GraphLayout)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="radial">Radial Layout</SelectItem>
              <SelectItem value="hierarchical">Hierarchical Layout</SelectItem>
              <SelectItem value="force">Force-Directed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Channel Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="trade">Trade Only</SelectItem>
              <SelectItem value="supply">Supply Chain Only</SelectItem>
              <SelectItem value="financial">Financial Only</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleLayer(0)}
              className={showLayers[0] ? 'bg-red-50' : ''}
            >
              Layer 0 (Actor)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleLayer(1)}
              className={showLayers[1] ? 'bg-orange-50' : ''}
            >
              Layer 1 (Targets)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleLayer(2)}
              className={showLayers[2] ? 'bg-orange-100' : ''}
            >
              Layer 2 (Spillover)
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-600"></div>
            <span>Actor Country (Epicenter)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-600"></div>
            <span>Direct Targets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-400"></div>
            <span>Spillover Countries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Node size = |ΔCO-GRI|</div>
          </div>
        </div>

        {/* Graph */}
        <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-left"
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const style = node.style as any;
                return style?.background || '#f97316';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </div>

        {/* Display Limit Controls */}
        <div className="flex justify-center gap-2">
          {displayLimit === 30 && (
            <Button variant="outline" onClick={() => setDisplayLimit(50)}>
              Show Top 50 Countries
            </Button>
          )}
          {displayLimit === 50 && result.nodeAttribution.length > 50 && (
            <Button variant="outline" onClick={() => setDisplayLimit(result.nodeAttribution.length)}>
              Show All ({result.nodeAttribution.length})
            </Button>
          )}
          {displayLimit > 30 && (
            <Button variant="outline" onClick={() => setDisplayLimit(30)}>
              Show Less
            </Button>
          )}
        </div>

        {/* Selected Node Info */}
        {selectedNode && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">
              {getCountryFlag(selectedNode)} {selectedNode}
            </h4>
            <p className="text-sm text-muted-foreground">
              Click on other nodes to explore transmission paths. Use controls to zoom and pan.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
          <p className="font-semibold">How to use:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Click and drag to pan the graph</li>
            <li>Scroll to zoom in/out</li>
            <li>Click nodes to select and highlight connections</li>
            <li>Toggle layers to show/hide different propagation levels</li>
            <li>Change layout to see different visualizations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
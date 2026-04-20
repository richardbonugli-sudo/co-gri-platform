/**
 * Propagation Graph Component
 * 
 * D3-based network visualization showing event propagation through trade relationships.
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PropagationNode {
  id: string;
  country: string;
  hop: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface PropagationLink {
  source: string | PropagationNode;
  target: string | PropagationNode;
  intensity: number;
}

interface PropagationGraphProps {
  nodes: PropagationNode[];
  links: PropagationLink[];
  width?: number;
  height?: number;
  originCountry: string;
}

export default function PropagationGraph({
  nodes,
  links,
  width = 800,
  height = 600,
  originCountry
}: PropagationGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<PropagationNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create arrow marker for directed edges
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')
      .style('stroke', 'none');

    // Create force simulation
    const simulation = d3.forceSimulation<PropagationNode>(nodes)
      .force('link', d3.forceLink<PropagationNode, PropagationLink>(links)
        .id(d => d.id)
        .distance(100)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create container for zoom
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: PropagationLink) => Math.max(1, d.intensity / 2))
      .attr('marker-end', 'url(#arrowhead)');

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, PropagationNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add circles
    node.append('circle')
      .attr('r', (d: PropagationNode) => d.hop === 0 ? 20 : 15)
      .attr('fill', (d: PropagationNode) => {
        if (d.hop === 0) return '#ef4444'; // Red for origin
        if (d.hop === 1) return '#f97316'; // Orange for hop 1
        if (d.hop === 2) return '#eab308'; // Yellow for hop 2
        return '#84cc16'; // Green for hop 3+
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d);
      });

    // Add labels
    node.append('text')
      .text((d: PropagationNode) => d.country)
      .attr('x', 0)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: PropagationLink & { source: PropagationNode }) => d.source.x || 0)
        .attr('y1', (d: PropagationLink & { source: PropagationNode }) => d.source.y || 0)
        .attr('x2', (d: PropagationLink & { target: PropagationNode }) => d.target.x || 0)
        .attr('y2', (d: PropagationLink & { target: PropagationNode }) => d.target.y || 0);

      node.attr('transform', (d: PropagationNode) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height]);

  return (
    <div className="space-y-4">
      <Card className="bg-[#0f1e2e] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Propagation Network</CardTitle>
          <CardDescription className="text-gray-200">
            Event propagation from {originCountry} through trade relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-200">Origin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-200">Hop 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-200">Hop 2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-lime-500"></div>
              <span className="text-sm text-gray-200">Hop 3+</span>
            </div>
          </div>
          
          <div className="bg-[#1a2332] rounded-lg overflow-hidden">
            <svg ref={svgRef} className="w-full" style={{ minHeight: height }}></svg>
          </div>

          {selectedNode && (
            <div className="mt-4 p-4 bg-[#1a2332] rounded border border-gray-700">
              <h3 className="text-white font-semibold mb-2">{selectedNode.country}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Hop:</span>
                  <Badge className={
                    selectedNode.hop === 0 ? 'bg-red-600' :
                    selectedNode.hop === 1 ? 'bg-orange-600' :
                    selectedNode.hop === 2 ? 'bg-yellow-600' :
                    'bg-lime-600'
                  }>
                    {selectedNode.hop === 0 ? 'Origin' : `Hop ${selectedNode.hop}`}
                  </Badge>
                </div>
                {selectedNode.hop === 0 && (
                  <p className="text-gray-300">This is the origin country where the event occurred.</p>
                )}
                {selectedNode.hop > 0 && (
                  <p className="text-gray-300">
                    Affected through {selectedNode.hop}-hop propagation via trade relationships.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#0f1e2e] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Network Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Total Countries</p>
              <p className="text-white text-2xl font-semibold">{nodes.length}</p>
            </div>
            <div>
              <p className="text-gray-400">Trade Links</p>
              <p className="text-white text-2xl font-semibold">{links.length}</p>
            </div>
            <div>
              <p className="text-gray-400">Max Hops</p>
              <p className="text-white text-2xl font-semibold">
                {Math.max(...nodes.map(n => n.hop))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
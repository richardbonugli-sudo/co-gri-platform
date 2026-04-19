import React, { useState } from 'react';
import { AuditDataTable } from '../shared/AuditDataTable';
import { DetectionStatusBadge } from './DetectionStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GroundTruthEvent, DetectionMatch, CSIRiskVector, CSIRiskVectorNames, DetectionStatus } from '@/types/audit.types';

interface GroundTruthEventListProps {
  events: GroundTruthEvent[];
  matches: DetectionMatch[];
  onExport?: () => void;
}

export function GroundTruthEventList({ events, matches, onExport }: GroundTruthEventListProps) {
  const [vectorFilter, setVectorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Combine events with their detection status
  const combinedData = events.map(event => {
    const match = matches.find(m => m.ground_truth_event_id === event.event_id);
    return {
      ...event,
      detection_status: match?.detection_status || DetectionStatus.NOT_DETECTED,
      routing_correct: match?.routing_correct || false
    };
  });

  // Apply filters
  const filteredData = combinedData.filter(item => {
    if (vectorFilter !== 'all' && item.primary_vector !== vectorFilter) return false;
    if (statusFilter !== 'all' && item.detection_status !== statusFilter) return false;
    return true;
  });

  const columns = [
    {
      key: 'event_date',
      label: 'Date',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString()
    },
    {
      key: 'event_name',
      label: 'Event',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'primary_vector',
      label: 'Vector',
      sortable: true,
      render: (value: CSIRiskVector) => (
        <span className="text-sm">{CSIRiskVectorNames[value]}</span>
      )
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (value: string) => (
        <Badge
          variant="outline"
          className={
            value === 'MAJOR'
              ? 'border-red-500 text-red-500'
              : value === 'MODERATE'
              ? 'border-yellow-500 text-yellow-500'
              : 'border-gray-500 text-gray-500'
          }
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'detection_status',
      label: 'Status',
      sortable: true,
      render: (value: DetectionStatus) => <DetectionStatusBadge status={value} />
    },
    {
      key: 'primary_country',
      label: 'Country',
      sortable: true
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Vector:</span>
          <Select value={vectorFilter} onValueChange={setVectorFilter}>
            <SelectTrigger className="w-[200px] bg-gray-900 border-gray-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="all">All Vectors</SelectItem>
              {Object.entries(CSIRiskVectorNames).map(([key, name]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] bg-gray-900 border-gray-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={DetectionStatus.DETECTED_CORRECT}>Detected</SelectItem>
              <SelectItem value={DetectionStatus.DETECTED_MISROUTED}>Misrouted</SelectItem>
              <SelectItem value={DetectionStatus.NOT_DETECTED}>Missed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <AuditDataTable
        data={filteredData}
        columns={columns}
        onExport={onExport}
        searchable={true}
      />
    </div>
  );
}
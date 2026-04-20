import React from 'react';
import { AuditDataTable } from '../shared/AuditDataTable';
import { Badge } from '@/components/ui/badge';
import { VectorTotals, CSIRiskVectorNames } from '@/types/audit.types';

interface MovementLedgerTableProps {
  data: VectorTotals[];
  onExport?: () => void;
}

export function MovementLedgerTable({ data, onExport }: MovementLedgerTableProps) {
  const columns = [
    {
      key: 'vector',
      label: 'Vector',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium">{CSIRiskVectorNames[value as keyof typeof CSIRiskVectorNames]}</span>
      )
    },
    {
      key: 'total_drift_points',
      label: 'Drift Points',
      sortable: true,
      render: (value: number) => value.toFixed(1)
    },
    {
      key: 'total_event_points',
      label: 'Event Points',
      sortable: true,
      render: (value: number) => value.toFixed(1)
    },
    {
      key: 'total_movement_points',
      label: 'Total Movement',
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-[#7fa89f]">{value.toFixed(1)}</span>
      )
    },
    {
      key: 'total_detected_items',
      label: 'Detected Items',
      sortable: true
    },
    {
      key: 'total_confirmed_items',
      label: 'Confirmed',
      sortable: true
    },
    {
      key: 'items_suppressed',
      label: 'Suppressed',
      sortable: true,
      render: (value: number) => (
        value > 10 ? (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            {value}
          </Badge>
        ) : (
          <span>{value}</span>
        )
      )
    }
  ];

  return (
    <AuditDataTable
      data={data}
      columns={columns}
      onExport={onExport}
      searchable={false}
    />
  );
}
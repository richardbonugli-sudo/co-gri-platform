import React from 'react';
import { AuditDataTable } from '../shared/AuditDataTable';
import { Badge } from '@/components/ui/badge';
import { BaselineFactor, CSIRiskVectorNames } from '@/types/audit.types';

interface BaselineFactorMatrixProps {
  data: BaselineFactor[];
  onExport?: () => void;
}

export function BaselineFactorMatrix({ data, onExport }: BaselineFactorMatrixProps) {
  const columns = [
    {
      key: 'country_name',
      label: 'Country',
      sortable: true
    },
    {
      key: 'vector',
      label: 'Vector',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm">{CSIRiskVectorNames[value as keyof typeof CSIRiskVectorNames]}</span>
      )
    },
    {
      key: 'factor_value',
      label: 'Factor Value',
      sortable: true,
      render: (value: number) => value.toFixed(2)
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-400">{value}</span>
      )
    },
    {
      key: 'fallback_type',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <Badge
          variant="outline"
          className={
            value === 'direct'
              ? 'border-green-500 text-green-500'
              : value === 'regional'
              ? 'border-yellow-500 text-yellow-500'
              : 'border-gray-500 text-gray-500'
          }
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'weight',
      label: 'Weight',
      sortable: true,
      render: (value: number) => value.toFixed(2)
    },
    {
      key: 'weighted_contribution',
      label: 'Weighted Contribution',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-[#7fa89f]">{value.toFixed(2)}</span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500 text-green-500">Direct</Badge>
          <span className="text-gray-400">Primary source data</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">Regional</Badge>
          <span className="text-gray-400">Regional average fallback</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-gray-500 text-gray-500">Neutral</Badge>
          <span className="text-gray-400">Neutral default value</span>
        </div>
      </div>
      <AuditDataTable
        data={data}
        columns={columns}
        onExport={onExport}
        searchable={true}
      />
    </div>
  );
}
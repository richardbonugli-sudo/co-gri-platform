import React from 'react';
import { Button } from '@/components/ui/button';
import { TimeWindow } from '@/types/audit.types';

interface AuditTimeRangeSelectorProps {
  value: TimeWindow;
  onChange: (timeWindow: TimeWindow) => void;
}

export function AuditTimeRangeSelector({ value, onChange }: AuditTimeRangeSelectorProps) {
  const presets: Array<{ label: string; type: TimeWindow['type'] }> = [
    { label: 'Last 90 Days', type: 'last_90_days' },
    { label: 'Last 12 Months', type: 'last_12_months' },
    { label: 'Last 24 Months', type: 'last_24_months' }
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400 mr-2">Time Range:</span>
      {presets.map((preset) => (
        <Button
          key={preset.type}
          variant={value.type === preset.type ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange({ type: preset.type })}
          className={
            value.type === preset.type
              ? 'bg-[#7fa89f] hover:bg-[#6a9080]'
              : 'border-gray-800 hover:bg-gray-800'
          }
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
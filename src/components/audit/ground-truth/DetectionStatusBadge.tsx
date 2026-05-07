import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { DetectionStatus } from '@/types/audit.types';

interface DetectionStatusBadgeProps {
  status: DetectionStatus;
}

export function DetectionStatusBadge({ status }: DetectionStatusBadgeProps) {
  const config = {
    [DetectionStatus.DETECTED_CORRECT]: {
      icon: CheckCircle,
      label: 'Detected',
      className: 'border-green-500 text-green-500'
    },
    [DetectionStatus.DETECTED_MISROUTED]: {
      icon: AlertTriangle,
      label: 'Misrouted',
      className: 'border-yellow-500 text-yellow-500'
    },
    [DetectionStatus.DETECTED_SUPPRESSED]: {
      icon: AlertTriangle,
      label: 'Suppressed',
      className: 'border-orange-500 text-orange-500'
    },
    [DetectionStatus.NOT_DETECTED]: {
      icon: XCircle,
      label: 'Missed',
      className: 'border-red-500 text-red-500'
    }
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
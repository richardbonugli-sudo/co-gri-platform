import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AuditSectionCardProps {
  sectionNumber: number;
  title: string;
  children: React.ReactNode;
  status?: 'pass' | 'fail' | 'warning';
  defaultExpanded?: boolean;
  anomalyCount?: number;
}

export function AuditSectionCard({
  sectionNumber,
  title,
  children,
  status = 'pass',
  defaultExpanded = false,
  anomalyCount = 0
}: AuditSectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const statusConfig = {
    pass: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    fail: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={`border-gray-800 ${config.borderColor}`}>
      <CardHeader
        className="cursor-pointer hover:bg-gray-900/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-[#7fa89f] text-[#7fa89f]">
              Section {sectionNumber}
            </Badge>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {anomalyCount > 0 && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                {anomalyCount} {anomalyCount === 1 ? 'Anomaly' : 'Anomalies'}
              </Badge>
            )}
            <div className={`flex items-center gap-2 ${config.color}`}>
              <StatusIcon className="h-5 w-5" />
              <span className="text-sm font-medium capitalize">{status}</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-6">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
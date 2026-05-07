import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AuditMetricCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  status?: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function AuditMetricCard({
  icon: Icon,
  value,
  label,
  status = 'good',
  trend,
  trendValue
}: AuditMetricCardProps) {
  const statusConfig = {
    good: {
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    warning: {
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    critical: {
      iconColor: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    }
  };

  const config = statusConfig[status];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <Card className={`border-gray-800 ${config.borderColor}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
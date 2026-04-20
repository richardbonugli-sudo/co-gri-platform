import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuditChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  height?: number;
}

export function AuditChartContainer({
  title,
  description,
  children,
  height = 400
}: AuditChartContainerProps) {
  return (
    <Card className="border-gray-800">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }} className="w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
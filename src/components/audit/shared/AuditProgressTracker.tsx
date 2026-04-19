import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AuditProgress } from '@/types/audit.types';

interface AuditProgressTrackerProps {
  progress: AuditProgress;
  onCancel?: () => void;
}

export function AuditProgressTracker({ progress, onCancel }: AuditProgressTrackerProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{progress.section_name}</span>
            <span className="text-muted-foreground">
              Section {progress.current_section} of {progress.total_sections}
            </span>
          </div>
          <Progress value={progress.percentage_complete} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.percentage_complete.toFixed(1)}% complete</span>
            <span>~{progress.estimated_time_remaining_seconds}s remaining</span>
          </div>
          {onCancel && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancel} 
              className="w-full mt-2"
            >
              Cancel Audit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
/**
 * Legacy Scenario Builder Component (Placeholder)
 * This is a placeholder to maintain backward compatibility with the old ScenarioMode.tsx
 * The new Scenario Mode implementation is in /pages/modes/ScenarioMode.tsx
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ScenarioBuilderProps {
  ticker: string;
}

const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({ ticker }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Builder</CardTitle>
        <CardDescription>Legacy component placeholder</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This is a legacy placeholder. The new Scenario Mode implementation is available at <strong>/scenario</strong> route.
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Analyzing: {ticker}</p>
          <p className="mt-2">The new Scenario Mode (Weeks 9-10) includes:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Custom scenario builder with initial shock configuration</li>
            <li>Propagation settings with depth and amplification controls</li>
            <li>Scenario results with company impact analysis</li>
            <li>Transmission trace visualization</li>
            <li>5 preset scenarios (Tech Decoupling, Oil Crisis, etc.)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioBuilder;
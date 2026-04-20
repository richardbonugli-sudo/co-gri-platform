'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  CheckCircle,
  Clock,
  Zap,
  Calendar
} from 'lucide-react';
import { getDataQualitySystem } from './SystemInitializer';

export function DataQualityManualControls() {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const system = getDataQualitySystem();

  useEffect(() => {
    updateStatus();
    
    // Update status every 30 seconds
    const interval = setInterval(updateStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = () => {
    const status = system.getStatus();
    setSystemStatus(status);
  };

  const handleRunMaintenance = async () => {
    setLoading(true);
    try {
      await system.runManualMaintenance();
      setLastAction('Manual maintenance completed successfully');
      updateStatus();
    } catch (error) {
      setLastAction(`Maintenance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    try {
      await system.restart();
      setLastAction('System restarted successfully');
      updateStatus();
    } catch (error) {
      setLastAction(`Restart failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!systemStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading system status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Data Quality System Control Panel
          </CardTitle>
          <CardDescription>
            Monitor and control the automated data quality system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={systemStatus.initialized ? 'default' : 'secondary'}>
                {systemStatus.initialized ? 'Initialized' : 'Not Initialized'}
              </Badge>
              {systemStatus.initialized && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={systemStatus.updaterRunning ? 'default' : 'outline'}>
                {systemStatus.updaterRunning ? 'Running' : 'Idle'}
              </Badge>
              {systemStatus.updaterRunning && <Zap className="w-4 h-4 text-yellow-500" />}
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Next: {systemStatus.nextUpdate ? 
                  new Date(systemStatus.nextUpdate).toLocaleDateString() : 
                  'Not scheduled'
                }
              </span>
            </div>
          </div>

          {/* Configuration Summary */}
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertTitle>Current Configuration</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1 text-sm">
                <div>Monthly Updates: <strong>{systemStatus.config.enabled ? 'Enabled' : 'Disabled'}</strong></div>
                <div>Schedule: <strong>{systemStatus.config.dayOfMonth}th of each month at {systemStatus.config.timeOfDay}</strong></div>
                <div>Auto-filtering: <strong>{systemStatus.config.autoFilterSuspiciousSegments ? 'Enabled' : 'Disabled'}</strong></div>
                <div>Quality Threshold: <strong>{systemStatus.config.qualityThresholdForAutoUpdate}/100</strong></div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Manual Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={handleRunMaintenance} 
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Run Manual Maintenance
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleRestart} 
              disabled={loading}
            >
              <Play className="w-4 h-4 mr-2" />
              Restart System
            </Button>
          </div>

          {/* Last Action Result */}
          {lastAction && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Last Action</AlertTitle>
              <AlertDescription>{lastAction}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>System Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">69</div>
              <div className="text-sm text-muted-foreground">Companies Monitored</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">15th</div>
              <div className="text-sm text-muted-foreground">Monthly Update Day</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">Auto</div>
              <div className="text-sm text-muted-foreground">Segment Filtering</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">60+</div>
              <div className="text-sm text-muted-foreground">Quality Threshold</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
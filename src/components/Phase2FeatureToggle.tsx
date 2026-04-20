/**
 * Phase 2 Feature Toggle Component - Phase 2 Task 5
 * 
 * Allows users to enable/disable Phase 2 features
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sparkles, TrendingUp, Brain, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { setFeatureFlag, getFeatureFlags } from '@/config/featureFlags';

interface Phase2FeatureToggleProps {
  onFeaturesChange?: () => void;
}

export function Phase2FeatureToggle({ onFeaturesChange }: Phase2FeatureToggleProps) {
  const [features, setFeatures] = React.useState(getFeatureFlags());
  
  const handleToggle = (feature: keyof typeof features) => {
    const newValue = !features[feature];
    setFeatureFlag(feature, newValue);
    setFeatures(getFeatureFlags());
    onFeaturesChange?.();
  };
  
  const featureList = [
    {
      key: 'enableChannelSpecificMultipliers' as const,
      icon: <Sparkles className="w-5 h-5 text-cyan-600" />,
      title: 'Channel-Specific Multipliers',
      description: 'Apply different risk multipliers for Revenue, Supply Chain, Assets, and Financial Operations channels',
      badge: 'Task 1',
      color: 'cyan'
    },
    {
      key: 'enableDynamicMultipliers' as const,
      icon: <TrendingUp className="w-5 h-5 text-teal-600" />,
      title: 'Dynamic Risk Adjustments',
      description: 'Real-time multiplier adjustments based on geopolitical events and market conditions',
      badge: 'Task 2',
      color: 'teal',
      requires: 'enableChannelSpecificMultipliers'
    },
    {
      key: 'enableMLCalibration' as const,
      icon: <Brain className="w-5 h-5 text-purple-600" />,
      title: 'ML-Based Calibration',
      description: 'AI-powered multiplier recommendations using historical data and predictive analytics',
      badge: 'Task 3',
      color: 'purple',
      requires: 'enableDynamicMultipliers'
    }
  ];

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-bold text-indigo-900">
            Phase 2 Features
          </CardTitle>
          <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-300">
            Advanced
          </Badge>
        </div>
        <CardDescription className="text-indigo-800">
          Enable advanced risk assessment features for more accurate COGRI scores
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* What's New */}
        <div className="p-4 bg-white rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-indigo-600" />
            <h4 className="font-semibold text-gray-900">What's New in Phase 2</h4>
          </div>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-1">•</span>
              <span><strong>Channel Multipliers:</strong> More granular risk assessment across four operational channels</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 mt-1">•</span>
              <span><strong>Dynamic Adjustments:</strong> Real-time risk updates based on current events</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span><strong>ML Calibration:</strong> Data-driven recommendations for optimal accuracy</span>
            </li>
          </ul>
        </div>
        
        {/* Feature Toggles */}
        <div className="space-y-3">
          {featureList.map((feature) => {
            const isEnabled = features[feature.key] as boolean;
            const requirementMet = !feature.requires || (features[feature.requires as keyof typeof features] as boolean);
            const isDisabled = !requirementMet;
            
            return (
              <div
                key={feature.key}
                className={`p-4 bg-white rounded-lg border transition-all ${
                  isEnabled
                    ? `border-${feature.color}-300 bg-${feature.color}-50`
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{feature.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-gray-900">{feature.title}</h5>
                        <Badge variant="outline" className={`bg-${feature.color}-100 text-${feature.color}-700 border-${feature.color}-300`}>
                          {feature.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                      
                      {isDisabled && feature.requires && (
                        <p className="text-xs text-orange-600 mt-2">
                          Requires: {featureList.find(f => f.key === feature.requires)?.title}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => handleToggle(feature.key)}
                            disabled={isDisabled}
                            className={isEnabled ? `data-[state=checked]:bg-${feature.color}-600` : ''}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isEnabled ? 'Disable' : 'Enable'} {feature.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Status Summary - FIXED: Convert boolean values to strings */}
        <div className="p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border border-indigo-200">
          <p className="text-sm text-indigo-900">
            <strong>Active Features:</strong>{' '}
            {[
              features.enableChannelSpecificMultipliers ? 'Channel Multipliers' : null,
              features.enableDynamicMultipliers ? 'Dynamic Adjustments' : null,
              features.enableMLCalibration ? 'ML Calibration' : null
            ].filter((item): item is string => item !== null).join(', ') || 'None'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
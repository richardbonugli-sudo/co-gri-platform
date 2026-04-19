/**
 * Company Components Index
 * Exports all company mode components with React.memo optimization
 * Part of CO-GRI Platform Phase 2 - Week 5
 */

import React from 'react';

// Import original components
import { CompanySummaryPanel as CompanySummaryPanelOriginal } from './CompanySummaryPanel';
import { COGRITrendChart as COGRITrendChartOriginal } from './COGRITrendChart';
import { RiskContributionMap as RiskContributionMapOriginal } from './RiskContributionMap';
import { ExposurePathways as ExposurePathwaysOriginal } from './ExposurePathways';
import { TopRelevantRisks as TopRelevantRisksOriginal } from './TopRelevantRisks';
import { PeerComparison as PeerComparisonOriginal } from './PeerComparison';
import { RiskAttribution as RiskAttributionOriginal } from './RiskAttribution';
import { TimelineEventFeed as TimelineEventFeedOriginal } from './TimelineEventFeed';
import { VerificationDrawer as VerificationDrawerOriginal } from './VerificationDrawer';

// Export memoized versions for performance
export const CompanySummaryPanel = React.memo(CompanySummaryPanelOriginal);
export const COGRITrendChart = React.memo(COGRITrendChartOriginal);
export const RiskContributionMap = React.memo(RiskContributionMapOriginal);
export const ExposurePathways = React.memo(ExposurePathwaysOriginal);
export const TopRelevantRisks = React.memo(TopRelevantRisksOriginal);
export const PeerComparison = React.memo(PeerComparisonOriginal);
export const RiskAttribution = React.memo(RiskAttributionOriginal);
export const TimelineEventFeed = React.memo(TimelineEventFeedOriginal);
export const VerificationDrawer = React.memo(VerificationDrawerOriginal);

// Export original components for testing
export {
  CompanySummaryPanelOriginal,
  COGRITrendChartOriginal,
  RiskContributionMapOriginal,
  ExposurePathwaysOriginal,
  TopRelevantRisksOriginal,
  PeerComparisonOriginal,
  RiskAttributionOriginal,
  TimelineEventFeedOriginal,
  VerificationDrawerOriginal
};
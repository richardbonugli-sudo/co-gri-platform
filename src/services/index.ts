/**
 * Services Index - V.4 Integration
 * 
 * Central export point for all services with V.4 integration support.
 */

// V.4 Services (new)
export * from './v4Integration';
export * from './cogriCalculationServiceV4';
export * from './geographicExposureServiceV4';
export * from './v34ComprehensiveIntegrationV4';

// Legacy Services (maintained for backward compatibility)
export * from './cogriCalculationService';
export * from './v34ComprehensiveIntegration';
export * from './channelSpecificCalculations';

// Feature Flags
export * from '../config/featureFlags';
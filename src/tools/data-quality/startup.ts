/**
 * Data Quality System Startup Script
 * 
 * Auto-initializes the data quality system when the application starts
 */

import { initializeDataQualitySystem } from './SystemInitializer';

// Auto-initialize when this module is imported
let initializationPromise: Promise<void> | null = null;

export async function startDataQualitySystem(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('🎯 Starting Data Quality System...');
      const system = await initializeDataQualitySystem();
      
      const status = system.getStatus();
      console.log('🎉 Data Quality System is now active!');
      console.log(`Next monthly update: ${status.nextUpdate?.toLocaleString()}`);
      
      // Register cleanup on process exit
      process.on('SIGINT', () => {
        console.log('🛑 Shutting down Data Quality System...');
        system.stop();
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ Failed to start Data Quality System:', error);
      throw error;
    }
  })();

  return initializationPromise;
}

// Auto-start the system (with error handling)
startDataQualitySystem().catch(error => {
  console.error('Data Quality System startup failed:', error);
});
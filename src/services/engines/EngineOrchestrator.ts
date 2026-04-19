/**
 * Engine Orchestration Layer
 * Routes requests to appropriate engines and coordinates cross-engine integration
 * Part of CO-GRI Platform Phase 3 - Week 6
 * 
 * Implements Part 2.2: Engine Routing and Integration
 */

import { Mode } from '@/store/globalState';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Available engines in the platform
 */
export type EngineType = 
  | 'COGRI'           // CO-GRI calculation engine
  | 'Forecast'        // Forecast engine
  | 'Scenario'        // Scenario engine
  | 'Propagation'     // Risk propagation engine
  | 'Trading'         // Trading signal engine
  | 'Portfolio';      // Portfolio analysis engine

/**
 * Engine activation level
 */
export type ActivationLevel = 'Primary' | 'Secondary' | 'Inactive';

/**
 * Engine activation matrix entry
 */
export interface EngineActivation {
  engine: EngineType;
  level: ActivationLevel;
  purpose: string;
}

/**
 * Engine routing context
 */
export interface EngineContext {
  mode: Mode;
  entityType?: 'country' | 'company' | 'sector' | 'portfolio';
  entityId?: string;
  timeWindow?: string;
  additionalParams?: Record<string, any>;
}

/**
 * Engine integration result
 */
export interface EngineIntegrationResult {
  primaryEngine: EngineType;
  secondaryEngines: EngineType[];
  data: any;
  metadata: {
    executionTime: number;
    dataSource: string;
    confidence?: number;
  };
}

// ============================================================================
// ENGINE ROUTING MATRIX (Part 2.2 Specification)
// ============================================================================

/**
 * Engine activation matrix by mode
 * Defines which engines are active in each operational mode
 */
const ENGINE_ROUTING_MATRIX: Record<Mode, EngineActivation[]> = {
  'Country': [
    { engine: 'COGRI', level: 'Primary', purpose: 'Country risk calculation' },
    { engine: 'Propagation', level: 'Secondary', purpose: 'Regional risk spillover' },
    { engine: 'Forecast', level: 'Inactive', purpose: 'Not used in Country Mode' },
    { engine: 'Scenario', level: 'Inactive', purpose: 'Not used in Country Mode' },
    { engine: 'Trading', level: 'Inactive', purpose: 'Not used in Country Mode' },
    { engine: 'Portfolio', level: 'Inactive', purpose: 'Not used in Country Mode' }
  ],
  
  'Company': [
    { engine: 'COGRI', level: 'Primary', purpose: 'Company CO-GRI calculation' },
    { engine: 'Forecast', level: 'Secondary', purpose: 'Forecast overlay lens' },
    { engine: 'Scenario', level: 'Secondary', purpose: 'Scenario shock lens' },
    { engine: 'Trading', level: 'Secondary', purpose: 'Trading signal lens' },
    { engine: 'Propagation', level: 'Inactive', purpose: 'Not used in Company Mode' },
    { engine: 'Portfolio', level: 'Inactive', purpose: 'Not used in Company Mode' }
  ],
  
  'Forecast': [
    { engine: 'Forecast', level: 'Primary', purpose: 'Event forecasting and impact analysis' },
    { engine: 'COGRI', level: 'Secondary', purpose: 'Baseline risk calculation' },
    { engine: 'Propagation', level: 'Secondary', purpose: 'Event propagation modeling' },
    { engine: 'Scenario', level: 'Inactive', purpose: 'Not used in Forecast Mode' },
    { engine: 'Trading', level: 'Inactive', purpose: 'Not used in Forecast Mode' },
    { engine: 'Portfolio', level: 'Inactive', purpose: 'Not used in Forecast Mode' }
  ],
  
  'Scenario': [
    { engine: 'Scenario', level: 'Primary', purpose: 'Custom scenario modeling' },
    { engine: 'COGRI', level: 'Secondary', purpose: 'Baseline risk calculation' },
    { engine: 'Propagation', level: 'Secondary', purpose: 'Scenario impact propagation' },
    { engine: 'Forecast', level: 'Inactive', purpose: 'Not used in Scenario Mode' },
    { engine: 'Trading', level: 'Inactive', purpose: 'Not used in Scenario Mode' },
    { engine: 'Portfolio', level: 'Inactive', purpose: 'Not used in Scenario Mode' }
  ],
  
  'Trading': [
    { engine: 'Trading', level: 'Primary', purpose: 'Trading signal generation' },
    { engine: 'COGRI', level: 'Secondary', purpose: 'Risk-adjusted signals' },
    { engine: 'Forecast', level: 'Secondary', purpose: 'Forward-looking signals' },
    { engine: 'Portfolio', level: 'Secondary', purpose: 'Portfolio optimization' },
    { engine: 'Scenario', level: 'Inactive', purpose: 'Not used in Trading Mode' },
    { engine: 'Propagation', level: 'Inactive', purpose: 'Not used in Trading Mode' }
  ]
};

// ============================================================================
// ENGINE ORCHESTRATOR CLASS
// ============================================================================

class EngineOrchestratorService {
  /**
   * Route request to appropriate engine based on mode and context
   */
  routeToEngine(context: EngineContext): EngineType {
    const activations = ENGINE_ROUTING_MATRIX[context.mode];
    const primaryEngine = activations.find(a => a.level === 'Primary');
    
    if (!primaryEngine) {
      throw new Error(`No primary engine defined for mode: ${context.mode}`);
    }
    
    return primaryEngine.engine;
  }
  
  /**
   * Get engine activation matrix for a specific mode
   */
  getEngineActivation(mode: Mode): EngineActivation[] {
    return ENGINE_ROUTING_MATRIX[mode];
  }
  
  /**
   * Get active engines for a mode (Primary + Secondary)
   */
  getActiveEngines(mode: Mode): EngineType[] {
    const activations = ENGINE_ROUTING_MATRIX[mode];
    return activations
      .filter(a => a.level === 'Primary' || a.level === 'Secondary')
      .map(a => a.engine);
  }
  
  /**
   * Get primary engine for a mode
   */
  getPrimaryEngine(mode: Mode): EngineType {
    const activations = ENGINE_ROUTING_MATRIX[mode];
    const primary = activations.find(a => a.level === 'Primary');
    
    if (!primary) {
      throw new Error(`No primary engine for mode: ${mode}`);
    }
    
    return primary.engine;
  }
  
  /**
   * Get secondary engines for a mode
   */
  getSecondaryEngines(mode: Mode): EngineType[] {
    const activations = ENGINE_ROUTING_MATRIX[mode];
    return activations
      .filter(a => a.level === 'Secondary')
      .map(a => a.engine);
  }
  
  /**
   * Integrate multiple engines for cross-engine analysis
   * 
   * @param primary - Primary engine type
   * @param secondary - Array of secondary engine types
   * @param context - Engine context with parameters
   * @returns Integration result with combined data
   */
  async integrateEngines(
    primary: EngineType,
    secondary: EngineType[],
    context: EngineContext
  ): Promise<EngineIntegrationResult> {
    const startTime = Date.now();
    
    try {
      // Execute primary engine
      const primaryData = await this.executeEngine(primary, context);
      
      // Execute secondary engines in parallel
      const secondaryResults = await Promise.all(
        secondary.map(engine => this.executeEngine(engine, context))
      );
      
      // Integrate results
      const integratedData = this.mergeEngineResults(primaryData, secondaryResults);
      
      const executionTime = Date.now() - startTime;
      
      return {
        primaryEngine: primary,
        secondaryEngines: secondary,
        data: integratedData,
        metadata: {
          executionTime,
          dataSource: 'Multi-engine integration',
          confidence: this.calculateConfidence(primaryData, secondaryResults)
        }
      };
    } catch (error) {
      console.error('Engine integration error:', error);
      throw new Error(`Failed to integrate engines: ${error instanceof Error ? error.message : String(error)}`, {
        cause: error
      });
    }
  }
  
  /**
   * Execute a single engine
   * 
   * @param engine - Engine type to execute
   * @param context - Engine context with parameters
   * @returns Engine execution result
   */
  private async executeEngine(engine: EngineType, context: EngineContext): Promise<any> {
    // Placeholder implementation - will be replaced with actual engine calls
    console.log(`Executing ${engine} engine with context:`, context);
    
    // Simulate async execution
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      engine,
      status: 'success',
      data: {},
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Merge results from multiple engines
   */
  private mergeEngineResults(primary: any, secondary: any[]): any {
    return {
      primary,
      secondary,
      merged: true,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Calculate confidence score for integrated results
   */
  private calculateConfidence(primary: any, secondary: any[]): number {
    // Placeholder - implement actual confidence calculation
    return 0.85;
  }
  
  /**
   * Validate engine compatibility
   * 
   * @param engines - Array of engines to validate
   * @returns True if engines are compatible
   */
  validateEngineCompatibility(engines: EngineType[]): boolean {
    // Placeholder - implement actual compatibility checks
    return true;
  }
  
  /**
   * Get engine description
   */
  getEngineDescription(engine: EngineType): string {
    const descriptions: Record<EngineType, string> = {
      'COGRI': 'CO-GRI calculation engine for geopolitical risk assessment',
      'Forecast': 'Forward-looking event forecasting and impact analysis',
      'Scenario': 'Custom scenario modeling and stress testing',
      'Propagation': 'Risk propagation and spillover analysis',
      'Trading': 'Trading signal generation and investment decision support',
      'Portfolio': 'Portfolio optimization and risk-adjusted allocation'
    };
    return descriptions[engine];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const engineOrchestrator = new EngineOrchestratorService();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an engine is active in a specific mode
 */
export function isEngineActive(mode: Mode, engine: EngineType): boolean {
  const activations = ENGINE_ROUTING_MATRIX[mode];
  const activation = activations.find(a => a.engine === engine);
  return activation ? activation.level !== 'Inactive' : false;
}

/**
 * Get engine activation level in a specific mode
 */
export function getEngineLevel(mode: Mode, engine: EngineType): ActivationLevel {
  const activations = ENGINE_ROUTING_MATRIX[mode];
  const activation = activations.find(a => a.engine === engine);
  return activation ? activation.level : 'Inactive';
}

/**
 * Get engine purpose in a specific mode
 */
export function getEnginePurpose(mode: Mode, engine: EngineType): string {
  const activations = ENGINE_ROUTING_MATRIX[mode];
  const activation = activations.find(a => a.engine === engine);
  return activation ? activation.purpose : 'Not available';
}
/**
 * CSI Implementation Verification - Vector Router
 * Phase 1A: Exactly-one-vector enforcement for signal classification
 */

import {
  CSIRiskVector,
  CSIRiskVectorNames,
  SignalProcessed,
  QuarantinedSignal,
  SourceRole
} from '../types/CSITypes';
import { csiDatabase } from '../storage/CSIDatabase';

// ============================================================================
// SIGNAL TYPE TO VECTOR MAPPING
// ============================================================================

/**
 * Signal type definitions with vector assignments
 */
interface SignalTypeDefinition {
  signal_type: string;
  primary_vector: CSIRiskVector;
  keywords: string[];
  description: string;
}

/**
 * Comprehensive signal type to vector mapping
 * Each signal type maps to EXACTLY ONE vector
 */
const SIGNAL_TYPE_MAPPINGS: SignalTypeDefinition[] = [
  // Conflict & Security (v1)
  { signal_type: 'military_mobilization', primary_vector: CSIRiskVector.CONFLICT_SECURITY, keywords: ['military', 'troops', 'mobilization', 'deployment', 'armed forces'], description: 'Military troop movements or mobilization' },
  { signal_type: 'military_exercise', primary_vector: CSIRiskVector.CONFLICT_SECURITY, keywords: ['military exercise', 'war games', 'naval exercise', 'air defense drill'], description: 'Military exercises or drills' },
  { signal_type: 'border_tension', primary_vector: CSIRiskVector.CONFLICT_SECURITY, keywords: ['border', 'territorial', 'incursion', 'violation'], description: 'Border tensions or violations' },
  { signal_type: 'armed_conflict', primary_vector: CSIRiskVector.CONFLICT_SECURITY, keywords: ['conflict', 'fighting', 'combat', 'war', 'hostilities'], description: 'Armed conflict or hostilities' },
  { signal_type: 'terrorism_threat', primary_vector: CSIRiskVector.CONFLICT_SECURITY, keywords: ['terrorism', 'terrorist', 'attack threat', 'extremist'], description: 'Terrorism threats or attacks' },
  { signal_type: 'sovereignty_threat', primary_vector: CSIRiskVector.CONFLICT_SECURITY, keywords: ['sovereignty', 'annexation', 'territorial claim', 'independence threat'], description: 'Threats to national sovereignty' },
  { signal_type: 'defense_escalation', primary_vector: CSIRiskVector.CONFLICT_SECURITY, keywords: ['defense', 'weapons', 'arms buildup', 'missile'], description: 'Defense buildup or weapons escalation' },
  
  // Sanctions & Regulatory Pressure (v2)
  { signal_type: 'sanctions_threat', primary_vector: CSIRiskVector.SANCTIONS_REGULATORY, keywords: ['sanctions', 'sanction threat', 'punitive measures', 'economic pressure'], description: 'Sanctions threats or warnings' },
  { signal_type: 'sanctions_imposed', primary_vector: CSIRiskVector.SANCTIONS_REGULATORY, keywords: ['sanctions imposed', 'sanctions enacted', 'blacklist', 'designated'], description: 'Sanctions formally imposed' },
  { signal_type: 'export_controls', primary_vector: CSIRiskVector.SANCTIONS_REGULATORY, keywords: ['export control', 'export ban', 'export restriction', 'strategic goods'], description: 'Export control measures' },
  { signal_type: 'asset_freeze', primary_vector: CSIRiskVector.SANCTIONS_REGULATORY, keywords: ['asset freeze', 'frozen assets', 'seizure'], description: 'Asset freezes or seizures' },
  { signal_type: 'visa_ban', primary_vector: CSIRiskVector.SANCTIONS_REGULATORY, keywords: ['visa ban', 'travel ban', 'entry restriction'], description: 'Visa or travel bans' },
  { signal_type: 'regulatory_investigation', primary_vector: CSIRiskVector.SANCTIONS_REGULATORY, keywords: ['investigation', 'regulatory probe', 'compliance review'], description: 'Regulatory investigations' },
  { signal_type: 'secondary_sanctions', primary_vector: CSIRiskVector.SANCTIONS_REGULATORY, keywords: ['secondary sanctions', 'third-party sanctions'], description: 'Secondary sanctions threats' },
  
  // Trade & Logistics Disruption (v3)
  { signal_type: 'tariff_threat', primary_vector: CSIRiskVector.TRADE_LOGISTICS, keywords: ['tariff', 'duty', 'import tax', 'trade barrier'], description: 'Tariff threats or announcements' },
  { signal_type: 'tariff_imposed', primary_vector: CSIRiskVector.TRADE_LOGISTICS, keywords: ['tariff imposed', 'tariff enacted', 'duty applied'], description: 'Tariffs formally imposed' },
  { signal_type: 'trade_restriction', primary_vector: CSIRiskVector.TRADE_LOGISTICS, keywords: ['trade restriction', 'import ban', 'quota'], description: 'Trade restrictions or quotas' },
  { signal_type: 'supply_chain_disruption', primary_vector: CSIRiskVector.TRADE_LOGISTICS, keywords: ['supply chain', 'logistics', 'shipping disruption', 'port closure'], description: 'Supply chain disruptions' },
  { signal_type: 'trade_war_escalation', primary_vector: CSIRiskVector.TRADE_LOGISTICS, keywords: ['trade war', 'trade dispute', 'retaliation'], description: 'Trade war escalation' },
  { signal_type: 'infrastructure_threat', primary_vector: CSIRiskVector.TRADE_LOGISTICS, keywords: ['infrastructure', 'pipeline', 'critical infrastructure'], description: 'Infrastructure threats' },
  { signal_type: 'commodity_restriction', primary_vector: CSIRiskVector.TRADE_LOGISTICS, keywords: ['commodity', 'rare earth', 'critical minerals', 'resource restriction'], description: 'Commodity or resource restrictions' },
  
  // Governance & Rule of Law (v4)
  { signal_type: 'regime_instability', primary_vector: CSIRiskVector.GOVERNANCE_RULE_OF_LAW, keywords: ['regime', 'government collapse', 'political crisis', 'leadership'], description: 'Regime instability signals' },
  { signal_type: 'constitutional_crisis', primary_vector: CSIRiskVector.GOVERNANCE_RULE_OF_LAW, keywords: ['constitutional', 'constitution', 'legal crisis'], description: 'Constitutional or legal crises' },
  { signal_type: 'judicial_interference', primary_vector: CSIRiskVector.GOVERNANCE_RULE_OF_LAW, keywords: ['judicial', 'court', 'judiciary', 'legal system'], description: 'Judicial interference' },
  { signal_type: 'election_dispute', primary_vector: CSIRiskVector.GOVERNANCE_RULE_OF_LAW, keywords: ['election', 'vote', 'electoral', 'ballot'], description: 'Election disputes' },
  { signal_type: 'corruption_scandal', primary_vector: CSIRiskVector.GOVERNANCE_RULE_OF_LAW, keywords: ['corruption', 'bribery', 'scandal', 'embezzlement'], description: 'Corruption scandals' },
  { signal_type: 'governance_pressure', primary_vector: CSIRiskVector.GOVERNANCE_RULE_OF_LAW, keywords: ['governance', 'autonomy', 'self-determination'], description: 'Governance pressure' },
  
  // Cyber & Data Sovereignty (v5)
  { signal_type: 'cyber_attack', primary_vector: CSIRiskVector.CYBER_DATA, keywords: ['cyber attack', 'hack', 'breach', 'malware', 'ransomware'], description: 'Cyber attacks' },
  { signal_type: 'data_breach', primary_vector: CSIRiskVector.CYBER_DATA, keywords: ['data breach', 'data leak', 'information theft'], description: 'Data breaches' },
  { signal_type: 'data_localization', primary_vector: CSIRiskVector.CYBER_DATA, keywords: ['data localization', 'data sovereignty', 'data residency'], description: 'Data localization requirements' },
  { signal_type: 'tech_ban', primary_vector: CSIRiskVector.CYBER_DATA, keywords: ['tech ban', 'technology restriction', 'app ban'], description: 'Technology bans' },
  { signal_type: 'espionage', primary_vector: CSIRiskVector.CYBER_DATA, keywords: ['espionage', 'spy', 'intelligence', 'surveillance'], description: 'Espionage activities' },
  
  // Public Unrest & Civil Stability (v6)
  { signal_type: 'mass_protest', primary_vector: CSIRiskVector.PUBLIC_UNREST, keywords: ['protest', 'demonstration', 'rally', 'march'], description: 'Mass protests' },
  { signal_type: 'strike', primary_vector: CSIRiskVector.PUBLIC_UNREST, keywords: ['strike', 'walkout', 'labor action', 'work stoppage'], description: 'Strikes or labor actions' },
  { signal_type: 'civil_unrest', primary_vector: CSIRiskVector.PUBLIC_UNREST, keywords: ['unrest', 'riot', 'violence', 'clashes'], description: 'Civil unrest' },
  { signal_type: 'social_tension', primary_vector: CSIRiskVector.PUBLIC_UNREST, keywords: ['social tension', 'polarization', 'division'], description: 'Social tensions' },
  
  // Currency & Capital Controls (v7)
  { signal_type: 'capital_controls', primary_vector: CSIRiskVector.CURRENCY_CAPITAL, keywords: ['capital control', 'capital restriction', 'capital flow'], description: 'Capital controls' },
  { signal_type: 'fx_restriction', primary_vector: CSIRiskVector.CURRENCY_CAPITAL, keywords: ['foreign exchange', 'fx restriction', 'currency control'], description: 'FX restrictions' },
  { signal_type: 'currency_crisis', primary_vector: CSIRiskVector.CURRENCY_CAPITAL, keywords: ['currency crisis', 'devaluation', 'currency collapse'], description: 'Currency crises' },
  { signal_type: 'banking_restriction', primary_vector: CSIRiskVector.CURRENCY_CAPITAL, keywords: ['banking', 'bank restriction', 'financial restriction'], description: 'Banking restrictions' }
];

// ============================================================================
// VECTOR ROUTER CLASS
// ============================================================================

/**
 * Vector Router - classifies signals to exactly one CSI risk vector
 */
export class VectorRouter {
  private static instance: VectorRouter;
  private signalTypeMappings: Map<string, SignalTypeDefinition>;

  private constructor() {
    this.signalTypeMappings = new Map();
    for (const mapping of SIGNAL_TYPE_MAPPINGS) {
      this.signalTypeMappings.set(mapping.signal_type, mapping);
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): VectorRouter {
    if (!VectorRouter.instance) {
      VectorRouter.instance = new VectorRouter();
    }
    return VectorRouter.instance;
  }

  /**
   * Classify a signal to exactly one vector
   * Returns the vector ID or null if unclassifiable (quarantine)
   */
  public classifySignalToVector(
    signalContent: string,
    signalType?: string,
    metadata?: Record<string, unknown>
  ): { vectorId: CSIRiskVector | null; confidence: number; signalType: string } {
    // If signal type is provided and known, use direct mapping
    if (signalType && this.signalTypeMappings.has(signalType)) {
      const mapping = this.signalTypeMappings.get(signalType)!;
      return {
        vectorId: mapping.primary_vector,
        confidence: 1.0,
        signalType: signalType
      };
    }

    // Otherwise, use keyword-based classification
    const contentLower = signalContent.toLowerCase();
    let bestMatch: { mapping: SignalTypeDefinition; score: number } | null = null;

    for (const mapping of SIGNAL_TYPE_MAPPINGS) {
      let score = 0;
      for (const keyword of mapping.keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { mapping, score };
      }
    }

    if (bestMatch && bestMatch.score >= 1) {
      // Calculate confidence based on keyword matches
      const confidence = Math.min(1.0, bestMatch.score / 3);
      return {
        vectorId: bestMatch.mapping.primary_vector,
        confidence,
        signalType: bestMatch.mapping.signal_type
      };
    }

    // Unable to classify - will be quarantined
    return {
      vectorId: null,
      confidence: 0,
      signalType: 'unknown'
    };
  }

  /**
   * Validate that a signal has exactly one vector assignment
   * This is a hard constraint - signals MUST have exactly one vector
   */
  public validateSingleVectorAssignment(signal: SignalProcessed): boolean {
    // Check that vector_id is set and is a valid CSI risk vector
    if (!signal.vector_id) {
      return false;
    }
    
    const validVectors = Object.values(CSIRiskVector);
    return validVectors.includes(signal.vector_id);
  }

  /**
   * Quarantine an unclassifiable signal for manual review
   */
  public quarantineSignal(
    signalId: string,
    rawData: Record<string, unknown>,
    reason: string
  ): QuarantinedSignal {
    // Suggest possible vectors based on partial matches
    const suggestedVectors = this.suggestVectors(rawData);

    const quarantined: QuarantinedSignal = {
      quarantine_id: `quarantine_${signalId}_${Date.now()}`,
      signal_id: signalId,
      reason,
      raw_data: rawData,
      suggested_vectors: suggestedVectors,
      review_status: 'pending',
      created_at: new Date()
    };

    csiDatabase.saveQuarantinedSignal(quarantined);
    return quarantined;
  }

  /**
   * Suggest possible vectors for a quarantined signal
   */
  private suggestVectors(rawData: Record<string, unknown>): CSIRiskVector[] {
    const suggestions: Set<CSIRiskVector> = new Set();
    const content = JSON.stringify(rawData).toLowerCase();

    for (const mapping of SIGNAL_TYPE_MAPPINGS) {
      for (const keyword of mapping.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          suggestions.add(mapping.primary_vector);
          break;
        }
      }
    }

    return Array.from(suggestions);
  }

  /**
   * Get all signal types for a specific vector
   */
  public getSignalTypesForVector(vectorId: CSIRiskVector): string[] {
    return SIGNAL_TYPE_MAPPINGS
      .filter(m => m.primary_vector === vectorId)
      .map(m => m.signal_type);
  }

  /**
   * Get vector for a known signal type
   */
  public getVectorForSignalType(signalType: string): CSIRiskVector | null {
    const mapping = this.signalTypeMappings.get(signalType);
    return mapping ? mapping.primary_vector : null;
  }

  /**
   * Validate source role can generate signals
   * Detection sources ONLY can generate signals
   */
  public validateSourceCanGenerateSignal(sourceRole: SourceRole): boolean {
    return sourceRole === SourceRole.DETECTION;
  }

  /**
   * Validate source role can confirm events
   * Confirmation sources ONLY can confirm events
   */
  public validateSourceCanConfirmEvent(sourceRole: SourceRole): boolean {
    return sourceRole === SourceRole.CONFIRMATION;
  }

  /**
   * Get all available signal type mappings
   */
  public getAllSignalTypeMappings(): SignalTypeDefinition[] {
    return [...SIGNAL_TYPE_MAPPINGS];
  }

  /**
   * Get vector name
   */
  public getVectorName(vectorId: CSIRiskVector): string {
    return CSIRiskVectorNames[vectorId];
  }
}

// Export singleton instance
export const vectorRouter = VectorRouter.getInstance();
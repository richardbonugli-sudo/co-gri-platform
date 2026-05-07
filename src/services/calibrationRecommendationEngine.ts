/**
 * Calibration Recommendation Engine
 * 
 * Analyzes ML predictions and generates actionable multiplier adjustment recommendations
 * with detailed rationale, impact analysis, and human-in-the-loop approval workflow.
 * 
 * Phase 2 Task 3 - Part 4 of 5
 */

import { mlPredictionService, type MultiplierPrediction, type PredictionComparison } from './mlPredictionService';
import { mlModelTrainer, type TrainedModel } from './mlModelTrainer';
import { sectorClassificationService } from './sectorClassificationService';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationStatus = 'pending' | 'approved' | 'rejected' | 'implemented';
export type ApprovalLevel = 'auto' | 'analyst' | 'manager' | 'executive';

export interface MultiplierRecommendation {
  id: string;
  ticker: string;
  sector: string;
  timestamp: Date;
  
  // Current state
  currentMultipliers: {
    sector: number;
    channel: number;
    dynamic: number;
    total: number;
  };
  
  // Recommended changes
  recommendedMultipliers: {
    sector: number;
    channel: number;
    dynamic: number;
    total: number;
  };
  
  // Changes
  changes: {
    sectorChange: number;
    channelChange: number;
    dynamicChange: number;
    totalChange: number;
    percentageChange: number;
  };
  
  // ML prediction details
  mlPrediction: MultiplierPrediction;
  mlConfidence: number;
  
  // Rationale
  rationale: {
    primary: string;
    secondary: string[];
    dataSupport: string[];
    riskFactors: string[];
  };
  
  // Impact analysis
  impact: {
    expectedScoreChange: number;
    expectedRiskLevelChange?: string;
    affectedAssessments: number;
    confidenceLevel: number;
  };
  
  // Prioritization
  priority: RecommendationPriority;
  urgency: number; // 0-10 scale
  
  // Approval workflow
  approvalRequired: ApprovalLevel;
  status: RecommendationStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Implementation
  implementedAt?: Date;
  actualOutcome?: {
    scoreChange: number;
    riskLevelChange?: string;
    accuracy: number;
  };
}

export interface RecommendationBatch {
  batchId: string;
  createdAt: Date;
  recommendations: MultiplierRecommendation[];
  summary: {
    totalRecommendations: number;
    byPriority: Record<RecommendationPriority, number>;
    byStatus: Record<RecommendationStatus, number>;
    avgConfidence: number;
    totalExpectedImpact: number;
  };
}

export interface ApprovalRequest {
  recommendationId: string;
  requestedBy: string;
  requestedAt: Date;
  requiredLevel: ApprovalLevel;
  justification: string;
  supportingData: {
    modelMetrics: {
      r2Score: number;
      mae: number;
      confidence: number;
    };
    historicalAccuracy?: number;
    similarCases?: string[];
  };
}

export interface ApprovalDecision {
  recommendationId: string;
  approvedBy: string;
  approvedAt: Date;
  decision: 'approved' | 'rejected' | 'needs_revision';
  comments: string;
  conditions?: string[];
}

export interface ImpactAnalysis {
  ticker: string;
  currentScore: number;
  projectedScore: number;
  scoreChange: number;
  percentageChange: number;
  
  riskLevelChange: {
    current: string;
    projected: string;
    changed: boolean;
  };
  
  confidence: {
    predictionConfidence: number;
    modelConfidence: number;
    overallConfidence: number;
  };
  
  sensitivity: {
    optimistic: number;
    expected: number;
    pessimistic: number;
  };
  
  affectedMetrics: {
    metric: string;
    currentValue: number;
    projectedValue: number;
    change: number;
  }[];
}

// ============================================================================
// Calibration Recommendation Engine Service
// ============================================================================

class CalibrationRecommendationEngineService {
  private recommendations: Map<string, MultiplierRecommendation> = new Map();
  private batches: Map<string, RecommendationBatch> = new Map();
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  
  /**
   * Generate calibration recommendation for a ticker
   */
  public generateRecommendation(
    ticker: string,
    sector: string,
    currentMultipliers: {
      sector: number;
      channel: number;
      dynamic: number;
    },
    mlPrediction: MultiplierPrediction,
    rawScore: number
  ): MultiplierRecommendation {
    console.log(`[Calibration Engine] Generating recommendation for ${ticker}`);
    
    // Calculate recommended multipliers
    const recommendedDynamic = mlPrediction.predictedMultiplier;
    const recommendedTotal = currentMultipliers.sector * currentMultipliers.channel * (1 + recommendedDynamic);
    const currentTotal = currentMultipliers.sector * currentMultipliers.channel * (1 + currentMultipliers.dynamic);
    
    // Calculate changes
    const dynamicChange = recommendedDynamic - currentMultipliers.dynamic;
    const totalChange = recommendedTotal - currentTotal;
    const percentageChange = (totalChange / currentTotal) * 100;
    
    // Generate rationale
    const rationale = this.generateRationale(
      ticker,
      sector,
      currentMultipliers,
      mlPrediction,
      dynamicChange
    );
    
    // Perform impact analysis
    const impact = this.analyzeImpact(
      ticker,
      rawScore,
      currentTotal,
      recommendedTotal,
      mlPrediction.confidence
    );
    
    // Determine priority and urgency
    const { priority, urgency } = this.determinePriority(
      Math.abs(dynamicChange),
      mlPrediction.confidence,
      impact.expectedScoreChange
    );
    
    // Determine approval level required
    const approvalRequired = this.determineApprovalLevel(
      priority,
      Math.abs(dynamicChange),
      mlPrediction.confidence
    );
    
    // Create recommendation
    const recommendationId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const recommendation: MultiplierRecommendation = {
      id: recommendationId,
      ticker,
      sector,
      timestamp: new Date(),
      currentMultipliers: {
        sector: currentMultipliers.sector,
        channel: currentMultipliers.channel,
        dynamic: currentMultipliers.dynamic,
        total: currentTotal,
      },
      recommendedMultipliers: {
        sector: currentMultipliers.sector,
        channel: currentMultipliers.channel,
        dynamic: recommendedDynamic,
        total: recommendedTotal,
      },
      changes: {
        sectorChange: 0,
        channelChange: 0,
        dynamicChange,
        totalChange,
        percentageChange,
      },
      mlPrediction,
      mlConfidence: mlPrediction.confidence,
      rationale,
      impact,
      priority,
      urgency,
      approvalRequired,
      status: 'pending',
    };
    
    // Store recommendation
    this.recommendations.set(recommendationId, recommendation);
    
    console.log(`[Calibration Engine] Recommendation ${recommendationId} generated`);
    console.log(`  Priority: ${priority} (Urgency: ${urgency}/10)`);
    console.log(`  Dynamic adjustment change: ${dynamicChange > 0 ? '+' : ''}${dynamicChange.toFixed(4)}`);
    console.log(`  Expected score impact: ${impact.expectedScoreChange > 0 ? '+' : ''}${impact.expectedScoreChange.toFixed(2)}`);
    console.log(`  Approval required: ${approvalRequired}`);
    
    return recommendation;
  }
  
  /**
   * Generate detailed rationale for recommendation
   */
  private generateRationale(
    ticker: string,
    sector: string,
    currentMultipliers: { sector: number; channel: number; dynamic: number },
    mlPrediction: MultiplierPrediction,
    dynamicChange: number
  ): MultiplierRecommendation['rationale'] {
    const direction = dynamicChange > 0 ? 'increase' : 'decrease';
    const magnitude = Math.abs(dynamicChange);
    
    // Primary rationale
    let primary: string;
    if (magnitude > 0.15) {
      primary = `ML model recommends a significant ${direction} in dynamic adjustment (${(magnitude * 100).toFixed(1)}%) based on current geopolitical conditions and market stress indicators.`;
    } else if (magnitude > 0.05) {
      primary = `ML model suggests a moderate ${direction} in dynamic adjustment (${(magnitude * 100).toFixed(1)}%) to better align with risk exposure patterns.`;
    } else {
      primary = `ML model indicates a minor ${direction} in dynamic adjustment (${(magnitude * 100).toFixed(1)}%) for fine-tuning risk assessment accuracy.`;
    }
    
    // Secondary rationale points
    const secondary: string[] = [];
    
    if (mlPrediction.confidence > 0.8) {
      secondary.push(`High model confidence (${(mlPrediction.confidence * 100).toFixed(1)}%) supports this recommendation.`);
    } else if (mlPrediction.confidence < 0.6) {
      secondary.push(`Moderate model confidence (${(mlPrediction.confidence * 100).toFixed(1)}%) suggests cautious implementation.`);
    }
    
    secondary.push(`${sector} sector multiplier (${currentMultipliers.sector.toFixed(2)}x) remains appropriate.`);
    secondary.push(`Channel multiplier (${currentMultipliers.channel.toFixed(3)}x) reflects current exposure distribution.`);
    
    if (dynamicChange > 0) {
      secondary.push('Increased geopolitical events or market volatility warrant higher risk premium.');
    } else if (dynamicChange < 0) {
      secondary.push('Stabilizing conditions or reduced exposure justify lower risk adjustment.');
    }
    
    // Data support
    const dataSupport: string[] = [
      `ML model trained on ${mlPrediction.modelUsed.algorithm} regression algorithm`,
      `Prediction based on 20+ features including geographic exposure, events, and market conditions`,
      `95% confidence interval: [${mlPrediction.predictionRange.lower.toFixed(4)}, ${mlPrediction.predictionRange.upper.toFixed(4)}]`,
    ];
    
    const activeModel = mlModelTrainer.getLatestModel();
    if (activeModel) {
      dataSupport.push(`Model R² score: ${activeModel.metrics.r2Score.toFixed(4)}`);
      dataSupport.push(`Model MAE: ${activeModel.metrics.mae.toFixed(4)}`);
    }
    
    // Risk factors
    const riskFactors: string[] = [];
    
    if (mlPrediction.confidence < 0.7) {
      riskFactors.push('Lower model confidence increases prediction uncertainty');
    }
    
    if (magnitude > 0.2) {
      riskFactors.push('Large adjustment may significantly impact risk classification');
    }
    
    const rangeWidth = mlPrediction.predictionRange.upper - mlPrediction.predictionRange.lower;
    if (rangeWidth > 0.3) {
      riskFactors.push('Wide prediction interval indicates higher uncertainty');
    }
    
    if (riskFactors.length === 0) {
      riskFactors.push('No significant risk factors identified');
    }
    
    return {
      primary,
      secondary,
      dataSupport,
      riskFactors,
    };
  }
  
  /**
   * Analyze impact of recommendation
   */
  private analyzeImpact(
    ticker: string,
    rawScore: number,
    currentTotal: number,
    recommendedTotal: number,
    confidence: number
  ): MultiplierRecommendation['impact'] {
    const currentFinalScore = rawScore * currentTotal;
    const recommendedFinalScore = rawScore * recommendedTotal;
    const expectedScoreChange = recommendedFinalScore - currentFinalScore;
    
    // Determine risk level change
    let expectedRiskLevelChange: string | undefined;
    const currentRiskLevel = this.getRiskLevel(currentFinalScore);
    const recommendedRiskLevel = this.getRiskLevel(recommendedFinalScore);
    
    if (currentRiskLevel !== recommendedRiskLevel) {
      expectedRiskLevelChange = `${currentRiskLevel} → ${recommendedRiskLevel}`;
    }
    
    // Estimate affected assessments (simplified)
    const affectedAssessments = 1;
    
    // Calculate confidence level for impact
    const confidenceLevel = confidence * 0.9; // Slightly lower than prediction confidence
    
    return {
      expectedScoreChange,
      expectedRiskLevelChange,
      affectedAssessments,
      confidenceLevel,
    };
  }
  
  /**
   * Get risk level from COGRI score
   */
  private getRiskLevel(score: number): string {
    if (score >= 70) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 30) return 'Moderate';
    return 'Low';
  }
  
  /**
   * Determine priority and urgency
   */
  private determinePriority(
    changeMagnitude: number,
    confidence: number,
    scoreImpact: number
  ): { priority: RecommendationPriority; urgency: number } {
    let priority: RecommendationPriority;
    let urgency: number;
    
    // Calculate urgency score (0-10)
    urgency = (changeMagnitude * 20) + (confidence * 5) + (Math.abs(scoreImpact) / 10);
    urgency = Math.min(10, Math.max(0, urgency));
    
    // Determine priority
    if (urgency >= 8 || changeMagnitude > 0.2) {
      priority = 'critical';
    } else if (urgency >= 6 || changeMagnitude > 0.1) {
      priority = 'high';
    } else if (urgency >= 4 || changeMagnitude > 0.05) {
      priority = 'medium';
    } else {
      priority = 'low';
    }
    
    return { priority, urgency };
  }
  
  /**
   * Determine approval level required
   */
  private determineApprovalLevel(
    priority: RecommendationPriority,
    changeMagnitude: number,
    confidence: number
  ): ApprovalLevel {
    // Auto-approve low-risk changes with high confidence
    if (priority === 'low' && confidence > 0.85 && changeMagnitude < 0.03) {
      return 'auto';
    }
    
    // Analyst approval for medium changes
    if (priority === 'medium' && confidence > 0.75) {
      return 'analyst';
    }
    
    // Manager approval for high priority or large changes
    if (priority === 'high' || changeMagnitude > 0.15) {
      return 'manager';
    }
    
    // Executive approval for critical changes
    if (priority === 'critical' || changeMagnitude > 0.25) {
      return 'executive';
    }
    
    return 'analyst';
  }
  
  /**
   * Perform detailed impact analysis
   */
  public performDetailedImpactAnalysis(
    ticker: string,
    currentScore: number,
    currentMultiplier: number,
    recommendedMultiplier: number,
    confidence: number
  ): ImpactAnalysis {
    const rawScore = currentScore / currentMultiplier;
    const projectedScore = rawScore * recommendedMultiplier;
    const scoreChange = projectedScore - currentScore;
    const percentageChange = (scoreChange / currentScore) * 100;
    
    // Risk level analysis
    const currentRiskLevel = this.getRiskLevel(currentScore);
    const projectedRiskLevel = this.getRiskLevel(projectedScore);
    
    // Confidence analysis
    const modelConfidence = mlModelTrainer.getLatestModel()?.metrics.r2Score || 0.8;
    const overallConfidence = (confidence + modelConfidence) / 2;
    
    // Sensitivity analysis
    const optimisticMultiplier = recommendedMultiplier * 1.1;
    const pessimisticMultiplier = recommendedMultiplier * 0.9;
    
    const sensitivity = {
      optimistic: rawScore * optimisticMultiplier,
      expected: projectedScore,
      pessimistic: rawScore * pessimisticMultiplier,
    };
    
    // Affected metrics
    const affectedMetrics = [
      {
        metric: 'COGRI Score',
        currentValue: currentScore,
        projectedValue: projectedScore,
        change: scoreChange,
      },
      {
        metric: 'Risk Multiplier',
        currentValue: currentMultiplier,
        projectedValue: recommendedMultiplier,
        change: recommendedMultiplier - currentMultiplier,
      },
      {
        metric: 'Risk Premium',
        currentValue: (currentMultiplier - 1) * 100,
        projectedValue: (recommendedMultiplier - 1) * 100,
        change: (recommendedMultiplier - currentMultiplier) * 100,
      },
    ];
    
    return {
      ticker,
      currentScore,
      projectedScore,
      scoreChange,
      percentageChange,
      riskLevelChange: {
        current: currentRiskLevel,
        projected: projectedRiskLevel,
        changed: currentRiskLevel !== projectedRiskLevel,
      },
      confidence: {
        predictionConfidence: confidence,
        modelConfidence,
        overallConfidence,
      },
      sensitivity,
      affectedMetrics,
    };
  }
  
  /**
   * Create approval request
   */
  public createApprovalRequest(
    recommendationId: string,
    requestedBy: string,
    justification: string
  ): ApprovalRequest {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }
    
    const activeModel = mlModelTrainer.getLatestModel();
    
    const request: ApprovalRequest = {
      recommendationId,
      requestedBy,
      requestedAt: new Date(),
      requiredLevel: recommendation.approvalRequired,
      justification,
      supportingData: {
        modelMetrics: {
          r2Score: activeModel?.metrics.r2Score || 0,
          mae: activeModel?.metrics.mae || 0,
          confidence: recommendation.mlConfidence,
        },
      },
    };
    
    this.approvalRequests.set(recommendationId, request);
    
    console.log(`[Calibration Engine] Approval request created for ${recommendationId}`);
    console.log(`  Required level: ${recommendation.approvalRequired}`);
    console.log(`  Requested by: ${requestedBy}`);
    
    return request;
  }
  
  /**
   * Process approval decision
   */
  public processApprovalDecision(
    recommendationId: string,
    decision: ApprovalDecision
  ): void {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }
    
    if (decision.decision === 'approved') {
      recommendation.status = 'approved';
      recommendation.approvedBy = decision.approvedBy;
      recommendation.approvedAt = decision.approvedAt;
      
      console.log(`[Calibration Engine] Recommendation ${recommendationId} approved by ${decision.approvedBy}`);
    } else if (decision.decision === 'rejected') {
      recommendation.status = 'rejected';
      recommendation.rejectionReason = decision.comments;
      
      console.log(`[Calibration Engine] Recommendation ${recommendationId} rejected: ${decision.comments}`);
    } else {
      recommendation.status = 'pending';
      console.log(`[Calibration Engine] Recommendation ${recommendationId} needs revision`);
    }
    
    this.recommendations.set(recommendationId, recommendation);
  }
  
  /**
   * Mark recommendation as implemented
   */
  public markAsImplemented(
    recommendationId: string,
    actualOutcome?: MultiplierRecommendation['actualOutcome']
  ): void {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }
    
    if (recommendation.status !== 'approved') {
      throw new Error('Only approved recommendations can be implemented');
    }
    
    recommendation.status = 'implemented';
    recommendation.implementedAt = new Date();
    
    if (actualOutcome) {
      recommendation.actualOutcome = actualOutcome;
      
      console.log(`[Calibration Engine] Recommendation ${recommendationId} implemented`);
      console.log(`  Expected score change: ${recommendation.impact.expectedScoreChange.toFixed(2)}`);
      console.log(`  Actual score change: ${actualOutcome.scoreChange.toFixed(2)}`);
      console.log(`  Accuracy: ${(actualOutcome.accuracy * 100).toFixed(1)}%`);
    }
    
    this.recommendations.set(recommendationId, recommendation);
  }
  
  /**
   * Create recommendation batch
   */
  public createRecommendationBatch(
    recommendations: MultiplierRecommendation[]
  ): RecommendationBatch {
    const batchId = `batch_${Date.now()}`;
    
    // Calculate summary statistics
    const byPriority: Record<RecommendationPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    
    const byStatus: Record<RecommendationStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      implemented: 0,
    };
    
    let totalConfidence = 0;
    let totalExpectedImpact = 0;
    
    recommendations.forEach(rec => {
      byPriority[rec.priority]++;
      byStatus[rec.status]++;
      totalConfidence += rec.mlConfidence;
      totalExpectedImpact += Math.abs(rec.impact.expectedScoreChange);
    });
    
    const batch: RecommendationBatch = {
      batchId,
      createdAt: new Date(),
      recommendations,
      summary: {
        totalRecommendations: recommendations.length,
        byPriority,
        byStatus,
        avgConfidence: recommendations.length > 0 ? totalConfidence / recommendations.length : 0,
        totalExpectedImpact,
      },
    };
    
    this.batches.set(batchId, batch);
    
    console.log(`[Calibration Engine] Created recommendation batch ${batchId}`);
    console.log(`  Total recommendations: ${recommendations.length}`);
    console.log(`  Critical: ${byPriority.critical}, High: ${byPriority.high}, Medium: ${byPriority.medium}, Low: ${byPriority.low}`);
    console.log(`  Avg confidence: ${(batch.summary.avgConfidence * 100).toFixed(1)}%`);
    
    return batch;
  }
  
  /**
   * Get recommendations by priority
   */
  public getRecommendationsByPriority(priority: RecommendationPriority): MultiplierRecommendation[] {
    return Array.from(this.recommendations.values())
      .filter(rec => rec.priority === priority)
      .sort((a, b) => b.urgency - a.urgency);
  }
  
  /**
   * Get recommendations by status
   */
  public getRecommendationsByStatus(status: RecommendationStatus): MultiplierRecommendation[] {
    return Array.from(this.recommendations.values())
      .filter(rec => rec.status === status)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Get pending approvals
   */
  public getPendingApprovals(approvalLevel?: ApprovalLevel): MultiplierRecommendation[] {
    let pending = Array.from(this.recommendations.values())
      .filter(rec => rec.status === 'pending');
    
    if (approvalLevel) {
      pending = pending.filter(rec => rec.approvalRequired === approvalLevel);
    }
    
    return pending.sort((a, b) => b.urgency - a.urgency);
  }
  
  /**
   * Get recommendation by ID
   */
  public getRecommendation(recommendationId: string): MultiplierRecommendation | undefined {
    return this.recommendations.get(recommendationId);
  }
  
  /**
   * Get all recommendations
   */
  public getAllRecommendations(): MultiplierRecommendation[] {
    return Array.from(this.recommendations.values());
  }
  
  /**
   * Get recommendation batch
   */
  public getBatch(batchId: string): RecommendationBatch | undefined {
    return this.batches.get(batchId);
  }
  
  /**
   * Get approval request
   */
  public getApprovalRequest(recommendationId: string): ApprovalRequest | undefined {
    return this.approvalRequests.get(recommendationId);
  }
  
  /**
   * Get recommendation statistics
   */
  public getStatistics(): {
    total: number;
    byPriority: Record<RecommendationPriority, number>;
    byStatus: Record<RecommendationStatus, number>;
    avgConfidence: number;
    avgUrgency: number;
    implementationRate: number;
    avgAccuracy: number;
  } {
    const recommendations = Array.from(this.recommendations.values());
    
    const byPriority: Record<RecommendationPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    
    const byStatus: Record<RecommendationStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      implemented: 0,
    };
    
    let totalConfidence = 0;
    let totalUrgency = 0;
    let totalAccuracy = 0;
    let accuracyCount = 0;
    
    recommendations.forEach(rec => {
      byPriority[rec.priority]++;
      byStatus[rec.status]++;
      totalConfidence += rec.mlConfidence;
      totalUrgency += rec.urgency;
      
      if (rec.actualOutcome) {
        totalAccuracy += rec.actualOutcome.accuracy;
        accuracyCount++;
      }
    });
    
    const total = recommendations.length;
    const implementationRate = total > 0 ? byStatus.implemented / total : 0;
    
    return {
      total,
      byPriority,
      byStatus,
      avgConfidence: total > 0 ? totalConfidence / total : 0,
      avgUrgency: total > 0 ? totalUrgency / total : 0,
      implementationRate,
      avgAccuracy: accuracyCount > 0 ? totalAccuracy / accuracyCount : 0,
    };
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const calibrationRecommendationEngine = new CalibrationRecommendationEngineService();

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example: Generate and approve recommendation
 * 
 * // Generate recommendation
 * const recommendation = calibrationRecommendationEngine.generateRecommendation(
 *   'AAPL',
 *   'Technology',
 *   { sector: 1.10, channel: 1.025, dynamic: 0.15 },
 *   mlPrediction,
 *   46.15
 * );
 * 
 * // Create approval request
 * const approvalRequest = calibrationRecommendationEngine.createApprovalRequest(
 *   recommendation.id,
 *   'analyst@company.com',
 *   'ML model shows high confidence in this adjustment based on current geopolitical conditions'
 * );
 * 
 * // Process approval
 * calibrationRecommendationEngine.processApprovalDecision(
 *   recommendation.id,
 *   {
 *     recommendationId: recommendation.id,
 *     approvedBy: 'manager@company.com',
 *     approvedAt: new Date(),
 *     decision: 'approved',
 *     comments: 'Approved based on strong model metrics and clear rationale',
 *   }
 * );
 * 
 * // Mark as implemented
 * calibrationRecommendationEngine.markAsImplemented(
 *   recommendation.id,
 *   {
 *     scoreChange: 2.5,
 *     riskLevelChange: 'Moderate → High',
 *     accuracy: 0.92,
 *   }
 * );
 */

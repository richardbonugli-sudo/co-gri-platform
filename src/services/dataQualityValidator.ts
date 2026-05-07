/**
 * Data Quality Validator
 * 
 * Validates and scores the quality of geographic exposure data
 * with comprehensive quality metrics and improvement recommendations.
 */

import { IntegratedCompanyData, IntegratedGeographicExposure } from './multiSourceIntegrator';

export interface QualityValidationResult {
  overallScore: number; // 0-100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  evidenceLevel: 'institutional' | 'professional' | 'standard' | 'basic' | 'insufficient';
  validationResults: ValidationCheck[];
  recommendations: QualityRecommendation[];
  complianceStatus: ComplianceStatus;
}

export interface ValidationCheck {
  category: 'accuracy' | 'completeness' | 'consistency' | 'timeliness' | 'reliability';
  checkName: string;
  status: 'pass' | 'warning' | 'fail';
  score: number; // 0-100
  message: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
}

export interface QualityRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  recommendation: string;
  estimatedImpact: number; // Expected score improvement (0-100)
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface ComplianceStatus {
  institutionalGrade: boolean; // Meets institutional investment standards
  regulatoryCompliance: boolean; // Meets regulatory reporting requirements
  auditReadiness: boolean; // Ready for external audit
  dataGovernance: boolean; // Meets data governance standards
  riskManagement: boolean; // Adequate for risk management
}

export class DataQualityValidator {
  private readonly QUALITY_THRESHOLDS = {
    institutional: { min: 90, sources: 5, crossValidation: 0.8, confidence: 0.85 },
    professional: { min: 80, sources: 4, crossValidation: 0.6, confidence: 0.75 },
    standard: { min: 70, sources: 3, crossValidation: 0.4, confidence: 0.65 },
    basic: { min: 60, sources: 2, crossValidation: 0.2, confidence: 0.55 },
    insufficient: { min: 0, sources: 1, crossValidation: 0.0, confidence: 0.0 }
  };

  private readonly GRADE_THRESHOLDS = {
    'A+': 95, 'A': 90, 'B+': 85, 'B': 80, 'C+': 75, 'C': 70, 'D': 60, 'F': 0
  };

  /**
   * Validate integrated company data quality
   */
  validateCompanyData(data: IntegratedCompanyData): QualityValidationResult {
    console.log(`🔍 Validating data quality for ${data.ticker}...`);
    
    const validationResults: ValidationCheck[] = [];
    
    // Run all validation checks
    validationResults.push(...this.validateAccuracy(data));
    validationResults.push(...this.validateCompleteness(data));
    validationResults.push(...this.validateConsistency(data));
    validationResults.push(...this.validateTimeliness(data));
    validationResults.push(...this.validateReliability(data));
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(validationResults);
    
    // Determine grade and evidence level
    const grade = this.calculateGrade(overallScore);
    const evidenceLevel = this.determineEvidenceLevel(data, overallScore);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(validationResults, data);
    
    // Check compliance status
    const complianceStatus = this.checkComplianceStatus(data, overallScore, validationResults);
    
    console.log(`✅ Quality validation completed: ${grade} grade, ${evidenceLevel} evidence level`);
    
    return {
      overallScore,
      grade,
      evidenceLevel,
      validationResults,
      recommendations,
      complianceStatus
    };
  }

  /**
   * Validate data accuracy
   */
  private validateAccuracy(data: IntegratedCompanyData): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    // Check confidence scores
    const avgConfidence = data.qualityMetrics.averageConfidence;
    checks.push({
      category: 'accuracy',
      checkName: 'Average Confidence Score',
      status: avgConfidence >= 0.8 ? 'pass' : avgConfidence >= 0.6 ? 'warning' : 'fail',
      score: avgConfidence * 100,
      message: `Average confidence: ${Math.round(avgConfidence * 100)}%`,
      impact: avgConfidence < 0.5 ? 'critical' : avgConfidence < 0.7 ? 'high' : 'medium'
    });
    
    // Check geographic coverage accuracy
    const totalPercentage = data.geographicExposures.reduce((sum, exp) => {
      return sum + (exp.revenuePercentage || 0);
    }, 0);
    
    const coverageAccuracy = Math.abs(100 - totalPercentage) <= 10;
    checks.push({
      category: 'accuracy',
      checkName: 'Geographic Coverage Sum',
      status: coverageAccuracy ? 'pass' : Math.abs(100 - totalPercentage) <= 20 ? 'warning' : 'fail',
      score: Math.max(0, 100 - Math.abs(100 - totalPercentage) * 2),
      message: `Total coverage: ${totalPercentage.toFixed(1)}% (target: ~100%)`,
      impact: !coverageAccuracy ? 'high' : 'low'
    });
    
    // Check for unrealistic values
    const unrealisticExposures = data.geographicExposures.filter(exp => 
      (exp.revenuePercentage && exp.revenuePercentage > 100) ||
      (exp.revenuePercentage && exp.revenuePercentage < 0)
    );
    
    checks.push({
      category: 'accuracy',
      checkName: 'Realistic Value Ranges',
      status: unrealisticExposures.length === 0 ? 'pass' : 'fail',
      score: unrealisticExposures.length === 0 ? 100 : Math.max(0, 100 - unrealisticExposures.length * 20),
      message: unrealisticExposures.length === 0 ? 'All values within realistic ranges' : `${unrealisticExposures.length} unrealistic values found`,
      impact: unrealisticExposures.length > 0 ? 'critical' : 'low'
    });
    
    return checks;
  }

  /**
   * Validate data completeness
   */
  private validateCompleteness(data: IntegratedCompanyData): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    // Check geographic exposure completeness
    const hasRevenue = data.geographicExposures.some(exp => exp.revenuePercentage !== undefined);
    const hasEmployees = data.geographicExposures.some(exp => exp.employeeCount !== undefined);
    const hasFacilities = data.geographicExposures.some(exp => exp.facilityCount !== undefined);
    
    const completenessFactors = [hasRevenue, hasEmployees, hasFacilities];
    const completenessScore = (completenessFactors.filter(Boolean).length / completenessFactors.length) * 100;
    
    checks.push({
      category: 'completeness',
      checkName: 'Geographic Data Completeness',
      status: completenessScore >= 80 ? 'pass' : completenessScore >= 50 ? 'warning' : 'fail',
      score: completenessScore,
      message: `${completenessFactors.filter(Boolean).length}/3 data types available`,
      impact: completenessScore < 50 ? 'high' : 'medium'
    });
    
    // Check operational presence completeness
    const operationalTypes = ['headquarters', 'manufacturing', 'sales', 'rd', 'supply_chain'];
    const availableTypes = new Set(data.operationalPresence.map(op => op.operationType));
    const operationalCompleteness = (availableTypes.size / operationalTypes.length) * 100;
    
    checks.push({
      category: 'completeness',
      checkName: 'Operational Presence Coverage',
      status: operationalCompleteness >= 60 ? 'pass' : operationalCompleteness >= 40 ? 'warning' : 'fail',
      score: operationalCompleteness,
      message: `${availableTypes.size}/${operationalTypes.length} operational types covered`,
      impact: operationalCompleteness < 40 ? 'medium' : 'low'
    });
    
    // Check strategic insights completeness
    const hasStrategy = data.strategicInsights.length > 0;
    checks.push({
      category: 'completeness',
      checkName: 'Strategic Insights Availability',
      status: hasStrategy ? 'pass' : 'warning',
      score: hasStrategy ? 100 : 0,
      message: hasStrategy ? `${data.strategicInsights.length} strategic insights available` : 'No strategic insights found',
      impact: 'low'
    });
    
    return checks;
  }

  /**
   * Validate data consistency
   */
  private validateConsistency(data: IntegratedCompanyData): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    // Check cross-source consistency
    const crossValidationRate = data.qualityMetrics.totalDataPoints > 0 
      ? (data.qualityMetrics.crossValidatedPoints / data.qualityMetrics.totalDataPoints) * 100
      : 0;
    
    checks.push({
      category: 'consistency',
      checkName: 'Cross-Source Validation',
      status: crossValidationRate >= 60 ? 'pass' : crossValidationRate >= 30 ? 'warning' : 'fail',
      score: crossValidationRate,
      message: `${Math.round(crossValidationRate)}% of data points cross-validated`,
      impact: crossValidationRate < 30 ? 'high' : 'medium'
    });
    
    // Check geographic naming consistency
    const geographyNames = data.geographicExposures.map(exp => exp.geography);
    const uniqueNames = new Set(geographyNames);
    const namingConsistency = geographyNames.length > 0 ? (uniqueNames.size / geographyNames.length) : 1;
    
    checks.push({
      category: 'consistency',
      checkName: 'Geographic Naming Consistency',
      status: namingConsistency >= 0.8 ? 'pass' : namingConsistency >= 0.6 ? 'warning' : 'fail',
      score: namingConsistency * 100,
      message: `${uniqueNames.size} unique names from ${geographyNames.length} entries`,
      impact: namingConsistency < 0.6 ? 'medium' : 'low'
    });
    
    // Check confidence score consistency
    const confidenceScores = data.geographicExposures.map(exp => exp.confidence);
    const confidenceVariance = this.calculateVariance(confidenceScores);
    const confidenceConsistency = confidenceVariance < 0.1 ? 100 : Math.max(0, 100 - confidenceVariance * 200);
    
    checks.push({
      category: 'consistency',
      checkName: 'Confidence Score Consistency',
      status: confidenceConsistency >= 80 ? 'pass' : confidenceConsistency >= 60 ? 'warning' : 'fail',
      score: confidenceConsistency,
      message: `Confidence variance: ${confidenceVariance.toFixed(3)}`,
      impact: confidenceConsistency < 60 ? 'medium' : 'low'
    });
    
    return checks;
  }

  /**
   * Validate data timeliness
   */
  private validateTimeliness(data: IntegratedCompanyData): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    // Check data freshness
    const freshnessScore = data.qualityMetrics.freshnessScore;
    checks.push({
      category: 'timeliness',
      checkName: 'Data Freshness',
      status: freshnessScore >= 80 ? 'pass' : freshnessScore >= 60 ? 'warning' : 'fail',
      score: freshnessScore,
      message: `Data freshness: ${Math.round(freshnessScore)}% (${data.dataFreshness} days old)`,
      impact: freshnessScore < 50 ? 'high' : 'medium'
    });
    
    // Check update frequency
    const lastUpdated = new Date(data.lastUpdated);
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const updateTimeliness = Math.max(0, 100 - daysSinceUpdate * 2);
    
    checks.push({
      category: 'timeliness',
      checkName: 'Update Frequency',
      status: updateTimeliness >= 90 ? 'pass' : updateTimeliness >= 70 ? 'warning' : 'fail',
      score: updateTimeliness,
      message: `Last updated ${Math.round(daysSinceUpdate)} days ago`,
      impact: updateTimeliness < 50 ? 'medium' : 'low'
    });
    
    return checks;
  }

  /**
   * Validate data reliability
   */
  private validateReliability(data: IntegratedCompanyData): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    
    // Check source count and diversity
    const sourceCount = data.qualityMetrics.sourceCount;
    const sourceReliability = Math.min(100, (sourceCount / 5) * 100);
    
    checks.push({
      category: 'reliability',
      checkName: 'Source Count and Diversity',
      status: sourceCount >= 3 ? 'pass' : sourceCount >= 2 ? 'warning' : 'fail',
      score: sourceReliability,
      message: `${sourceCount} data sources available`,
      impact: sourceCount < 2 ? 'critical' : sourceCount < 3 ? 'high' : 'medium'
    });
    
    // Check evidence count per geography
    const avgEvidenceCount = data.geographicExposures.length > 0 
      ? data.geographicExposures.reduce((sum, exp) => sum + exp.evidenceCount, 0) / data.geographicExposures.length
      : 0;
    
    const evidenceReliability = Math.min(100, avgEvidenceCount * 50);
    
    checks.push({
      category: 'reliability',
      checkName: 'Evidence Density',
      status: avgEvidenceCount >= 2 ? 'pass' : avgEvidenceCount >= 1 ? 'warning' : 'fail',
      score: evidenceReliability,
      message: `Average ${avgEvidenceCount.toFixed(1)} evidence points per geography`,
      impact: avgEvidenceCount < 1 ? 'high' : 'medium'
    });
    
    // Check data lineage completeness
    const lineageCompleteness = data.dataLineage.length > 0 ? 100 : 0;
    
    checks.push({
      category: 'reliability',
      checkName: 'Data Lineage Tracking',
      status: lineageCompleteness >= 100 ? 'pass' : 'fail',
      score: lineageCompleteness,
      message: lineageCompleteness > 0 ? `${data.dataLineage.length} lineage records` : 'No lineage tracking',
      impact: lineageCompleteness === 0 ? 'medium' : 'low'
    });
    
    return checks;
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(validationResults: ValidationCheck[]): number {
    const categoryWeights = {
      accuracy: 0.3,
      completeness: 0.25,
      consistency: 0.2,
      timeliness: 0.15,
      reliability: 0.1
    };
    
    const categoryScores: Record<string, number[]> = {};
    
    // Group scores by category
    for (const result of validationResults) {
      if (!categoryScores[result.category]) {
        categoryScores[result.category] = [];
      }
      categoryScores[result.category].push(result.score);
    }
    
    // Calculate weighted average
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [category, weight] of Object.entries(categoryWeights)) {
      if (categoryScores[category] && categoryScores[category].length > 0) {
        const categoryAvg = categoryScores[category].reduce((sum, score) => sum + score, 0) / categoryScores[category].length;
        totalScore += categoryAvg * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate quality grade
   */
  private calculateGrade(score: number): QualityValidationResult['grade'] {
    for (const [grade, threshold] of Object.entries(this.GRADE_THRESHOLDS)) {
      if (score >= threshold) {
        return grade as QualityValidationResult['grade'];
      }
    }
    return 'F';
  }

  /**
   * Determine evidence level
   */
  private determineEvidenceLevel(data: IntegratedCompanyData, overallScore: number): QualityValidationResult['evidenceLevel'] {
    const metrics = data.qualityMetrics;
    
    for (const [level, thresholds] of Object.entries(this.QUALITY_THRESHOLDS)) {
      if (overallScore >= thresholds.min &&
          metrics.sourceCount >= thresholds.sources &&
          (metrics.crossValidatedPoints / Math.max(1, metrics.totalDataPoints)) >= thresholds.crossValidation &&
          metrics.averageConfidence >= thresholds.confidence) {
        return level as QualityValidationResult['evidenceLevel'];
      }
    }
    
    return 'insufficient';
  }

  /**
   * Generate quality improvement recommendations
   */
  private generateRecommendations(validationResults: ValidationCheck[], data: IntegratedCompanyData): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];
    
    // Analyze failed and warning checks
    const criticalIssues = validationResults.filter(r => r.status === 'fail' && r.impact === 'critical');
    const highIssues = validationResults.filter(r => r.status === 'fail' && r.impact === 'high');
    const warningIssues = validationResults.filter(r => r.status === 'warning');
    
    // Critical recommendations
    for (const issue of criticalIssues) {
      recommendations.push({
        priority: 'critical',
        category: issue.category,
        issue: issue.checkName,
        recommendation: this.getRecommendationText(issue),
        estimatedImpact: 100 - issue.score,
        implementationEffort: this.getImplementationEffort(issue)
      });
    }
    
    // High priority recommendations
    for (const issue of highIssues) {
      recommendations.push({
        priority: 'high',
        category: issue.category,
        issue: issue.checkName,
        recommendation: this.getRecommendationText(issue),
        estimatedImpact: Math.max(10, 100 - issue.score),
        implementationEffort: this.getImplementationEffort(issue)
      });
    }
    
    // Medium priority recommendations
    for (const issue of warningIssues.slice(0, 3)) { // Limit to top 3 warnings
      recommendations.push({
        priority: 'medium',
        category: issue.category,
        issue: issue.checkName,
        recommendation: this.getRecommendationText(issue),
        estimatedImpact: Math.max(5, 100 - issue.score),
        implementationEffort: this.getImplementationEffort(issue)
      });
    }
    
    // Add general recommendations based on data gaps
    if (data.qualityMetrics.sourceCount < 3) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        issue: 'Insufficient data sources',
        recommendation: 'Add sustainability reports, investor presentations, and earnings call transcripts',
        estimatedImpact: 25,
        implementationEffort: 'medium'
      });
    }
    
    if (data.operationalPresence.length === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'completeness',
        issue: 'Missing operational data',
        recommendation: 'Gather facility locations, employee distributions, and manufacturing data',
        estimatedImpact: 15,
        implementationEffort: 'high'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get recommendation text for specific issues
   */
  private getRecommendationText(issue: ValidationCheck): string {
    const recommendations: Record<string, string> = {
      'Average Confidence Score': 'Improve NLP models and add manual validation for key data points',
      'Geographic Coverage Sum': 'Verify geographic data completeness and resolve missing regions',
      'Realistic Value Ranges': 'Implement data validation rules and outlier detection',
      'Geographic Data Completeness': 'Add employee and facility data from HR and operations reports',
      'Cross-Source Validation': 'Find overlapping data points across multiple sources for validation',
      'Source Count and Diversity': 'Add more diverse data sources including sustainability and investor reports',
      'Data Freshness': 'Update with more recent reports and implement automated data refresh',
      'Evidence Density': 'Increase evidence collection per geography through additional sources'
    };
    
    return recommendations[issue.checkName] || 'Review and improve data quality for this metric';
  }

  /**
   * Get implementation effort estimate
   */
  private getImplementationEffort(issue: ValidationCheck): QualityRecommendation['implementationEffort'] {
    const effortMap: Record<string, QualityRecommendation['implementationEffort']> = {
      'Average Confidence Score': 'high',
      'Geographic Coverage Sum': 'medium',
      'Realistic Value Ranges': 'low',
      'Geographic Data Completeness': 'high',
      'Cross-Source Validation': 'medium',
      'Source Count and Diversity': 'high',
      'Data Freshness': 'medium',
      'Evidence Density': 'high'
    };
    
    return effortMap[issue.checkName] || 'medium';
  }

  /**
   * Check compliance status
   */
  private checkComplianceStatus(data: IntegratedCompanyData, overallScore: number, validationResults: ValidationCheck[]): ComplianceStatus {
    const criticalFailures = validationResults.filter(r => r.status === 'fail' && r.impact === 'critical').length;
    const highFailures = validationResults.filter(r => r.status === 'fail' && r.impact === 'high').length;
    
    return {
      institutionalGrade: overallScore >= 90 && data.qualityMetrics.sourceCount >= 4 && criticalFailures === 0,
      regulatoryCompliance: overallScore >= 75 && data.qualityMetrics.sourceCount >= 2 && criticalFailures === 0,
      auditReadiness: overallScore >= 80 && data.dataLineage.length > 0 && criticalFailures === 0,
      dataGovernance: overallScore >= 70 && data.qualityMetrics.crossValidatedPoints > 0,
      riskManagement: overallScore >= 65 && highFailures <= 1
    };
  }

  /**
   * Calculate variance of an array
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}
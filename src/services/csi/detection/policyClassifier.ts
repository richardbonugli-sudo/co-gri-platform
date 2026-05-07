/**
 * Policy Classifier
 * 
 * Classifies articles into event types and vectors based on content and entities.
 * Maps policy categories to EventType and VectorCode.
 */

import type { EventType, VectorCode } from '@/types/csi.types';
import type { RSSArticle } from '../dataSources/rssFeedIngestion';
import type { ExtractedEntities } from './nerEngine';
import { getPolicyCategories } from './nerEngine';

export interface Classification {
  event_type: EventType;
  primary_vector: VectorCode;
  secondary_vectors: VectorCode[];
  confidence: number;
  reasoning: string;
}

// Mapping from policy categories to event types
const POLICY_TO_EVENT_TYPE: Record<string, EventType> = {
  'sanctions': 'SANCTION',
  'export_control': 'EXPORT_CONTROL',
  'tariff': 'TARIFF',
  'conflict': 'KINETIC',
  'capital_control': 'CAPITAL_CONTROL',
  'cyber': 'CYBER_ATTACK',
  'unrest': 'COUP'
};

// Mapping from event types to primary vectors
const EVENT_TYPE_TO_VECTOR: Record<EventType, VectorCode> = {
  'SANCTION': 'SC2',
  'EXPORT_CONTROL': 'SC3',
  'TARIFF': 'SC3',
  'KINETIC': 'SC1',
  'CAPITAL_CONTROL': 'SC5',
  'COUP': 'SC6',
  'CYBER_ATTACK': 'SC7',
  'TRADE_RESTRICTION': 'SC3',
  'OTHER': 'SC3'
};

// Secondary vectors by event type
const SECONDARY_VECTORS: Record<EventType, VectorCode[]> = {
  'SANCTION': ['SC5'],
  'EXPORT_CONTROL': ['SC2'],
  'TARIFF': ['SC2'],
  'KINETIC': ['SC6'],
  'CAPITAL_CONTROL': ['SC2'],
  'COUP': ['SC1'],
  'CYBER_ATTACK': ['SC5'],
  'TRADE_RESTRICTION': ['SC2'],
  'OTHER': []
};

/**
 * Classify an article into event type and vectors
 */
export function classifyArticle(
  article: RSSArticle,
  entities: ExtractedEntities
): Classification | null {
  const fullText = `${article.title} ${article.description} ${article.content || ''}`;
  
  // Get policy categories from text
  const policyCategories = getPolicyCategories(fullText);
  
  if (policyCategories.length === 0) {
    return null; // No relevant policy content
  }
  
  // Select primary policy category (first match)
  const primaryCategory = policyCategories[0];
  const eventType = POLICY_TO_EVENT_TYPE[primaryCategory] || 'OTHER';
  
  // Determine vectors
  const primaryVector = EVENT_TYPE_TO_VECTOR[eventType];
  const secondaryVectors = SECONDARY_VECTORS[eventType] || [];
  
  // Calculate confidence
  const confidence = calculateClassificationConfidence(
    entities,
    policyCategories,
    article
  );
  
  // Generate reasoning
  const reasoning = generateReasoning(
    eventType,
    primaryVector,
    policyCategories,
    entities
  );
  
  return {
    event_type: eventType,
    primary_vector: primaryVector,
    secondary_vectors: secondaryVectors,
    confidence,
    reasoning
  };
}

/**
 * Calculate classification confidence
 */
function calculateClassificationConfidence(
  entities: ExtractedEntities,
  policyCategories: string[],
  article: RSSArticle
): number {
  let score = 0;
  
  // Base confidence from entity extraction
  score += entities.confidence * 0.4;
  
  // Policy category clarity (20 points)
  if (policyCategories.length === 1) {
    score += 20; // Clear single category
  } else if (policyCategories.length === 2) {
    score += 15; // Two related categories
  } else {
    score += 10; // Multiple categories (less clear)
  }
  
  // Country specificity (20 points)
  if (entities.countries.length === 1) {
    score += 20; // Single country (clear target)
  } else if (entities.countries.length === 2) {
    score += 15; // Two countries (bilateral)
  } else if (entities.countries.length > 2) {
    score += 10; // Multiple countries (regional)
  }
  
  // Agency mention (20 points)
  if (entities.agencies.length > 0) {
    score += 20; // Official source mentioned
  }
  
  return Math.min(score, 100);
}

/**
 * Generate reasoning for classification
 */
function generateReasoning(
  eventType: EventType,
  primaryVector: VectorCode,
  policyCategories: string[],
  entities: ExtractedEntities
): string {
  const parts: string[] = [];
  
  parts.push(`Classified as ${eventType} based on policy categories: ${policyCategories.join(', ')}`);
  parts.push(`Primary vector: ${primaryVector}`);
  
  if (entities.countries.length > 0) {
    parts.push(`Countries mentioned: ${entities.countries.join(', ')}`);
  }
  
  if (entities.agencies.length > 0) {
    parts.push(`Agencies: ${entities.agencies.join(', ')}`);
  }
  
  if (entities.sectors.length > 0) {
    parts.push(`Sectors: ${entities.sectors.slice(0, 3).join(', ')}`);
  }
  
  return parts.join('. ');
}

/**
 * Batch classify multiple articles
 */
export function classifyArticles(
  articles: RSSArticle[],
  entitiesMap: Map<string, ExtractedEntities>
): Map<string, Classification> {
  const classifications = new Map<string, Classification>();
  
  articles.forEach(article => {
    const entities = entitiesMap.get(article.article_id);
    if (!entities) return;
    
    const classification = classifyArticle(article, entities);
    if (classification) {
      classifications.set(article.article_id, classification);
    }
  });
  
  return classifications;
}

/**
 * Filter classifications by confidence threshold
 */
export function filterByConfidence(
  classifications: Map<string, Classification>,
  minConfidence: number
): Map<string, Classification> {
  const filtered = new Map<string, Classification>();
  
  classifications.forEach((classification, articleId) => {
    if (classification.confidence >= minConfidence) {
      filtered.set(articleId, classification);
    }
  });
  
  return filtered;
}
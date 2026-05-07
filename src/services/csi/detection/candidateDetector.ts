/**
 * Candidate Detector
 * 
 * Combines NER and Classification to detect event candidates.
 * Groups related articles and generates EventCandidate objects.
 */

import type { EventType, VectorCode } from '@/types/csi.types';
import type { RSSArticle } from '../dataSources/rssFeedIngestion';
import type { ExtractedEntities } from './nerEngine';
import type { Classification } from './policyClassifier';

export interface EventCandidate {
  candidate_id: string;
  country: string;
  event_type: EventType;
  primary_vector: VectorCode;
  secondary_vectors: VectorCode[];
  confidence: number;
  source_articles: SourceArticle[];
  detected_date: string;
  description: string;
  reasoning: string;
  entities: ExtractedEntities;
}

export interface SourceArticle {
  article_id: string;
  source_name: string;
  title: string;
  link: string;
  pubDate: Date;
}

/**
 * Detect event candidates from classified articles
 */
export function detectCandidates(
  articles: RSSArticle[],
  entitiesMap: Map<string, ExtractedEntities>,
  classificationsMap: Map<string, Classification>,
  minConfidence: number = 60
): EventCandidate[] {
  const candidates: EventCandidate[] = [];
  
  // Group articles by country + event type
  const groups = groupArticles(articles, entitiesMap, classificationsMap);
  
  // Create candidates from groups
  groups.forEach((group, key) => {
    const [country, eventType] = key.split('|');
    
    if (group.articles.length === 0) return;
    
    // Calculate aggregate confidence
    const confidence = calculateAggregateConfidence(group);
    
    if (confidence < minConfidence) return;
    
    // Create candidate
    const candidate = createCandidate(
      country,
      eventType as EventType,
      group,
      confidence
    );
    
    candidates.push(candidate);
  });
  
  console.log(`[Candidate Detector] 🎯 Detected ${candidates.length} event candidates`);
  return candidates;
}

interface ArticleGroup {
  articles: RSSArticle[];
  entities: ExtractedEntities[];
  classifications: Classification[];
}

/**
 * Group articles by country and event type
 */
function groupArticles(
  articles: RSSArticle[],
  entitiesMap: Map<string, ExtractedEntities>,
  classificationsMap: Map<string, Classification>
): Map<string, ArticleGroup> {
  const groups = new Map<string, ArticleGroup>();
  
  articles.forEach(article => {
    const entities = entitiesMap.get(article.article_id);
    const classification = classificationsMap.get(article.article_id);
    
    if (!entities || !classification) return;
    
    // Create group for each country mentioned
    entities.countries.forEach(country => {
      const key = `${country}|${classification.event_type}`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          articles: [],
          entities: [],
          classifications: []
        });
      }
      
      const group = groups.get(key)!;
      group.articles.push(article);
      group.entities.push(entities);
      group.classifications.push(classification);
    });
  });
  
  return groups;
}

/**
 * Calculate aggregate confidence from multiple articles
 */
function calculateAggregateConfidence(group: ArticleGroup): number {
  if (group.articles.length === 0) return 0;
  
  // Base confidence: average of individual confidences
  const avgConfidence = group.classifications.reduce(
    (sum, c) => sum + c.confidence, 0
  ) / group.classifications.length;
  
  // Boost for multiple sources
  let boost = 0;
  if (group.articles.length >= 3) {
    boost = 15; // 3+ sources: high confidence
  } else if (group.articles.length === 2) {
    boost = 10; // 2 sources: medium boost
  }
  
  // Boost for authoritative sources
  const hasAuthoritativeSource = group.articles.some(article =>
    article.source_name.includes('OFAC') ||
    article.source_name.includes('BIS') ||
    article.source_name.includes('MOFCOM') ||
    article.source_name.includes('UN')
  );
  
  if (hasAuthoritativeSource) {
    boost += 10;
  }
  
  return Math.min(avgConfidence + boost, 100);
}

/**
 * Create an event candidate from grouped articles
 */
function createCandidate(
  country: string,
  eventType: EventType,
  group: ArticleGroup,
  confidence: number
): EventCandidate {
  const candidateId = generateCandidateId(country, eventType);
  
  // Get primary classification
  const primaryClassification = group.classifications[0];
  
  // Merge entities from all articles
  const mergedEntities = mergeEntities(group.entities);
  
  // Generate description from article titles
  const description = generateDescription(group.articles, eventType, country);
  
  // Generate reasoning
  const reasoning = generateReasoning(group, confidence);
  
  // Create source article references
  const sourceArticles: SourceArticle[] = group.articles.map(article => ({
    article_id: article.article_id,
    source_name: article.source_name,
    title: article.title,
    link: article.link,
    pubDate: article.pubDate
  }));
  
  return {
    candidate_id: candidateId,
    country,
    event_type: eventType,
    primary_vector: primaryClassification.primary_vector,
    secondary_vectors: primaryClassification.secondary_vectors,
    confidence,
    source_articles: sourceArticles,
    detected_date: new Date().toISOString(),
    description,
    reasoning,
    entities: mergedEntities
  };
}

/**
 * Generate candidate ID
 */
function generateCandidateId(country: string, eventType: string): string {
  const timestamp = Date.now();
  const countryCode = country.substring(0, 2).toUpperCase();
  return `CAND-${countryCode}-${eventType}-${timestamp}`;
}

/**
 * Merge entities from multiple extractions
 */
function mergeEntities(entities: ExtractedEntities[]): ExtractedEntities {
  const merged: ExtractedEntities = {
    countries: [],
    agencies: [],
    companies: [],
    sectors: [],
    policyTerms: [],
    confidence: 0
  };
  
  const countriesSet = new Set<string>();
  const agenciesSet = new Set<string>();
  const companiesSet = new Set<string>();
  const sectorsSet = new Set<string>();
  const policyTermsSet = new Set<string>();
  
  entities.forEach(e => {
    e.countries.forEach(c => countriesSet.add(c));
    e.agencies.forEach(a => agenciesSet.add(a));
    e.companies.forEach(c => companiesSet.add(c));
    e.sectors.forEach(s => sectorsSet.add(s));
    e.policyTerms.forEach(p => policyTermsSet.add(p));
  });
  
  merged.countries = Array.from(countriesSet);
  merged.agencies = Array.from(agenciesSet);
  merged.companies = Array.from(companiesSet);
  merged.sectors = Array.from(sectorsSet);
  merged.policyTerms = Array.from(policyTermsSet);
  merged.confidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
  
  return merged;
}

/**
 * Generate description from articles
 */
function generateDescription(
  articles: RSSArticle[],
  eventType: EventType,
  country: string
): string {
  // Use the most recent article's title as base
  const latestArticle = articles.sort((a, b) => 
    b.pubDate.getTime() - a.pubDate.getTime()
  )[0];
  
  return `${country}: ${latestArticle.title}`;
}

/**
 * Generate reasoning for candidate
 */
function generateReasoning(group: ArticleGroup, confidence: number): string {
  const parts: string[] = [];
  
  parts.push(`Detected from ${group.articles.length} source(s)`);
  parts.push(`Confidence: ${confidence.toFixed(1)}%`);
  
  const sources = group.articles.map(a => a.source_name).join(', ');
  parts.push(`Sources: ${sources}`);
  
  const uniqueAgencies = new Set(group.entities.flatMap(e => e.agencies));
  if (uniqueAgencies.size > 0) {
    parts.push(`Agencies mentioned: ${Array.from(uniqueAgencies).join(', ')}`);
  }
  
  return parts.join('. ');
}

/**
 * Filter candidates by confidence threshold
 */
export function filterCandidatesByConfidence(
  candidates: EventCandidate[],
  minConfidence: number
): EventCandidate[] {
  return candidates.filter(c => c.confidence >= minConfidence);
}

/**
 * Get candidates for a specific country
 */
export function getCandidatesForCountry(
  candidates: EventCandidate[],
  country: string
): EventCandidate[] {
  return candidates.filter(c => c.country === country);
}
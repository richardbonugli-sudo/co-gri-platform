/**
 * Bottom-Line Interpretation Generator Service
 * 
 * Generates structured 4-sentence bottom-line interpretation per Appendix B.1 Part II, Section 3.
 * 
 * Required format:
 * - Sentence 1: Net direction relative to baseline
 * - Sentence 2: Primary driver and channel
 * - Sentence 3: Offsets/nuance (if present)
 * - Sentence 4: Conclusion (headwind/tailwind/mixed)
 * 
 * Answers: "Is the geopolitical outlook a headwind, tailwind, or mixed for this company?"
 * 
 * @module bottomLineGenerator
 */

import { Channel } from '@/types/v4Types';
import {
  BottomLineInterpretation,
  ChannelPathway,
  RelevantEvent,
  DEFAULT_CHANNEL_WEIGHTS
} from '@/types/forecastCompany';

/**
 * Input data for bottom-line generation
 */
export interface BottomLineInput {
  companyName: string;
  relevantEvents: RelevantEvent[];
  channelPathways: ChannelPathway[];
}

/**
 * Generate bottom-line interpretation
 * 
 * @param input - Company name, relevant events, and channel pathways
 * @returns Structured 4-sentence interpretation
 */
export function generateBottomLineInterpretation(
  input: BottomLineInput
): BottomLineInterpretation {
  // Determine net direction
  const netDirection = determineNetDirection(input.channelPathways);

  // Identify primary driver
  const primaryDriver = identifyPrimaryDriver(input.relevantEvents);

  // Identify primary channel
  const primaryChannel = identifyPrimaryChannel(input.channelPathways);

  // Identify offsets
  const offsets = identifyOffsets(input.channelPathways);

  // Determine conclusion
  const conclusion = determineConclusion(netDirection, offsets);

  // Build full text
  const fullText = buildFullText(
    input.companyName,
    netDirection,
    primaryDriver,
    primaryChannel,
    offsets,
    conclusion
  );

  return {
    netDirection,
    primaryDriver,
    primaryChannel,
    offsets,
    conclusion,
    fullText
  };
}

/**
 * Determine net direction relative to historical baseline
 * 
 * @param pathways - Channel pathways
 * @returns Net direction
 */
function determineNetDirection(
  pathways: ChannelPathway[]
): 'elevated' | 'reduced' | 'mixed' {
  let negativeCount = 0;
  let positiveCount = 0;
  let negativeWeight = 0;
  let positiveWeight = 0;

  for (const pathway of pathways) {
    const weight = getChannelWeight(pathway.channel);
    
    if (pathway.impact === 'negative') {
      negativeCount++;
      negativeWeight += weight * getSeverityMultiplier(pathway.severity);
    } else if (pathway.impact === 'positive') {
      positiveCount++;
      positiveWeight += weight * getSeverityMultiplier(pathway.severity);
    }
  }

  // Weighted decision
  if (negativeWeight > positiveWeight * 1.5) {
    return 'elevated';
  } else if (positiveWeight > negativeWeight * 1.5) {
    return 'reduced';
  } else {
    return 'mixed';
  }
}

/**
 * Identify primary geopolitical driver
 * 
 * @param events - Relevant events
 * @returns Primary driver description
 */
function identifyPrimaryDriver(
  events: RelevantEvent[]
): string {
  if (events.length === 0) {
    return 'stable geopolitical environment';
  }

  // Primary driver is highest relevance event
  const primaryEvent = events[0];
  
  // Extract key phrase from event name
  const eventName = primaryEvent.event.toLowerCase();
  
  // Common patterns
  if (eventName.includes('decoupling')) {
    return extractDecouplingPhrase(eventName);
  } else if (eventName.includes('sanctions')) {
    return extractSanctionsPhrase(eventName);
  } else if (eventName.includes('controls')) {
    return extractControlsPhrase(eventName);
  } else if (eventName.includes('growth')) {
    return extractGrowthPhrase(eventName);
  } else {
    // Default: use event name with probability context
    return `${primaryEvent.event} (${(primaryEvent.probability * 100).toFixed(0)}% probability)`;
  }
}

/**
 * Extract decoupling phrase
 */
function extractDecouplingPhrase(eventName: string): string {
  if (eventName.includes('us-china') || eventName.includes('us–china')) {
    return 'US-China technology decoupling';
  } else if (eventName.includes('tech')) {
    return 'technology decoupling';
  } else {
    return 'economic decoupling';
  }
}

/**
 * Extract sanctions phrase
 */
function extractSanctionsPhrase(eventName: string): string {
  if (eventName.includes('semiconductor') || eventName.includes('chip')) {
    return 'semiconductor sanctions';
  } else if (eventName.includes('export')) {
    return 'export sanctions';
  } else {
    return 'sanctions regime';
  }
}

/**
 * Extract controls phrase
 */
function extractControlsPhrase(eventName: string): string {
  if (eventName.includes('export')) {
    return 'export controls';
  } else if (eventName.includes('capital')) {
    return 'capital controls';
  } else {
    return 'regulatory controls';
  }
}

/**
 * Extract growth phrase
 */
function extractGrowthPhrase(eventName: string): string {
  if (eventName.includes('em') || eventName.includes('emerging')) {
    return 'emerging market growth';
  } else if (eventName.includes('asia')) {
    return 'Asian market expansion';
  } else {
    return 'market growth';
  }
}

/**
 * Identify primary exposure channel
 * 
 * @param pathways - Channel pathways
 * @returns Primary channel
 */
function identifyPrimaryChannel(
  pathways: ChannelPathway[]
): Channel {
  // Find channel with highest impact severity
  let primaryChannel = Channel.REVENUE;
  let maxScore = 0;

  for (const pathway of pathways) {
    if (pathway.impact === 'neutral') continue;
    
    const score = getSeverityMultiplier(pathway.severity) * getChannelWeight(pathway.channel);
    
    if (score > maxScore) {
      maxScore = score;
      primaryChannel = pathway.channel;
    }
  }

  return primaryChannel;
}

/**
 * Identify offsetting factors
 * 
 * @param pathways - Channel pathways
 * @returns Array of offset descriptions
 */
function identifyOffsets(
  pathways: ChannelPathway[]
): string[] {
  const offsets: string[] = [];

  // Check for positive channels offsetting negative ones
  const hasNegative = pathways.some(p => p.impact === 'negative');
  const hasPositive = pathways.some(p => p.impact === 'positive');

  if (hasNegative && hasPositive) {
    const positiveChannels = pathways.filter(p => p.impact === 'positive');
    if (positiveChannels.length > 0) {
      // Extract offset from explanation
      for (const channel of positiveChannels) {
        const offsetText = extractOffsetFromExplanation(channel.explanation);
        if (offsetText && !offsets.includes(offsetText)) {
          offsets.push(offsetText);
        }
      }
    }
  }

  // Check for diversification mentions in explanations
  for (const pathway of pathways) {
    if (pathway.explanation.toLowerCase().includes('diversif')) {
      if (!offsets.some(o => o.includes('diversif'))) {
        offsets.push('diversification efforts');
      }
    }
    
    if (pathway.explanation.toLowerCase().includes('offset')) {
      const offsetMatch = pathway.explanation.match(/offset by ([^.]+)/i);
      if (offsetMatch && !offsets.includes(offsetMatch[1])) {
        offsets.push(offsetMatch[1]);
      }
    }
  }

  return offsets.slice(0, 2); // Max 2 offsets for readability
}

/**
 * Extract offset text from explanation
 */
function extractOffsetFromExplanation(explanation: string): string | null {
  const lowerExpl = explanation.toLowerCase();
  
  if (lowerExpl.includes('growth in')) {
    const match = explanation.match(/growth in ([^.]+)/i);
    return match ? `growth in ${match[1]}` : null;
  }
  
  if (lowerExpl.includes('expansion')) {
    return 'market expansion';
  }
  
  if (lowerExpl.includes('benefit')) {
    return 'favorable market conditions';
  }
  
  return null;
}

/**
 * Determine overall conclusion
 * 
 * @param netDirection - Net direction
 * @param offsets - Offsetting factors
 * @returns Conclusion
 */
function determineConclusion(
  netDirection: 'elevated' | 'reduced' | 'mixed',
  offsets: string[]
): 'headwind' | 'tailwind' | 'mixed' {
  if (netDirection === 'elevated') {
    return offsets.length > 0 ? 'mixed' : 'headwind';
  } else if (netDirection === 'reduced') {
    return 'tailwind';
  } else {
    return 'mixed';
  }
}

/**
 * Build full 4-sentence interpretation text
 * 
 * @param companyName - Company name
 * @param netDirection - Net direction
 * @param primaryDriver - Primary driver
 * @param primaryChannel - Primary channel
 * @param offsets - Offsetting factors
 * @param conclusion - Conclusion
 * @returns Complete interpretation text
 */
function buildFullText(
  companyName: string,
  netDirection: 'elevated' | 'reduced' | 'mixed',
  primaryDriver: string,
  primaryChannel: Channel,
  offsets: string[],
  conclusion: 'headwind' | 'tailwind' | 'mixed'
): string {
  // Sentence 1: Net direction
  const sentence1 = `${companyName}'s geopolitical risk exposure is ${netDirection} relative to its historical baseline`;

  // Sentence 2: Primary driver and channel
  const channelName = formatChannelName(primaryChannel);
  const sentence2 = `driven primarily by ${channelName} exposure to ${primaryDriver}`;

  // Sentence 3: Offsets (if present)
  let sentence3 = '';
  if (offsets.length > 0) {
    const offsetsText = offsets.length === 1 
      ? offsets[0] 
      : `${offsets.slice(0, -1).join(', ')} and ${offsets[offsets.length - 1]}`;
    sentence3 = `While ${offsetsText} mitigate some downside`;
  }

  // Sentence 4: Conclusion
  const conclusionText = conclusion === 'headwind' 
    ? 'a net headwind' 
    : conclusion === 'tailwind' 
      ? 'a net tailwind' 
      : 'a mixed environment';
  const sentence4 = `the geopolitical environment over the next year represents ${conclusionText}`;

  // Combine sentences
  if (sentence3) {
    return `${sentence1}, ${sentence2}. ${sentence3}, ${sentence4}.`;
  } else {
    return `${sentence1}, ${sentence2}. ${sentence4.charAt(0).toUpperCase() + sentence4.slice(1)}.`;
  }
}

/**
 * Format channel name for display
 */
function formatChannelName(channel: Channel): string {
  switch (channel) {
    case Channel.REVENUE:
      return 'revenue';
    case Channel.SUPPLY:
      return 'supply-chain';
    case Channel.ASSETS:
      return 'asset';
    case Channel.FINANCIAL:
      return 'financial';
    default:
      return channel.toLowerCase();
  }
}

/**
 * Get channel weight for aggregation
 */
function getChannelWeight(channel: Channel): number {
  const channelKey = channel.toLowerCase() as keyof typeof DEFAULT_CHANNEL_WEIGHTS;
  return DEFAULT_CHANNEL_WEIGHTS[channelKey] || 0.25;
}

/**
 * Get severity multiplier
 */
function getSeverityMultiplier(severity: 'high' | 'medium' | 'low'): number {
  switch (severity) {
    case 'high':
      return 1.0;
    case 'medium':
      return 0.6;
    case 'low':
      return 0.3;
    default:
      return 0.5;
  }
}

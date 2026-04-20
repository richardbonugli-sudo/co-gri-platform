/**
 * Event Lifecycle State Machine
 * 
 * Manages the lifecycle of CSI events from detection through resolution.
 * Implements a finite state machine with validation rules and audit trails.
 * 
 * States:
 * - DETECTED: Initial detection from data sources
 * - PROVISIONAL: Passed initial validation, awaiting corroboration
 * - CONFIRMED: Corroborated by multiple sources, active in system
 * - RESOLVED: Event concluded or superseded
 * 
 * @module lifecycle/eventStateMachine
 */

export enum EventState {
  DETECTED = 'DETECTED',
  PROVISIONAL = 'PROVISIONAL',
  CONFIRMED = 'CONFIRMED',
  RESOLVED = 'RESOLVED'
}

export enum TransitionTrigger {
  INITIAL_VALIDATION_PASSED = 'INITIAL_VALIDATION_PASSED',
  CORROBORATION_ACHIEVED = 'CORROBORATION_ACHIEVED',
  RESOLUTION_DETECTED = 'RESOLUTION_DETECTED',
  INVALIDATION = 'INVALIDATION',
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE'
}

export interface EventCandidate {
  id: string;
  state: EventState;
  title: string;
  description: string;
  primaryVector: string;
  secondaryVectors: string[];
  sources: EventSource[];
  detectedAt: Date;
  lastUpdated: Date;
  metadata: Record<string, any>;
}

export interface EventSource {
  sourceId: string;
  sourceName: string;
  credibility: number; // 0.0 - 1.0
  timestamp: Date;
  url?: string;
  snippet?: string;
}

export interface StateTransition {
  fromState: EventState;
  toState: EventState;
  trigger: TransitionTrigger;
  timestamp: Date;
  actor: string; // system or user ID
  reason: string;
  metadata?: Record<string, any>;
}

export interface TransitionRule {
  fromState: EventState;
  toState: EventState;
  trigger: TransitionTrigger;
  condition: (event: EventCandidate, context: TransitionContext) => boolean;
  action: (event: EventCandidate, context: TransitionContext) => Promise<void>;
}

export interface TransitionContext {
  trigger: TransitionTrigger;
  actor: string;
  reason: string;
  metadata?: Record<string, any>;
}

export class EventStateMachineError extends Error {
  constructor(
    message: string,
    public code: string,
    public eventId?: string,
    public currentState?: EventState
  ) {
    super(message);
    this.name = 'EventStateMachineError';
  }
}

/**
 * Event Lifecycle State Machine
 * 
 * Manages state transitions for CSI event candidates with validation
 * and audit trail capabilities.
 */
export class EventStateMachine {
  private transitionRules: TransitionRule[];
  private auditLog: StateTransition[] = [];

  constructor() {
    this.transitionRules = this.initializeTransitionRules();
  }

  /**
   * Initialize state transition rules
   */
  private initializeTransitionRules(): TransitionRule[] {
    return [
      // DETECTED -> PROVISIONAL
      {
        fromState: EventState.DETECTED,
        toState: EventState.PROVISIONAL,
        trigger: TransitionTrigger.INITIAL_VALIDATION_PASSED,
        condition: (event: EventCandidate) => {
          // Must have at least one credible source
          return event.sources.length > 0 && 
                 event.sources.some(s => s.credibility >= 0.5);
        },
        action: async (event: EventCandidate, context: TransitionContext) => {
          // Log transition
          console.log(`Event ${event.id} transitioning to PROVISIONAL`);
        }
      },

      // PROVISIONAL -> CONFIRMED
      {
        fromState: EventState.PROVISIONAL,
        toState: EventState.CONFIRMED,
        trigger: TransitionTrigger.CORROBORATION_ACHIEVED,
        condition: (event: EventCandidate, context: TransitionContext) => {
          // Require ≥2 independent sources
          const uniqueSources = new Set(event.sources.map(s => s.sourceId));
          if (uniqueSources.size < 2) return false;

          // Check 48-72 hour persistence
          const oldestSource = event.sources.reduce((oldest, source) => 
            source.timestamp < oldest.timestamp ? source : oldest
          );
          const hoursSinceDetection = 
            (Date.now() - oldestSource.timestamp.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceDetection < 48) return false;

          // Weighted credibility score ≥ 0.7
          const avgCredibility = event.sources.reduce((sum, s) => sum + s.credibility, 0) / 
                                 event.sources.length;
          
          return avgCredibility >= 0.7;
        },
        action: async (event: EventCandidate, context: TransitionContext) => {
          console.log(`Event ${event.id} CONFIRMED - corroboration achieved`);
          // Trigger CSI delta calculation
        }
      },

      // CONFIRMED -> RESOLVED
      {
        fromState: EventState.CONFIRMED,
        toState: EventState.RESOLVED,
        trigger: TransitionTrigger.RESOLUTION_DETECTED,
        condition: (event: EventCandidate) => {
          // Always allow resolution from confirmed state
          return true;
        },
        action: async (event: EventCandidate, context: TransitionContext) => {
          console.log(`Event ${event.id} RESOLVED - ${context.reason}`);
          // Archive event data
        }
      },

      // PROVISIONAL -> RESOLVED (invalidation)
      {
        fromState: EventState.PROVISIONAL,
        toState: EventState.RESOLVED,
        trigger: TransitionTrigger.INVALIDATION,
        condition: (event: EventCandidate) => true,
        action: async (event: EventCandidate, context: TransitionContext) => {
          console.log(`Event ${event.id} INVALIDATED - ${context.reason}`);
        }
      },

      // Manual override - any state to any state
      {
        fromState: EventState.DETECTED,
        toState: EventState.CONFIRMED,
        trigger: TransitionTrigger.MANUAL_OVERRIDE,
        condition: (event: EventCandidate, context: TransitionContext) => {
          // Require admin privileges (check in context)
          return context.metadata?.isAdmin === true;
        },
        action: async (event: EventCandidate, context: TransitionContext) => {
          console.log(`Event ${event.id} MANUAL OVERRIDE by ${context.actor}`);
        }
      }
    ];
  }

  /**
   * Attempt to transition an event to a new state
   * 
   * @param event - The event candidate to transition
   * @param trigger - What triggered this transition
   * @param context - Additional context for the transition
   * @returns Updated event with new state
   * @throws EventStateMachineError if transition is invalid
   */
  async transition(
    event: EventCandidate,
    trigger: TransitionTrigger,
    context: TransitionContext
  ): Promise<EventCandidate> {
    // Find applicable transition rules
    const applicableRules = this.transitionRules.filter(
      rule => rule.fromState === event.state && rule.trigger === trigger
    );

    if (applicableRules.length === 0) {
      throw new EventStateMachineError(
        `No transition rule found for ${event.state} -> ${trigger}`,
        'INVALID_TRANSITION',
        event.id,
        event.state
      );
    }

    // Find first rule that passes condition
    let selectedRule: TransitionRule | null = null;
    for (const rule of applicableRules) {
      try {
        if (rule.condition(event, context)) {
          selectedRule = rule;
          break;
        }
      } catch (error) {
        console.error(`Condition check failed for rule ${rule.fromState}->${rule.toState}:`, error);
      }
    }

    if (!selectedRule) {
      throw new EventStateMachineError(
        `Transition conditions not met for ${event.state} -> ${trigger}`,
        'CONDITION_NOT_MET',
        event.id,
        event.state
      );
    }

    // Execute transition action
    try {
      await selectedRule.action(event, context);
    } catch (error) {
      throw new EventStateMachineError(
        `Transition action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ACTION_FAILED',
        event.id,
        event.state
      );
    }

    // Create audit log entry
    const transition: StateTransition = {
      fromState: event.state,
      toState: selectedRule.toState,
      trigger,
      timestamp: new Date(),
      actor: context.actor,
      reason: context.reason,
      metadata: context.metadata
    };
    this.auditLog.push(transition);

    // Update event state
    const updatedEvent: EventCandidate = {
      ...event,
      state: selectedRule.toState,
      lastUpdated: new Date()
    };

    return updatedEvent;
  }

  /**
   * Validate if a transition is possible
   * 
   * @param event - The event to check
   * @param trigger - The proposed trigger
   * @param context - Transition context
   * @returns true if transition is valid
   */
  canTransition(
    event: EventCandidate,
    trigger: TransitionTrigger,
    context: TransitionContext
  ): boolean {
    const applicableRules = this.transitionRules.filter(
      rule => rule.fromState === event.state && rule.trigger === trigger
    );

    if (applicableRules.length === 0) return false;

    return applicableRules.some(rule => {
      try {
        return rule.condition(event, context);
      } catch {
        return false;
      }
    });
  }

  /**
   * Get all valid transitions for an event's current state
   * 
   * @param event - The event to check
   * @returns Array of possible triggers
   */
  getValidTransitions(event: EventCandidate): TransitionTrigger[] {
    const validTriggers = new Set<TransitionTrigger>();
    
    for (const rule of this.transitionRules) {
      if (rule.fromState === event.state) {
        validTriggers.add(rule.trigger);
      }
    }

    return Array.from(validTriggers);
  }

  /**
   * Get audit trail for state transitions
   * 
   * @param eventId - Optional filter by event ID
   * @returns Array of state transitions
   */
  getAuditTrail(eventId?: string): StateTransition[] {
    return this.auditLog.filter(
      transition => !eventId || transition.metadata?.eventId === eventId
    );
  }

  /**
   * Clear audit log (for testing purposes)
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }
}

// Singleton instance
export const eventStateMachine = new EventStateMachine();
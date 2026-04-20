/**
 * Unit tests for Event Lifecycle State Machine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EventStateMachine,
  EventState,
  TransitionTrigger,
  EventCandidate,
  TransitionContext,
  EventStateMachineError
} from './eventStateMachine';

describe('EventStateMachine', () => {
  let stateMachine: EventStateMachine;
  let mockEvent: EventCandidate;

  beforeEach(() => {
    stateMachine = new EventStateMachine();
    stateMachine.clearAuditLog();

    mockEvent = {
      id: 'test-event-001',
      state: EventState.DETECTED,
      title: 'Test Geopolitical Event',
      description: 'A test event for validation',
      primaryVector: 'SC1',
      secondaryVectors: [],
      sources: [
        {
          sourceId: 'reuters',
          sourceName: 'Reuters',
          credibility: 0.9,
          timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000), // 50 hours ago
          url: 'https://reuters.com/test'
        },
        {
          sourceId: 'bloomberg',
          sourceName: 'Bloomberg',
          credibility: 0.85,
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
          url: 'https://bloomberg.com/test'
        }
      ],
      detectedAt: new Date(Date.now() - 50 * 60 * 60 * 1000),
      lastUpdated: new Date(),
      metadata: {}
    };
  });

  describe('State Transitions', () => {
    it('should transition from DETECTED to PROVISIONAL when validation passes', async () => {
      const context: TransitionContext = {
        trigger: TransitionTrigger.INITIAL_VALIDATION_PASSED,
        actor: 'system',
        reason: 'Initial validation completed'
      };

      const result = await stateMachine.transition(
        mockEvent,
        TransitionTrigger.INITIAL_VALIDATION_PASSED,
        context
      );

      expect(result.state).toBe(EventState.PROVISIONAL);
      expect(result.id).toBe(mockEvent.id);
    });

    it('should transition from PROVISIONAL to CONFIRMED when corroborated', async () => {
      mockEvent.state = EventState.PROVISIONAL;

      const context: TransitionContext = {
        trigger: TransitionTrigger.CORROBORATION_ACHIEVED,
        actor: 'system',
        reason: 'Corroboration threshold met'
      };

      const result = await stateMachine.transition(
        mockEvent,
        TransitionTrigger.CORROBORATION_ACHIEVED,
        context
      );

      expect(result.state).toBe(EventState.CONFIRMED);
    });

    it('should transition from CONFIRMED to RESOLVED', async () => {
      mockEvent.state = EventState.CONFIRMED;

      const context: TransitionContext = {
        trigger: TransitionTrigger.RESOLUTION_DETECTED,
        actor: 'system',
        reason: 'Event concluded'
      };

      const result = await stateMachine.transition(
        mockEvent,
        TransitionTrigger.RESOLUTION_DETECTED,
        context
      );

      expect(result.state).toBe(EventState.RESOLVED);
    });

    it('should reject transition if conditions not met', async () => {
      // Event with no sources should fail validation
      const eventNoSources: EventCandidate = {
        ...mockEvent,
        sources: []
      };

      const context: TransitionContext = {
        trigger: TransitionTrigger.INITIAL_VALIDATION_PASSED,
        actor: 'system',
        reason: 'Test'
      };

      await expect(
        stateMachine.transition(eventNoSources, TransitionTrigger.INITIAL_VALIDATION_PASSED, context)
      ).rejects.toThrow(EventStateMachineError);
    });

    it('should reject invalid state transitions', async () => {
      // Cannot go directly from DETECTED to CONFIRMED
      const context: TransitionContext = {
        trigger: TransitionTrigger.CORROBORATION_ACHIEVED,
        actor: 'system',
        reason: 'Test'
      };

      await expect(
        stateMachine.transition(mockEvent, TransitionTrigger.CORROBORATION_ACHIEVED, context)
      ).rejects.toThrow(EventStateMachineError);
    });
  });

  describe('Validation Rules', () => {
    it('should require at least one credible source for DETECTED->PROVISIONAL', async () => {
      const eventLowCredibility: EventCandidate = {
        ...mockEvent,
        sources: [{
          sourceId: 'test',
          sourceName: 'Test Source',
          credibility: 0.3, // Below 0.5 threshold
          timestamp: new Date(),
          url: 'https://test.com'
        }]
      };

      const context: TransitionContext = {
        trigger: TransitionTrigger.INITIAL_VALIDATION_PASSED,
        actor: 'system',
        reason: 'Test'
      };

      await expect(
        stateMachine.transition(eventLowCredibility, TransitionTrigger.INITIAL_VALIDATION_PASSED, context)
      ).rejects.toThrow(EventStateMachineError);
    });

    it('should require ≥2 independent sources for PROVISIONAL->CONFIRMED', async () => {
      mockEvent.state = EventState.PROVISIONAL;
      mockEvent.sources = [mockEvent.sources[0]]; // Only one source

      const context: TransitionContext = {
        trigger: TransitionTrigger.CORROBORATION_ACHIEVED,
        actor: 'system',
        reason: 'Test'
      };

      await expect(
        stateMachine.transition(mockEvent, TransitionTrigger.CORROBORATION_ACHIEVED, context)
      ).rejects.toThrow(EventStateMachineError);
    });

    it('should require 48-hour persistence for PROVISIONAL->CONFIRMED', async () => {
      mockEvent.state = EventState.PROVISIONAL;
      // Set sources to recent timestamps (< 48 hours)
      mockEvent.sources = [
        {
          sourceId: 'reuters',
          sourceName: 'Reuters',
          credibility: 0.9,
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
          url: 'https://reuters.com/test'
        },
        {
          sourceId: 'bloomberg',
          sourceName: 'Bloomberg',
          credibility: 0.85,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          url: 'https://bloomberg.com/test'
        }
      ];

      const context: TransitionContext = {
        trigger: TransitionTrigger.CORROBORATION_ACHIEVED,
        actor: 'system',
        reason: 'Test'
      };

      await expect(
        stateMachine.transition(mockEvent, TransitionTrigger.CORROBORATION_ACHIEVED, context)
      ).rejects.toThrow(EventStateMachineError);
    });

    it('should require average credibility ≥ 0.7 for PROVISIONAL->CONFIRMED', async () => {
      mockEvent.state = EventState.PROVISIONAL;
      mockEvent.sources = [
        {
          sourceId: 'source1',
          sourceName: 'Source 1',
          credibility: 0.6,
          timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000),
          url: 'https://test1.com'
        },
        {
          sourceId: 'source2',
          sourceName: 'Source 2',
          credibility: 0.65,
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          url: 'https://test2.com'
        }
      ];

      const context: TransitionContext = {
        trigger: TransitionTrigger.CORROBORATION_ACHIEVED,
        actor: 'system',
        reason: 'Test'
      };

      await expect(
        stateMachine.transition(mockEvent, TransitionTrigger.CORROBORATION_ACHIEVED, context)
      ).rejects.toThrow(EventStateMachineError);
    });
  });

  describe('Manual Override', () => {
    it('should allow manual override with admin privileges', async () => {
      const context: TransitionContext = {
        trigger: TransitionTrigger.MANUAL_OVERRIDE,
        actor: 'admin-user-123',
        reason: 'Manual confirmation by analyst',
        metadata: { isAdmin: true }
      };

      const result = await stateMachine.transition(
        mockEvent,
        TransitionTrigger.MANUAL_OVERRIDE,
        context
      );

      expect(result.state).toBe(EventState.CONFIRMED);
    });

    it('should reject manual override without admin privileges', async () => {
      const context: TransitionContext = {
        trigger: TransitionTrigger.MANUAL_OVERRIDE,
        actor: 'regular-user-456',
        reason: 'Attempted manual confirmation',
        metadata: { isAdmin: false }
      };

      await expect(
        stateMachine.transition(mockEvent, TransitionTrigger.MANUAL_OVERRIDE, context)
      ).rejects.toThrow(EventStateMachineError);
    });
  });

  describe('Audit Trail', () => {
    it('should record state transitions in audit log', async () => {
      const context: TransitionContext = {
        trigger: TransitionTrigger.INITIAL_VALIDATION_PASSED,
        actor: 'system',
        reason: 'Validation passed'
      };

      await stateMachine.transition(
        mockEvent,
        TransitionTrigger.INITIAL_VALIDATION_PASSED,
        context
      );

      const auditTrail = stateMachine.getAuditTrail();
      expect(auditTrail.length).toBe(1);
      expect(auditTrail[0].fromState).toBe(EventState.DETECTED);
      expect(auditTrail[0].toState).toBe(EventState.PROVISIONAL);
      expect(auditTrail[0].actor).toBe('system');
    });

    it('should track multiple transitions', async () => {
      // Transition 1: DETECTED -> PROVISIONAL
      await stateMachine.transition(
        mockEvent,
        TransitionTrigger.INITIAL_VALIDATION_PASSED,
        { trigger: TransitionTrigger.INITIAL_VALIDATION_PASSED, actor: 'system', reason: 'Test 1' }
      );

      // Transition 2: PROVISIONAL -> CONFIRMED
      mockEvent.state = EventState.PROVISIONAL;
      await stateMachine.transition(
        mockEvent,
        TransitionTrigger.CORROBORATION_ACHIEVED,
        { trigger: TransitionTrigger.CORROBORATION_ACHIEVED, actor: 'system', reason: 'Test 2' }
      );

      const auditTrail = stateMachine.getAuditTrail();
      expect(auditTrail.length).toBe(2);
    });
  });

  describe('Utility Methods', () => {
    it('should check if transition is possible', () => {
      const context: TransitionContext = {
        trigger: TransitionTrigger.INITIAL_VALIDATION_PASSED,
        actor: 'system',
        reason: 'Test'
      };

      const canTransition = stateMachine.canTransition(
        mockEvent,
        TransitionTrigger.INITIAL_VALIDATION_PASSED,
        context
      );

      expect(canTransition).toBe(true);
    });

    it('should return valid transitions for current state', () => {
      const validTransitions = stateMachine.getValidTransitions(mockEvent);
      
      expect(validTransitions).toContain(TransitionTrigger.INITIAL_VALIDATION_PASSED);
      expect(validTransitions).toContain(TransitionTrigger.MANUAL_OVERRIDE);
    });
  });
});
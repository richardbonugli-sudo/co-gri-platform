/**
 * API Routes for Event Lifecycle Management
 * 
 * Provides REST endpoints for managing event candidates, signals,
 * and CSI data with full audit trail support.
 * 
 * @module api/eventRoutes
 */

import { Router, Request, Response } from 'express';
import { eventStateMachine, EventState, TransitionTrigger } from '../lifecycle/eventStateMachine';
import { vectorRouter } from '../routing/vectorRouter';
import { corroborationEngine } from '../validation/corroborationEngine';

const router = Router();

/**
 * POST /api/v2/events/candidates
 * Create a new event candidate
 */
router.post('/candidates', async (req: Request, res: Response) => {
  try {
    const { title, description, sources, metadata } = req.body;

    // Validate required fields
    if (!title || !description || !sources || sources.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'description', 'sources']
      });
    }

    // Route to vectors
    const routingResult = vectorRouter.route({
      title,
      description,
      tags: metadata?.tags || []
    });

    // Create event candidate
    const eventCandidate = {
      id: generateEventId(),
      state: EventState.DETECTED,
      title,
      description,
      primaryVector: routingResult.primaryVector,
      secondaryVectors: routingResult.secondaryVectors.map(sv => sv.vector),
      sources: sources.map((s: any) => ({
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        credibility: s.credibility || 0.5,
        timestamp: new Date(s.timestamp || Date.now()),
        url: s.url,
        snippet: s.snippet
      })),
      detectedAt: new Date(),
      lastUpdated: new Date(),
      metadata: {
        ...metadata,
        routingConfidence: routingResult.primaryConfidence,
        routingReasoning: routingResult.reasoning
      }
    };

    // TODO: Persist to database
    // await db.eventCandidates.insert(eventCandidate);

    res.status(201).json({
      success: true,
      eventId: eventCandidate.id,
      event: eventCandidate,
      routing: routingResult
    });
  } catch (error) {
    console.error('Error creating event candidate:', error);
    res.status(500).json({
      error: 'Failed to create event candidate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v2/events/candidates/:id
 * Get event candidate details
 */
router.get('/candidates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Fetch from database
    // const event = await db.eventCandidates.findById(id);

    // Mock response for now
    const event = {
      id,
      state: EventState.PROVISIONAL,
      title: 'Sample Event',
      description: 'Sample event description',
      primaryVector: 'SC1',
      secondaryVectors: [],
      sources: [],
      detectedAt: new Date(),
      lastUpdated: new Date(),
      metadata: {}
    };

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        eventId: id
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error fetching event candidate:', error);
    res.status(500).json({
      error: 'Failed to fetch event candidate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/v2/events/candidates/:id
 * Update event lifecycle state
 */
router.patch('/candidates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { trigger, actor, reason, metadata } = req.body;

    // Validate required fields
    if (!trigger || !actor || !reason) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['trigger', 'actor', 'reason']
      });
    }

    // TODO: Fetch current event from database
    // const currentEvent = await db.eventCandidates.findById(id);

    // Mock current event for now
    const currentEvent = {
      id,
      state: EventState.DETECTED,
      title: 'Sample Event',
      description: 'Sample event description',
      primaryVector: 'SC1',
      secondaryVectors: [],
      sources: [
        {
          sourceId: 'reuters',
          sourceName: 'Reuters',
          credibility: 0.9,
          timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000),
          url: 'https://reuters.com/test'
        },
        {
          sourceId: 'bloomberg',
          sourceName: 'Bloomberg',
          credibility: 0.85,
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          url: 'https://bloomberg.com/test'
        }
      ],
      detectedAt: new Date(Date.now() - 50 * 60 * 60 * 1000),
      lastUpdated: new Date(),
      metadata: {}
    };

    if (!currentEvent) {
      return res.status(404).json({
        error: 'Event not found',
        eventId: id
      });
    }

    // Attempt state transition
    const updatedEvent = await eventStateMachine.transition(
      currentEvent,
      trigger as TransitionTrigger,
      { trigger, actor, reason, metadata }
    );

    // TODO: Persist updated event to database
    // await db.eventCandidates.update(id, updatedEvent);

    res.json({
      success: true,
      event: updatedEvent,
      transition: {
        from: currentEvent.state,
        to: updatedEvent.state,
        trigger,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating event candidate:', error);
    res.status(400).json({
      error: 'Failed to update event candidate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v2/events/candidates
 * List event candidates with filters
 */
router.get('/candidates', async (req: Request, res: Response) => {
  try {
    const {
      state,
      vector,
      country,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    // TODO: Query database with filters
    // const events = await db.eventCandidates.find({ state, vector, country, startDate, endDate }, { limit, offset });

    // Mock response for now
    const events = [];
    const total = 0;

    res.json({
      success: true,
      events,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: total > Number(offset) + Number(limit)
      },
      filters: {
        state,
        vector,
        country,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error listing event candidates:', error);
    res.status(500).json({
      error: 'Failed to list event candidates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v2/signals
 * Create a new escalation signal
 */
router.post('/signals', async (req: Request, res: Response) => {
  try {
    const { sourceId, content, url, metadata } = req.body;

    if (!sourceId || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['sourceId', 'content']
      });
    }

    // Route to vectors
    const routingResult = vectorRouter.route({
      title: content.title || '',
      description: content.description || content.text || '',
      tags: metadata?.tags || []
    });

    const signal = {
      id: generateSignalId(),
      sourceId,
      content,
      url,
      vector: routingResult.primaryVector,
      confidence: routingResult.primaryConfidence,
      detectedAt: new Date(),
      metadata: {
        ...metadata,
        routing: routingResult
      }
    };

    // TODO: Persist to database
    // await db.escalationSignals.insert(signal);

    res.status(201).json({
      success: true,
      signalId: signal.id,
      signal,
      routing: routingResult
    });
  } catch (error) {
    console.error('Error creating signal:', error);
    res.status(500).json({
      error: 'Failed to create signal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v2/signals/:id
 * Get signal details
 */
router.get('/signals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Fetch from database
    // const signal = await db.escalationSignals.findById(id);

    const signal = null; // Mock

    if (!signal) {
      return res.status(404).json({
        error: 'Signal not found',
        signalId: id
      });
    }

    res.json({
      success: true,
      signal
    });
  } catch (error) {
    console.error('Error fetching signal:', error);
    res.status(500).json({
      error: 'Failed to fetch signal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v2/signals
 * List signals with filters
 */
router.get('/signals', async (req: Request, res: Response) => {
  try {
    const {
      sourceId,
      vector,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query;

    // TODO: Query database
    const signals = [];
    const total = 0;

    res.json({
      success: true,
      signals,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: total > Number(offset) + Number(limit)
      }
    });
  } catch (error) {
    console.error('Error listing signals:', error);
    res.status(500).json({
      error: 'Failed to list signals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v2/events/validate
 * Validate an event candidate for corroboration
 */
router.post('/events/validate', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        error: 'Missing required field: eventId'
      });
    }

    // TODO: Fetch event from database
    const event = {
      id: eventId,
      state: EventState.PROVISIONAL,
      title: 'Sample Event',
      description: 'Sample event description',
      primaryVector: 'SC1',
      secondaryVectors: [],
      sources: [
        {
          sourceId: 'reuters',
          sourceName: 'Reuters',
          credibility: 0.9,
          timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000),
          url: 'https://reuters.com/test'
        },
        {
          sourceId: 'bloomberg',
          sourceName: 'Bloomberg',
          credibility: 0.85,
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          url: 'https://bloomberg.com/test'
        }
      ],
      detectedAt: new Date(Date.now() - 50 * 60 * 60 * 1000),
      lastUpdated: new Date(),
      metadata: {}
    };

    // Validate with corroboration engine
    const validationResult = corroborationEngine.validate(event);

    res.json({
      success: true,
      eventId,
      validation: validationResult
    });
  } catch (error) {
    console.error('Error validating event:', error);
    res.status(500).json({
      error: 'Failed to validate event',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSignalId(): string {
  return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default router;
/**
 * Initialize China Silver Event - Creates the initial China silver export restriction event
 * 
 * This is the first event in the CSI system, demonstrating the baseline vs event separation.
 */

import { eventStore } from './eventStore';
import type { CreateEventInput } from '@/types/csi.types';

let initialized = false;

/**
 * Create the China silver export restriction event
 */
export function initializeChinaSilverEvent(): void {
  if (initialized) {
    console.log('[China Silver Event] ⏭️ Already initialized, skipping');
    return;
  }

  console.log('[China Silver Event] 🚀 Creating China silver export restriction event...');

  const eventInput: CreateEventInput = {
    country: 'China',
    event_type: 'EXPORT_CONTROL',
    primary_vector: 'SC3',
    secondary_vectors: ['SC2'],
    severity: 6,
    delta_csi: 2.5,
    detected_date: '2025-12-15T00:00:00Z',
    effective_date: '2026-01-01T00:00:00Z',
    description: 'China implements export restrictions on silver effective January 1, 2026',
    sources: ['https://www.mofcom.gov.cn/'],
    rationale: 'New export control on strategic commodity; affects global silver supply chain. This is a discrete event separate from baseline CSI, demonstrating the event-based architecture.',
    decay_schedule: { type: 'NONE' },
    propagation_eligible: true,
    created_by: 'SYSTEM'
  };

  try {
    const event = eventStore.createEvent(eventInput);
    
    // First transition to PROVISIONAL state (required intermediate step)
    eventStore.transitionEventState({
      event_id: event.event_id,
      new_state: 'PROVISIONAL',
      user: 'SYSTEM',
      reason: 'Initial system event - transitioning to provisional for review'
    });
    
    // Then transition to CONFIRMED state
    eventStore.transitionEventState({
      event_id: event.event_id,
      new_state: 'CONFIRMED',
      user: 'SYSTEM',
      reason: 'Initial system event - pre-confirmed based on official government announcement'
    });

    initialized = true;
    console.log(`[China Silver Event] ✅ Event created and confirmed: ${event.event_id}`);
    console.log(`[China Silver Event] 📊 China CSI impact: Baseline 75.0 + Event ΔCSI 2.5 = Composite 77.5`);
  } catch (error) {
    console.error('[China Silver Event] ❌ Failed to create event:', error);
  }
}

/**
 * Check if China silver event is initialized
 */
export function isChinaSilverEventInitialized(): boolean {
  return initialized;
}

/**
 * Reset initialization state (for testing)
 */
export function resetChinaSilverEvent(): void {
  initialized = false;
  console.log('[China Silver Event] 🔄 Reset initialization state');
}
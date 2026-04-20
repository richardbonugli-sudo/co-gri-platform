# External Event Integration Guide

This document provides instructions for integrating external data sources (ACLED and GDELT) into the geopolitical events system.

## Overview

The external event integration system consists of two main components:

1. **External Event Ingestion Service** (`/src/services/externalEventIngestion.ts`)
   - Handles API integration with ACLED and GDELT
   - Transforms external events to GeopoliticalEvent format
   - Deduplicates and merges similar events

2. **Event Classification Engine** (`/src/services/eventClassificationEngine.ts`)
   - Classifies events into appropriate categories
   - Assesses severity levels
   - Estimates CSI impact
   - Identifies affected countries
   - Calculates vector impact breakdowns

## Phase 2 Status: Infrastructure Preparation

✅ **Completed:**
- Service architecture and interfaces defined
- Event transformation logic implemented
- Classification algorithms ready
- Deduplication system in place
- Documentation complete

⏳ **Phase 3 (Future):**
- Live API integration with automated updates
- ML model training for improved classification
- Real-time event streaming
- Automated CSI recalculation

## Data Sources

### 1. ACLED (Armed Conflict Location & Event Data Project)

**Description:** ACLED collects real-time data on political violence and protest events around the world.

**API Documentation:** https://acleddata.com/acleddatanew/wp-content/uploads/dlm_uploads/2021/06/ACLED_API-User-Guide_062021.pdf

**Coverage:**
- 190+ countries
- Event types: Battles, Violence against civilians, Protests, Riots, Strategic developments, Explosions/Remote violence
- Updated daily
- Historical data back to 1997

**Data Quality:**
- High accuracy for conflict events
- Detailed location data (latitude/longitude)
- Fatality counts
- Actor information

### 2. GDELT (Global Database of Events, Language, and Tone)

**Description:** GDELT monitors news media in over 100 languages from every country in the world.

**API Documentation:** https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/

**Coverage:**
- Global coverage
- 300+ event categories (CAMEO codes)
- Real-time updates (every 15 minutes)
- Sentiment analysis (tone)
- Goldstein scale for event impact

**Data Quality:**
- Extremely high volume (millions of events per day)
- Automated extraction (may have noise)
- Good for trend analysis
- Sentiment scores useful for impact assessment

## Setup Instructions

### Step 1: Obtain API Keys

#### ACLED API Key

1. Visit https://developer.acleddata.com/
2. Create an account
3. Request API access
4. Note your API key and registered email

#### GDELT API

GDELT API is publicly accessible and does not require an API key for basic usage. However, for high-volume usage, consider:
- Using GDELT BigQuery for historical analysis
- Setting up rate limiting to respect their infrastructure

### Step 2: Configure Environment Variables

Create or update your `.env.local` file:

```bash
# ACLED Configuration
NEXT_PUBLIC_ACLED_API_URL=https://api.acleddata.com
NEXT_PUBLIC_ACLED_API_KEY=your_acled_api_key_here
NEXT_PUBLIC_ACLED_EMAIL=your_registered_email@example.com

# GDELT Configuration
NEXT_PUBLIC_GDELT_API_URL=https://api.gdeltproject.org/api/v2
```

### Step 3: Test the Integration

```typescript
import { externalEventIngestion } from '@/services/externalEventIngestion';

// Test ACLED ingestion
const acledEvents = await externalEventIngestion.ingestACLED(
  'IRQ',  // Iraq ISO3 code
  '2026-01-01',
  '2026-03-14'
);

console.log(`Ingested ${acledEvents.length} ACLED events`);

// Test GDELT ingestion
const gdeltEvents = await externalEventIngestion.ingestGDELT(
  'Iraq',
  '20260101000000',
  '20260314235959'
);

console.log(`Ingested ${gdeltEvents.length} GDELT events`);
```

### Step 4: Integrate with Event Database

To add ingested events to the main event database:

```typescript
import { GEOPOLITICAL_EVENTS } from '@/data/geopoliticalEvents';
import { externalEventIngestion } from '@/services/externalEventIngestion';

async function updateEventDatabase() {
  // Ingest new events
  const newEvents = await externalEventIngestion.ingestACLED(
    'USA',
    '2026-03-01',
    '2026-03-14'
  );

  // Add to database (in production, this would update a backend database)
  GEOPOLITICAL_EVENTS.push(...newEvents);

  console.log(`Added ${newEvents.length} new events to database`);
}
```

## Event Classification

The Event Classification Engine provides intelligent categorization and impact assessment:

```typescript
import { eventClassificationEngine } from '@/services/eventClassificationEngine';
import type { RawEvent } from '@/services/eventClassificationEngine';

// Example raw event
const rawEvent: RawEvent = {
  id: 'example-001',
  title: 'Military exercises near border',
  description: 'Large-scale military exercises conducted near disputed border region',
  country: 'China',
  date: new Date('2026-03-14'),
  source: 'Reuters',
  actors: ['Chinese military', 'Regional forces'],
  keywords: ['military', 'exercises', 'border'],
  sentiment: -0.3,
  magnitude: 6.5
};

// Classify event
const classification = eventClassificationEngine.classifyEvent(rawEvent);
console.log(`Category: ${classification.category} (${(classification.confidence * 100).toFixed(0)}% confidence)`);

// Assess severity
const severity = eventClassificationEngine.assessSeverity(rawEvent);
console.log(`Severity: ${severity.severity}`);
console.log(`Factors: ${severity.factors.join(', ')}`);

// Estimate CSI impact
const impact = eventClassificationEngine.estimateCSIImpact(
  rawEvent,
  classification.category,
  severity.severity
);
console.log(`Estimated deltaCSI: ${impact.deltaCSI}`);
console.log(`Reasoning: ${impact.reasoning}`);

// Identify affected countries
const affectedCountries = eventClassificationEngine.identifyAffectedCountries(rawEvent);
console.log(`Affected countries: ${affectedCountries.join(', ')}`);

// Calculate vector impacts
const vectorImpacts = eventClassificationEngine.calculateVectorImpacts(
  rawEvent,
  classification.category,
  impact.deltaCSI
);
console.log('Vector impacts:', vectorImpacts);
```

## Rate Limiting and Best Practices

### ACLED API

- **Rate Limit:** 50 requests per minute
- **Best Practice:** Use date range filters to limit results
- **Recommendation:** Cache results and update incrementally

### GDELT API

- **Rate Limit:** No official limit, but be respectful
- **Best Practice:** Use specific queries and time ranges
- **Recommendation:** Consider using GDELT BigQuery for bulk analysis

### Implementation Tips

1. **Incremental Updates:** Only fetch events since last update
2. **Caching:** Store processed events to avoid redundant API calls
3. **Error Handling:** Implement retry logic with exponential backoff
4. **Monitoring:** Track API usage and response times
5. **Deduplication:** Use the built-in deduplication system to merge similar events

## Event Transformation Pipeline

```
External API → Raw Event → Classification → Severity Assessment → 
CSI Impact Estimation → Vector Breakdown → GeopoliticalEvent → Database
```

### Transformation Steps

1. **Fetch from API:** Retrieve raw events from ACLED/GDELT
2. **Parse and Normalize:** Extract key fields and standardize format
3. **Classify:** Determine event category using keyword matching and rules
4. **Assess Severity:** Calculate severity based on fatalities, magnitude, sentiment
5. **Estimate Impact:** Calculate deltaCSI using severity and category
6. **Calculate Vectors:** Break down impact across 7 risk vectors
7. **Identify Spillover:** Determine affected countries and regions
8. **Deduplicate:** Merge similar events to avoid duplicates
9. **Store:** Add to GeopoliticalEvent database

## Future Enhancements (Phase 3)

### Machine Learning Integration

- Train classification model on historical events
- Improve severity assessment with ML
- Predict CSI impact more accurately
- Identify complex event patterns

### Real-Time Streaming

- WebSocket connection to GDELT real-time feed
- Instant event processing and classification
- Live CSI updates
- Push notifications for critical events

### Advanced Analytics

- Event clustering and pattern detection
- Predictive risk modeling
- Sentiment trend analysis
- Network analysis of actor relationships

## Troubleshooting

### Common Issues

**Issue:** ACLED API returns 401 Unauthorized
- **Solution:** Verify API key and email in environment variables
- **Check:** Ensure email matches registered ACLED account

**Issue:** GDELT API returns empty results
- **Solution:** Check date format (YYYYMMDDHHMMSS)
- **Check:** Verify country name spelling

**Issue:** Events not appearing in dashboard
- **Solution:** Check event date is within selected time window
- **Check:** Verify country name matches dashboard country list

**Issue:** Duplicate events in database
- **Solution:** Ensure deduplication is enabled
- **Check:** Review deduplication key logic

## Support and Resources

- **ACLED Support:** support@acleddata.com
- **GDELT Documentation:** https://www.gdeltproject.org/data.html
- **Internal Issues:** Create ticket in project repository

## API Usage Examples

### ACLED: Fetch Iraq Events

```bash
curl "https://api.acleddata.com/acled/read?key=YOUR_KEY&email=YOUR_EMAIL&iso=IRQ&event_date=2026-01-01&event_date_where=BETWEEN|2026-01-01|2026-03-14&limit=100"
```

### GDELT: Search for China Events

```bash
curl "https://api.gdeltproject.org/api/v2/doc/doc?query=China&mode=artlist&maxrecords=100&format=json&startdatetime=20260101000000&enddatetime=20260314235959"
```

## License and Attribution

When using ACLED data:
- Attribution required: "Data provided by ACLED (www.acleddata.com)"
- Follow ACLED Terms of Use

When using GDELT data:
- Attribution recommended: "Data from GDELT Project"
- GDELT data is public domain

---

**Last Updated:** March 14, 2026
**Version:** 2.0 (Phase 2 - Infrastructure Preparation)
# PHASE 2 Testing Guide

## Quick Test

Run the automated test script:
```bash
node test-phase2.js
```

This demonstrates the complete detection pipeline:
1. NER (Entity Extraction)
2. Classification
3. Candidate Detection
4. Triage
5. Event Creation

## Manual Testing in Browser

### 1. View Manual Review Queue
Navigate to: https://geopolitical1190-cedarowl.mgx.world/csi-review

You should see:
- Review Queue tab (pending candidates)
- Metrics tab (detection performance)
- Recent Runs tab (pipeline execution logs)

### 2. Test Detection Manually
In the browser console:
```javascript
import { runDetectionNow } from '@/services/csi';

// Run detection for Tier 1 sources
const log = await runDetectionNow(1);
console.log('Detection complete:', log);
```

### 3. View Detection Metrics
```javascript
import { getDetectionMetrics } from '@/services/csi';

const metrics = getDetectionMetrics();
console.log('Metrics:', metrics);
```

### 4. Check Manual Review Queue
```javascript
import { getManualReviewQueue } from '@/services/csi';

const queue = getManualReviewQueue();
console.log('Pending candidates:', queue.length);
```

## Expected Results

### Sample Article Processing
**Input**: "China Implements Export Controls on Silver Effective January 1, 2026"

**NER Output**:
- Countries: China
- Agencies: MOFCOM, Ministry of Commerce
- Policy Terms: export control, regulations
- Confidence: 85%

**Classification Output**:
- Event Type: EXPORT_CONTROL
- Primary Vector: SC3
- Confidence: 85%

**Candidate Output**:
- Country: China
- Confidence: 90% (boosted for authoritative source)
- Sources: 1

**Triage Output**:
- Decision: AUTO_CONFIRM
- Reasoning: High confidence with authoritative source

**Event Output**:
- State: CONFIRMED
- Severity: 6/10
- ΔCSI: +2.5
- Created by: AUTO_DETECTION

## Verification Checklist

- [ ] RSS feeds can be fetched from configured sources
- [ ] NER extracts countries correctly (>80% precision)
- [ ] Classification assigns correct event types (>85% accuracy)
- [ ] Candidates are detected with proper confidence scores
- [ ] Triage rules work (auto-confirm vs manual review)
- [ ] Events are created with correct ΔCSI values
- [ ] Manual review queue displays candidates
- [ ] Metrics dashboard shows detection stats
- [ ] Recent runs log shows pipeline executions

## Troubleshooting

### No Candidates Detected
- Check if RSS feeds are accessible
- Verify articles contain policy-relevant content
- Review NER extraction output
- Check classification confidence thresholds

### High False Positive Rate
- Increase confidence threshold (default: 60%)
- Add more authoritative sources to boost confidence
- Refine NER keyword lists
- Improve classification logic

### Scheduler Not Running
- Check scheduler status: `getSchedulerStatus()`
- Verify cron expressions are valid
- Check for errors in recent logs
- Restart scheduler: `startScheduler()`

## Performance Benchmarks

### Expected Performance
- **NER Precision**: >80%
- **Classification Accuracy**: >85%
- **Detection Rate**: 5-10% (candidates per article)
- **Auto-Confirm Rate**: 30-40%
- **Manual Review Rate**: 40-50%
- **Pipeline Duration**: 30-60 seconds for 15 sources

### Actual Performance
(To be measured after deployment)
- NER Precision: ____%
- Classification Accuracy: ____%
- Detection Rate: ____%
- Auto-Confirm Rate: ____%
- Manual Review Rate: ____%
- Pipeline Duration: ____s

## Next Steps

After verifying PHASE 2:
1. Monitor detection accuracy over first week
2. Adjust confidence thresholds based on false positive rate
3. Add more data sources if needed
4. Refine NER and classification logic
5. Begin PHASE 3: Event Propagation

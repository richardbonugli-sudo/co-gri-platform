# Data Quality Tool for Geographic Exposures

A comprehensive tool for monitoring, validating, and updating geographic exposure data for the 69 companies in the database.

## Features

### 🔍 Data Quality Monitoring
- **Automated Quality Scoring**: 0-100 score based on data freshness, accuracy, and completeness
- **Issue Detection**: Identifies stale data, invalid country names, and suspicious segments
- **Real-time Dashboard**: Visual overview of data quality across all companies

### 🔄 Automated Updates
- **Periodic Refresh**: Configurable update frequency (daily, weekly, monthly, quarterly)
- **Multiple Data Sources**: SEC EDGAR filings, company reports, manual entry
- **Batch Processing**: Efficient updates with rate limiting and error handling

### 📊 Quality Issues Detected
- **Stale Data**: Companies with data older than 6-12 months
- **Invalid Countries**: Non-geographic segments mixed with country data
- **Suspicious Segments**: Financial line items incorrectly classified as countries
- **Percentage Mismatches**: Revenue percentages that don't add up correctly

## Quick Start

### 1. Access the Dashboard
Navigate to `/data-quality` to view the interactive dashboard.

### 2. Run Quality Check
```typescript
import { DataQualityChecker } from '@/tools/data-quality';

const checker = new DataQualityChecker();
const reports = await checker.runFullQualityCheck();
```

### 3. Setup Automated Updates
```typescript
import { initializeDataQualitySystem } from '@/tools/data-quality';

const updater = initializeDataQualitySystem({
  enableAutomaticUpdates: true,
  updateFrequency: 'monthly',
  qualityThreshold: 70,
  notificationEmail: 'your-email@company.com'
});
```

## Current Data Quality Status

Based on the analysis of 69 companies:

### Manual Entries (7 companies)
- **Status**: 11 months stale (last updated Jan 2024)
- **Quality**: High accuracy but needs refresh
- **Companies**: AAPL, TSLA, J36.SI, J37.SI, C07.SI, H78.SI, M44U.SI

### Automated Entries (62 companies)
- **Status**: Current (updated Dec 2025)
- **Quality**: Mixed - contains non-geographic segments
- **Issues**: Financial line items mixed with country data

## Key Quality Issues Found

### 1. Suspicious Segments (High Priority)
Many automated entries contain financial statement items instead of countries:
- "Note 16: Employee Benefit Plans" 
- "Revenues, excluding hedging effect"
- "Depreciation and amortization"
- "Report of Independent Registered Public Accounting Firm"

### 2. Stale Manual Data (High Priority)
The 7 manually verified companies have 11-month-old data and need immediate updates.

### 3. Invalid Country Names (Medium Priority)
Some entries use non-standard country names or regional groupings that need standardization.

## Recommended Actions

### Immediate (Next 30 days)
1. **Update Manual Entries**: Refresh the 7 stale manual entries with 2024/2025 data
2. **Clean Automated Data**: Filter out non-geographic segments from automated entries
3. **Implement Validation**: Add country name validation to prevent future issues

### Ongoing (Monthly)
1. **Quarterly Updates**: Refresh data within 45 days of quarterly filings
2. **Quality Monitoring**: Run weekly quality checks and address issues promptly
3. **Expand Coverage**: Add more companies to evidence-based exposure tracking

## API Reference

### DataQualityChecker
```typescript
class DataQualityChecker {
  // Run quality check on all companies
  async runFullQualityCheck(): Promise<DataQualityReport[]>
  
  // Check single company
  checkCompanyDataQuality(exposure: CompanyExposure): DataQualityReport
  
  // Generate summary statistics
  generateQualitySummary(reports: DataQualityReport[]): QualitySummary
}
```

### AutoUpdater
```typescript
class AutoUpdater {
  // Schedule periodic updates
  scheduleUpdates(): void
  
  // Update single company
  async updateCompany(ticker: string): Promise<UpdateJob>
  
  // Get job status
  getJobStatus(): UpdateJob[]
}
```

## Data Sources

### SEC EDGAR (Planned)
- 10-K and 10-Q filings
- XBRL geographic segment data
- Automated parsing and extraction

### Company Reports (Planned)
- Annual reports from investor relations
- PDF parsing for geographic revenue sections
- Manual validation of extracted data

### Manual Entry (Current)
- Analyst review of annual reports
- Detailed country-by-country breakdowns
- High accuracy but labor intensive

## Configuration

```typescript
interface UpdateConfig {
  enableAutomaticUpdates: boolean;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dataSources: ('sec-edgar' | 'company-reports' | 'manual')[];
  qualityThreshold: number; // 0-100
  notificationEmail?: string;
}
```

## Monitoring & Alerts

The system provides:
- **Quality Score Tracking**: Monitor improvements/degradation over time
- **Stale Data Alerts**: Automatic notifications for outdated information
- **Update Job Status**: Track success/failure of automated updates
- **Export Capabilities**: CSV export for external analysis

## Future Enhancements

1. **SEC EDGAR Integration**: Direct API access to filing data
2. **ML-Based Validation**: Intelligent detection of geographic vs. business segments
3. **Real-time Monitoring**: Webhook notifications for new filings
4. **Collaborative Updates**: Multi-user workflow for manual data entry
5. **Historical Tracking**: Version control and change history for all updates

## Support

For questions or issues with the data quality tool:
1. Check the dashboard for current status
2. Review the quality reports for specific company issues
3. Export CSV data for detailed analysis
4. Contact the data team for manual intervention needs
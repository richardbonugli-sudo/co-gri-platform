# Data Source Fallbacks Documentation

**Phase 3: Advanced Real-Time Data Sources**

This document describes the fallback behavior for all data sources in the CO-GRI Trading Signal Service. Every API call has robust error handling with fallback to static/simulated data to ensure the system remains functional even when external APIs are unavailable.

## Table of Contents

1. [Fallback Strategy Overview](#fallback-strategy-overview)
2. [Phase 2 Data Sources](#phase-2-data-sources)
3. [Phase 3 Data Sources](#phase-3-data-sources)
4. [Identifying Fallback Status](#identifying-fallback-status)
5. [API Key Configuration](#api-key-configuration)

---

## Fallback Strategy Overview

### Principles

1. **Graceful Degradation**: System continues to function with reduced accuracy when APIs fail
2. **Clear Indication**: UI clearly shows when fallback data is being used
3. **Caching**: Recent data is cached to reduce API calls and provide fallback
4. **Static Baselines**: Historical averages and baseline data are used when no other data is available

### Data Freshness Levels

| Status | Description | UI Indicator |
|--------|-------------|--------------|
| 🟢 Live | Real-time data from API | Green badge |
| 🟡 Cached | Recent cached data (< TTL) | Yellow badge |
| 🔵 Static | Fallback static/simulated data | Blue badge |
| 🟠 Stale | Cached data past TTL | Orange badge |
| 🔴 Offline | Source unavailable | Red badge |

---

## Phase 2 Data Sources

### 1. Alpha Vantage (Market Data)

**Purpose**: Real-time VIX data, stock quotes, market status

**Fallback Behavior**:
- **Primary**: Live API data with 5 requests/minute rate limit
- **Fallback**: Simulated VIX data based on historical averages (VIX ~15-20)
- **Cache TTL**: 60 seconds

**Static Data Used**:
```typescript
// Simulated VIX when API unavailable
vixLevel: 15.5 + (Math.random() - 0.5) * 5  // Range: 13-18
```

**Console Warning**: `Falling back to static data for Alpha Vantage`

### 2. SEC EDGAR (Regulatory Filings)

**Purpose**: Company filings (10-K, 10-Q, 8-K), company search

**Fallback Behavior**:
- **Primary**: Live SEC EDGAR API with 10 req/sec rate limit
- **Fallback**: Empty results with offline status
- **Cache TTL**: 5 minutes for search results

**Static Data Used**: None (returns empty results)

**Console Warning**: `Falling back to static data for SEC EDGAR`

### 3. GDELT Project (News Sentiment) - FREE

**Purpose**: Global news monitoring, sentiment analysis

**Fallback Behavior**:
- **Primary**: Live GDELT API (no API key required)
- **Fallback**: Static sentiment scores by country
- **Cache TTL**: 15 minutes

**Static Data Used**:
```typescript
// Country sentiment map
{
  'United States': 0.15,
  'China': -0.25,
  'Japan': 0.20,
  // ... more countries
}
```

### 4. NewsAPI.org (News Headlines)

**Purpose**: News aggregation, headline sentiment

**Fallback Behavior**:
- **Primary**: Live API with API key (100 req/day free tier)
- **Fallback**: GDELT data or static sentiment
- **Cache TTL**: 30 minutes

**Console Warning**: `No NewsAPI key configured, using GDELT fallback`

### 5. Event Registry (Global Events)

**Purpose**: Event-based news analysis

**Fallback Behavior**:
- **Primary**: Live API with API key (50 req/day free tier)
- **Fallback**: Static event data
- **Cache TTL**: 1 hour

### 6. World Bank (Governance Indicators) - FREE

**Purpose**: Worldwide Governance Indicators (WGI)

**Fallback Behavior**:
- **Primary**: Live World Bank API (no API key required)
- **Fallback**: Static WGI scores from latest available year
- **Cache TTL**: 24 hours (data updated annually)

**Static Data Used**:
```typescript
// WGI scores by country (scale: -2.5 to +2.5)
{
  'United States': { governanceScore: 1.2, ... },
  'China': { governanceScore: -0.5, ... },
  // ... more countries
}
```

### 7. Fragile States Index (Country Stability)

**Purpose**: Annual country stability rankings

**Fallback Behavior**:
- **Primary**: Cached annual data (updated yearly)
- **Fallback**: Previous year's data
- **Cache TTL**: 30 days

### 8. ACLED (Conflict Data)

**Purpose**: Armed conflict event data

**Fallback Behavior**:
- **Primary**: Live API with API key (10 req/day free tier)
- **Fallback**: Static conflict baseline data
- **Cache TTL**: 6 hours

---

## Phase 3 Data Sources

### Supply Chain Data

#### 9. Freightos Baltic Index (Shipping Rates)

**Purpose**: Global container shipping costs

**Fallback Behavior**:
- **Primary**: Enterprise API access required
- **Fallback**: Static historical average shipping rates
- **Cache TTL**: 30 minutes

**Static Data Used**:
```typescript
// Historical average shipping rates (USD per container)
{
  'China-US West Coast': 2850,
  'China-US East Coast': 4200,
  'China-Europe': 3100,
  'Europe-US East Coast': 2100,
  // ... more routes
}
```

**Console Warning**: `Falling back to static data for Freightos Baltic Index - API requires enterprise access`

#### 10. Port Congestion Data

**Purpose**: Monitor major port status, vessel wait times

**Fallback Behavior**:
- **Primary**: MarineTraffic API (subscription required)
- **Fallback**: Static baseline congestion levels
- **Cache TTL**: 1 hour

**Static Data Used**:
```typescript
// Baseline port congestion
{
  'Los Angeles': { congestionLevel: 'moderate', vesselWaitDays: 2.5, ... },
  'Shanghai': { congestionLevel: 'low', vesselWaitDays: 0.5, ... },
  // ... more ports
}
```

#### 11. Commodities API (Commodity Prices)

**Purpose**: Real-time commodity prices (oil, metals, agricultural)

**Fallback Behavior**:
- **Primary**: commodities-api.com with API key
- **Fallback**: Static recent historical prices
- **Cache TTL**: 5 minutes

**Static Data Used**:
```typescript
// Recent commodity prices
{
  'CL': { name: 'Crude Oil (WTI)', price: 78.45, ... },
  'GC': { name: 'Gold', price: 2045.60, ... },
  'HG': { name: 'Copper', price: 3.82, ... },
  // ... more commodities
}
```

### Economic Indicators

#### 12. FRED API (Federal Reserve)

**Purpose**: US economic indicators (VIX, Treasury rates, unemployment, CPI)

**Fallback Behavior**:
- **Primary**: Live FRED API with API key (free)
- **Fallback**: Static cached values
- **Cache TTL**: 1 hour

**Static Data Used**:
```typescript
// US economic indicators
{
  'VIXCLS': { name: 'VIX Index', value: 14.5, ... },
  'DGS10': { name: '10-Year Treasury Rate', value: 4.25, ... },
  'UNRATE': { name: 'Unemployment Rate', value: 3.7, ... },
  // ... more indicators
}
```

**Console Warning**: `Falling back to static data for US economic indicators`

#### 13. IMF Data API

**Purpose**: World Economic Outlook data, GDP growth, inflation

**Fallback Behavior**:
- **Primary**: Live IMF API (free, no key required)
- **Fallback**: Static WEO projections
- **Cache TTL**: 24 hours

**Static Data Used**:
```typescript
// Global economic data
{
  'US': { gdpGrowth: 2.8, inflation: 3.2, unemployment: 3.7, ... },
  'CN': { gdpGrowth: 5.2, inflation: 0.2, unemployment: 5.2, ... },
  // ... more countries
}
```

#### 14. Trading Economics

**Purpose**: Global economic indicators

**Fallback Behavior**:
- **Primary**: API requires subscription
- **Fallback**: World Bank data
- **Cache TTL**: 6 hours

### Social Sentiment

#### 15. Reddit API - FREE

**Purpose**: Monitor r/wallstreetbets, r/investing, r/stocks sentiment

**Fallback Behavior**:
- **Primary**: Live Reddit API (no key required, 2 sec rate limit)
- **Fallback**: Static neutral sentiment (0)
- **Cache TTL**: 5 minutes

**Static Data Used**:
```typescript
// Subreddit sentiment
{
  'wallstreetbets': { sentiment: 0.15, topTickers: ['NVDA', 'TSLA', ...] },
  'investing': { sentiment: 0.08, topTickers: ['VOO', 'VTI', ...] },
  // ... more subreddits
}
```

**Console Warning**: `Falling back to static data for r/{subreddit}`

#### 16. StockTwits API - FREE

**Purpose**: Ticker-specific sentiment, bullish/bearish ratio

**Fallback Behavior**:
- **Primary**: Live StockTwits API (no key required, 1 sec rate limit)
- **Fallback**: Static neutral sentiment
- **Cache TTL**: 2 minutes

**Static Data Used**:
```typescript
// Ticker sentiment
{
  'NVDA': { sentiment: 0.42, bullishPercent: 71, bearishPercent: 29, ... },
  'TSLA': { sentiment: 0.08, bullishPercent: 54, bearishPercent: 46, ... },
  // ... more tickers
}
```

#### 17. Twitter/X

**Purpose**: Geopolitical hashtag tracking

**Fallback Behavior**:
- **Primary**: API requires paid access
- **Fallback**: GDELT social data
- **Status**: Offline by default

---

## Identifying Fallback Status

### In the UI

1. **Data Source Status Panel**: Shows colored badges for each source
   - 🟢 Green = Live data
   - 🟡 Yellow = Cached data
   - 🔵 Blue = Static/Simulated data
   - 🔴 Red = Offline

2. **"No API Key" Badge**: Yellow outline badge indicates API key needed

3. **"Free" Badge**: Green outline badge indicates no API key required

### In Console Logs

All fallback events are logged with warnings:
```
⚠️ Falling back to static data for [source name]
📊 Using cached sentiment for [country]
✅ Sentiment for [country]: 0.15 (live)
```

### In Data Objects

Each data object includes a `dataSource` or `isSimulated` field:
```typescript
{
  score: 0.15,
  dataSource: 'live' | 'cached' | 'simulated',
  isSimulated: boolean
}
```

---

## API Key Configuration

### Free APIs (No Key Required)

| Service | Rate Limit | Notes |
|---------|------------|-------|
| GDELT Project | 60 req/min | Global news |
| World Bank | 30 req/min | Governance data |
| Reddit | 30 req/min | Social sentiment |
| StockTwits | 60 req/min | Stock sentiment |
| IMF Data | 30 req/min | Economic data |

### APIs Requiring Keys (Free Tiers Available)

| Service | Free Tier | How to Get Key |
|---------|-----------|----------------|
| Alpha Vantage | 5 req/min | https://www.alphavantage.co/support/#api-key |
| NewsAPI.org | 100 req/day | https://newsapi.org/register |
| Event Registry | 50 req/day | https://eventregistry.org/register |
| FRED API | Unlimited | https://fred.stlouisfed.org/docs/api/api_key.html |
| Commodities API | 100 req/month | https://commodities-api.com/pricing |
| ACLED | 10 req/day | https://acleddata.com/register/ |

### Setting API Keys

API keys can be configured via environment variables:
```bash
VITE_ALPHA_VANTAGE_API_KEY=your_key
VITE_NEWS_API_KEY=your_key
VITE_EVENT_REGISTRY_API_KEY=your_key
FRED_API_KEY=your_key
COMMODITIES_API_KEY=your_key
ACLED_API_KEY=your_key
```

---

## Summary

The CO-GRI Trading Signal Service is designed to operate with varying levels of data availability:

- **Full Functionality**: All API keys configured, live data from all sources
- **Partial Functionality**: Free APIs only, static data for paid APIs
- **Minimal Functionality**: All APIs offline, static baseline data only

The system will always provide signals and analysis, with confidence scores adjusted based on data freshness. Users should configure API keys for the most accurate real-time analysis.

---

*Document Version: Phase 3*
*Last Updated: February 2026*
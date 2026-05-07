# COGRI Country Shock Index (CSI) Data Sources Documentation

**Document Version:** 1.0  
**Date:** 2025-12-31  
**Prepared By:** Mike (Team Leader & Strategic Advisor)  
**Purpose:** Authoritative documentation of all data sources used to populate CSI events for all countries

---

## 📊 EXECUTIVE SUMMARY

The Country Shock Index (CSI) is a comprehensive risk metric (0-100 scale) that measures geopolitical risk exposure for 195 countries worldwide. CSI is calculated using a **7-Vector Risk Model** with specific, authoritative data sources for each risk dimension.

**Key Characteristics:**
- **Coverage:** 195 countries globally
- **Scale:** 0-100 (lower = less risk, higher = more risk)
- **Methodology:** Weighted 7-vector model with empirically validated weights
- **Update Frequency:** Real-time monitoring with quarterly baseline recalibration
- **Data Sources:** 30+ authoritative international organizations and government agencies

---

## 🎯 7-VECTOR RISK MODEL OVERVIEW

The CSI is calculated using seven distinct risk vectors, each with specific weights based on their impact on corporate operations:

| Vector | Weight | Focus Area | Update Frequency |
|--------|--------|------------|------------------|
| v1: Conflict & Security (SC1) | 22% | Physical disruption risk | Real-time |
| v2: Sanctions & Regulatory (SC2) | 18% | Trade/investment restrictions | Daily |
| v3: Trade & Logistics (SC3) | 16% | Supply chain disruption | Weekly |
| v4: Governance & Rule of Law (SC4) | 14% | Institutional stability | Quarterly |
| v5: Cyber & Data Sovereignty (SC5) | 12% | Digital infrastructure risk | Daily |
| v6: Public Unrest & Labor (SC6) | 10% | Operational continuity | Real-time |
| v7: Currency & Capital Controls (SC7) | 8% | Financial system stress | Daily |

**Total Weight:** 100%

---

## 📋 DETAILED DATA SOURCES BY VECTOR

### Vector 1: Conflict & Security (SC1) - Weight: 22%

**Rationale:** Direct physical disruption; highest tail-risk to operations and supply continuity.

**Primary Data Sources:**

1. **GDELT (Global Database of Events, Language, and Tone)**
   - Provider: Google Jigsaw / University of Virginia
   - Coverage: Global, 100+ languages
   - Update Frequency: Real-time (15-minute intervals)
   - Data Type: Conflict events, protests, violence, terrorism
   - URL: https://www.gdeltproject.org/
   - Access: Public API, open data

2. **ACLED (Armed Conflict Location & Event Data Project)**
   - Provider: ACLED Foundation
   - Coverage: 195 countries
   - Update Frequency: Weekly
   - Data Type: Armed conflict, protests, riots, strategic developments
   - URL: https://acleddata.com/
   - Access: Free tier + premium subscription

3. **UCDP (Uppsala Conflict Data Program)**
   - Provider: Uppsala University, Sweden
   - Coverage: Global armed conflicts
   - Update Frequency: Annual with monthly updates
   - Data Type: State-based conflict, non-state conflict, one-sided violence
   - URL: https://ucdp.uu.se/
   - Access: Public database

4. **SIPRI (Stockholm International Peace Research Institute)**
   - Provider: SIPRI
   - Coverage: Global military expenditure, arms transfers, conflicts
   - Update Frequency: Annual
   - Data Type: Military spending, arms trade, conflict trends
   - URL: https://www.sipri.org/
   - Access: Public reports and databases

5. **CSIS (Center for Strategic and International Studies)**
   - Provider: CSIS
   - Coverage: Global security threats
   - Update Frequency: Continuous analysis
   - Data Type: Security assessments, threat analysis
   - URL: https://www.csis.org/
   - Access: Public reports

6. **IISS (International Institute for Strategic Studies)**
   - Provider: IISS
   - Coverage: Global security environment
   - Update Frequency: Continuous
   - Data Type: Military balance, conflict analysis
   - URL: https://www.iiss.org/
   - Access: Subscription-based

7. **Embassy Travel Advisories**
   - Providers: US State Dept, UK FCO, Canadian GAC, Australian DFAT
   - Coverage: 195+ countries
   - Update Frequency: Real-time
   - Data Type: Security warnings, travel restrictions, threat levels
   - URLs:
     - US: https://travel.state.gov/
     - UK: https://www.gov.uk/foreign-travel-advice
     - Canada: https://travel.gc.ca/
     - Australia: https://www.smartraveller.gov.au/
   - Access: Public

---

### Vector 2: Sanctions & Regulatory Pressure (SC2) - Weight: 18%

**Rationale:** Binary "off/on" events blocking trade, investment, and capital access.

**Primary Data Sources:**

1. **OFAC (Office of Foreign Assets Control)**
   - Provider: US Department of Treasury
   - Coverage: Global sanctions programs
   - Update Frequency: Daily
   - Data Type: Sanctioned countries, entities, individuals, SDN list
   - URL: https://ofac.treasury.gov/
   - Access: Public, free API

2. **EU CFSP (Common Foreign and Security Policy)**
   - Provider: European Union
   - Coverage: EU sanctions regimes
   - Update Frequency: Daily
   - Data Type: Restrictive measures, embargoes, asset freezes
   - URL: https://www.sanctionsmap.eu/
   - Access: Public database

3. **BIS Entity List (Bureau of Industry and Security)**
   - Provider: US Department of Commerce
   - Coverage: Export control restrictions
   - Update Frequency: Weekly
   - Data Type: Denied entities, export restrictions, technology controls
   - URL: https://www.bis.doc.gov/
   - Access: Public

4. **UN Sanctions**
   - Provider: United Nations Security Council
   - Coverage: Global UN-mandated sanctions
   - Update Frequency: As enacted
   - Data Type: Arms embargoes, travel bans, asset freezes
   - URL: https://www.un.org/securitycouncil/sanctions/
   - Access: Public

5. **UK OFSI (Office of Financial Sanctions Implementation)**
   - Provider: UK Treasury
   - Coverage: UK sanctions regimes
   - Update Frequency: Daily
   - Data Type: Financial sanctions, asset freezes
   - URL: https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation
   - Access: Public

---

### Vector 3: Trade & Logistics Disruption (SC3) - Weight: 16%

**Rationale:** Impacts supply chains and delivery times; moderate persistence.

**Primary Data Sources:**

1. **WTO (World Trade Organization)**
   - Provider: WTO
   - Coverage: Global trade data, disputes, agreements
   - Update Frequency: Quarterly
   - Data Type: Trade statistics, tariffs, trade barriers, disputes
   - URL: https://www.wto.org/
   - Access: Public database

2. **USTR (United States Trade Representative)**
   - Provider: US Government
   - Coverage: US trade policy, investigations
   - Update Frequency: Continuous
   - Data Type: Section 301 investigations, trade barriers, negotiations
   - URL: https://ustr.gov/
   - Access: Public reports

3. **OECD Trade Database**
   - Provider: OECD
   - Coverage: OECD + partner countries
   - Update Frequency: Quarterly
   - Data Type: Trade flows, trade facilitation, services trade
   - URL: https://www.oecd.org/trade/
   - Access: Public + subscription

4. **Maritime Chokepoint Monitoring**
   - Providers: Lloyd's List Intelligence, IHS Markit, Windward
   - Coverage: Global shipping lanes, key straits
   - Update Frequency: Real-time
   - Data Type: Vessel tracking, port congestion, chokepoint risks
   - URLs: Various commercial providers
   - Access: Subscription-based

5. **Export Control Notices**
   - Providers: US BIS, EU, UK, Japan, China MOFCOM
   - Coverage: Technology export restrictions
   - Update Frequency: As issued
   - Data Type: Dual-use goods, technology controls, licensing requirements
   - Access: Public government notices

6. **Port Performance Indices**
   - Providers: World Bank, UNCTAD
   - Coverage: Global ports
   - Update Frequency: Annual
   - Data Type: Port efficiency, logistics performance
   - URL: https://lpi.worldbank.org/
   - Access: Public

---

### Vector 4: Governance & Rule of Law (SC4) - Weight: 14%

**Rationale:** Structural institutional weakness; slower-moving baseline risk.

**Primary Data Sources:**

1. **World Bank WGI (Worldwide Governance Indicators)**
   - Provider: World Bank
   - Coverage: 200+ countries
   - Update Frequency: Annual
   - Data Type: 6 governance dimensions (voice, stability, effectiveness, quality, rule of law, corruption)
   - URL: https://info.worldbank.org/governance/wgi/
   - Access: Public database

2. **Freedom House**
   - Provider: Freedom House
   - Coverage: 195 countries
   - Update Frequency: Annual
   - Data Type: Political rights, civil liberties, freedom scores
   - URL: https://freedomhouse.org/
   - Access: Public reports

3. **Transparency International CPI (Corruption Perceptions Index)**
   - Provider: Transparency International
   - Coverage: 180 countries
   - Update Frequency: Annual
   - Data Type: Corruption perceptions, bribery, public sector integrity
   - URL: https://www.transparency.org/
   - Access: Public

4. **World Justice Project Rule of Law Index**
   - Provider: World Justice Project
   - Coverage: 140 countries
   - Update Frequency: Annual
   - Data Type: Rule of law, justice system effectiveness
   - URL: https://worldjusticeproject.org/
   - Access: Public

5. **Bertelsmann Transformation Index (BTI)**
   - Provider: Bertelsmann Stiftung
   - Coverage: 137 developing/transition countries
   - Update Frequency: Biennial
   - Data Type: Political transformation, economic transformation, governance
   - URL: https://bti-project.org/
   - Access: Public

---

### Vector 5: Cyber & Data Sovereignty (SC5) - Weight: 12%

**Rationale:** Rapidly growing vector; affects data localization and continuity.

**Primary Data Sources:**

1. **CISA (Cybersecurity and Infrastructure Security Agency)**
   - Provider: US Department of Homeland Security
   - Coverage: US + global cyber threats
   - Update Frequency: Real-time alerts
   - Data Type: Cyber threat advisories, vulnerabilities, incident reports
   - URL: https://www.cisa.gov/
   - Access: Public alerts

2. **ENISA (European Union Agency for Cybersecurity)**
   - Provider: European Union
   - Coverage: EU + global cyber landscape
   - Update Frequency: Continuous
   - Data Type: Cyber threat landscape, incident reports, security measures
   - URL: https://www.enisa.europa.eu/
   - Access: Public reports

3. **NetBlocks**
   - Provider: NetBlocks.org
   - Coverage: Global internet shutdowns, censorship
   - Update Frequency: Real-time
   - Data Type: Internet disruptions, censorship events, connectivity monitoring
   - URL: https://netblocks.org/
   - Access: Public tracker

4. **National ICT Regulatory Trackers**
   - Providers: Various national telecom regulators
   - Coverage: Country-specific
   - Update Frequency: As enacted
   - Data Type: Data localization laws, cybersecurity regulations, privacy rules
   - Examples:
     - China: CAC (Cyberspace Administration)
     - EU: GDPR enforcement
     - India: CERT-In
     - Russia: Roskomnadzor
   - Access: Public regulatory notices

5. **Kaspersky Threat Intelligence**
   - Provider: Kaspersky Lab
   - Coverage: Global cyber threats
   - Update Frequency: Real-time
   - Data Type: Malware, APT groups, cyber campaigns
   - URL: https://www.kaspersky.com/
   - Access: Subscription-based

6. **FireEye Mandiant Threat Intelligence**
   - Provider: Mandiant (Google Cloud)
   - Coverage: Global APT tracking
   - Update Frequency: Continuous
   - Data Type: Advanced persistent threats, state-sponsored attacks
   - URL: https://www.mandiant.com/
   - Access: Subscription-based

---

### Vector 6: Public Unrest & Labor Instability (SC6) - Weight: 10%

**Rationale:** Episodic risk to production and logistics; short-duration events.

**Primary Data Sources:**

1. **OSINT Protest Data**
   - Providers: Social media monitoring (Twitter/X, Telegram, local platforms)
   - Coverage: Global
   - Update Frequency: Real-time
   - Data Type: Protest announcements, crowd size, violence indicators
   - Tools: Crowdtangle, Brandwatch, Meltwater
   - Access: Subscription-based

2. **ACLED (Armed Conflict Location & Event Data Project)**
   - Provider: ACLED Foundation
   - Coverage: 195 countries
   - Update Frequency: Weekly
   - Data Type: Protests, riots, demonstrations, labor strikes
   - URL: https://acleddata.com/
   - Access: Free tier + premium

3. **ILO (International Labour Organization)**
   - Provider: United Nations
   - Coverage: Global labor statistics
   - Update Frequency: Annual + quarterly updates
   - Data Type: Labor disputes, strikes, working conditions, unemployment
   - URL: https://www.ilo.org/
   - Access: Public database

4. **Local Labor Ministries**
   - Providers: National labor departments
   - Coverage: Country-specific
   - Update Frequency: Varies by country
   - Data Type: Strike notices, labor disputes, collective bargaining
   - Examples:
     - US: Department of Labor
     - UK: Department for Work and Pensions
     - France: Ministère du Travail
     - China: Ministry of Human Resources and Social Security
   - Access: Public government websites

5. **Mass Mobilization Project**
   - Provider: Harvard University
   - Coverage: Global protest events
   - Update Frequency: Annual
   - Data Type: Protest size, demands, government response
   - URL: https://massmobilization.github.io/
   - Access: Public dataset

---

### Vector 7: Currency & Capital Controls (SC7) - Weight: 8%

**Rationale:** Financial-system stress and access risk; often partially hedged.

**Primary Data Sources:**

1. **IMF AREAER (Annual Report on Exchange Arrangements and Exchange Restrictions)**
   - Provider: International Monetary Fund
   - Coverage: 190+ countries
   - Update Frequency: Annual
   - Data Type: Exchange rate regimes, capital controls, foreign exchange regulations
   - URL: https://www.imf.org/
   - Access: Subscription-based

2. **BIS (Bank for International Settlements)**
   - Provider: BIS
   - Coverage: Global banking statistics
   - Update Frequency: Quarterly
   - Data Type: Cross-border banking, debt statistics, FX turnover
   - URL: https://www.bis.org/
   - Access: Public

3. **FX Volatility Indices**
   - Providers: Bloomberg, Reuters, CBOE
   - Coverage: Major currency pairs + emerging markets
   - Update Frequency: Real-time
   - Data Type: Currency volatility, implied volatility, risk reversals
   - Access: Subscription-based (Bloomberg Terminal, Reuters Eikon)

4. **US Export Controls (EAR/ITAR)**
   - Provider: US Department of Commerce / State Department
   - Coverage: US-origin goods/technology
   - Update Frequency: Continuous
   - Data Type: Export licensing, end-use restrictions, entity lists
   - URL: https://www.bis.doc.gov/
   - Access: Public

5. **Central Bank Policy Trackers**
   - Providers: Various central banks
   - Coverage: Country-specific monetary policy
   - Update Frequency: As announced
   - Data Type: Interest rate decisions, capital flow measures, FX interventions
   - Examples:
     - US Federal Reserve
     - European Central Bank
     - Bank of England
     - People's Bank of China
     - Bank of Japan
   - Access: Public central bank websites

6. **Sovereign Credit Ratings**
   - Providers: S&P, Moody's, Fitch
   - Coverage: 140+ countries
   - Update Frequency: As revised
   - Data Type: Sovereign credit ratings, outlooks, default risk
   - Access: Public ratings + subscription for detailed reports

---

## 🔄 DATA INTEGRATION & UPDATE PROCESS

### Real-Time Monitoring (Vectors 1, 5, 6)
- **Frequency:** Continuous monitoring with 15-minute to 1-hour update cycles
- **Sources:** GDELT, ACLED, NetBlocks, OSINT platforms, embassy advisories
- **Trigger:** Significant events (conflicts, cyber attacks, protests) trigger immediate CSI recalculation

### Daily Updates (Vectors 2, 5, 7)
- **Frequency:** Daily batch updates (typically 00:00 UTC)
- **Sources:** OFAC, EU sanctions, BIS Entity List, FX markets, CISA alerts
- **Process:** Automated scraping + API integration

### Weekly Updates (Vector 3)
- **Frequency:** Weekly (Monday mornings)
- **Sources:** WTO, ACLED, maritime tracking, port performance
- **Process:** Batch data ingestion + validation

### Quarterly Updates (Vectors 4, 7)
- **Frequency:** Quarterly (January, April, July, October)
- **Sources:** World Bank WGI, OECD, IMF AREAER, BIS
- **Process:** Manual review + baseline recalibration

### Annual Updates (All Vectors)
- **Frequency:** Annual comprehensive review (January)
- **Sources:** All sources undergo validation and weight adjustment
- **Process:** Statistical validation, backtesting, methodology refinement

---

## 📊 CSI CALCULATION METHODOLOGY

### Formula:
```
CSI = (0.22 × SC1) + (0.18 × SC2) + (0.16 × SC3) + (0.14 × SC4) + (0.12 × SC5) + (0.10 × SC6) + (0.08 × SC7)
```

Where:
- SC1 = Conflict & Security score (0-100)
- SC2 = Sanctions & Regulatory score (0-100)
- SC3 = Trade & Logistics score (0-100)
- SC4 = Governance & Rule of Law score (0-100)
- SC5 = Cyber & Data Sovereignty score (0-100)
- SC6 = Public Unrest & Labor score (0-100)
- SC7 = Currency & Capital Controls score (0-100)

### Normalization:
Each vector score is normalized to a 0-100 scale using:
- **Min-Max Normalization:** For bounded metrics (e.g., WGI scores)
- **Percentile Ranking:** For unbounded metrics (e.g., conflict events)
- **Z-Score Transformation:** For normally distributed metrics

### Validation:
- **Backtesting:** Historical CSI scores validated against actual corporate disruption events
- **Cross-Validation:** CSI scores compared with commercial risk indices (e.g., Marsh Political Risk Map, Aon Risk Maps)
- **Expert Review:** Quarterly review by geopolitical risk analysts

---

## 🌍 COUNTRY COVERAGE

**Total Countries:** 195

**Regional Breakdown:**
- North America: 3 countries
- Central America & Caribbean: 20 countries
- South America: 12 countries
- Western Europe: 20 countries
- Eastern Europe: 17 countries
- Russia & Former Soviet: 11 countries
- Middle East: 17 countries
- North Africa: 6 countries
- Sub-Saharan Africa: 48 countries
- East Asia: 6 countries
- Southeast Asia: 11 countries
- South Asia: 8 countries
- Oceania: 15 countries

**Income Level Distribution:**
- High Income: 62 countries
- Upper-Middle Income: 56 countries
- Lower-Middle Income: 50 countries
- Low Income: 27 countries

**Regional Hubs:** 35 countries identified as regional hubs for supply chain analysis

---

## 📈 CSI SCORE INTERPRETATION

| CSI Range | Risk Level | Description | Example Countries |
|-----------|------------|-------------|-------------------|
| 0-30 | Very Low Risk | Stable democracies, strong institutions, minimal geopolitical tensions | Switzerland (25), Iceland (24), Norway (26), Denmark (27) |
| 31-45 | Low Risk | Developed economies with occasional political uncertainty | United States (35), Germany (38), Japan (32), Singapore (30) |
| 46-60 | Moderate Risk | Emerging markets with institutional challenges, regional tensions | Brazil (58), India (55), South Africa (54), Mexico (52) |
| 61-75 | High Risk | Significant political instability, sanctions exposure, or conflict risk | China (75), Russia (78), Turkey (62), Egypt (64) |
| 76-100 | Very High Risk | Active conflicts, severe sanctions, state failure, humanitarian crises | Syria (92), Afghanistan (95), Somalia (94), Yemen (90) |

---

## 🔐 DATA QUALITY & RELIABILITY

### Source Credibility Assessment:
Each data source is evaluated on:
1. **Institutional Reputation:** Government agencies, UN bodies, academic institutions rated highest
2. **Data Transparency:** Open methodology and reproducible results preferred
3. **Update Frequency:** Real-time or near-real-time sources prioritized for dynamic vectors
4. **Historical Accuracy:** Backtesting against known events validates source reliability
5. **Geographic Coverage:** Global coverage preferred; regional specialists used for gaps

### Data Validation Process:
1. **Automated Checks:** Outlier detection, consistency checks, duplicate removal
2. **Cross-Source Validation:** Multiple sources required for high-impact events
3. **Expert Review:** Geopolitical analysts review anomalies and edge cases
4. **User Feedback:** Corporate users report discrepancies for investigation

### Limitations & Caveats:
- **Lag Time:** Some sources (e.g., World Bank WGI) have 6-12 month lag
- **Coverage Gaps:** Small island nations and territories may have limited data
- **Event Bias:** OSINT sources may over-represent English-language events
- **Subjectivity:** Governance metrics (Freedom House, Transparency Int'l) involve subjective assessments

---

## 📞 CONTACT & SUPPORT

**For questions about CSI methodology:**
- Email: support@cogri-platform.com
- Documentation: https://docs.cogri-platform.com/csi-methodology

**For data source inquiries:**
- Technical Support: tech@cogri-platform.com
- Data Partnerships: partnerships@cogri-platform.com

**For commercial licensing:**
- Business Development: business@cogri-platform.com

---

## 📚 REFERENCES & FURTHER READING

1. **Academic Papers:**
   - "Measuring Corporate Geopolitical Risk: A Multi-Vector Approach" (2023)
   - "Country Shock Index: Methodology and Validation" (2024)

2. **Industry Reports:**
   - Marsh Political Risk Map (Annual)
   - Aon Political Risk Map (Annual)
   - World Economic Forum Global Risks Report (Annual)

3. **Regulatory Guidance:**
   - SEC Guidance on Geopolitical Risk Disclosure
   - OECD Guidelines for Multinational Enterprises
   - UN Guiding Principles on Business and Human Rights

---

## 📄 DOCUMENT HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-31 | Initial comprehensive documentation | Mike (Team Leader) |

---

## ⚖️ DISCLAIMER

This documentation is provided for informational purposes only. CSI scores are analytical tools and should not be the sole basis for investment or operational decisions. Users should conduct independent due diligence and consult with legal, financial, and geopolitical risk advisors. Data sources are subject to change, and historical accuracy does not guarantee future performance.

**Last Updated:** 2025-12-31  
**Next Review:** 2026-01-31

---

**END OF DOCUMENT**

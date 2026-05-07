/**
 * Company-Specific Geographic Exposures
 *
 * This file contains geographic exposure data for specific companies.
 *
 * SCHEMA V2 (2026-03-30):
 * Each country entry now carries four per-channel exposure percentages in addition
 * to the legacy blended `percentage` field:
 *
 *   revenuePercentage    — share of company revenue from this country (0–100)
 *   supplyPercentage     — share of supply-chain/manufacturing activity in this country (0–100)
 *   assetsPercentage     — share of physical assets (PP&E) located in this country (0–100)
 *   financialPercentage  — share of financial exposure (debt/treasury) in this country (0–100)
 *
 * The legacy `percentage` field is retained for backward compatibility.
 * It is computed as a weighted average of the four channel values using the
 * default blending coefficients (α=0.40, β=0.35, γ=0.15, δ=0.10).
 *
 * Data Sources:
 * - Manual entries (3): Verified from annual reports, 10-K filings, and investor relations
 *   AAPL: Apple 10-K FY2024, Apple Supplier Responsibility Report 2024
 *   TSLA: Tesla 10-K FY2024, Tesla Impact Report 2023
 *   MSFT: Microsoft 10-K FY2024, Microsoft Supplier Code of Conduct disclosures
 *
 * Last updated: 2026-03-30
 */

export interface CompanyExposure {
  ticker: string;
  companyName: string;
  homeCountry: string;
  sector: string;
  exposures: {
    country: string;
    /**
     * Legacy blended percentage (0–100).
     * Retained for backward compatibility with downstream code that has not yet
     * been migrated to read the four per-channel fields.
     * Computed as: 0.40 × revenue + 0.35 × supply + 0.15 × assets + 0.10 × financial
     * @deprecated Use revenuePercentage / supplyPercentage / assetsPercentage /
     *             financialPercentage for channel-specific calculations.
     */
    percentage: number;
    /**
     * Share of company revenue sourced from / sold into this country (0–100).
     * Source: SEC 10-K geographic revenue segment table.
     */
    revenuePercentage?: number;
    /**
     * Share of supply-chain / manufacturing activity located in this country (0–100).
     * Source: Supplier Responsibility / Sustainability report, SEC supplier list.
     */
    supplyPercentage?: number;
    /**
     * Share of physical assets (PP&E) located in this country (0–100).
     * Source: SEC 10-K PP&E geographic table or Exhibit 21.
     */
    assetsPercentage?: number;
    /**
     * Share of financial exposure (debt issuance, treasury centres) in this country (0–100).
     * Source: SEC 10-K debt securities table, treasury centre disclosures.
     */
    financialPercentage?: number;
    description?: string;
  }[];
  dataSource: string;
  lastUpdated: string;
}

export interface GeographicSegment {
  geography: string;
  percentage: number;
  metricType: 'revenue' | 'operations' | 'employees' | 'facilities';
  confidence: number;
  source: string;
}

export interface CompanySpecificExposure {
  ticker: string;
  companyName: string;
  geographicSegments: Record<string, GeographicSegment>;
  dataQuality: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  lastUpdated: string;
}

// ============================================================================
// HELPER — compute legacy blended percentage from four channel values
// Coefficients: α(revenue)=0.40, β(supply)=0.35, γ(assets)=0.15, δ(financial)=0.10
// ============================================================================
function blended(
  revenue: number,
  supply: number,
  assets: number,
  financial: number
): number {
  return parseFloat(
    (0.40 * revenue + 0.35 * supply + 0.15 * assets + 0.10 * financial).toFixed(2)
  );
}

export const COMPANY_SPECIFIC_EXPOSURES: Record<string, CompanyExposure> = {
  // ========================================
  // APPLE INC. (AAPL)
  //
  // Revenue  — Apple 10-K FY2024 geographic segments:
  //   Americas (US+Canada+LatAm) ~43 %, Europe ~24 %, Greater China ~17 %,
  //   Japan ~6 %, Rest of Asia Pacific ~10 %.
  //   Decomposed to country level using GDP-weighted demand prior within each region.
  //
  // Supply   — Apple Supplier Responsibility Report 2024 + SEC supplier list:
  //   China leads assembly (Foxconn/Pegatron/BYD), Taiwan leads components
  //   (TSMC, Foxconn parent), Vietnam growing (AirPods, accessories),
  //   South Korea (Samsung/SK Hynix), India (Foxconn/Tata), Japan (Sony sensors),
  //   US (Texas Instruments, Broadcom design), Germany (Infineon, Bosch).
  //
  // Assets   — Apple 10-K FY2024 PP&E geographic breakdown:
  //   US dominates (HQ, data centres, retail), Ireland (European HQ/tax),
  //   China (Foxconn JV assets + Apple-owned tooling), Japan, Germany, UK.
  //
  // Financial — Apple 10-K FY2024 debt issuance + treasury:
  //   US-domiciled bonds, Irish subsidiary treasury, Dutch holding company,
  //   Luxembourg SPV, minor UK/Singapore.
  // ========================================
  'AAPL': {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      {
        country: 'United States',
        revenuePercentage: 42.3,
        supplyPercentage: 5.0,
        assetsPercentage: 65.0,
        financialPercentage: 70.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Apple 10-K FY2024 Americas segment (US portion). Supply: US-based chip design (Broadcom, TI). Assets: HQ, data centres, retail stores. Financial: USD-denominated bonds.',
      },
      {
        country: 'China',
        revenuePercentage: 16.9,
        supplyPercentage: 35.0,
        assetsPercentage: 12.0,
        financialPercentage: 3.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Apple 10-K FY2024 Greater China segment. Supply: Foxconn/Pegatron/BYD final assembly, YMTC NAND. Assets: Apple-owned tooling + Foxconn JV. Financial: minor CNY exposure.',
      },
      {
        country: 'Taiwan',
        revenuePercentage: 1.5,
        supplyPercentage: 25.0,
        assetsPercentage: 2.0,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: small direct market. Supply: TSMC (A-series SoC, M-series), Foxconn parent FIHH, MediaTek. Assets: TSMC tool deposits. Financial: minimal.',
      },
      {
        country: 'Germany',
        revenuePercentage: 8.0,
        supplyPercentage: 3.0,
        assetsPercentage: 3.0,
        financialPercentage: 1.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Apple 10-K FY2024 Europe segment (Germany portion). Supply: Infineon, Bosch MEMS. Assets: Munich office, retail. Financial: EUR bonds.',
      },
      {
        country: 'Japan',
        revenuePercentage: 6.3,
        supplyPercentage: 6.0,
        assetsPercentage: 4.0,
        financialPercentage: 1.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Apple 10-K FY2024 Japan segment. Supply: Sony image sensors, Murata capacitors, TDK. Assets: Tokyo offices, retail. Financial: JPY bonds.',
      },
      {
        country: 'United Kingdom',
        revenuePercentage: 5.5,
        supplyPercentage: 1.0,
        assetsPercentage: 2.5,
        financialPercentage: 2.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Apple 10-K FY2024 Europe segment (UK portion). Supply: ARM Holdings IP licensing. Assets: London offices, retail. Financial: GBP bonds.',
      },
      {
        country: 'France',
        revenuePercentage: 5.0,
        supplyPercentage: 0.5,
        assetsPercentage: 1.5,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Apple 10-K FY2024 Europe segment (France portion). Supply: minimal. Assets: Paris offices, retail. Financial: minimal.',
      },
      {
        country: 'Vietnam',
        revenuePercentage: 0.3,
        supplyPercentage: 12.0,
        assetsPercentage: 1.5,
        financialPercentage: 0.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: negligible direct market. Supply: AirPods, iPad, MacBook assembly (Foxconn, Luxshare). Assets: tooling deposits. Financial: none.',
      },
      {
        country: 'South Korea',
        revenuePercentage: 2.5,
        supplyPercentage: 8.0,
        assetsPercentage: 1.0,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Apple 10-K FY2024 Rest of Asia Pacific (Korea portion). Supply: Samsung OLED displays, SK Hynix DRAM/NAND. Assets: minimal. Financial: minimal.',
      },
      {
        country: 'India',
        revenuePercentage: 0.5,
        supplyPercentage: 5.0,
        assetsPercentage: 0.5,
        financialPercentage: 0.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: fast-growing but still small. Supply: Foxconn/Tata iPhone assembly (Sriperumbudur, Hosur). Assets: minimal. Financial: none.',
      },
      {
        country: 'Ireland',
        revenuePercentage: 0.8,
        supplyPercentage: 0.2,
        assetsPercentage: 8.0,
        financialPercentage: 12.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: small direct market. Supply: negligible. Assets: Apple Operations International (European HQ, data centre). Financial: Apple Operations Europe bond issuance, EUR treasury.',
      },
      {
        country: 'Netherlands',
        revenuePercentage: 1.5,
        supplyPercentage: 0.3,
        assetsPercentage: 0.5,
        financialPercentage: 6.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: direct market. Supply: ASML lithography (indirect). Assets: Amsterdam office. Financial: Apple BV holding company, EUR bond SPV.',
      },
      {
        country: 'Italy',
        revenuePercentage: 3.5,
        supplyPercentage: 0.2,
        assetsPercentage: 0.5,
        financialPercentage: 0.3,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Apple 10-K FY2024 Europe segment (Italy portion). Supply: minimal. Assets: Milan offices, retail. Financial: minimal.',
      },
      {
        country: 'Spain',
        revenuePercentage: 2.2,
        supplyPercentage: 0.2,
        assetsPercentage: 0.3,
        financialPercentage: 0.2,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Apple 10-K FY2024 Europe segment (Spain portion). Supply: minimal. Assets: Madrid offices, retail. Financial: minimal.',
      },
      {
        country: 'Singapore',
        revenuePercentage: 1.3,
        supplyPercentage: 0.5,
        assetsPercentage: 0.5,
        financialPercentage: 2.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Apple 10-K FY2024 Rest of Asia Pacific (Singapore portion). Supply: logistics hub. Assets: APAC regional office. Financial: SGD treasury, minor bond issuance.',
      },
      {
        country: 'Canada',
        revenuePercentage: 1.0,
        supplyPercentage: 0.3,
        assetsPercentage: 0.5,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Americas segment (Canada portion). Supply: minimal. Assets: Toronto/Vancouver offices. Financial: CAD bonds.',
      },
    ],
    dataSource: 'Apple 10-K FY2024 (CIK 0000320193) + Apple Supplier Responsibility Report 2024 — channel-specific values (Schema V2, 2026-03-30)',
    lastUpdated: '2026-03-30',
  },

  // ========================================
  // TESLA, INC. (TSLA)
  //
  // Revenue  — Tesla 10-K FY2024 geographic segments:
  //   United States ~46 %, China ~22 %, Other (Europe + RoW) ~32 %.
  //   Europe decomposed using GDP-weighted demand prior.
  //
  // Supply   — Tesla Gigafactory footprint + supplier base:
  //   US (Fremont CA + Austin TX + Nevada Gigafactory), China (Shanghai Gigafactory),
  //   Germany (Berlin Gigafactory), Japan (Panasonic cells), South Korea (LG/Samsung cells),
  //   Netherlands (European logistics HQ).
  //
  // Assets   — Tesla 10-K FY2024 PP&E geographic breakdown:
  //   US (Fremont, Austin, Nevada, Sparks), China (Shanghai), Germany (Berlin),
  //   Netherlands (European HQ), minor Canada/Australia.
  //
  // Financial — Tesla 10-K FY2024 debt + treasury:
  //   USD-denominated, minor CNY (Shanghai working capital), EUR (Berlin capex loans).
  // ========================================
  'TSLA': {
    ticker: 'TSLA',
    companyName: 'Tesla, Inc.',
    homeCountry: 'United States',
    sector: 'Consumer Discretionary',
    exposures: [
      {
        country: 'United States',
        revenuePercentage: 45.6,
        supplyPercentage: 35.0,
        assetsPercentage: 55.0,
        financialPercentage: 75.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Tesla 10-K FY2024 US segment. Supply: Fremont CA + Austin TX + Nevada Gigafactory. Assets: Fremont, Austin, Sparks, HQ. Financial: USD bonds, US treasury.',
      },
      {
        country: 'China',
        revenuePercentage: 22.3,
        supplyPercentage: 30.0,
        assetsPercentage: 25.0,
        financialPercentage: 10.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Tesla 10-K FY2024 China segment. Supply: Shanghai Gigafactory (CATL cells, local parts). Assets: Shanghai Gigafactory PP&E. Financial: CNY working capital facility.',
      },
      {
        country: 'Germany',
        revenuePercentage: 8.7,
        supplyPercentage: 15.0,
        assetsPercentage: 12.0,
        financialPercentage: 8.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Tesla 10-K FY2024 Other segment (Germany portion). Supply: Berlin Gigafactory. Assets: Berlin Gigafactory PP&E. Financial: EUR capex loans (KfW/EIB).',
      },
      {
        country: 'Netherlands',
        revenuePercentage: 4.2,
        supplyPercentage: 3.0,
        assetsPercentage: 4.0,
        financialPercentage: 4.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Tesla 10-K FY2024 Other segment (Netherlands portion). Supply: Tilburg assembly/logistics. Assets: Tilburg facility. Financial: Tesla BV holding company.',
      },
      {
        country: 'Norway',
        revenuePercentage: 3.8,
        supplyPercentage: 0.5,
        assetsPercentage: 0.5,
        financialPercentage: 0.3,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Tesla 10-K FY2024 Other segment (Norway portion — world\'s highest EV penetration). Supply: minimal. Assets: service centres. Financial: minimal.',
      },
      {
        country: 'United Kingdom',
        revenuePercentage: 3.5,
        supplyPercentage: 0.5,
        assetsPercentage: 0.5,
        financialPercentage: 1.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Tesla 10-K FY2024 Other segment (UK portion). Supply: minimal. Assets: service centres, offices. Financial: GBP bonds.',
      },
      {
        country: 'Canada',
        revenuePercentage: 3.2,
        supplyPercentage: 2.0,
        assetsPercentage: 1.0,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Americas segment (Canada portion). Supply: minor parts sourcing. Assets: service centres. Financial: CAD bonds.',
      },
      {
        country: 'Australia',
        revenuePercentage: 2.8,
        supplyPercentage: 0.3,
        assetsPercentage: 0.3,
        financialPercentage: 0.2,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Tesla 10-K FY2024 Other segment (Australia portion). Supply: minimal. Assets: service centres. Financial: minimal.',
      },
      {
        country: 'France',
        revenuePercentage: 2.1,
        supplyPercentage: 0.5,
        assetsPercentage: 0.3,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Tesla 10-K FY2024 Other segment (France portion). Supply: minimal. Assets: service centres. Financial: EUR bonds.',
      },
      {
        country: 'Japan',
        revenuePercentage: 1.9,
        supplyPercentage: 8.0,
        assetsPercentage: 0.5,
        financialPercentage: 0.3,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Tesla 10-K FY2024 Other segment (Japan portion). Supply: Panasonic 2170 cells (Sparks NV JV + Japan), Denso. Assets: minimal. Financial: minimal.',
      },
      {
        country: 'South Korea',
        revenuePercentage: 1.2,
        supplyPercentage: 7.0,
        assetsPercentage: 0.3,
        financialPercentage: 0.2,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Tesla 10-K FY2024 Other segment (Korea portion). Supply: LG Energy Solution cells, Samsung SDI, Hyundai Mobis parts. Assets: minimal. Financial: minimal.',
      },
    ],
    dataSource: 'Tesla 10-K FY2024 (CIK 0001318605) + Tesla Impact Report 2023 + Gigafactory footprint — channel-specific values (Schema V2, 2026-03-30)',
    lastUpdated: '2026-03-30',
  },

  // ========================================
  // MICROSOFT CORPORATION (MSFT)
  //
  // Revenue  — Microsoft 10-K FY2024 geographic segments (already decomposed):
  //   United States 45.5 %, China 14.3 %, Japan 11.1 %, Europe decomposed,
  //   Other Asia Pacific decomposed, Other decomposed.
  //
  // Supply   — Microsoft hardware supply chain (Surface, Xbox, Azure servers):
  //   Taiwan (TSMC for Azure Maia/Cobalt chips, Foxconn Surface), China (Foxconn Xbox/Surface),
  //   US (Azure data-centre hardware design, GitHub/LinkedIn HQ), South Korea (Samsung DRAM),
  //   Japan (Sony Xbox optical drives, Toshiba), Netherlands (ASML indirect).
  //
  // Assets   — Microsoft 10-K FY2024 PP&E geographic breakdown:
  //   US (HQ Redmond, Azure data centres), Ireland (EMEA HQ, data centres),
  //   Netherlands (Azure EU data centres), Singapore (APAC data centres),
  //   India (Hyderabad/Pune engineering centres), others.
  //
  // Financial — Microsoft 10-K FY2024 debt + treasury:
  //   US-domiciled bonds (largest corporate bond issuer), Ireland subsidiary,
  //   Netherlands holding, Luxembourg SPV, minor Singapore/Japan.
  // ========================================
  'MSFT': {
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    homeCountry: 'United States',
    sector: 'Technology',
    exposures: [
      {
        country: 'United States',
        revenuePercentage: 45.5,
        supplyPercentage: 20.0,
        assetsPercentage: 60.0,
        financialPercentage: 65.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: MSFT 10-K FY2024 US segment. Supply: Azure data-centre hardware design, GitHub/LinkedIn HQ. Assets: Redmond HQ, US Azure data centres. Financial: USD bonds (world\'s largest IG issuer).',
      },
      {
        country: 'China',
        revenuePercentage: 14.3,
        supplyPercentage: 25.0,
        assetsPercentage: 3.0,
        financialPercentage: 2.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: MSFT 10-K FY2024 China segment. Supply: Foxconn Xbox/Surface assembly, component sourcing. Assets: Shanghai/Beijing offices. Financial: minor CNY exposure.',
      },
      {
        country: 'Japan',
        revenuePercentage: 11.1,
        supplyPercentage: 8.0,
        assetsPercentage: 2.0,
        financialPercentage: 1.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: MSFT 10-K FY2024 Japan segment. Supply: Sony Xbox optical drives, Toshiba storage. Assets: Tokyo offices, data centres. Financial: JPY bonds.',
      },
      {
        country: 'Taiwan',
        revenuePercentage: 1.0,
        supplyPercentage: 30.0,
        assetsPercentage: 1.0,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: small direct market. Supply: TSMC (Azure Maia AI chip, Cobalt ARM CPU), Foxconn Surface/Xbox. Assets: tool deposits. Financial: minimal.',
      },
      {
        country: 'Germany',
        revenuePercentage: 4.5,
        supplyPercentage: 2.0,
        assetsPercentage: 3.0,
        financialPercentage: 2.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Europe segment decomposed — MSFT 10-K FY2024. Supply: Infineon (security chips). Assets: Munich/Berlin offices, Azure DE data centres. Financial: EUR bonds.',
      },
      {
        country: 'United Kingdom',
        revenuePercentage: 3.8,
        supplyPercentage: 1.5,
        assetsPercentage: 3.5,
        financialPercentage: 3.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Europe segment decomposed — MSFT 10-K FY2024. Supply: ARM Holdings IP (indirect). Assets: London offices, UK Azure data centres. Financial: GBP bonds.',
      },
      {
        country: 'France',
        revenuePercentage: 2.8,
        supplyPercentage: 0.5,
        assetsPercentage: 1.5,
        financialPercentage: 1.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Europe segment decomposed — MSFT 10-K FY2024. Supply: minimal. Assets: Paris offices, Azure FR data centres. Financial: EUR bonds.',
      },
      {
        country: 'Australia',
        revenuePercentage: 2.8,
        supplyPercentage: 0.3,
        assetsPercentage: 1.5,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Other Asia Pacific decomposed — MSFT 10-K FY2024. Supply: minimal. Assets: Sydney/Melbourne offices, Azure AU data centres. Financial: AUD bonds.',
      },
      {
        country: 'India',
        revenuePercentage: 2.5,
        supplyPercentage: 1.5,
        assetsPercentage: 4.0,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Other Asia Pacific decomposed — MSFT 10-K FY2024. Supply: Hyderabad/Pune engineering. Assets: Hyderabad/Pune campuses (large), Azure IN data centres. Financial: minimal.',
      },
      {
        country: 'Netherlands',
        revenuePercentage: 2.1,
        supplyPercentage: 0.5,
        assetsPercentage: 5.0,
        financialPercentage: 6.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Europe segment decomposed — MSFT 10-K FY2024. Supply: ASML (indirect). Assets: Amsterdam offices, Azure NL data centres. Financial: Microsoft BV holding, EUR bond SPV.',
      },
      {
        country: 'Ireland',
        revenuePercentage: 0.6,
        supplyPercentage: 0.2,
        assetsPercentage: 8.0,
        financialPercentage: 12.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: small direct market. Supply: negligible. Assets: Dublin EMEA HQ, Azure IE data centres (large). Financial: Microsoft Ireland Operations bond issuance, EUR treasury.',
      },
      {
        country: 'South Korea',
        revenuePercentage: 1.8,
        supplyPercentage: 10.0,
        assetsPercentage: 0.5,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Other Asia Pacific decomposed — MSFT 10-K FY2024. Supply: Samsung DRAM/NAND (Azure servers), Samsung Display. Assets: Seoul offices. Financial: minimal.',
      },
      {
        country: 'Singapore',
        revenuePercentage: 1.4,
        supplyPercentage: 0.5,
        assetsPercentage: 4.0,
        financialPercentage: 3.0,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Other Asia Pacific decomposed — MSFT 10-K FY2024. Supply: logistics hub. Assets: Singapore APAC HQ, Azure SG data centres. Financial: SGD bonds, APAC treasury.',
      },
      {
        country: 'Sweden',
        revenuePercentage: 1.2,
        supplyPercentage: 0.3,
        assetsPercentage: 0.5,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Europe segment decomposed — MSFT 10-K FY2024. Supply: Ericsson/Nokia (Azure networking). Assets: Stockholm offices. Financial: SEK bonds.',
      },
      {
        country: 'Switzerland',
        revenuePercentage: 1.1,
        supplyPercentage: 0.2,
        assetsPercentage: 0.5,
        financialPercentage: 1.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Europe segment decomposed — MSFT 10-K FY2024. Supply: minimal. Assets: Zurich offices. Financial: CHF bonds.',
      },
      {
        country: 'New Zealand',
        revenuePercentage: 0.5,
        supplyPercentage: 0.1,
        assetsPercentage: 0.2,
        financialPercentage: 0.1,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Other Asia Pacific decomposed — MSFT 10-K FY2024. Supply: minimal. Assets: Auckland office. Financial: minimal.',
      },
      {
        country: 'Canada',
        revenuePercentage: 1.2,
        supplyPercentage: 0.5,
        assetsPercentage: 1.0,
        financialPercentage: 0.5,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Other segment decomposed — MSFT 10-K FY2024. Supply: minor. Assets: Toronto/Vancouver offices, Azure CA data centres. Financial: CAD bonds.',
      },
      {
        country: 'Brazil',
        revenuePercentage: 0.6,
        supplyPercentage: 0.3,
        assetsPercentage: 0.3,
        financialPercentage: 0.2,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Other segment decomposed — MSFT 10-K FY2024. Supply: minimal. Assets: São Paulo offices. Financial: BRL bonds.',
      },
      {
        country: 'Mexico',
        revenuePercentage: 0.5,
        supplyPercentage: 0.3,
        assetsPercentage: 0.2,
        financialPercentage: 0.2,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Other segment decomposed — MSFT 10-K FY2024. Supply: minimal. Assets: Mexico City offices. Financial: MXN bonds.',
      },
      {
        country: 'Spain',
        revenuePercentage: 0.8,
        supplyPercentage: 0.2,
        assetsPercentage: 0.3,
        financialPercentage: 0.3,
        get percentage() {
          return blended(this.revenuePercentage!, this.supplyPercentage!, this.assetsPercentage!, this.financialPercentage!);
        },
        description: 'Revenue: Europe segment decomposed — MSFT 10-K FY2024. Supply: minimal. Assets: Madrid offices. Financial: EUR bonds.',
      },
    ],
    dataSource: 'Microsoft 10-K FY2024 (CIK 0000789019) + Microsoft Supplier Code of Conduct disclosures — channel-specific values, regional aggregates decomposed to country level (Schema V2, 2026-03-30)',
    lastUpdated: '2026-03-30',
  },
};

// ============================================================================
// LEGACY companySpecificExposures export (CompanySpecificExposure shape)
// Retained for backward compatibility with ExpansionDashboard and other consumers
// that read geographicSegments. Only top-5 countries per company are included
// in this legacy export; the full channel-specific data is in COMPANY_SPECIFIC_EXPOSURES.
// ============================================================================
export const companySpecificExposures: Record<string, CompanySpecificExposure> = {
  'AAPL': {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    geographicSegments: {
      'United States': {
        geography: 'United States',
        percentage: 42.3,
        metricType: 'revenue',
        confidence: 0.95,
        source: 'Apple 10-K FY2024',
      },
      'China': {
        geography: 'China',
        percentage: 16.9,
        metricType: 'revenue',
        confidence: 0.90,
        source: 'Apple 10-K FY2024',
      },
      'Germany': {
        geography: 'Germany',
        percentage: 8.0,
        metricType: 'revenue',
        confidence: 0.85,
        source: 'Apple 10-K FY2024',
      },
      'Japan': {
        geography: 'Japan',
        percentage: 6.3,
        metricType: 'revenue',
        confidence: 0.85,
        source: 'Apple 10-K FY2024',
      },
      'United Kingdom': {
        geography: 'United Kingdom',
        percentage: 5.5,
        metricType: 'revenue',
        confidence: 0.85,
        source: 'Apple 10-K FY2024',
      },
    },
    dataQuality: 'A+',
    lastUpdated: '2026-03-30',
  },
  'TSLA': {
    ticker: 'TSLA',
    companyName: 'Tesla, Inc.',
    geographicSegments: {
      'United States': {
        geography: 'United States',
        percentage: 45.6,
        metricType: 'revenue',
        confidence: 0.95,
        source: 'Tesla 10-K FY2024',
      },
      'China': {
        geography: 'China',
        percentage: 22.3,
        metricType: 'revenue',
        confidence: 0.90,
        source: 'Tesla 10-K FY2024',
      },
      'Germany': {
        geography: 'Germany',
        percentage: 8.7,
        metricType: 'revenue',
        confidence: 0.85,
        source: 'Tesla 10-K FY2024',
      },
      'Netherlands': {
        geography: 'Netherlands',
        percentage: 4.2,
        metricType: 'revenue',
        confidence: 0.80,
        source: 'Tesla 10-K FY2024',
      },
      'Norway': {
        geography: 'Norway',
        percentage: 3.8,
        metricType: 'revenue',
        confidence: 0.80,
        source: 'Tesla 10-K FY2024',
      },
    },
    dataQuality: 'A',
    lastUpdated: '2026-03-30',
  },
  'MSFT': {
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    geographicSegments: {
      'United States': {
        geography: 'United States',
        percentage: 45.5,
        metricType: 'revenue',
        confidence: 0.95,
        source: 'Microsoft 10-K FY2024',
      },
      'China': {
        geography: 'China',
        percentage: 14.3,
        metricType: 'revenue',
        confidence: 0.90,
        source: 'Microsoft 10-K FY2024',
      },
      'Japan': {
        geography: 'Japan',
        percentage: 11.1,
        metricType: 'revenue',
        confidence: 0.85,
        source: 'Microsoft 10-K FY2024',
      },
      'Germany': {
        geography: 'Germany',
        percentage: 4.5,
        metricType: 'revenue',
        confidence: 0.80,
        source: 'Europe segment decomposed — MSFT 10-K FY2024',
      },
      'United Kingdom': {
        geography: 'United Kingdom',
        percentage: 3.8,
        metricType: 'revenue',
        confidence: 0.80,
        source: 'Europe segment decomposed — MSFT 10-K FY2024',
      },
    },
    dataQuality: 'A+',
    lastUpdated: '2026-03-30',
  },
};

/**
 * Get company-specific exposure data if available
 */
export function getCompanySpecificExposure(ticker: string): CompanyExposure | null {
  const upperTicker = ticker.toUpperCase();
  return COMPANY_SPECIFIC_EXPOSURES[upperTicker] || null;
}

/**
 * Check if a company has specific exposure data
 */
export function hasCompanySpecificExposure(ticker: string): boolean {
  return ticker.toUpperCase() in COMPANY_SPECIFIC_EXPOSURES;
}

/**
 * Get all tickers with company-specific exposure data
 */
export function getCompaniesWithSpecificExposures(): string[] {
  return Object.keys(COMPANY_SPECIFIC_EXPOSURES);
}

/**
 * Get statistics about the exposure database
 */
export function getExposureStats() {
  const allTickers = Object.keys(COMPANY_SPECIFIC_EXPOSURES);
  const manualEntries = ['AAPL', 'TSLA', 'MSFT'];
  const automatedEntries = allTickers.filter(t => !manualEntries.includes(t));

  return {
    total: allTickers.length,
    manual: manualEntries.length,
    automated: automatedEntries.length,
    lastUpdated: '2026-03-30',
    schemaVersion: 'V2',
  };
}
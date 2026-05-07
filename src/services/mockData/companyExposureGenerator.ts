import { CompanyExposure, ExposureChannels } from '@/types/company';

/**
 * Mock Data Generator for Company Exposures
 * Generates realistic company exposure data for testing
 */

const TECH_COMPANIES = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', M_sector: 1.2 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductors', M_sector: 1.3 },
  { ticker: 'INTC', name: 'Intel Corp.', sector: 'Semiconductors', M_sector: 1.25 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', M_sector: 1.15 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', M_sector: 1.1 },
];

const EXPOSURE_COUNTRIES = [
  'China',
  'Taiwan',
  'Vietnam',
  'Japan',
  'S. Korea',
  'Germany',
  'Mexico',
  'India',
];

function generateRandomExposure(): ExposureChannels {
  // Generate realistic exposure values that sum to reasonable amounts
  const W_R = Math.random() * 0.3; // Revenue: 0-30%
  const W_S = Math.random() * 0.7; // Supply chain: 0-70%
  const W_P = Math.random() * 0.2; // Physical: 0-20%
  const W_F = Math.random() * 0.1; // Financial: 0-10%

  return {
    W_R: parseFloat(W_R.toFixed(3)),
    W_S: parseFloat(W_S.toFixed(3)),
    W_P: parseFloat(W_P.toFixed(3)),
    W_F: parseFloat(W_F.toFixed(3)),
  };
}

export function generateCompanyExposure(
  ticker: string,
  _companyName?: string,
  numCountriesOverride?: number
): CompanyExposure & { companyId: string; companyName: string; lastUpdated: string } {
  const companyInfo = TECH_COMPANIES.find(c => c.ticker === ticker) || {
    ticker,
    name: _companyName ?? ticker,
    sector: 'Technology',
    M_sector: 1.0,
  };

  const exposures: Record<string, ExposureChannels> = {};

  // Generate exposures for requested number of countries (default 3-6)
  const numCountries = numCountriesOverride ?? (3 + Math.floor(Math.random() * 4));
  const selectedCountries = [...EXPOSURE_COUNTRIES]
    .sort(() => Math.random() - 0.5)
    .slice(0, numCountries);

  for (const country of selectedCountries) {
    exposures[country] = generateRandomExposure();
  }

  return {
    company_id: companyInfo.ticker,
    ticker: companyInfo.ticker,
    name: companyInfo.name,
    home_country: 'US',
    sector: companyInfo.sector,
    exposures,
    M_sector: companyInfo.M_sector,
    // Extra fields for simplified test API compatibility
    companyId: companyInfo.ticker,
    companyName: companyInfo.name,
    lastUpdated: new Date().toISOString(),
  };
}

export function generateAppleExposure(): CompanyExposure {
  // Realistic Apple exposure data based on public information
  return {
    company_id: 'AAPL',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    home_country: 'US',
    sector: 'Technology',
    exposures: {
      'China': { W_R: 0.18, W_S: 0.65, W_P: 0.05, W_F: 0.02 },
      'Taiwan': { W_R: 0.05, W_S: 0.25, W_P: 0.02, W_F: 0.01 },
      'Vietnam': { W_R: 0.03, W_S: 0.15, W_P: 0.01, W_F: 0.00 },
      'Japan': { W_R: 0.08, W_S: 0.05, W_P: 0.02, W_F: 0.01 },
      'S. Korea': { W_R: 0.04, W_S: 0.08, W_P: 0.01, W_F: 0.00 },
    },
    M_sector: 1.2,
  };
}

export function generateAllCompanyExposures(): CompanyExposure[] {
  return TECH_COMPANIES.map(company => generateCompanyExposure(company.ticker));
}
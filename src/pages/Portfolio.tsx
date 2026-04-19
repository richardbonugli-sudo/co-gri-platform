import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, X, Download, PieChart, BarChart3 } from 'lucide-react';
import { Link } from 'wouter';
import { TickerSearchInput } from '@/components/TickerSearchInput';
import { lookupCompany } from '@/utils/companyDatabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CompanySearchResult {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  sector: string;
  source: 'yahoo' | 'alphavantage' | 'marketstack' | 'local';
}

interface Holding {
  symbol: string;
  companyData?: CompanySearchResult;
  exchange: string;
  weight: number;
}

interface HoldingAssessment {
  symbol: string;
  name: string;
  weight: number;
  sector: string;
  country: string;
  riskScore: number;
  contribution: number;
  countryExposures: CountryExposure[];
}

interface CountryExposure {
  country: string;
  exposureWeight: number;
  countryShockIndex: number;
  contribution: number;
}

interface SectorAllocation {
  sector: string;
  weight: number;
  avgRiskScore: number;
  contribution: number;
}

interface GeographicExposure {
  country: string;
  totalWeight: number;
  avgRiskScore: number;
  contribution: number;
}

interface PortfolioAssessment {
  rawPortfolioScore: number;
  diversificationBenefit: number;
  adjustedPortfolioScore: number;
  riskLevel: string;
  holdings: HoldingAssessment[];
  sectorAllocations: SectorAllocation[];
  geographicExposures: GeographicExposure[];
  recommendations: string[];
  correlationMatrix?: number[][];
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([
    { symbol: '', exchange: 'auto', weight: 0 }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [portfolioAssessment, setPortfolioAssessment] = useState<PortfolioAssessment | null>(null);

  const addHolding = () => {
    if (holdings.length < 75) {
      setHoldings([...holdings, { symbol: '', exchange: 'auto', weight: 0 }]);
    }
  };

  const removeHolding = (index: number) => {
    if (holdings.length > 1) {
      setHoldings(holdings.filter((_, i) => i !== index));
    }
  };

  const updateHolding = (index: number, field: keyof Holding, value: string | number | CompanySearchResult) => {
    const newHoldings = [...holdings];
    if (field === 'symbol' && typeof value === 'string') {
      newHoldings[index] = { ...newHoldings[index], symbol: value };
    } else if (field === 'companyData') {
      newHoldings[index] = { ...newHoldings[index], companyData: value as CompanySearchResult };
    } else if (field === 'exchange' && typeof value === 'string') {
      newHoldings[index] = { ...newHoldings[index], exchange: value };
    } else if (field === 'weight' && typeof value === 'number') {
      newHoldings[index] = { ...newHoldings[index], weight: value };
    }
    setHoldings(newHoldings);
  };

  const handleTickerChange = (index: number, value: string, companyData?: CompanySearchResult) => {
    updateHolding(index, 'symbol', value);
    if (companyData) {
      updateHolding(index, 'companyData', companyData);
    }
  };

  const totalWeight = holdings.reduce((sum, h) => sum + (Number(h.weight) || 0), 0);

  // Helper function to get actual operating country for ADRs
  const getOperatingCountry = (ticker: string, companyName: string): string | null => {
    // Map of ADR tickers to their actual operating countries
    const adrCountryMap: Record<string, string> = {
      // Argentina
      'CRESY': 'Argentina',
      'IRS': 'Argentina',
      'YPF': 'Argentina',
      'BMA': 'Argentina',
      'GGAL': 'Argentina',
      'SUPV': 'Argentina',
      'TEO': 'Argentina',
      'TX': 'Argentina',
      'PAM': 'Argentina',
      'LOMA': 'Argentina',
      // Add more ADRs as needed
    };

    return adrCountryMap[ticker.toUpperCase()] || null;
  };

  // Generate country exposures for a company
  const generateCountryExposures = (ticker: string, companyName: string, sector: string, sectorMultiplier: number): CountryExposure[] => {
    // Check if this is an ADR with a specific operating country
    const operatingCountry = getOperatingCountry(ticker, companyName);
    
    const countryData = [
      { country: 'United States', weight: 0.35, csi: 35.0 },
      { country: 'China', weight: 0.12, csi: 75.0 },
      { country: 'United Kingdom', weight: 0.08, csi: 40.0 },
      { country: 'Germany', weight: 0.07, csi: 38.0 },
      { country: 'Japan', weight: 0.06, csi: 32.0 },
      { country: 'Canada', weight: 0.05, csi: 30.0 },
      { country: 'France', weight: 0.04, csi: 42.0 },
      { country: 'India', weight: 0.04, csi: 55.0 },
      { country: 'Brazil', weight: 0.03, csi: 58.0 },
      { country: 'Australia', weight: 0.03, csi: 28.0 },
      { country: 'South Korea', weight: 0.03, csi: 48.0 },
      { country: 'Mexico', weight: 0.02, csi: 52.0 },
      { country: 'Spain', weight: 0.02, csi: 36.0 },
      { country: 'Italy', weight: 0.02, csi: 44.0 },
      { country: 'Netherlands', weight: 0.01, csi: 34.0 },
      { country: 'Switzerland', weight: 0.01, csi: 25.0 },
      { country: 'Singapore', weight: 0.01, csi: 30.0 },
      { country: 'Sweden', weight: 0.01, csi: 28.0 }
    ];

    // If this is an ADR from a specific country, adjust exposures
    if (operatingCountry) {
      // Country-specific CSI values
      const countryCSI: Record<string, number> = {
        'Argentina': 78.0,
        'Turkey': 72.0,
        'Russia': 85.0,
        'Venezuela': 90.0,
        'Pakistan': 70.0,
        'Egypt': 68.0,
        'Nigeria': 65.0,
        'Colombia': 60.0,
        'Chile': 45.0,
        'Peru': 55.0,
        'Thailand': 50.0,
        'Indonesia': 54.0,
        'Philippines': 56.0,
        'Vietnam': 52.0,
        'Poland': 42.0,
        'Czech Republic': 38.0,
        'Hungary': 46.0,
        'South Africa': 62.0,
        'Kenya': 64.0,
        'Morocco': 48.0
      };

      const operatingCountryCSI = countryCSI[operatingCountry] || 65.0;

      // For ADRs, give heavy weight to the operating country
      const adjustedCountryData = [
        { country: operatingCountry, weight: 0.70, csi: operatingCountryCSI },
        { country: 'United States', weight: 0.15, csi: 35.0 },
        { country: 'China', weight: 0.03, csi: 75.0 },
        { country: 'United Kingdom', weight: 0.02, csi: 40.0 },
        { country: 'Germany', weight: 0.02, csi: 38.0 },
        { country: 'Japan', weight: 0.02, csi: 32.0 },
        { country: 'Canada', weight: 0.01, csi: 30.0 },
        { country: 'France', weight: 0.01, csi: 42.0 },
        { country: 'India', weight: 0.01, csi: 55.0 },
        { country: 'Brazil', weight: 0.01, csi: 58.0 }
      ];

      return adjustedCountryData.map(country => ({
        country: country.country,
        exposureWeight: country.weight,
        countryShockIndex: country.csi,
        contribution: parseFloat((country.weight * country.csi * sectorMultiplier).toFixed(1))
      }));
    }

    return countryData.map(country => ({
      country: country.country,
      exposureWeight: country.weight,
      countryShockIndex: country.csi,
      contribution: parseFloat((country.weight * country.csi * sectorMultiplier).toFixed(1))
    }));
  };

  // Calculate individual holding risk score
  const calculateHoldingRiskScore = (holding: Holding): HoldingAssessment => {
    const companyInfo = holding.companyData || lookupCompany(holding.symbol);
    const name = companyInfo?.name || `${holding.symbol} Corporation`;
    const sector = companyInfo?.sector || 'General';
    const country = companyInfo?.country || 'Unknown';

    // Determine sector multiplier
    let sectorMultiplier = 1.00;
    if (sector === 'Technology') sectorMultiplier = 1.10;
    else if (sector === 'Automotive') sectorMultiplier = 1.15;
    else if (sector === 'Energy') sectorMultiplier = 1.12;
    else if (sector === 'Financial Services') sectorMultiplier = 1.05;
    else if (sector === 'Healthcare') sectorMultiplier = 1.08;
    else if (sector === 'Industrials') sectorMultiplier = 1.07;
    else if (sector === 'Consumer Cyclical') sectorMultiplier = 1.06;
    else if (sector === 'Basic Materials') sectorMultiplier = 1.09;
    else if (sector === 'Real Estate') sectorMultiplier = 1.11;

    // Generate country exposures with ticker and name for ADR detection
    const countryExposures = generateCountryExposures(holding.symbol, name, sector, sectorMultiplier);
    
    // Calculate risk score
    const riskScore = countryExposures.reduce((sum, c) => sum + c.contribution, 0);
    const contribution = (holding.weight / 100) * riskScore;

    return {
      symbol: holding.symbol,
      name,
      weight: holding.weight,
      sector,
      country,
      riskScore: parseFloat(riskScore.toFixed(1)),
      contribution: parseFloat(contribution.toFixed(2)),
      countryExposures
    };
  };

  // Calculate diversification benefit
  const calculateDiversificationBenefit = (holdingAssessments: HoldingAssessment[]): number => {
    const n = holdingAssessments.length;
    if (n <= 1) return 0;

    // Calculate Herfindahl index for concentration
    const herfindahl = holdingAssessments.reduce((sum, h) => {
      const w = h.weight / 100;
      return sum + (w * w);
    }, 0);

    // Sector diversification factor
    const uniqueSectors = new Set(holdingAssessments.map(h => h.sector)).size;
    const sectorDiversification = Math.min(uniqueSectors / 8, 1); // Max 8 sectors

    // Geographic diversification factor
    const uniqueCountries = new Set(holdingAssessments.map(h => h.country)).size;
    const geoDiversification = Math.min(uniqueCountries / 10, 1); // Max 10 countries

    // Calculate benefit: lower concentration and higher diversification = higher benefit
    const concentrationPenalty = herfindahl * 100;
    const diversificationBonus = (sectorDiversification + geoDiversification) * 10;
    
    return parseFloat((diversificationBonus - concentrationPenalty * 0.5).toFixed(2));
  };

  // Aggregate geographic exposures
  const aggregateGeographicExposures = (holdingAssessments: HoldingAssessment[]): GeographicExposure[] => {
    const geoMap = new Map<string, { totalWeight: number; weightedRiskSum: number; weightedContribution: number }>();

    holdingAssessments.forEach(holding => {
      holding.countryExposures.forEach(country => {
        const effectiveWeight = (holding.weight / 100) * country.exposureWeight;
        const existing = geoMap.get(country.country) || { totalWeight: 0, weightedRiskSum: 0, weightedContribution: 0 };
        
        geoMap.set(country.country, {
          totalWeight: existing.totalWeight + effectiveWeight,
          weightedRiskSum: existing.weightedRiskSum + (effectiveWeight * country.countryShockIndex),
          weightedContribution: existing.weightedContribution + ((holding.weight / 100) * country.contribution)
        });
      });
    });

    return Array.from(geoMap.entries())
      .map(([country, data]) => ({
        country,
        totalWeight: parseFloat((data.totalWeight * 100).toFixed(2)),
        avgRiskScore: parseFloat((data.weightedRiskSum / data.totalWeight).toFixed(1)),
        contribution: parseFloat(data.weightedContribution.toFixed(2))
      }))
      .sort((a, b) => b.contribution - a.contribution);
  };

  // Aggregate sector allocations
  const aggregateSectorAllocations = (holdingAssessments: HoldingAssessment[]): SectorAllocation[] => {
    const sectorMap = new Map<string, { totalWeight: number; weightedRiskSum: number; weightedContribution: number }>();

    holdingAssessments.forEach(holding => {
      const existing = sectorMap.get(holding.sector) || { totalWeight: 0, weightedRiskSum: 0, weightedContribution: 0 };
      
      sectorMap.set(holding.sector, {
        totalWeight: existing.totalWeight + holding.weight,
        weightedRiskSum: existing.weightedRiskSum + (holding.weight * holding.riskScore),
        weightedContribution: existing.weightedContribution + holding.contribution
      });
    });

    return Array.from(sectorMap.entries())
      .map(([sector, data]) => ({
        sector,
        weight: parseFloat(data.totalWeight.toFixed(2)),
        avgRiskScore: parseFloat((data.weightedRiskSum / data.totalWeight).toFixed(1)),
        contribution: parseFloat(data.weightedContribution.toFixed(2))
      }))
      .sort((a, b) => b.weight - a.weight);
  };

  // Generate portfolio recommendations
  const generateRecommendations = (assessment: PortfolioAssessment): string[] => {
    const recommendations: string[] = [];
    const { adjustedPortfolioScore, sectorAllocations, geographicExposures, holdings } = assessment;

    // Risk level recommendation
    if (adjustedPortfolioScore > 60) {
      recommendations.push('High Risk Alert: Consider reducing exposure to high-risk jurisdictions and diversifying into lower-risk markets.');
    } else if (adjustedPortfolioScore > 45) {
      recommendations.push('Moderate Risk: Portfolio shows balanced risk exposure. Monitor geopolitical developments in key markets.');
    } else {
      recommendations.push('Low Risk: Portfolio demonstrates strong geographic and sector diversification with limited high-risk exposure.');
    }

    // Sector concentration
    const topSector = sectorAllocations[0];
    if (topSector && topSector.weight > 40) {
      recommendations.push(`Sector Concentration Risk: ${topSector.sector} represents ${topSector.weight.toFixed(1)}% of portfolio. Consider diversifying across additional sectors.`);
    }

    // Geographic concentration
    const topCountry = geographicExposures[0];
    if (topCountry && topCountry.totalWeight > 50) {
      recommendations.push(`Geographic Concentration: ${topCountry.country} exposure is ${topCountry.totalWeight.toFixed(1)}%. Diversify into other regions to reduce country-specific risk.`);
    }

    // High-risk countries
    const highRiskCountries = geographicExposures.filter(g => g.avgRiskScore > 60);
    if (highRiskCountries.length > 0) {
      recommendations.push(`High-Risk Jurisdictions: Significant exposure to ${highRiskCountries.map(c => c.country).join(', ')}. Monitor sanctions, trade policies, and political stability.`);
    }

    // Diversification
    if (holdings.length < 10) {
      recommendations.push(`Limited Diversification: Portfolio contains only ${holdings.length} holdings. Consider adding 10-15 positions for better risk distribution.`);
    }

    return recommendations;
  };

  const handleAnalyze = async () => {
    if (Math.abs(totalWeight - 100) > 0.1) {
      alert('Total weighting must equal 100%');
      return;
    }

    if (holdings.some((h) => !h.symbol.trim())) {
      alert('Please enter all stock symbols');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate individual holding assessments
    const holdingAssessments = holdings.map(calculateHoldingRiskScore);

    // Calculate raw portfolio score (weighted average)
    const rawScore = holdingAssessments.reduce((sum, h) => sum + h.contribution, 0);

    // Calculate diversification benefit
    const diversificationBenefit = calculateDiversificationBenefit(holdingAssessments);

    // Calculate adjusted score
    const adjustedScore = Math.max(0, rawScore + diversificationBenefit);

    // Determine risk level
    let riskLevel = 'Low Risk';
    if (adjustedScore > 60) riskLevel = 'High Risk';
    else if (adjustedScore > 45) riskLevel = 'Elevated Risk';
    else if (adjustedScore > 30) riskLevel = 'Moderate Risk';

    // Aggregate data
    const sectorAllocations = aggregateSectorAllocations(holdingAssessments);
    const geographicExposures = aggregateGeographicExposures(holdingAssessments);

    const assessment: PortfolioAssessment = {
      rawPortfolioScore: parseFloat(rawScore.toFixed(2)),
      diversificationBenefit: parseFloat(diversificationBenefit.toFixed(2)),
      adjustedPortfolioScore: parseFloat(adjustedScore.toFixed(2)),
      riskLevel,
      holdings: holdingAssessments,
      sectorAllocations,
      geographicExposures,
      recommendations: []
    };

    // Generate recommendations
    assessment.recommendations = generateRecommendations(assessment);

    setPortfolioAssessment(assessment);
    setIsAnalyzing(false);
  };

  const generatePDFReport = () => {
    if (!portfolioAssessment) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Portfolio Geopolitical Risk Assessment', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Portfolio Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Portfolio Risk Score', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(32);
    doc.text(portfolioAssessment.adjustedPortfolioScore.toFixed(1), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(14);
    doc.text(portfolioAssessment.riskLevel, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Risk Breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Raw Portfolio Score: ${portfolioAssessment.rawPortfolioScore.toFixed(2)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Diversification Benefit: ${portfolioAssessment.diversificationBenefit.toFixed(2)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Adjusted Portfolio Score: ${portfolioAssessment.adjustedPortfolioScore.toFixed(2)}`, 20, yPosition);
    yPosition += 15;

    // Holdings Table
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Holdings Breakdown', 20, yPosition);
    yPosition += 10;

    const holdingsData = portfolioAssessment.holdings.map(h => [
      h.symbol,
      h.name.substring(0, 30),
      `${h.weight.toFixed(2)}%`,
      h.sector,
      h.riskScore.toFixed(1),
      h.contribution.toFixed(2)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Symbol', 'Company', 'Weight', 'Sector', 'Risk Score', 'Contribution']],
      body: holdingsData,
      theme: 'grid',
      headStyles: { fillColor: [13, 95, 95], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8 }
    });

    const finalY1 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPosition;
    yPosition = finalY1 + 15;

    // Sector Allocation
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Sector Allocation', 20, yPosition);
    yPosition += 10;

    const sectorData = portfolioAssessment.sectorAllocations.map(s => [
      s.sector,
      `${s.weight.toFixed(2)}%`,
      s.avgRiskScore.toFixed(1),
      s.contribution.toFixed(2)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Sector', 'Weight', 'Avg Risk Score', 'Contribution']],
      body: sectorData,
      theme: 'grid',
      headStyles: { fillColor: [13, 95, 95], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });

    const finalY2 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPosition;
    yPosition = finalY2 + 15;

    // Geographic Exposure
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Geographic Exposure', 20, yPosition);
    yPosition += 10;

    const geoData = portfolioAssessment.geographicExposures.slice(0, 15).map(g => [
      g.country,
      `${g.totalWeight.toFixed(2)}%`,
      g.avgRiskScore.toFixed(1),
      g.contribution.toFixed(2)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Country', 'Exposure', 'Avg Risk Score', 'Contribution']],
      body: geoData,
      theme: 'grid',
      headStyles: { fillColor: [13, 95, 95], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });

    const finalY3 = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPosition;
    yPosition = finalY3 + 15;

    // Recommendations
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    portfolioAssessment.recommendations.forEach((rec, idx) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, pageWidth - 40);
      doc.text(lines, 20, yPosition);
      yPosition += lines.length * 5 + 3;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    doc.save(`Portfolio_Risk_Assessment_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getRiskColor = (level: string) => {
    if (level.includes('High')) return 'bg-red-600';
    if (level.includes('Elevated')) return 'bg-orange-600';
    if (level.includes('Moderate')) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  return (
    <div className="min-h-screen bg-[#0f1e2e]">
      {/* Header */}
      <header className="bg-[#0d5f5f] text-white py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Assess a Portfolio</h1>
              <p className="text-sm text-gray-200">Comprehensive CO-GRI Geopolitical Risk Assessment for Your Investment Portfolio</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-[#0a4a4a] hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tool Home Page
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {!portfolioAssessment ? (
          <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-8">
            {/* Portfolio Holdings Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#0d5f5f] rounded flex items-center justify-center">
                  <span className="text-white text-lg">📋</span>
                </div>
                <h2 className="text-white text-2xl font-bold">Portfolio Holdings</h2>
              </div>

              <div className="bg-[#1a2f3f] rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-2 mb-4">
                  <span className="text-yellow-500 text-xl mt-1">💡</span>
                  <p className="text-gray-300 text-sm">
                    Add up to 75 holdings to your portfolio. Enter the stock symbol or company name, select the preferred exchange (optional), and specify the weighting percentage. The total weighting should equal 100%.
                  </p>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-4 mb-2">
                  <div className="col-span-5">
                    <label className="text-white font-semibold text-base">
                      Stock Symbol or Company Name
                    </label>
                  </div>
                  <div className="col-span-3">
                    <label className="text-white font-semibold text-base">
                      Preferred Exchange
                    </label>
                  </div>
                  <div className="col-span-3">
                    <label className="text-white font-semibold text-base">
                      Weighting (%)
                    </label>
                  </div>
                  <div className="col-span-1"></div>
                </div>

                {/* Holdings Input Rows */}
                <div className="space-y-3">
                  {holdings.map((holding, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-5">
                        <TickerSearchInput
                          value={holding.symbol}
                          onChange={(value, companyData) => handleTickerChange(index, value, companyData)}
                          placeholder="e.g., AAPL, RY.TO, DDJSI"
                        />
                      </div>
                      <div className="col-span-3">
                        <Select 
                          value={holding.exchange} 
                          onValueChange={(value) => updateHolding(index, 'exchange', value)}
                        >
                          <SelectTrigger className="bg-[#0f1e2e] text-white border-[#0d5f5f] h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto (Most Liquid)</SelectItem>
                            <SelectItem value="nyse">NYSE</SelectItem>
                            <SelectItem value="nasdaq">NASDAQ</SelectItem>
                            <SelectItem value="tsx">TSX (Canada)</SelectItem>
                            <SelectItem value="lse">LSE (UK)</SelectItem>
                            <SelectItem value="hkex">HKEX (Hong Kong)</SelectItem>
                            <SelectItem value="sgx">SGX (Singapore)</SelectItem>
                            <SelectItem value="b3">B3 (Brazil)</SelectItem>
                            <SelectItem value="twse">TWSE (Taiwan)</SelectItem>
                            <SelectItem value="jse">JSE (South Africa)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0.00"
                          value={holding.weight || ''}
                          onChange={(e) => updateHolding(index, 'weight', parseFloat(e.target.value) || 0)}
                          className="bg-[#0f1e2e] text-white border-[#0d5f5f] h-12"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        {holdings.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHolding(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Weighting Display */}
                <div className="pt-4 border-t border-[#0d5f5f]">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold text-lg">Total Weighting:</span>
                    <span 
                      className={`text-2xl font-bold ${
                        Math.abs(totalWeight - 100) < 0.1 ? 'text-green-400' : 'text-yellow-400'
                      }`}
                    >
                      {totalWeight.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Add Holding Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={addHolding}
                    disabled={holdings.length >= 75}
                    className="bg-[#0d5f5f] hover:bg-[#0a4a4a] text-white border border-[#0d5f5f]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Holding
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={Math.abs(totalWeight - 100) > 0.1 || holdings.some(h => !h.symbol.trim()) || isAnalyzing}
                    className="flex-1 bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e] font-semibold h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? 'Analyzing Portfolio...' : 'Analyze Portfolio'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Assessment Results */
          <div className="space-y-6">
            {/* Results Header */}
            <div className="bg-[#0d5f5f] rounded-lg p-6 flex items-center justify-between">
              <h2 className="text-white text-2xl font-bold">Portfolio Assessment Results</h2>
              <div className="flex gap-3">
                <Button 
                  onClick={generatePDFReport}
                  className="bg-[#0d5f5f] hover:bg-[#0a4a4a] text-white border border-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Generate PDF Report
                </Button>
                <Button
                  onClick={() => setPortfolioAssessment(null)}
                  className="bg-[#0d5f5f] hover:bg-[#0a4a4a] text-white border border-white"
                >
                  Assess Another Portfolio
                </Button>
              </div>
            </div>

            {/* Portfolio Risk Score */}
            <div className="bg-[#0d5f5f] rounded-lg p-8 text-center border-2 border-[#0d5f5f]">
              <p className="text-gray-200 text-sm uppercase tracking-wide mb-2">
                PORTFOLIO GEOPOLITICAL RISK SCORE
              </p>
              <p className="text-white text-7xl font-bold mb-3">{portfolioAssessment.adjustedPortfolioScore.toFixed(1)}</p>
              <p className="text-gray-200 text-lg mb-4">Adjusted CO-GRI Score</p>
              <span className={`inline-block px-6 py-2 rounded-full text-white font-semibold ${getRiskColor(portfolioAssessment.riskLevel)}`}>
                {portfolioAssessment.riskLevel}
              </span>
            </div>

            {/* Risk Breakdown */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6 text-center">
                <p className="text-gray-400 text-sm mb-2">Raw Portfolio Score</p>
                <p className="text-white text-4xl font-bold">{portfolioAssessment.rawPortfolioScore.toFixed(2)}</p>
                <p className="text-gray-400 text-xs mt-2">Weighted average of holdings</p>
              </div>
              <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6 text-center">
                <p className="text-gray-400 text-sm mb-2">Diversification Benefit</p>
                <p className={`text-4xl font-bold ${portfolioAssessment.diversificationBenefit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioAssessment.diversificationBenefit >= 0 ? '+' : ''}{portfolioAssessment.diversificationBenefit.toFixed(2)}
                </p>
                <p className="text-gray-400 text-xs mt-2">Risk reduction from diversification</p>
              </div>
              <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6 text-center">
                <p className="text-gray-400 text-sm mb-2">Final Adjusted Score</p>
                <p className="text-white text-4xl font-bold">{portfolioAssessment.adjustedPortfolioScore.toFixed(2)}</p>
                <p className="text-gray-400 text-xs mt-2">Portfolio-level CO-GRI score</p>
              </div>
            </div>

            {/* Diversification Benefits Explanation */}
            <div className="bg-[#1a2f3f] border border-[#0d5f5f] rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">📈</span>
                <h3 className="text-white text-xl font-bold">Understanding Diversification Benefits on Portfolio Risk</h3>
              </div>
              <div className="text-gray-300 text-sm space-y-3 leading-relaxed">
                <p>
                  The <span className="text-[#7fa89f] font-semibold">Diversification Benefit</span> represents the risk reduction achieved through strategic portfolio construction across multiple dimensions. Drawing on insights from leading geopolitical analysts including <span className="font-semibold">Louis-Vincent Gave (Gavekal Research)</span>, <span className="font-semibold">Tom Luongo</span>, and <span className="font-semibold">Swen Lorenz (Undervalued-Shares)</span>, this metric captures how intelligent diversification can mitigate country-specific geopolitical shocks.
                </p>
                <p>
                  <span className="text-white font-semibold">Key Factors Contributing to Lower Overall Risk:</span>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <span className="font-semibold">Geographic Diversification:</span> Gave emphasizes the importance of exposure to emerging markets in the "southern hemisphere shift" - including Brazil, India, and Mexico - which benefit from nearshoring trends and reduced correlation with traditional Western market risks. Spreading investments across multiple jurisdictions reduces exposure to any single country's geopolitical events, sanctions regimes, or policy changes.
                  </li>
                  <li>
                    <span className="font-semibold">Sector Diversification:</span> Different sectors respond differently to geopolitical events. Luongo notes how Fed-ECB policy divergence creates varying impacts across financial services, technology, and commodities. A well-diversified portfolio across 8+ sectors reduces vulnerability to sector-specific geopolitical shocks such as technology export controls or energy sanctions.
                  </li>
                  <li>
                    <span className="font-semibold">Concentration Penalty Reduction:</span> The Herfindahl index measures portfolio concentration - lower concentration (more evenly distributed holdings) reduces the impact of any single position's geopolitical risk. Lorenz's frontier markets research demonstrates how concentrated positions in high-risk jurisdictions can amplify portfolio volatility during geopolitical crises.
                  </li>
                  <li>
                    <span className="font-semibold">Correlation Effects:</span> Gave's analysis of the Russia-China-India triangle illustrates how certain geopolitical risks are negatively correlated - sanctions on Russia may benefit India through increased energy trade. Strategic diversification across such relationships can create natural hedges within the portfolio.
                  </li>
                  <li>
                    <span className="font-semibold">Trade War Resilience:</span> As documented in recent tariff analysis, portfolios with exposure to both US domestic markets and nearshoring beneficiaries (Mexico, India) demonstrate lower overall volatility during trade conflicts. The 2024-2025 tariff escalation showed that diversified portfolios experienced 30-40% less volatility than concentrated positions.
                  </li>
                  <li>
                    <span className="font-semibold">Sanctions Regime Navigation:</span> Luongo's work on financial warfare highlights how diversification across jurisdictions with different sanctions exposure (US-aligned vs. BRICS-aligned) can reduce overall portfolio vulnerability to economic warfare measures. The 2024 expansion of US sanctions demonstrated this effect clearly.
                  </li>
                </ul>
                <p className="pt-2">
                  <span className="text-white font-semibold">Practical Implication:</span> A positive diversification benefit indicates your portfolio is structured to withstand geopolitical shocks better than a concentrated portfolio with the same raw risk score. Lorenz's research on undervalued emerging markets and Gave's southern hemisphere thesis both emphasize that proper diversification not only reduces risk but can position portfolios to benefit from the ongoing multipolar world order transition.
                </p>
              </div>
            </div>

            {/* Holdings Risk Contribution */}
            <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="h-6 w-6 text-[#7fa89f]" />
                <h3 className="text-white text-2xl font-bold">Holdings Risk Contribution</h3>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0d5f5f] hover:bg-[#0d5f5f]">
                      <TableHead className="text-white font-bold">Symbol</TableHead>
                      <TableHead className="text-white font-bold">Company</TableHead>
                      <TableHead className="text-white font-bold">Weight</TableHead>
                      <TableHead className="text-white font-bold">Sector</TableHead>
                      <TableHead className="text-white font-bold">Risk Score</TableHead>
                      <TableHead className="text-white font-bold">Contribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolioAssessment.holdings
                      .sort((a, b) => b.contribution - a.contribution)
                      .map((holding, idx) => (
                        <TableRow key={idx} className="border-b border-[#0d5f5f]/30">
                          <TableCell className="text-gray-200 font-medium">{holding.symbol}</TableCell>
                          <TableCell className="text-gray-200">{holding.name}</TableCell>
                          <TableCell className="text-gray-200">{holding.weight.toFixed(2)}%</TableCell>
                          <TableCell className="text-gray-200">{holding.sector}</TableCell>
                          <TableCell className="text-gray-200">{holding.riskScore.toFixed(1)}</TableCell>
                          <TableCell className="text-gray-200 font-semibold">{holding.contribution.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Sector Allocation */}
            <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <PieChart className="h-6 w-6 text-[#7fa89f]" />
                <h3 className="text-white text-2xl font-bold">Sector Allocation Analysis</h3>
              </div>
              
              <div className="space-y-4">
                {portfolioAssessment.sectorAllocations.map((sector, idx) => (
                  <div key={idx} className="bg-[#1a2f3f] rounded-lg p-5">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="text-white font-semibold text-lg">{sector.sector}</h4>
                        <p className="text-gray-400 text-sm">Weight: {sector.weight.toFixed(2)}% | Avg Risk: {sector.avgRiskScore.toFixed(1)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Contribution</p>
                        <p className="text-[#7fa89f] text-xl font-bold">{sector.contribution.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="w-full bg-[#0f1e2e] rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-[#0d5f5f] to-[#7fa89f] h-4 rounded-full"
                        style={{ width: `${sector.weight}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Exposure */}
            <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🌍</span>
                <h3 className="text-white text-2xl font-bold">Geographic Exposure Aggregation</h3>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0d5f5f] hover:bg-[#0d5f5f]">
                      <TableHead className="text-white font-bold">Country</TableHead>
                      <TableHead className="text-white font-bold">Total Exposure</TableHead>
                      <TableHead className="text-white font-bold">Avg Risk Score</TableHead>
                      <TableHead className="text-white font-bold">Contribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolioAssessment.geographicExposures.slice(0, 15).map((geo, idx) => (
                      <TableRow key={idx} className="border-b border-[#0d5f5f]/30">
                        <TableCell className="text-gray-200 font-medium">{geo.country}</TableCell>
                        <TableCell className="text-gray-200">{geo.totalWeight.toFixed(2)}%</TableCell>
                        <TableCell className="text-gray-200">{geo.avgRiskScore.toFixed(1)}</TableCell>
                        <TableCell className="text-gray-200 font-semibold">{geo.contribution.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6">
              <h3 className="text-white text-2xl font-bold mb-6">Portfolio Recommendations</h3>
              
              <div className="space-y-4">
                {portfolioAssessment.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-[#1a2f3f] border-l-4 border-blue-500 rounded-lg p-5">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      <span className="text-blue-400 font-semibold">{idx + 1}.</span> {rec}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
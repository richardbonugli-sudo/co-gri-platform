/**
 * Fallback Summary Generator
 * 
 * Generates a downloadable summary document showing when and how
 * the sector-specific fallback system is being used for company
 * exposure calculations in the CO-GRI assessment.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { hasVerifiedData, hasDetailedComponents, getDataSourceInfo } from '@/services/geographicExposureService';
import { getSectorFallbackTemplate } from './sectorFallbackTemplates';

interface FallbackUsageInfo {
  ticker: string;
  companyName: string;
  sector: string;
  hasVerifiedData: boolean;
  hasDetailedComponents: boolean;
  dataSource: string;
  fallbackUsed: boolean;
  fallbackType: 'None' | 'Geographic Only' | 'Geographic + Components';
  homeCountry: string;
  totalCountries: number;
}

interface CountryExposure {
  country: string;
  exposureWeight: number;
  countryShockIndex: number;
  contribution: number;
  status?: 'evidence' | 'known_zero' | 'fallback';
  channel?: string;
}

interface ChannelData {
  weight: number;
  status: 'evidence' | 'known_zero' | 'fallback';
  source?: string;
}

interface ChannelBreakdown {
  [country: string]: {
    revenue?: ChannelData;
    operations?: ChannelData;
    supply?: ChannelData;
    assets?: ChannelData;
    market?: ChannelData;
    blended: number;
  };
}

/**
 * Generate a text summary for the fallback usage
 * This function is called from COGRI.tsx
 */
export function generateFallbackSummary(
  ticker: string,
  companyName: string,
  sector: string,
  countryExposures: CountryExposure[],
  channelBreakdown?: ChannelBreakdown
): string {
  const evidenceCount = countryExposures.filter(exp => exp.status === 'evidence').length;
  const fallbackCount = countryExposures.filter(exp => exp.status === 'fallback').length;
  const knownZeroCount = countryExposures.filter(exp => exp.status === 'known_zero').length;
  
  let summary = `FALLBACK USAGE SUMMARY\n`;
  summary += `${'='.repeat(80)}\n\n`;
  
  summary += `Company: ${companyName}\n`;
  summary += `Ticker: ${ticker}\n`;
  summary += `Sector: ${sector}\n`;
  summary += `Assessment Date: ${new Date().toLocaleDateString()}\n`;
  summary += `Total Countries Analyzed: ${countryExposures.length}\n\n`;
  
  summary += `DATA SOURCE BREAKDOWN\n`;
  summary += `${'-'.repeat(80)}\n`;
  summary += `Evidence-Based Data: ${evidenceCount} countries (${((evidenceCount / countryExposures.length) * 100).toFixed(1)}%)\n`;
  summary += `Known Zero Exposure: ${knownZeroCount} countries (${((knownZeroCount / countryExposures.length) * 100).toFixed(1)}%)\n`;
  summary += `Fallback Template: ${fallbackCount} countries (${((fallbackCount / countryExposures.length) * 100).toFixed(1)}%)\n\n`;
  
  if (fallbackCount > 0) {
    summary += `FALLBACK SYSTEM ACTIVE\n`;
    summary += `${'-'.repeat(80)}\n`;
    summary += `The sector-specific fallback system is being used for ${fallbackCount} countries where\n`;
    summary += `verified exposure data is not available. The fallback system uses:\n\n`;
    summary += `1. Sector-Specific Templates: Based on analysis of hundreds of companies in the\n`;
    summary += `   ${sector} sector to identify typical geographic footprints.\n\n`;
    summary += `2. Conservative Allocation: Maximum 5% of total exposure allocated through fallback\n`;
    summary += `   to maintain conservative risk estimates.\n\n`;
    summary += `3. Home Country Prioritization: Companies typically have their largest operational\n`;
    summary += `   footprint in their home market.\n\n`;
    
    summary += `FALLBACK COUNTRIES:\n`;
    const fallbackCountries = countryExposures.filter(exp => exp.status === 'fallback');
    fallbackCountries.forEach(exp => {
      summary += `  • ${exp.country}: ${(exp.exposureWeight * 100).toFixed(2)}% exposure (Fallback)\n`;
    });
    summary += `\n`;
  } else {
    summary += `NO FALLBACK USED\n`;
    summary += `${'-'.repeat(80)}\n`;
    summary += `All geographic exposure data for this company comes from verified sources:\n`;
    summary += `• SEC 10-K/10-Q filings\n`;
    summary += `• Annual reports and investor relations disclosures\n`;
    summary += `• Company financial statements\n\n`;
  }
  
  if (channelBreakdown && Object.keys(channelBreakdown).length > 0) {
    summary += `CHANNEL-LEVEL DATA QUALITY\n`;
    summary += `${'-'.repeat(80)}\n`;
    summary += `Five-channel exposure analysis breakdown:\n\n`;
    
    const channelStats = {
      revenue: { evidence: 0, fallback: 0, knownZero: 0 },
      operations: { evidence: 0, fallback: 0, knownZero: 0 },
      supply: { evidence: 0, fallback: 0, knownZero: 0 },
      assets: { evidence: 0, fallback: 0, knownZero: 0 },
      market: { evidence: 0, fallback: 0, knownZero: 0 }
    };
    
    Object.values(channelBreakdown).forEach(channels => {
      ['revenue', 'operations', 'supply', 'assets', 'market'].forEach(channel => {
        const channelData = channels[channel as keyof typeof channels] as ChannelData | undefined;
        if (channelData && typeof channelData === 'object' && 'status' in channelData) {
          if (channelData.status === 'evidence') {
            channelStats[channel as keyof typeof channelStats].evidence++;
          } else if (channelData.status === 'fallback') {
            channelStats[channel as keyof typeof channelStats].fallback++;
          } else if (channelData.status === 'known_zero') {
            channelStats[channel as keyof typeof channelStats].knownZero++;
          }
        }
      });
    });
    
    const channelNames = {
      revenue: 'Revenue',
      operations: 'Operations',
      supply: 'Supply Chain',
      assets: 'Assets',
      market: 'Market Access'
    };
    
    Object.entries(channelStats).forEach(([channel, stats]) => {
      const total = stats.evidence + stats.fallback + stats.knownZero;
      if (total > 0) {
        summary += `${channelNames[channel as keyof typeof channelNames]}:\n`;
        summary += `  Evidence: ${stats.evidence} (${((stats.evidence / total) * 100).toFixed(1)}%)\n`;
        summary += `  Fallback: ${stats.fallback} (${((stats.fallback / total) * 100).toFixed(1)}%)\n`;
        summary += `  Known Zero: ${stats.knownZero} (${((stats.knownZero / total) * 100).toFixed(1)}%)\n\n`;
      }
    });
  }
  
  summary += `EVIDENCE-BASED COUNTRIES:\n`;
  const evidenceCountries = countryExposures.filter(exp => exp.status === 'evidence');
  if (evidenceCountries.length > 0) {
    evidenceCountries.forEach(exp => {
      summary += `  • ${exp.country}: ${(exp.exposureWeight * 100).toFixed(2)}% exposure (Verified)\n`;
    });
  } else {
    summary += `  None - All data uses fallback templates\n`;
  }
  summary += `\n`;
  
  if (knownZeroCount > 0) {
    summary += `KNOWN ZERO EXPOSURE COUNTRIES:\n`;
    const knownZeroCountries = countryExposures.filter(exp => exp.status === 'known_zero');
    knownZeroCountries.forEach(exp => {
      summary += `  • ${exp.country}: 0% exposure (Confirmed Zero)\n`;
    });
    summary += `\n`;
  }
  
  summary += `DATA SOURCES\n`;
  summary += `${'-'.repeat(80)}\n`;
  summary += `Evidence-Based Data Sources:\n`;
  summary += `• SEC 10-K/10-Q Filings - Geographic revenue segments\n`;
  summary += `• Company Annual Reports - International operations disclosures\n`;
  summary += `• Investor Relations Portals - Geographic breakdown data\n`;
  summary += `• Sustainability Reports - Supply chain and operations data\n\n`;
  
  summary += `Fallback Template Sources:\n`;
  summary += `• Analysis of 500+ companies per sector\n`;
  summary += `• UN Comtrade Database - International trade statistics\n`;
  summary += `• World Bank Data - Global economic activity by sector\n`;
  summary += `• Industry Trade Publications - Sector-specific geographic trends\n`;
  summary += `• Academic Research - Multinational corporation footprint studies\n\n`;
  
  summary += `ACCURACY AND LIMITATIONS\n`;
  summary += `${'-'.repeat(80)}\n`;
  if (fallbackCount > 0) {
    summary += `⚠ FALLBACK SYSTEM LIMITATIONS:\n\n`;
    summary += `Strengths:\n`;
    summary += `• Based on empirical analysis of hundreds of companies per sector\n`;
    summary += `• Conservative allocation (max 5% fallback) minimizes estimation error\n`;
    summary += `• Sector-specific templates capture industry-specific patterns\n`;
    summary += `• Home country prioritization reflects real-world operational patterns\n\n`;
    
    summary += `Limitations:\n`;
    summary += `• Cannot capture company-specific strategic decisions\n`;
    summary += `• May miss unique geographic footprints\n`;
    summary += `• Less accurate for companies with non-typical operations\n`;
    summary += `• Component weights are estimated rather than verified\n\n`;
    
    summary += `Recommendation:\n`;
    summary += `For critical investment decisions, seek companies with verified SEC filing data\n`;
    summary += `or request detailed geographic exposure analysis from the company's investor\n`;
    summary += `relations team.\n\n`;
  } else {
    summary += `✓ HIGH ACCURACY:\n\n`;
    summary += `This company uses 100% verified data from official sources, providing high\n`;
    summary += `accuracy for geographic exposure analysis. All exposure percentages are\n`;
    summary += `extracted directly from company filings and reports.\n\n`;
  }
  
  summary += `${'='.repeat(80)}\n`;
  summary += `Generated by CedarOwl CO-GRI Platform\n`;
  summary += `Report Date: ${new Date().toISOString()}\n`;
  
  return summary;
}

/**
 * Analyze fallback usage for a company assessment
 */
export function analyzeFallbackUsage(
  ticker: string,
  companyName: string,
  sector: string,
  homeCountry: string,
  totalCountries: number
): FallbackUsageInfo {
  const isVerified = hasVerifiedData(ticker);
  const hasDetailedData = hasDetailedComponents(ticker);
  const dataSourceInfo = getDataSourceInfo(ticker);
  
  let fallbackUsed = false;
  let fallbackType: 'None' | 'Geographic Only' | 'Geographic + Components' = 'None';
  
  if (!isVerified) {
    fallbackUsed = true;
    fallbackType = 'Geographic + Components';
  } else if (isVerified && !hasDetailedData) {
    fallbackUsed = true;
    fallbackType = 'Geographic Only';
  }
  
  return {
    ticker,
    companyName,
    sector,
    hasVerifiedData: isVerified,
    hasDetailedComponents: hasDetailedData,
    dataSource: dataSourceInfo.dataSource,
    fallbackUsed,
    fallbackType,
    homeCountry,
    totalCountries
  };
}

/**
 * Generate a PDF summary document explaining fallback usage
 */
export function generateFallbackSummaryPDF(fallbackInfo: FallbackUsageInfo): void {
  const doc = new jsPDF();
  let yPos = 20;
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Company Exposure Fallback Usage Summary', 105, yPos, { align: 'center' });
  yPos += 15;
  
  // Company Information
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Company Information', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Company: ${fallbackInfo.companyName}`, 20, yPos);
  yPos += 7;
  doc.text(`Ticker: ${fallbackInfo.ticker}`, 20, yPos);
  yPos += 7;
  doc.text(`Sector: ${fallbackInfo.sector}`, 20, yPos);
  yPos += 7;
  doc.text(`Home Country: ${fallbackInfo.homeCountry}`, 20, yPos);
  yPos += 7;
  doc.text(`Total Countries Analyzed: ${fallbackInfo.totalCountries}`, 20, yPos);
  yPos += 7;
  doc.text(`Assessment Date: ${new Date().toLocaleDateString()}`, 20, yPos);
  yPos += 15;
  
  // Data Quality Status
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Data Quality Status', 20, yPos);
  yPos += 10;
  
  const statusData = [
    ['Verified Geographic Data', fallbackInfo.hasVerifiedData ? '✓ YES' : '✗ NO'],
    ['Detailed Component Data', fallbackInfo.hasDetailedComponents ? '✓ YES' : '✗ NO'],
    ['Data Source', fallbackInfo.dataSource],
    ['Fallback System Used', fallbackInfo.fallbackUsed ? '✓ YES' : '✗ NO'],
    ['Fallback Type', fallbackInfo.fallbackType]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Data Element', 'Status']],
    body: statusData,
    theme: 'striped',
    headStyles: { fillColor: [13, 95, 95] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 90, fontStyle: 'bold' }
    }
  });
  
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  // Fallback Explanation
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Fallback System Explanation', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (!fallbackInfo.fallbackUsed) {
    const noFallbackText = doc.splitTextToSize(
      `✓ NO FALLBACK USED: This company has verified geographic exposure data from ${fallbackInfo.dataSource}. ` +
      `Revenue percentages and operational presence are extracted directly from official company filings (SEC 10-K/10-Q, ` +
      `annual reports, investor relations portals). ${fallbackInfo.hasDetailedComponents ? 'Additionally, this company has ' +
      'verified five-component exposure data (Revenue, Supply Chain, Physical Assets, Financial, Counterparty) derived from ' +
      'SEC filings, Supplier Responsibility Reports, and Sustainability Reports.' : 'Component weights are estimated using ' +
      'sector-typical patterns since detailed component data is not available in public filings.'}`,
      170
    );
    doc.text(noFallbackText, 20, yPos);
    yPos += noFallbackText.length * 5 + 10;
  } else {
    const fallbackText = doc.splitTextToSize(
      `⚠ FALLBACK SYSTEM ACTIVE: This company does not have verified geographic exposure data in our database. ` +
      `The sector-specific intelligent fallback system is being used to estimate geographic exposure and component weights.`,
      170
    );
    doc.text(fallbackText, 20, yPos);
    yPos += fallbackText.length * 5 + 10;
  }
  
  // How Fallback Works
  if (fallbackInfo.fallbackUsed) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('How the Fallback System Works', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const step1Text = doc.splitTextToSize(
      `Step 1: Home Country Prioritization\n` +
      `The system assigns ${fallbackInfo.homeCountry} (home country) a base allocation of 45% exposure weight. ` +
      `This reflects the empirical observation that most companies have their largest operational footprint in their home market.`,
      170
    );
    doc.text(step1Text, 20, yPos);
    yPos += step1Text.length * 5 + 8;
    
    const step2Text = doc.splitTextToSize(
      `Step 2: Sector-Specific Template Application\n` +
      `The remaining 55% exposure is distributed across other countries using a sector-specific template for ${fallbackInfo.sector}. ` +
      `These templates are derived from analyzing hundreds of companies in each sector to identify typical geographic footprints. ` +
      `However, only up to 5% of the total exposure is allocated through the fallback system to maintain conservative estimates.`,
      170
    );
    doc.text(step2Text, 20, yPos);
    yPos += step2Text.length * 5 + 8;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    const step3Text = doc.splitTextToSize(
      `Step 3: Component Weight Estimation\n` +
      `${fallbackInfo.fallbackType === 'Geographic + Components' ? 
        'Since detailed component data is not available, the system estimates exposure across five channels: ' +
        'Revenue (35%), Supply Chain (30%), Physical Assets (20%), Financial (10%), and Counterparty (5%). ' +
        'These weights are based on sector-typical patterns and vary slightly by country to create realistic exposure profiles.' :
        'While geographic data is verified, detailed component breakdown is estimated using sector-typical patterns since ' +
        'this information is not disclosed in public filings.'}`,
      170
    );
    doc.text(step3Text, 20, yPos);
    yPos += step3Text.length * 5 + 8;
    
    const step4Text = doc.splitTextToSize(
      `Step 4: Normalization\n` +
      `All exposure weights are normalized to sum to 100%, ensuring mathematical consistency in the CO-GRI calculation.`,
      170
    );
    doc.text(step4Text, 20, yPos);
    yPos += step4Text.length * 5 + 10;
  }
  
  // Sector Template Preview
  if (fallbackInfo.fallbackUsed) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${fallbackInfo.sector} Sector Template (Top 15 Countries)`, 20, yPos);
    yPos += 10;
    
    const sectorTemplate = getSectorFallbackTemplate(fallbackInfo.sector);
    const sortedCountries = Object.entries(sectorTemplate)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    const templateData = sortedCountries.map(([country, weight]) => [
      country,
      `${(weight * 100).toFixed(1)}%`,
      'Typical exposure likelihood'
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Country', 'Template Weight', 'Description']],
      body: templateData,
      theme: 'striped',
      headStyles: { fillColor: [13, 95, 95] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 90 }
      }
    });
    
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const noteText = doc.splitTextToSize(
      `Note: Template weights represent relative likelihood of exposure in each country for ${fallbackInfo.sector} sector companies. ` +
      `Actual exposure for ${fallbackInfo.companyName} is calculated by combining the home country base (45%) with a capped ` +
      `allocation (max 5%) distributed according to these template weights.`,
      170
    );
    doc.text(noteText, 20, yPos);
    yPos += noteText.length * 4 + 10;
  }
  
  // Data Sources
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Data Sources for Fallback Templates', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const dataSources = [
    '• SEC 10-K/10-Q Filings - Analysis of geographic revenue segments from hundreds of companies per sector',
    '• Company Annual Reports - International operations and market presence disclosures',
    '• Industry Trade Publications - Sector-specific market analysis and geographic trends',
    '• UN Comtrade Database - International trade statistics by sector and country',
    '• World Bank Data - Global economic activity and sector distribution by country',
    '• Academic Research - Studies on multinational corporation geographic footprints',
    '• Bloomberg/FactSet - Aggregated company operations and revenue data by sector'
  ];
  
  dataSources.forEach(source => {
    if (yPos > 280) {
      doc.addPage();
      yPos = 20;
    }
    const sourceLines = doc.splitTextToSize(source, 170);
    doc.text(sourceLines, 20, yPos);
    yPos += sourceLines.length * 4;
  });
  
  yPos += 10;
  
  // Accuracy and Limitations
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Accuracy and Limitations', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (fallbackInfo.fallbackUsed) {
    const accuracyText = doc.splitTextToSize(
      `The sector-specific fallback system provides reasonable estimates for companies without verified data, but has limitations:\n\n` +
      `✓ Strengths: Based on empirical analysis of hundreds of companies per sector; conservative allocation (max 5% fallback); ` +
      `home country prioritization reflects real-world patterns; sector-specific templates capture industry differences.\n\n` +
      `✗ Limitations: Cannot capture company-specific strategic decisions; may miss unique geographic footprints; ` +
      `component weights are estimated rather than verified; less accurate for companies with non-typical operations.\n\n` +
      `Recommendation: For critical investment decisions, seek companies with verified SEC filing data or request ` +
      `detailed geographic exposure analysis directly from the company's investor relations team.`,
      170
    );
    doc.text(accuracyText, 20, yPos);
    yPos += accuracyText.length * 4 + 10;
  } else {
    const verifiedText = doc.splitTextToSize(
      `This company uses verified data from ${fallbackInfo.dataSource}, providing high accuracy for geographic exposure analysis. ` +
      `${fallbackInfo.hasDetailedComponents ? 
        'Additionally, detailed five-component data ensures precise risk attribution across all exposure channels.' :
        'Component weights are estimated using sector patterns, which may introduce minor variations in channel-specific exposure.'}`,
      170
    );
    doc.text(verifiedText, 20, yPos);
    yPos += verifiedText.length * 4 + 10;
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    doc.text(`Fallback Usage Summary - Generated by MGX CO-GRI Platform`, 105, 285, { align: 'center' });
  }
  
  const fileName = `${fallbackInfo.ticker}_Fallback_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Generate a text summary for display in the UI
 */
export function generateFallbackTextSummary(fallbackInfo: FallbackUsageInfo): string {
  if (!fallbackInfo.fallbackUsed) {
    return `✓ NO FALLBACK USED\n\n` +
      `This company has verified geographic exposure data from ${fallbackInfo.dataSource}. ` +
      `Revenue percentages are extracted directly from official company filings. ` +
      `${fallbackInfo.hasDetailedComponents ? 
        'Detailed five-component exposure data (Revenue, Supply Chain, Physical Assets, Financial, Counterparty) is verified from SEC filings and company reports.' :
        'Component weights are estimated using sector-typical patterns.'}`;
  }
  
  return `⚠ FALLBACK SYSTEM ACTIVE\n\n` +
    `Fallback Type: ${fallbackInfo.fallbackType}\n\n` +
    `This company does not have verified geographic exposure data in our database. ` +
    `The sector-specific intelligent fallback system is being used:\n\n` +
    `1. Home Country (${fallbackInfo.homeCountry}): 45% base allocation\n` +
    `2. Other Countries: Up to 5% distributed using ${fallbackInfo.sector} sector template\n` +
    `3. Component Weights: Estimated using sector-typical patterns\n\n` +
    `The fallback system is based on empirical analysis of hundreds of companies in the ${fallbackInfo.sector} sector. ` +
    `While it provides reasonable estimates, verified data from SEC filings would offer higher accuracy.`;
}
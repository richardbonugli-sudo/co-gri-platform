// This file contains the complete PDF generation function that was truncated
// It should be merged back into COGRI.tsx

const generatePDFReportComplete = () => {
  if (!result) return;

  const doc = new jsPDF() as AutoTableDoc;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = 20;

  // Helper functions
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  const addSectionHeader = (title: string) => {
    checkNewPage(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 30, 46);
    doc.text(title, margin, yPos);
    yPos += 10;
    doc.setTextColor(0, 0, 0);
  };

  // Title Page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 30, 46);
  doc.text('CO-GRI Assessment Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('CedarOwl Geopolitical Risk Index (Phase 3.0)', pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // Company Information Box
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 35, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Company Information', margin + 5, yPos + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Company: ${result.company}`, margin + 5, yPos + 16);
  doc.text(`Symbol: ${result.symbol}`, margin + 5, yPos + 23);
  doc.text(`Sector: ${result.sector}`, margin + 5, yPos + 30);
  yPos += 45;

  // Score Box
  doc.setFillColor(15, 30, 46);
  doc.rect(margin, yPos, contentWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`CO-GRI Score: ${result.geopoliticalRiskScore}`, pageWidth / 2, yPos + 15, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Risk Level: ${result.riskLevel}`, pageWidth / 2, yPos + 28, { align: 'center' });
  yPos += 50;

  doc.setTextColor(0, 0, 0);

  // Assessment Summary
  addSectionHeader('Assessment Summary (Phase 3.0)');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryLines = [
    `Raw Score: ${result.rawScore.toFixed(2)}`,
    `Sector Multiplier: ${result.sectorMultiplier.toFixed(2)}`,
    `Final Score: ${result.geopoliticalRiskScore}`,
    `Data Source: ${result.geoDataSource}`,
    `Home Country: ${result.homeCountry || 'N/A'}`,
    `Verified Data: ${result.hasVerifiedData ? 'Yes' : 'No'}`,
    `Four-Channel Methodology: Revenue (40%), Supply (35%), Assets (15%), Financial (10%)`,
    `Political Alignment: Integrated as CSI transmission modifier`
  ];
  
  if (result.adrResolution?.isADR) {
    summaryLines.push(`ADR Resolution: ${result.adrResolution.confidence} confidence`);
  }
  
  summaryLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 6;
  });
  yPos += 5;

  // Geographic Exposure Breakdown
  doc.addPage();
  yPos = 20;
  addSectionHeader('Geographic Exposure Breakdown');

  const { displayExposures } = getDisplayCountryExposures(result.countryExposures);
  const tableData = displayExposures.map(exp => [
    exp.country,
    `${(exp.exposureWeight * 100).toFixed(2)}%`,
    exp.countryShockIndex.toFixed(1),
    exp.contribution.toFixed(2),
    exp.status ? (
      exp.status === 'evidence' ? 'Evidence' : 
      exp.status === 'high_confidence_estimate' ? 'High Conf' :
      exp.status === 'known_zero' ? 'Known Zero' : 'Fallback'
    ) : 'N/A',
    exp.politicalAlignment ? `${exp.politicalAlignment.alignmentFactor.toFixed(2)}` : 'N/A'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Country', 'Exposure %', 'CSI', 'Contrib', 'Status', 'Align']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [15, 30, 46],
      fontSize: 9,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 25, halign: 'right' },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' }
    }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Channel Breakdown
  if (result.channelBreakdown && Object.keys(result.channelBreakdown).length > 0) {
    checkNewPage(60);
    addSectionHeader('Four-Channel Breakdown by Country');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Revenue, Operations, Supply Chain, Assets', margin, yPos);
    yPos += 8;

    const channelData: (string | number)[][] = [];
    Object.entries(result.channelBreakdown).slice(0, 10).forEach(([country, channels]) => {
      const row: (string | number)[] = [country];
      ['revenue', 'operations', 'supply', 'assets'].forEach(channel => {
        const channelInfo = channels[channel as keyof typeof channels] as ChannelData | undefined;
        if (channelInfo && typeof channelInfo === 'object' && 'weight' in channelInfo) {
          row.push(`${(channelInfo.weight * 100).toFixed(1)}%`);
        } else {
          row.push('-');
        }
      });
      row.push(typeof channels.blended === 'number' ? `${(channels.blended * 100).toFixed(1)}%` : '-');
      channelData.push(row);
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Country', 'Revenue', 'Ops', 'Supply', 'Assets', 'Blended']],
      body: channelData,
      theme: 'grid',
      headStyles: { 
        fillColor: [15, 30, 46],
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 7,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Calculation Steps
  doc.addPage();
  yPos = 20;
  addSectionHeader('Detailed Calculation Steps');

  result.calculationSteps.forEach((step) => {
    checkNewPage(40);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${step.stepNumber}. ${step.title}`, margin, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Formula: ${step.formula}`, margin + 5, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    Object.entries(step.values).forEach(([key, value]) => {
      const line = `${key}: ${value}`;
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });

    doc.setFont('helvetica', 'bold');
    doc.text(`Result: ${step.result}`, margin + 5, yPos);
    yPos += 10;
  });

  // Key Risks
  doc.addPage();
  yPos = 20;
  addSectionHeader('Key Geopolitical Risks');

  result.keyRisks.forEach((risk, index) => {
    checkNewPage(50);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${risk.description}`, margin, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', margin + 5, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const detailLines = doc.splitTextToSize(risk.detail, contentWidth - 10);
    detailLines.forEach((line: string) => {
      checkNewPage(10);
      doc.text(line, margin + 10, yPos);
      yPos += 5;
    });
    yPos += 5;
  });

  // Recommendations
  yPos += 10;
  checkNewPage(40);
  addSectionHeader('Risk Management Recommendations');

  result.recommendations.forEach((rec) => {
    checkNewPage(25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const priorityColor = rec.priority === 'High' ? [220, 38, 38] : 
                         rec.priority === 'Medium' ? [234, 179, 8] : [34, 197, 94];
    doc.setTextColor(priorityColor[0], priorityColor[1], priorityColor[2]);
    doc.text(`[${rec.priority}]`, margin, yPos);
    doc.setTextColor(0, 0, 0);
    doc.text(` ${rec.category}`, margin + 20, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const actionLines = doc.splitTextToSize(rec.action, contentWidth - 5);
    actionLines.forEach((line: string) => {
      checkNewPage(10);
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });
    yPos += 3;
  });

  // Data Sources
  doc.addPage();
  yPos = 20;
  addSectionHeader('Data Sources & Methodology');

  result.dataSources.forEach((source, index) => {
    checkNewPage(20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${source.name}`, margin, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const descLines = doc.splitTextToSize(source.description, contentWidth - 5);
    descLines.forEach((line: string) => {
      checkNewPage(10);
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });

    if (source.url) {
      doc.setTextColor(0, 0, 255);
      doc.text(source.url, margin + 5, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;
    }
    yPos += 3;
  });

  // Footer
  yPos = pageHeight - 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Generated by CedarOwl CO-GRI Platform (Phase 3.0)', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });

  // Save PDF
  doc.save(`COGRI_Phase3_Assessment_${result.symbol}_${new Date().toISOString().split('T')[0]}.pdf`);
};
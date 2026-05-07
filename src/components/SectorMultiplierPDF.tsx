import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SectorData {
  sector: string;
  baseMultiplier: string;
  adjustment: string;
  finalMultiplier: string;
  riskLevel: string;
  rationale: string;
  keyRisks: string[];
  examples: string;
}

const SECTOR_DATA: SectorData[] = [
  {
    sector: 'Automotive',
    baseMultiplier: '1.00',
    adjustment: '+0.15',
    finalMultiplier: '1.15',
    riskLevel: 'Very High',
    rationale: 'Complex global supply chains spanning 50+ countries, heavy reliance on critical materials (lithium, cobalt, rare earths), vulnerable to trade disputes and tariffs, affected by sanctions on technology transfers, subject to country-specific emission regulations.',
    keyRisks: [
      'Supply chain disruptions (semiconductor shortages)',
      'Trade barriers and tariffs (US-China trade war)',
      'Technology transfer restrictions (EV battery tech)',
      'Regional emission standards (EU Green Deal)'
    ],
    examples: 'Tesla (TSLA), Toyota, Volkswagen, General Motors'
  },
  {
    sector: 'Energy',
    baseMultiplier: '1.00',
    adjustment: '+0.12',
    finalMultiplier: '1.12',
    riskLevel: 'High',
    rationale: 'Direct exposure to geopolitical conflicts (Middle East, Russia-Ukraine), subject to international sanctions (OFAC, EU), vulnerable to resource nationalism, affected by pipeline politics and transit routes, exposed to OPEC+ production decisions.',
    keyRisks: [
      'Sanctions on oil/gas exports (Russia, Iran, Venezuela)',
      'Conflict in resource-rich regions (Middle East)',
      'Nationalization of energy assets',
      'Pipeline and LNG infrastructure disputes'
    ],
    examples: 'Exxon Mobil (XOM), Chevron, BP, Shell'
  },
  {
    sector: 'Technology',
    baseMultiplier: '1.00',
    adjustment: '+0.10',
    finalMultiplier: '1.10',
    riskLevel: 'High',
    rationale: 'High exposure to US-China tech decoupling, subject to export controls on advanced chips, vulnerable to data sovereignty regulations, affected by cybersecurity threats, dependent on global semiconductor supply chains.',
    keyRisks: [
      'Export controls (CHIPS Act, Entity List)',
      'Data localization requirements (GDPR, China Cybersecurity Law)',
      'Technology transfer restrictions',
      'Intellectual property disputes'
    ],
    examples: 'Apple (AAPL), Microsoft (MSFT), NVIDIA (NVDA), Google (GOOGL)'
  },
  {
    sector: 'Basic Materials',
    baseMultiplier: '1.00',
    adjustment: '+0.09',
    finalMultiplier: '1.09',
    riskLevel: 'Elevated',
    rationale: 'Exposed to resource nationalism, vulnerable to trade restrictions on critical minerals, affected by environmental regulations, subject to export bans and quotas.',
    keyRisks: [
      'Critical mineral export restrictions (China rare earths)',
      'Resource nationalism (lithium in Latin America)',
      'Environmental compliance costs',
      'Trade disputes on steel and aluminum'
    ],
    examples: 'BHP, Rio Tinto, Freeport-McMoRan, Alcoa'
  },
  {
    sector: 'Healthcare',
    baseMultiplier: '1.00',
    adjustment: '+0.08',
    finalMultiplier: '1.08',
    riskLevel: 'Elevated',
    rationale: 'Subject to drug pricing regulations, affected by intellectual property disputes, vulnerable to supply chain disruptions (API sourcing), exposed to pandemic-related trade restrictions.',
    keyRisks: [
      'Pharmaceutical patent disputes',
      'Active Pharmaceutical Ingredient (API) supply chain concentration',
      'Country-specific pricing controls',
      'Vaccine nationalism and export bans'
    ],
    examples: 'Johnson & Johnson (JNJ), Pfizer (PFE), UnitedHealth (UNH)'
  },
  {
    sector: 'Industrials',
    baseMultiplier: '1.00',
    adjustment: '+0.07',
    finalMultiplier: '1.07',
    riskLevel: 'Moderate-High',
    rationale: 'Moderate exposure to global trade flows, affected by infrastructure spending policies, subject to tariffs on manufactured goods, vulnerable to supply chain disruptions.',
    keyRisks: [
      'Tariffs on industrial equipment',
      'Infrastructure policy changes',
      'Supply chain concentration risks',
      'Trade war impacts on machinery exports'
    ],
    examples: 'Caterpillar (CAT), 3M (MMM), Honeywell (HON), Boeing (BA)'
  },
  {
    sector: 'Consumer Cyclical',
    baseMultiplier: '1.00',
    adjustment: '+0.06',
    finalMultiplier: '1.06',
    riskLevel: 'Moderate',
    rationale: 'Moderate sensitivity to trade policies, affected by consumer confidence in geopolitical tensions, subject to tariffs on consumer goods, vulnerable to supply chain disruptions.',
    keyRisks: [
      'Tariffs on imported consumer goods',
      'Supply chain delays (shipping, logistics)',
      'Consumer sentiment during conflicts',
      'Currency fluctuations affecting purchasing power'
    ],
    examples: 'Amazon (AMZN), Nike (NKE), Starbucks (SBUX), Home Depot (HD)'
  },
  {
    sector: 'Financial Services',
    baseMultiplier: '1.00',
    adjustment: '+0.05',
    finalMultiplier: '1.05',
    riskLevel: 'Moderate',
    rationale: 'Exposed to sanctions compliance requirements, affected by cross-border payment restrictions, subject to capital controls, vulnerable to sovereign debt crises.',
    keyRisks: [
      'SWIFT exclusions and payment sanctions',
      'Capital controls and currency restrictions',
      'Sovereign debt defaults',
      'Regulatory fragmentation across jurisdictions'
    ],
    examples: 'JPMorgan Chase (JPM), Bank of America (BAC), Visa (V), Mastercard (MA)'
  },
  {
    sector: 'Communication Services',
    baseMultiplier: '1.00',
    adjustment: '+0.05',
    finalMultiplier: '1.05',
    riskLevel: 'Moderate',
    rationale: 'Moderate exposure to content regulation, subject to data sovereignty laws, affected by internet censorship, vulnerable to platform bans and restrictions.',
    keyRisks: [
      'Content moderation regulations',
      'Data localization requirements',
      'Platform bans (TikTok, Facebook in certain countries)',
      'Telecommunications infrastructure restrictions'
    ],
    examples: 'Meta (META), Netflix (NFLX), Comcast (CMCSA), AT&T (T)'
  },
  {
    sector: 'Consumer Defensive',
    baseMultiplier: '1.00',
    adjustment: '+0.04',
    finalMultiplier: '1.04',
    riskLevel: 'Low-Moderate',
    rationale: 'Lower sensitivity due to essential goods nature, some exposure to agricultural trade policies, moderate impact from food security concerns, limited exposure to discretionary spending cuts.',
    keyRisks: [
      'Agricultural trade restrictions',
      'Food security policies (export bans)',
      'Currency fluctuations affecting commodity prices',
      'Supply chain disruptions for staple goods'
    ],
    examples: 'Procter & Gamble (PG), Coca-Cola (KO), Walmart (WMT), Costco (COST)'
  },
  {
    sector: 'Utilities',
    baseMultiplier: '1.00',
    adjustment: '+0.03',
    finalMultiplier: '1.03',
    riskLevel: 'Low',
    rationale: 'Low sensitivity due to domestic focus, some exposure to energy import dependencies, affected by climate policy changes, subject to regulatory stability.',
    keyRisks: [
      'Natural gas import dependencies (Europe)',
      'Climate policy transitions (coal phase-out)',
      'Regulatory changes in energy markets',
      'Cross-border electricity grid vulnerabilities'
    ],
    examples: 'NextEra Energy (NEE), Duke Energy (DUK), Southern Company (SO)'
  },
  {
    sector: 'Real Estate',
    baseMultiplier: '1.00',
    adjustment: '+0.02',
    finalMultiplier: '1.02',
    riskLevel: 'Low',
    rationale: 'Lowest sensitivity due to local market focus, minimal direct geopolitical exposure, some impact from foreign investment restrictions, affected by interest rate changes during crises.',
    keyRisks: [
      'Foreign investment restrictions (China, Australia)',
      'Capital flight during geopolitical tensions',
      'Interest rate volatility',
      'Sanctions on property transactions'
    ],
    examples: 'American Tower (AMT), Prologis (PLD), Simon Property Group (SPG)'
  },
  {
    sector: 'General (Default)',
    baseMultiplier: '1.00',
    adjustment: '+0.00',
    finalMultiplier: '1.00',
    riskLevel: 'Baseline',
    rationale: 'Baseline multiplier for unclassified or diversified companies. No sector-specific adjustment. Represents average geopolitical sensitivity.',
    keyRisks: [
      'Used for highly diversified operations across multiple sectors',
      'Newly listed companies without clear sector classification',
      'Holding companies with mixed sector exposure'
    ],
    examples: 'Berkshire Hathaway, diversified conglomerates'
  }
];

export function SectorMultiplierPDF() {
  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Title Page
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CO-GRI Sector Multiplier', 105, yPos, { align: 'center' });
    yPos += 10;
    doc.text('Reference Guide', 105, yPos, { align: 'center' });
    yPos += 20;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Complete Documentation of Sector-Specific', 105, yPos, { align: 'center' });
    yPos += 7;
    doc.text('Geopolitical Risk Sensitivity Adjustments', 105, yPos, { align: 'center' });
    yPos += 20;

    // Date and version
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
    yPos += 7;
    doc.text('Version 1.0', 105, yPos, { align: 'center' });
    yPos += 30;

    // Overview box
    doc.setFillColor(13, 95, 95);
    doc.rect(20, yPos, 170, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Mathematical Framework', 25, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('M_sector(i) = M₀ + β_sector(i)', 25, yPos + 18);
    doc.text('Where:', 25, yPos + 26);
    doc.text('• M₀ = Base multiplier (1.00 for all sectors)', 30, yPos + 32);
    doc.text('• β_sector = Sector-specific sensitivity adjustment', 30, yPos + 37);
    doc.setTextColor(0, 0, 0);

    // New page for summary table
    doc.addPage();
    yPos = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Sector Multiplier Summary Table', 20, yPos);
    yPos += 10;

    // Summary table
    const summaryData = SECTOR_DATA.map(s => [
      s.sector,
      s.baseMultiplier,
      s.adjustment,
      s.finalMultiplier,
      s.riskLevel
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Sector', 'M₀', 'β_sector', 'M_sector', 'Risk Level']],
      body: summaryData,
      theme: 'striped',
      headStyles: { 
        fillColor: [13, 95, 95],
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 35, halign: 'center' }
      }
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

    // Key insights box
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(240, 248, 255);
    doc.rect(20, yPos, 170, 35, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Insights:', 25, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('• All sectors start with M₀ = 1.00 (neutral baseline)', 25, yPos + 15);
    doc.text('• β_sector ranges from 0.00 to 0.15 (Automotive has highest adjustment)', 25, yPos + 21);
    doc.text('• Final multipliers range from 1.00 to 1.15 (maximum 15% amplification)', 25, yPos + 27);
    doc.text('• Calibrated using historical geopolitical event analysis (2010-2024)', 25, yPos + 33);

    // Detailed sector analysis
    SECTOR_DATA.forEach((sector, idx) => {
      doc.addPage();
      yPos = 20;

      // Sector header
      doc.setFillColor(13, 95, 95);
      doc.rect(20, yPos, 170, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${sector.sector}`, 25, yPos + 8);
      doc.setTextColor(0, 0, 0);
      yPos += 20;

      // Calculation box
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPos, 170, 25, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Calculation:', 25, yPos + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`M_sector = M₀ + β_sector`, 25, yPos + 14);
      doc.text(`M_sector = ${sector.baseMultiplier} + ${sector.adjustment} = ${sector.finalMultiplier}`, 25, yPos + 20);
      yPos += 32;

      // Risk level
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Level:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(sector.riskLevel, 50, yPos);
      yPos += 10;

      // Rationale
      doc.setFont('helvetica', 'bold');
      doc.text('Rationale:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const rationaleLines = doc.splitTextToSize(sector.rationale, 170);
      doc.text(rationaleLines, 20, yPos);
      yPos += rationaleLines.length * 5 + 8;

      // Key risks
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Risk Factors:', 20, yPos);
      yPos += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      sector.keyRisks.forEach(risk => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const riskLines = doc.splitTextToSize(`• ${risk}`, 165);
        doc.text(riskLines, 25, yPos);
        yPos += riskLines.length * 5;
      });
      yPos += 5;

      // Example companies
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Example Companies:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const exampleLines = doc.splitTextToSize(sector.examples, 170);
      doc.text(exampleLines, 20, yPos);
    });

    // Application example page
    doc.addPage();
    yPos = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Practical Application Example', 20, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.text('Tesla Inc. (TSLA) - Automotive Sector', 20, yPos);
    yPos += 12;

    // Step 3 box
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPos, 170, 25, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Step 3: Sector Multiplier', 25, yPos + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('M₀ = 1.00', 25, yPos + 14);
    doc.text('β_sector = 0.15', 25, yPos + 19);
    doc.text('M_sector = 1.00 + 0.15 = 1.15', 80, yPos + 14);
    yPos += 35;

    // Step 4 calculation
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Step 4: Raw Score Calculation', 20, yPos);
    yPos += 10;

    const exampleData = [
      ['United States', '0.46', '35.2', '1.15', '18.6'],
      ['China', '0.22', '58.7', '1.15', '14.9'],
      ['Europe', '0.24', '28.4', '1.15', '7.8'],
      ['Rest of World', '0.08', '42.1', '1.15', '3.9']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Country', 'W_i,c', 'S_c', 'M_sector', 'Contribution']],
      body: exampleData,
      theme: 'striped',
      headStyles: { 
        fillColor: [13, 95, 95],
        fontSize: 9
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' }
      }
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Raw_Score = 18.6 + 14.9 + 7.8 + 3.9 = 45.2', 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const impactText = doc.splitTextToSize(
      'The sector multiplier of 1.15 amplifies Tesla\'s geopolitical risk by 15% compared to a baseline company, reflecting the automotive sector\'s high sensitivity to supply chain disruptions, trade policies, and technology transfer restrictions.',
      170
    );
    doc.text(impactText, 20, yPos);

    // Calibration methodology page
    doc.addPage();
    yPos = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Calibration Methodology', 20, yPos);
    yPos += 15;

    doc.setFontSize(11);
    doc.text('Historical Event Analysis', 20, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const methodologyText = [
      '1. Event Selection: Major geopolitical shocks from 2010-2024',
      '   • US-China trade war (2018-2020)',
      '   • Russia-Ukraine conflict (2022-present)',
      '   • COVID-19 pandemic supply chain disruptions (2020-2022)',
      '   • Brexit (2016-2020)',
      '   • Middle East conflicts (2010-2024)',
      '',
      '2. Impact Measurement: Stock price volatility and earnings impact',
      '   • Measure abnormal returns during event windows',
      '   • Calculate sector-specific beta coefficients',
      '   • Analyze earnings call mentions of geopolitical risks',
      '',
      '3. Regression Analysis: Sector sensitivity to geopolitical risk indices',
      '   • Dependent variable: Stock returns or earnings changes',
      '   • Independent variables: Geopolitical risk indices (GPR, GPRD)',
      '   • Control variables: Market returns, sector fundamentals',
      '',
      '4. Multiplier Derivation: Convert regression coefficients to multipliers',
      '   • Normalize coefficients to range [1.00, 1.20]',
      '   • Round to nearest 0.01 for practical application',
      '   • Validate against expert judgment and industry reports'
    ];

    methodologyText.forEach(line => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 20, yPos);
      yPos += line === '' ? 3 : 5;
    });

    // References page
    doc.addPage();
    yPos = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('References', 20, yPos);
    yPos += 15;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const references = [
      '• BlackRock Geopolitical Risk Dashboard (2024)',
      '• Caldara, D., & Iacoviello, M. (2022). "Measuring Geopolitical Risk." American Economic Review.',
      '• S&P Global Market Intelligence - Sector Risk Analysis (2024)',
      '• World Economic Forum - Global Risks Report (2024)',
      '• McKinsey Global Institute - Supply Chain Risk Analysis (2023)',
      '• IMF Country Reports - Economic Stability and Currency Risk (2024)',
      '• World Bank Worldwide Governance Indicators (2024)',
      '• ACLED - Armed Conflict Location & Event Data Project (2024)',
      '• GDELT Project - Global Database of Events, Language, and Tone (2024)'
    ];

    references.forEach(ref => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const refLines = doc.splitTextToSize(ref, 170);
      doc.text(refLines, 20, yPos);
      yPos += refLines.length * 5 + 3;
    });

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('CO-GRI Sector Multiplier Reference Guide', 105, 285, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    // Save the PDF
    const fileName = `CO-GRI_Sector_Multiplier_Reference_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <Button
      onClick={generatePDF}
      className="bg-[#0d5f5f] hover:bg-[#0a4a4a] text-white"
    >
      <Download className="mr-2 h-4 w-4" />
      Download Sector Multiplier Reference (PDF)
    </Button>
  );
}
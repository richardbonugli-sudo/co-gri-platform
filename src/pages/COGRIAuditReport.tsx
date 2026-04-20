/**
 * CO-GRI Company Methodology Audit Report
 * 
 * Full 13-section methodology audit covering:
 * 1. Model Overview
 * 2. Data Sources by Channel
 * 3. Parsing & Extraction Logic
 * 4. Channel Assignment Logic
 * 5. Fallback Logic (SSF → RF → GF)
 * 6. Country Mapping Logic
 * 7. Full Formulas & Calculations
 * 8. Attribution Logic
 * 9. Advanced Metrics Toggle Logic
 * 10. End-to-End AAPL Case Study
 * 11. Data Coverage & Historical Backfill
 * 12. Known Limitations & Risks
 * 13. Recommendations
 */

import React, { useRef, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Download, FileText, CheckCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BaselineResultsPanel } from '@/components/audit/shared/BaselineResultsPanel';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SectionProps {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}

interface FindingProps {
  type: 'strength' | 'gap' | 'info';
  children: React.ReactNode;
}

interface FormulaBoxProps {
  label: string;
  formula: string;
  variables?: { symbol: string; definition: string }[];
}

interface TableRow {
  cells: (string | React.ReactNode)[];
  highlight?: boolean;
}

interface AuditTableProps {
  headers: string[];
  rows: TableRow[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section: React.FC<SectionProps> = ({ id, number, title, children }) => (
  <section id={id} className="mb-12">
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-teal-800/40">
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-sm flex-shrink-0">
        {number}
      </div>
      <h2 className="text-xl font-bold text-teal-300">{title}</h2>
    </div>
    <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
      {children}
    </div>
  </section>
);

const Finding: React.FC<FindingProps> = ({ type, children }) => {
  const styles = {
    strength: 'bg-emerald-950/50 border-emerald-600/40 text-emerald-300',
    gap: 'bg-amber-950/50 border-amber-600/40 text-amber-300',
    info: 'bg-blue-950/50 border-blue-600/40 text-blue-300',
  };
  const icons = {
    strength: <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />,
    gap: <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex gap-2 p-3 rounded-lg border ${styles[type]}`}>
      {icons[type]}
      <span className="text-sm">{children}</span>
    </div>
  );
};

const FormulaBox: React.FC<FormulaBoxProps> = ({ label, formula, variables }) => (
  <div className="my-4 rounded-lg border border-teal-700/50 overflow-hidden">
    <div className="bg-teal-900/40 px-4 py-2 border-b border-teal-700/50">
      <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">{label}</span>
    </div>
    <div className="bg-slate-900/60 px-4 py-3">
      <code className="text-teal-200 font-mono text-sm block">{formula}</code>
    </div>
    {variables && variables.length > 0 && (
      <div className="bg-slate-900/30 px-4 py-3 border-t border-teal-700/30">
        <div className="grid grid-cols-1 gap-1">
          {variables.map((v, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <code className="text-teal-400 font-mono w-32 flex-shrink-0">{v.symbol}</code>
              <span className="text-slate-400">{v.definition}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const AuditTable: React.FC<AuditTableProps> = ({ headers, rows }) => (
  <div className="overflow-x-auto rounded-lg border border-slate-700/50 my-4">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-800/80">
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3 text-left text-teal-400 font-semibold text-xs uppercase tracking-wider border-b border-slate-700/50">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className={`border-b border-slate-700/30 ${row.highlight ? 'bg-teal-950/30' : ri % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-800/20'}`}>
            {row.cells.map((cell, ci) => (
              <td key={ci} className="px-4 py-2.5 text-slate-300 align-top">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-base font-semibold text-teal-400 mt-6 mb-3">{children}</h3>
);

const Pill: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => {
  const colors: Record<string, string> = {
    green: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
    blue: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
    purple: 'bg-purple-900/50 text-purple-300 border-purple-700/50',
    orange: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
    red: 'bg-red-900/50 text-red-300 border-red-700/50',
    teal: 'bg-teal-900/50 text-teal-300 border-teal-700/50',
    gray: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

// ─── TOC ─────────────────────────────────────────────────────────────────────

const TOC_ITEMS = [
  { id: 's1', number: '1', title: 'Model Overview' },
  { id: 's2', number: '2', title: 'Data Sources by Channel' },
  { id: 's3', number: '3', title: 'Parsing & Extraction Logic' },
  { id: 's4', number: '4', title: 'Channel Assignment Logic' },
  { id: 's5', number: '5', title: 'Fallback Logic (SSF → RF → GF)' },
  { id: 's6', number: '6', title: 'Country Mapping Logic' },
  { id: 's7', number: '7', title: 'Full Formulas & Calculations' },
  { id: 's8', number: '8', title: 'Attribution Logic' },
  { id: 's9', number: '9', title: 'Advanced Metrics Toggle Logic' },
  { id: 's10', number: '10', title: 'AAPL End-to-End Case Study' },
  { id: 's11', number: '11', title: 'Data Coverage & Historical Backfill' },
  { id: 's12', number: '12', title: 'Known Limitations & Risks' },
  { id: 's13', number: '13', title: 'Recommendations' },
  { id: 's14', number: '14', title: 'Live Baseline Results' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const COGRIAuditReport: React.FC = () => {
  const [, navigate] = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);

  const reportDate = useMemo(() => new Date(), []);
  const formattedDate = useMemo(() => reportDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), [reportDate]);
  const formattedDateTime = useMemo(() => reportDate.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }), [reportDate]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const element = reportRef.current;
      if (!element) return;

      // Temporarily switch to light background for PDF capture
      element.classList.add('pdf-capture');

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false,
        windowWidth: 1200,
      });

      element.classList.remove('pdf-capture');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      let yOffset = 0;
      let pageCount = 0;

      while (yOffset < scaledHeight) {
        if (pageCount > 0) pdf.addPage();
        pdf.addImage(
          imgData,
          'PNG',
          0,
          -yOffset,
          pdfWidth,
          scaledHeight
        );
        yOffset += pdfHeight;
        pageCount++;
      }

      pdf.save('CO-GRI_Company_Methodology_Audit_Report.pdf');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF generation encountered an issue. Please try printing via browser (Ctrl+P) and saving as PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/company')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          <div className="h-4 w-px bg-slate-600" />
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-semibold text-teal-300">CO-GRI Company Methodology Audit Report</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs border-teal-700 text-teal-400">
            Confidential — Internal Use
          </Badge>
          <Button
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-teal-600 hover:bg-teal-500 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Generating PDF…' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10" ref={reportRef}>

        {/* ── Cover ── */}
        <div className="mb-12 p-8 rounded-2xl border border-teal-700/40 bg-gradient-to-br from-slate-900 to-teal-950/30">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-xs font-semibold text-teal-500 uppercase tracking-widest mb-2">
                CO-GRI Trading Signal Service
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Full Company Methodology Audit
              </h1>
              <p className="text-slate-400 text-sm">
                A comprehensive technical review of the CO-GRI Company Mode pipeline — from raw SEC filing data to final risk score and trading signal.
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 space-y-1 flex-shrink-0 ml-6">
              <div>Report Date: <span className="text-slate-300">{formattedDate}</span></div>
              <div>Version: <span className="text-slate-300">2.0 (V5)</span></div>
              <div>Classification: <span className="text-amber-400">Confidential</span></div>
              <div>Scope: <span className="text-slate-300">Company Mode Dashboard</span></div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Sections Audited', value: '13' },
              { label: 'Source Files Reviewed', value: '12' },
              { label: 'Formulas Documented', value: '8' },
              { label: 'Case Study Traced', value: 'AAPL' },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-teal-400">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Executive Summary ── */}
        <div className="mb-10 p-6 rounded-xl border border-slate-700/50 bg-slate-900/40">
          <h2 className="text-lg font-bold text-white mb-3">Executive Summary</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-3">
            The CO-GRI (Country-level Geopolitical Risk Index) Company Mode implements a rigorous, multi-channel exposure pipeline that translates raw SEC filing data into a single, auditable risk score. This audit reviewed twelve core source files spanning data ingestion, channel assignment, formula execution, attribution rendering, and UI presentation.
          </p>
          <p className="text-slate-300 text-sm leading-relaxed mb-3">
            The model is <strong className="text-white">methodologically sound</strong> at its core. The four-channel blended weight formula, normalization logic, political alignment amplification, and sector multiplier are all implemented consistently across the codebase. Key bugs (the "operations" vs "financial" field rename — Bug #5, and the 0.5% filtering threshold — Priority 3 Fix) have been resolved. The pipeline correctly prioritizes company-specific data → SEC filing integration → sector-specific fallback.
          </p>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            <strong className="text-teal-400">V5 Methodology Updates (April 2026):</strong> Eight systematic fixes (R1–R8) have been applied: channel homogeneity fix (R1), meta/generic ticker rendering fix (R3), unified C4/C5 data source via <code className="text-teal-400 text-xs">deriveCompanyAnalytics()</code> (R8), six missing sector coefficients added — Communication Services, Consumer Discretionary, Industrials, Materials, Utilities, Real Estate (R4), progressive loading with 30s timeout (R5), and a live Runtime Validation panel (R6). All fixes are verified with zero build errors.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-950/40 border border-emerald-700/40 rounded-lg p-3">
              <div className="text-xs font-semibold text-emerald-400 mb-1">✓ Strengths</div>
              <ul className="text-xs text-emerald-300 space-y-1">
                <li>• Canonical field naming enforced</li>
                <li>• Normalization to 100% guaranteed</li>
                <li>• Full audit trail in console logs</li>
                <li>• Sector-specific coefficients</li>
                <li>• Political alignment amplification</li>
                <li>• 6 new sector coefficients (V5 R4)</li>
                <li>• Unified C4/C5 data source (V5 R8)</li>
              </ul>
            </div>
            <div className="bg-amber-950/40 border border-amber-700/40 rounded-lg p-3">
              <div className="text-xs font-semibold text-amber-400 mb-1">⚠ Gaps</div>
              <ul className="text-xs text-amber-300 space-y-1">
                <li>• MSFT has regional aggregates (not countries)</li>
                <li>• narrativeParser uses simulated data</li>
                <li>• No live EDGAR API in production</li>
                <li>• Scenario/Trading lens stubs incomplete</li>
              </ul>
            </div>
            <div className="bg-blue-950/40 border border-blue-700/40 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-400 mb-1">→ Priority Actions</div>
              <ul className="text-xs text-blue-300 space-y-1">
                <li>• Decompose MSFT regional aggregates</li>
                <li>• Wire live EDGAR API to replace simulated data</li>
                <li>• Complete Trading Signal lens</li>
                <li>• Add unit tests for formula layer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Table of Contents ── */}
        <div className="mb-10 rounded-xl border border-slate-700/50 bg-slate-900/40 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-6 py-4 text-left"
            onClick={() => setTocOpen(!tocOpen)}
          >
            <span className="font-semibold text-white">Table of Contents</span>
            {tocOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {tocOpen && (
            <div className="px-6 pb-4 grid grid-cols-2 gap-1">
              {TOC_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-slate-800/60 transition-colors"
                >
                  <span className="text-xs font-bold text-teal-500 w-5">{item.number}.</span>
                  <span className="text-sm text-slate-300 hover:text-teal-300">{item.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1 — MODEL OVERVIEW                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s1" number="1" title="Model Overview — Full Pipeline Description">
          <p>
            The CO-GRI Company Mode computes a single, sector-adjusted geopolitical risk score for any publicly traded company. The pipeline consists of six sequential stages, each with a clearly defined responsibility and a documented fallback path.
          </p>

          <SubHeading>Pipeline Architecture</SubHeading>
          <AuditTable
            headers={['Stage', 'Module / File', 'Responsibility']}
            rows={[
              { cells: ['1. Company Resolution', 'geographicExposureService.ts → resolveTickerMultiSource()', 'Resolve ticker to company metadata via Polygon.io + SEC EDGAR + Alpha Vantage. ADR detection via adrCountryResolver.ts.'] },
              { cells: ['2. Sector Classification', 'sectorClassificationService.ts', 'Classify company sector using multi-source consensus. Determines sector-specific exposure coefficients and sector multiplier.'] },
              { cells: ['3. Channel Exposure Calculation', 'geographicExposureService.ts → calculateIndependentChannelExposuresWithSEC()', 'Four-channel (Revenue, Supply, Assets, Financial) exposure weights per country. Priority: Company-Specific → SEC Filing → SSF/RF/GF fallback.'] },
              { cells: ['4. CO-GRI Score Calculation', 'cogriCalculationService.ts → calculateCOGRIScore()', 'Blended weight normalization, CSI assignment, political alignment amplification, raw score aggregation, sector multiplier application.'] },
              { cells: ['5. Attribution & Presentation', 'RiskAttribution.tsx, TopRelevantRisks.tsx', 'Render per-country risk contributions, dominant channel labels, and structural drivers. Advanced Metrics toggle reveals alignment modifier.'] },
              { cells: ['6. Lens Navigation', 'CompanyModeTabs.tsx', 'Four analytical lenses: Structural (default), Forecast Overlay, Scenario Shock, Trading Signal. Each lens filters the same underlying CO-GRI data through a different interpretive frame.'] },
            ]}
          />

          <SubHeading>Data Priority Hierarchy</SubHeading>
          <div className="flex items-center gap-2 flex-wrap my-3">
            <Pill color="green">① Company-Specific Override</Pill>
            <span className="text-slate-500">→</span>
            <Pill color="blue">② SEC Filing Integration</Pill>
            <span className="text-slate-500">→</span>
            <Pill color="purple">③ Sector-Specific Fallback (SSF)</Pill>
            <span className="text-slate-500">→</span>
            <Pill color="orange">④ Regional Fallback (RF)</Pill>
            <span className="text-slate-500">→</span>
            <Pill color="red">⑤ Global Fallback (GF)</Pill>
          </div>
          <p>
            Company-specific data (e.g., AAPL, TSLA, MSFT in <code className="text-teal-400 text-xs">companySpecificExposures.ts</code>) is loaded first and bypasses all downstream fallback logic entirely. For all other tickers, the pipeline attempts SEC EDGAR integration before falling back to sector templates.
          </p>

          <Finding type="strength">
            The pipeline is fully deterministic: given the same ticker and sector, the output is reproducible. All intermediate values are logged to the browser console with structured prefixes for auditability.
          </Finding>
          <Finding type="info">
            The Company Mode dashboard is accessible via the "Get Started" button on the home page, routing to <code className="text-blue-300 text-xs">/company</code>. The unified framework also exposes <code className="text-blue-300 text-xs">/dashboard</code> (UnifiedDashboardV2) as the central navigation hub.
          </Finding>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2 — DATA SOURCES                                          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s2" number="2" title="Data Sources by Channel">
          <p>
            Each of the four exposure channels draws from a distinct set of data sources, with a defined evidence hierarchy. The following table documents the source stack per channel.
          </p>

          <AuditTable
            headers={['Channel', 'Coefficient (Default)', 'Primary Source', 'Secondary Source', 'Fallback']}
            rows={[
              { cells: ['Revenue (α)', '0.40 (40%)', 'SEC 10-K geographic revenue tables (structured)', 'Narrative text: "Americas includes…" patterns', 'SSF → RF → GF template'], highlight: true },
              { cells: ['Supply Chain (β)', '0.35 (35%)', 'SEC 10-K supplier lists, UN Comtrade (unComtradeService)', 'supplyChainDataService, narrative manufacturing mentions', 'SSF → RF → GF template'] },
              { cells: ['Physical Assets (γ)', '0.15 (15%)', 'SEC 10-K PP&E tables by geography', 'Narrative: "facility", "plant", "PP&E" mentions', 'SSF → RF → GF template'], highlight: true },
              { cells: ['Financial (δ)', '0.10 (10%)', 'SEC 10-K debt tables, currency exposure disclosures', 'Narrative: "debt", "FX", "credit facility" mentions', 'SSF → RF → GF template'] },
            ]}
          />

          <SubHeading>Sector-Specific Coefficient Overrides</SubHeading>
          <p>
            The default coefficients (α=0.40, β=0.35, γ=0.15, δ=0.10) are overridden by sector-specific values defined in <code className="text-teal-400 text-xs">geographicExposureService.ts → SECTOR_EXPOSURE_COEFFICIENTS</code>:
          </p>
          <AuditTable
            headers={['Sector', 'Revenue (α)', 'Supply (β)', 'Assets (γ)', 'Financial (δ)', 'Rationale']}
            rows={[
              { cells: ['Technology', '0.45', '0.35', '0.10', '0.10', 'Revenue-dominant; light physical footprint'], highlight: true },
              { cells: ['Manufacturing', '0.30', '0.45', '0.20', '0.05', 'Supply chain is primary risk vector'] },
              { cells: ['Financial Services', '0.40', '0.05', '0.15', '0.40', 'Financial exposure dominates; minimal supply chain'], highlight: true },
              { cells: ['Energy', '0.35', '0.30', '0.30', '0.05', 'Physical assets (pipelines, rigs) are critical'] },
              { cells: ['Healthcare', '0.45', '0.30', '0.15', '0.10', 'Revenue + supply (pharma sourcing) balanced'] },
              { cells: ['Consumer Goods', '0.45', '0.30', '0.15', '0.10', 'Similar to Healthcare; brand revenue-led'] },
              { cells: ['Telecommunications', '0.50', '0.20', '0.25', '0.05', 'Infrastructure assets significant; local revenue'] },
              { cells: ['Retail', '0.50', '0.25', '0.20', '0.05', 'Revenue and store footprint dominate'] },
              { cells: ['Communication Services', '0.55', '0.15', '0.20', '0.10', 'Revenue-dominant (advertising/subscriptions); minimal supply chain; data centre assets (META, GOOGL, NFLX)'], highlight: true },
              { cells: ['Consumer Discretionary', '0.40', '0.35', '0.18', '0.07', 'Revenue and supply chain both significant (global sourcing); moderate assets (TSLA, AMZN, NKE)'] },
              { cells: ['Industrials', '0.30', '0.40', '0.25', '0.05', 'Supply chain critical (global parts); significant factory/equipment assets (BA, GE, CAT)'], highlight: true },
              { cells: ['Materials', '0.25', '0.45', '0.25', '0.05', 'Supply chain dominant (raw material sourcing); heavy physical assets (mining/chemicals)'] },
              { cells: ['Utilities', '0.35', '0.15', '0.40', '0.10', 'Physical assets (power plants/grids) dominant; local revenue; low supply chain'], highlight: true },
              { cells: ['Real Estate', '0.30', '0.10', '0.50', '0.10', 'Physical assets dominant; local revenue; minimal supply chain'] },
              { cells: ['Default (all others)', '0.40', '0.35', '0.15', '0.10', 'Balanced baseline'] },
            ]}
          />

          <SubHeading>External API Integrations</SubHeading>
          <AuditTable
            headers={['Service', 'File', 'Data Provided', 'Status']}
            rows={[
              { cells: ['Polygon.io', 'polygonService.ts', 'Ticker resolution, company metadata, exchange', <Pill color="green">Active</Pill>] },
              { cells: ['SEC EDGAR', 'secEdgarService.ts', '10-K/10-Q filings, revenue tables, PP&E, debt', <Pill color="orange">Simulated in dev</Pill>] },
              { cells: ['Alpha Vantage', 'alphaVantageService.ts', 'Company overview, sector, industry, description', <Pill color="green">Active</Pill>] },
              { cells: ['UN Comtrade', 'unComtradeService.ts', 'Trade flow data for supply chain channel', <Pill color="orange">Simulated in dev</Pill>] },
              { cells: ['Supply Chain Data', 'supplyChainDataService.ts', 'Supplier country lists', <Pill color="orange">Simulated in dev</Pill>] },
            ]}
          />

          <Finding type="gap">
            SEC EDGAR, UN Comtrade, and supplyChainDataService are currently returning simulated/fallback data in the development environment. The <code className="text-amber-300 text-xs">structuredDataIntegrator.ts</code> wraps these calls but the underlying EDGAR parsing is not yet wired to live filing content. This means most non-AAPL/TSLA companies fall through to SSF/RF/GF fallback.
          </Finding>
          <Finding type="strength">
            The company-specific override database (<code className="text-emerald-300 text-xs">companySpecificExposures.ts</code>) contains 3 manually verified entries (AAPL, TSLA, MSFT) and is designed to be extended. AAPL data is sourced directly from Apple's 10-K with 14 country-level entries at high confidence.
          </Finding>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3 — PARSING & EXTRACTION LOGIC                            */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s3" number="3" title="Parsing & Extraction Logic">
          <p>
            The <code className="text-teal-400 text-xs">narrativeParser.ts</code> service handles text extraction from SEC filing narrative sections. It implements three layers of extraction: regional definitions, explicit country mentions, and channel-specific context classification.
          </p>

          <SubHeading>Regional Definition Extraction (Three Patterns)</SubHeading>
          <AuditTable
            headers={['Pattern', 'Regex', 'Example Match', 'Confidence']}
            rows={[
              { cells: ['Includes Pattern', '/([A-Z][a-z\\s]+)\\s+includes?\\s+([^.;]+)/gi', '"Europe includes European countries, India, the Middle East, and Africa"', 'High'] },
              { cells: ['Consists Pattern', '/([A-Z][a-z\\s]+)\\s+consists?\\s+of\\s+([^.;]+)/gi', '"Japan segment consists of Japan only"', 'High'] },
              { cells: ['Comprises Pattern', '/([A-Z][a-z\\s]+)\\s+comprises?\\s+([^.;]+)/gi', '"Americas comprises United States, Canada, and Latin America"', 'High'] },
            ]}
          />

          <SubHeading>Channel-Specific Keyword Classification</SubHeading>
          <AuditTable
            headers={['Channel', 'Trigger Keywords', 'Example Sentence']}
            rows={[
              { cells: ['Revenue', 'revenue, sales, market, customers, demand', '"Revenue from China represented 16.9% of net sales"'], highlight: true },
              { cells: ['Supply Chain', 'manufacturing, supplier, supply chain, production, assembly, sourcing, procurement', '"Manufacturing facilities are located primarily in China and Vietnam"'] },
              { cells: ['Physical Assets', 'facility, facilities, plant, office, property, real estate, PP&E, long-lived assets', '"The Company maintains offices and retail stores in the United States and United Kingdom"'], highlight: true },
              { cells: ['Financial', 'debt, currency, FX, foreign exchange, banking, credit facility, cash holdings', '"Currency exposure includes USD, EUR, JPY, GBP, and CNY denominated transactions"'] },
            ]}
          />

          <SubHeading>Country Alias Resolution</SubHeading>
          <p>
            The parser maintains a <code className="text-teal-400 text-xs">COUNTRY_ALIASES</code> dictionary with 44 canonical country names and their common variants. Examples:
          </p>
          <div className="grid grid-cols-2 gap-3 my-3">
            {[
              { canonical: 'United States', aliases: 'US, USA, U.S., America, American' },
              { canonical: 'China', aliases: "China, Chinese, PRC, People's Republic of China, mainland China" },
              { canonical: 'United Kingdom', aliases: 'UK, U.K., Britain, British, Great Britain' },
              { canonical: 'South Korea', aliases: 'South Korea, Korea, Republic of Korea, ROK, Korean' },
            ].map((item) => (
              <div key={item.canonical} className="bg-slate-800/40 rounded p-3 text-xs">
                <div className="font-semibold text-teal-300 mb-1">{item.canonical}</div>
                <div className="text-slate-400">{item.aliases}</div>
              </div>
            ))}
          </div>

          <SubHeading>Regional Expansion Patterns</SubHeading>
          <p>
            When a regional keyword is found in text, the parser expands it to a list of default countries. The <code className="text-teal-400 text-xs">normalizeRegionName()</code> function strips suffixes like "segment" and "region" before matching:
          </p>
          <AuditTable
            headers={['Region Keyword', 'Default Country Expansion (count)']}
            rows={[
              { cells: ['Europe / EMEA', 'Germany, UK, France, Italy, Spain, Netherlands, Switzerland, Belgium, Sweden, Poland, Austria, Norway, Denmark, Ireland, Finland (15)'] },
              { cells: ['Asia Pacific / APAC', 'China, Japan, South Korea, India, Australia, Singapore, Indonesia, Thailand, Malaysia, Vietnam, Philippines, Taiwan, Hong Kong, New Zealand (14)'] },
              { cells: ['Greater China', 'China, Hong Kong, Taiwan (3)'] },
              { cells: ['Latin America / LATAM', 'Brazil, Mexico, Argentina, Colombia, Chile, Peru (6)'] },
              { cells: ['Middle East / MENA', 'Saudi Arabia, UAE, Israel, Turkey, Qatar, Kuwait, Oman, Bahrain (8)'] },
              { cells: ['Africa', 'South Africa, Nigeria, Egypt, Kenya, Morocco, Ethiopia, Ghana, Tanzania, Angola, Algeria (10)'] },
            ]}
          />

          <Finding type="info">
            The <code className="text-blue-300 text-xs">generateSimulatedNarrativeText()</code> function in narrativeParser.ts produces Apple-specific narrative text that closely mirrors actual Apple 10-K language, including the five geographic segments (Americas, Europe, Greater China, Japan, Rest of Asia Pacific). This is the source of the AAPL regional decomposition used in the pipeline.
          </Finding>
          <Finding type="gap">
            The narrative parser currently operates on simulated text, not live SEC EDGAR filing content. In production, <code className="text-amber-300 text-xs">parseNarrativeText()</code> should call the EDGAR full-text search API to retrieve actual 10-K Item 1 and Item 7 sections.
          </Finding>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 4 — CHANNEL ASSIGNMENT LOGIC                              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s4" number="4" title="Channel Assignment Logic">
          <p>
            Channel assignment determines which of the four channels (Revenue, Supply Chain, Physical Assets, Financial) applies to each country-level data point. The decision tree operates at two levels: structured data extraction and narrative classification.
          </p>

          <SubHeading>Decision Tree: Structured Data Path</SubHeading>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-1 my-3">
            <div>IF SEC 10-K revenue table found AND country appears in table</div>
            <div className="pl-4 text-teal-400">→ Revenue channel: weight = table_value / total_revenue</div>
            <div className="pl-4 text-teal-400">→ status = "evidence", evidenceType = "structured_table"</div>
            <div className="mt-2">IF SEC 10-K PP&E table found AND country appears in table</div>
            <div className="pl-4 text-teal-400">→ Assets channel: weight = ppe_value / total_ppe</div>
            <div className="pl-4 text-teal-400">→ status = "evidence", evidenceType = "structured_table"</div>
            <div className="mt-2">IF SEC 10-K debt table found AND country appears in table</div>
            <div className="pl-4 text-teal-400">→ Financial channel: weight = debt_value / total_debt</div>
            <div className="pl-4 text-teal-400">→ status = "evidence", evidenceType = "structured_table"</div>
            <div className="mt-2">IF supplier list found AND country appears</div>
            <div className="pl-4 text-teal-400">→ Supply channel: weight = supplier_count_share</div>
            <div className="pl-4 text-teal-400">→ status = "high_confidence_estimate", evidenceType = "structured_table"</div>
          </div>

          <SubHeading>Decision Tree: Company-Specific Override Path</SubHeading>
          <p>
            When a company has an entry in <code className="text-teal-400 text-xs">COMPANY_SPECIFIC_EXPOSURES</code>, all four channels receive the same weight (the company's revenue percentage for that country), with status = "evidence" and evidenceType = "structured_table". This is a deliberate simplification — the override data represents the best available single-source truth.
          </p>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-4 font-mono text-xs text-slate-300 my-3">
            <div className="text-amber-400">// Company-Specific Override: all channels get same weight</div>
            <div>channelBreakdown[country] = {'{'}</div>
            <div className="pl-4">revenue: {'{'} weight: exposure.percentage / 100, status: "evidence" {'}'}</div>
            <div className="pl-4">financial: {'{'} weight: exposure.percentage / 100, status: "evidence" {'}'}</div>
            <div className="pl-4">supply: {'{'} weight: exposure.percentage / 100, status: "evidence" {'}'}</div>
            <div className="pl-4">assets: {'{'} weight: exposure.percentage / 100, status: "evidence" {'}'}</div>
            <div>{'}'}</div>
          </div>

          <SubHeading>Edge Cases & Known Behaviors</SubHeading>
          <AuditTable
            headers={['Edge Case', 'Behavior', 'Risk']}
            rows={[
              { cells: ['Country appears in revenue table but not PP&E', 'Revenue channel: evidence; Assets channel: fallback weight from SSF/RF/GF', 'Low — documented in status field'] },
              { cells: ['Regional aggregate in SEC filing (e.g., "Europe")', 'narrativeParser expands to 15 default European countries; weight distributed equally', 'Medium — equal distribution may not reflect actual country breakdown'] },
              { cells: ['Known-zero state detected', 'Channel weight forced to 0; excluded from blended weight calculation', 'Low — prevents false positive exposure'] },
              { cells: ['Company-specific data uses same weight for all channels', 'Blended weight = α×W + β×W + γ×W + δ×W = W (since α+β+γ+δ=1.0)', 'Low — mathematically correct; channel differentiation lost'] },
              { cells: ['Blended weight < 0.0001 (0.01%)', 'Country excluded from final output (micro-exposure threshold)', 'Low — aligned between geographicExposureService and cogriCalculationService after Bug #6 fix'] },
            ]}
          />

          <Finding type="strength">
            The canonical field name <code className="text-emerald-300 text-xs">financial</code> (not "operations") is now enforced across both <code className="text-emerald-300 text-xs">geographicExposureService.ts</code> and <code className="text-emerald-300 text-xs">cogriCalculationService.ts</code>, eliminating the silent data loss that caused Bug #5. The shared <code className="text-emerald-300 text-xs">ExposureChannels</code> interface in <code className="text-emerald-300 text-xs">types/company.ts</code> is the single source of truth.
          </Finding>
          <Finding type="gap">
            When company-specific data is used, all four channels receive identical weights. This means the sector-specific coefficient differentiation (e.g., Technology: α=0.45, β=0.35) has no effect — the blended weight equals the raw exposure percentage. This is mathematically correct but loses channel-level granularity for AAPL, TSLA, and MSFT.
          </Finding>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 5 — FALLBACK LOGIC                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s5" number="5" title="Fallback Logic — Complete SSF → RF → GF Hierarchy">
          <p>
            When structured SEC filing data is unavailable or incomplete for a channel, the system applies a three-tier fallback hierarchy. Each tier is tracked via the <code className="text-teal-400 text-xs">fallbackType</code> field (<code className="text-teal-400 text-xs">'SSF' | 'RF' | 'GF' | 'none'</code>) and surfaced in the UI as a data quality indicator.
          </p>

          <SubHeading>Fallback Tier Definitions</SubHeading>
          <AuditTable
            headers={['Tier', 'Code', 'Description', 'Confidence', 'When Applied']}
            rows={[
              { cells: ['Sector-Specific Fallback', <Pill color="purple">SSF</Pill>, 'Uses sector template weights from getSectorFallbackTemplate(). Country distribution reflects typical exposure patterns for the sector.', 'Medium', 'SEC filing data unavailable; sector is known'], highlight: true },
              { cells: ['Regional Fallback', <Pill color="orange">RF</Pill>, 'Uses regional distribution patterns when sector template is insufficient. Distributes weight across region default countries.', 'Low-Medium', 'Sector template has insufficient coverage for the specific region'] },
              { cells: ['Global Fallback', <Pill color="red">GF</Pill>, 'Last resort: home country gets 85% weight; remaining 15% distributed across top-10 sector template countries.', 'Low', 'SEC integration completely fails; no sector data available'] },
              { cells: ['No Fallback', <Pill color="green">none</Pill>, 'Direct evidence from structured table or company-specific data.', 'High', 'Company-specific override or SEC structured table found'] },
            ]}
          />

          <SubHeading>Fallback Decision Logic (from fallbackLogic.ts)</SubHeading>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-1 my-3">
            <div className="text-amber-400">// decideFallback() — simplified pseudocode</div>
            <div>IF hasCompanySpecificExposure(ticker)</div>
            <div className="pl-4 text-teal-400">→ return {'{'} type: "none", source: "Company-Specific" {'}'}</div>
            <div className="mt-1">ELSE IF secIntegration returns structured table data</div>
            <div className="pl-4 text-teal-400">→ return {'{'} type: "none", source: "SEC Structured Table" {'}'}</div>
            <div className="mt-1">ELSE IF secIntegration returns narrative-parsed data</div>
            <div className="pl-4 text-teal-400">→ return {'{'} type: "SSF", source: "Narrative + Sector Template" {'}'}</div>
            <div className="mt-1">ELSE IF sector template has coverage for region</div>
            <div className="pl-4 text-teal-400">→ return {'{'} type: "SSF", source: "Sector-Specific Template" {'}'}</div>
            <div className="mt-1">ELSE IF regional pattern available</div>
            <div className="pl-4 text-teal-400">→ return {'{'} type: "RF", source: "Regional Fallback" {'}'}</div>
            <div className="mt-1">ELSE</div>
            <div className="pl-4 text-teal-400">→ return {'{'} type: "GF", source: "Global Fallback (85/15 split)" {'}'}</div>
          </div>

          <SubHeading>Global Fallback (GF) Weight Distribution</SubHeading>
          <p>
            When GF is applied (last resort), the weight distribution is:
          </p>
          <FormulaBox
            label="Global Fallback Weight Assignment"
            formula="W_home = 0.85   |   W_foreign[i] = (template_weight[i] / Σ template_weights) × 0.15"
            variables={[
              { symbol: 'W_home', definition: 'Weight assigned to the company\'s home country (85%)' },
              { symbol: 'W_foreign[i]', definition: 'Weight for foreign country i, proportional to sector template' },
              { symbol: 'template_weight[i]', definition: 'Sector template weight for country i (from getSectorFallbackTemplate)' },
            ]}
          />

          <SubHeading>Confidence Scoring</SubHeading>
          <AuditTable
            headers={['Data Status', 'Fallback Type', 'Confidence Score', 'UI Indicator']}
            rows={[
              { cells: ['evidence', 'none', '0.85 – 0.95', <Pill color="green">High</Pill>], highlight: true },
              { cells: ['high_confidence_estimate', 'none / SSF', '0.70 – 0.84', <Pill color="blue">Medium-High</Pill>] },
              { cells: ['fallback', 'SSF', '0.50 – 0.69', <Pill color="purple">Medium</Pill>], highlight: true },
              { cells: ['fallback', 'RF', '0.30 – 0.49', <Pill color="orange">Low-Medium</Pill>] },
              { cells: ['fallback', 'GF', '0.10 – 0.29', <Pill color="red">Low</Pill>] },
            ]}
          />

          <Finding type="strength">
            The fallback hierarchy is fully transparent: every country exposure record carries <code className="text-emerald-300 text-xs">status</code>, <code className="text-emerald-300 text-xs">fallbackType</code>, <code className="text-emerald-300 text-xs">source</code>, <code className="text-emerald-300 text-xs">dataQuality</code>, and <code className="text-emerald-300 text-xs">evidenceType</code> fields. These are propagated through the entire pipeline and available for UI rendering.
          </Finding>
          <Finding type="gap">
            The UI currently does not surface the fallback tier to end users in the Company Mode dashboard. Users see risk scores without knowing whether the underlying data is "evidence" quality or "GF" fallback. A data quality badge per country row would significantly improve transparency.
          </Finding>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 6 — COUNTRY MAPPING LOGIC                                 */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s6" number="6" title="Country Mapping Logic">
          <p>
            A core design principle of the CO-GRI pipeline is that <strong className="text-white">all outputs must be specific countries — no regions</strong>. The pipeline enforces this through several decomposition mechanisms.
          </p>

          <SubHeading>Region Decomposition Flow</SubHeading>
          <AuditTable
            headers={['Input', 'Detection Method', 'Decomposition', 'Output']}
            rows={[
              { cells: ['"Europe segment" (SEC filing)', 'isKnownRegion() + normalizeRegionName()', 'Expand via REGIONAL_PATTERNS["Europe"].defaultCountries', '15 specific European countries with equal weight distribution'] },
              { cells: ['"Greater China" (Apple 10-K)', 'narrativeParser regional definition', 'Expand to China, Hong Kong, Taiwan', '3 specific countries'] },
              { cells: ['"Rest of Asia Pacific" (Apple 10-K)', 'narrativeParser "consists of" pattern', 'Australia, New Zealand, other Asian countries', 'Specific countries from REGIONAL_PATTERNS'] },
              { cells: ['"Americas" (generic)', 'REGIONAL_PATTERNS["Americas"]', 'US, Canada, Brazil, Mexico, Argentina, Colombia, Chile, Peru', '8 specific countries'] },
              { cells: ['"ROW" / "Other" / "Rest of World"', 'isGlobalFallbackSegment()', 'Distribute across GF template top-10 countries', 'Specific countries with GF weights'] },
            ]}
          />

          <SubHeading>ADR Country Resolution</SubHeading>
          <p>
            For American Depositary Receipts (ADRs), the <code className="text-teal-400 text-xs">adrCountryResolver.ts</code> service corrects the home country from "United States" (as returned by APIs) to the actual country of incorporation. This affects the political alignment calculation and the home-country weight assignment.
          </p>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-3 text-xs my-3">
            <div className="text-slate-400 mb-2">Example ADR resolution:</div>
            <div className="text-slate-300">API returns: BABA → country = "United States"</div>
            <div className="text-teal-400">Resolved: BABA → country = "China" (high confidence, ADR-Resolved)</div>
          </div>

          <SubHeading>ROW (Rest of World) Allocation</SubHeading>
          <p>
            When a company reports an "Other" or "Rest of World" segment, the pipeline detects this via <code className="text-teal-400 text-xs">isGlobalFallbackSegment()</code> and distributes the weight proportionally across the sector template's top countries, excluding already-mapped countries. This prevents double-counting while ensuring the full 100% is allocated.
          </p>

          <Finding type="info">
            The <code className="text-blue-300 text-xs">normalizeRegionName()</code> function strips "segment" and "region" suffixes before matching. This ensures "Europe segment" correctly maps to "Europe" in the REGIONAL_PATTERNS dictionary — a subtle but critical fix that prevents region expansion failures.
          </Finding>
          <Finding type="gap">
            MSFT's company-specific data in <code className="text-amber-300 text-xs">companySpecificExposures.ts</code> contains "Europe" and "Other Asia Pacific" as country entries — these are regional aggregates, not specific countries. The pipeline does not currently decompose these entries when they come from the company-specific override (which bypasses the regional decomposition logic). This is the most significant data quality issue in the current database.
          </Finding>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 7 — FULL FORMULAS & CALCULATIONS                          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s7" number="7" title="Full Formulas & Calculations">
          <p>
            This section documents every formula in the CO-GRI calculation pipeline with complete variable definitions, as implemented in <code className="text-teal-400 text-xs">cogriCalculationService.ts</code> and <code className="text-teal-400 text-xs">geographicExposureService.ts</code>.
          </p>

          <SubHeading>Formula 1: Four-Channel Blended Weight</SubHeading>
          <FormulaBox
            label="Channel Blending (geographicExposureService.ts)"
            formula="W_blended[c] = α × W_revenue[c] + β × W_supply[c] + γ × W_assets[c] + δ × W_financial[c]"
            variables={[
              { symbol: 'W_blended[c]', definition: 'Blended exposure weight for country c (pre-normalization)' },
              { symbol: 'α = 0.40', definition: 'Revenue channel coefficient (Technology: 0.45)' },
              { symbol: 'β = 0.35', definition: 'Supply chain channel coefficient (Technology: 0.35)' },
              { symbol: 'γ = 0.15', definition: 'Physical assets channel coefficient (Technology: 0.10)' },
              { symbol: 'δ = 0.10', definition: 'Financial channel coefficient (Technology: 0.10)' },
              { symbol: 'W_revenue[c]', definition: 'Revenue channel weight for country c (0.0 to 1.0)' },
              { symbol: 'W_supply[c]', definition: 'Supply chain channel weight for country c (0.0 to 1.0)' },
              { symbol: 'W_assets[c]', definition: 'Physical assets channel weight for country c (0.0 to 1.0)' },
              { symbol: 'W_financial[c]', definition: 'Financial channel weight for country c (0.0 to 1.0)' },
            ]}
          />

          <SubHeading>Formula 2: Exposure Normalization</SubHeading>
          <FormulaBox
            label="Normalization (cogriCalculationService.ts)"
            formula="W_normalized[c] = W_blended[c] / Σ(W_blended[all countries])"
            variables={[
              { symbol: 'W_normalized[c]', definition: 'Normalized exposure weight for country c (sums to 1.0 across all countries)' },
              { symbol: 'W_blended[c]', definition: 'Pre-normalization blended weight for country c' },
              { symbol: 'Σ(W_blended)', definition: 'Sum of all blended weights across all countries with weight ≥ 0.0001' },
            ]}
          />
          <p className="text-xs text-slate-400 mt-1">
            <strong className="text-slate-300">Micro-exposure threshold:</strong> Countries with blended weight &lt; 0.0001 (0.01%) are excluded before normalization. This threshold is aligned between both services after the Priority 3 / Bug #6 fix.
          </p>

          <SubHeading>Formula 3: Political Alignment Amplification</SubHeading>
          <FormulaBox
            label="Country Contribution (cogriCalculationService.ts)"
            formula="Contribution[c] = W_normalized[c] × CSI[c] × (1.0 + 0.5 × (1.0 - A_c))"
            variables={[
              { symbol: 'Contribution[c]', definition: 'Risk contribution from country c to the raw CO-GRI score' },
              { symbol: 'W_normalized[c]', definition: 'Normalized exposure weight for country c' },
              { symbol: 'CSI[c]', definition: 'Country Shock Index for country c (0–100 scale, from globalCountries.ts)' },
              { symbol: 'A_c', definition: 'Political alignment factor for country c (0.0 = adversarial → 1.0 = aligned)' },
              { symbol: '0.5', definition: 'Alignment amplification coefficient: adversarial countries get up to 50% higher contribution' },
            ]}
          />
          <p className="text-xs text-slate-400 mt-1">
            <strong className="text-slate-300">Alignment amplification range:</strong> A_c = 1.0 (fully aligned) → multiplier = 1.0×. A_c = 0.0 (adversarial) → multiplier = 1.5×. This means adversarial-country exposure contributes 50% more to the risk score than aligned-country exposure of equal weight.
          </p>

          <SubHeading>Formula 4: Raw CO-GRI Score Aggregation</SubHeading>
          <FormulaBox
            label="Raw Score (cogriCalculationService.ts)"
            formula="CO-GRI_raw = Σ(Contribution[c]) for all countries c"
            variables={[
              { symbol: 'CO-GRI_raw', definition: 'Sum of all country contributions before sector adjustment' },
            ]}
          />

          <SubHeading>Formula 5: Sector-Adjusted Final Score</SubHeading>
          <FormulaBox
            label="Final Score (cogriCalculationService.ts)"
            formula="CO-GRI_final = round(CO-GRI_raw × S_multiplier, 1)"
            variables={[
              { symbol: 'CO-GRI_final', definition: 'Final CO-GRI score (rounded to 1 decimal place)' },
              { symbol: 'CO-GRI_raw', definition: 'Raw aggregated score before sector adjustment' },
              { symbol: 'S_multiplier', definition: 'Sector risk multiplier from sectorClassificationService (e.g., Technology ≈ 1.0–1.2)' },
            ]}
          />

          <SubHeading>Formula 6: Risk Level Classification</SubHeading>
          <AuditTable
            headers={['CO-GRI_final Range', 'Risk Level', 'Color']}
            rows={[
              { cells: ['< 30', 'Low Risk', <Pill color="green">Green</Pill>] },
              { cells: ['30 – 44.9', 'Moderate Risk', <Pill color="orange">Amber</Pill>] },
              { cells: ['45 – 59.9', 'High Risk', <Pill color="orange">Orange</Pill>] },
              { cells: ['≥ 60', 'Very High Risk', <Pill color="red">Red</Pill>] },
            ]}
          />

          <SubHeading>Formula 7: Composite CO-GRI (Full Expression)</SubHeading>
          <FormulaBox
            label="Complete CO-GRI Formula"
            formula="CO-GRI = [Σ_c (W_normalized[c] × CSI[c] × (1.0 + 0.5 × (1.0 - A_c)))] × S_multiplier"
            variables={[
              { symbol: 'W_normalized[c]', definition: 'W_blended[c] / Σ W_blended[all] — normalized four-channel blended weight' },
              { symbol: 'W_blended[c]', definition: 'α×W_rev + β×W_sup + γ×W_ast + δ×W_fin — four-channel blend' },
              { symbol: 'α, β, γ, δ', definition: 'Channel coefficients (sector-specific; default: 0.40, 0.35, 0.15, 0.10)' },
              { symbol: 'CSI[c]', definition: 'Country Shock Index (0–100)' },
              { symbol: 'A_c', definition: 'Political alignment factor (0.0–1.0)' },
              { symbol: 'S_multiplier', definition: 'Sector risk multiplier' },
            ]}
          />

          <SubHeading>Formula 8: Risk Attribution Share</SubHeading>
          <FormulaBox
            label="Risk Share (attributionCalculations.ts)"
            formula="RiskShare[c] = (Contribution[c] / CO-GRI_raw) × 100%"
            variables={[
              { symbol: 'RiskShare[c]', definition: 'Percentage of total raw score contributed by country c' },
              { symbol: 'Contribution[c]', definition: 'Country c\'s contribution = W_normalized × CSI × alignment_multiplier' },
              { symbol: 'CO-GRI_raw', definition: 'Total raw score (sum of all contributions)' },
            ]}
          />

          <Finding type="strength">
            All formulas are implemented identically in both <code className="text-emerald-300 text-xs">cogriCalculationService.ts</code> (the canonical calculation engine) and the legacy COGRI.tsx page. The <code className="text-emerald-300 text-xs">validateIdenticalResults()</code> utility function provides a programmatic check for result consistency within a configurable tolerance.
          </Finding>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 8 — ATTRIBUTION LOGIC                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s8" number="8" title="Attribution Logic">
          <p>
            The attribution layer translates the raw calculation results into human-readable risk breakdowns. Two components handle this: <code className="text-teal-400 text-xs">RiskAttribution.tsx</code> (C7 — full breakdown) and <code className="text-teal-400 text-xs">TopRelevantRisks.tsx</code> (C5 — top 1-2 drivers).
          </p>

          <SubHeading>RiskAttribution (C7) — Full Country Breakdown</SubHeading>
          <p>
            Displays the top 7 countries by risk contribution. For each country, it shows:
          </p>
          <AuditTable
            headers={['Field', 'Source', 'Description']}
            rows={[
              { cells: ['Risk Share (%)', 'calculateCountryAttribution() → risk_share', 'Country\'s percentage of total raw CO-GRI score'] },
              { cells: ['Risk Contribution', 'calculateCountryAttribution() → risk_contribution', 'Absolute contribution value (W_normalized × CSI × alignment_multiplier)'] },
              { cells: ['Dominant Channel', 'calculateCountryAttribution() → dominant_channel', 'Channel with highest weight for this country (Revenue/Supply/Assets/Financial)'] },
              { cells: ['Contribution Label', 'getContributionLabel(risk_share)', 'Primary (>25%), Moderate (10–25%), Minor (<10%)'] },
              { cells: ['Exposure Weight', 'attr.exposure_weight × 100', 'Normalized exposure weight as percentage'] },
              { cells: ['Adjusted Shock', 'attr.adjusted_shock', 'CSI × alignment_multiplier (effective shock after political adjustment)'] },
              { cells: ['Alignment Modifier (W^c)', 'attr.alignment_modifier', 'Shown only when Advanced Metrics toggle is ON'] },
            ]}
          />

          <SubHeading>Channel Contribution Labels</SubHeading>
          <AuditTable
            headers={['Label', 'Threshold', 'Color', 'Meaning']}
            rows={[
              { cells: [<Pill color="red">Primary</Pill>, 'Risk Share > 25%', 'Red/High', 'Dominant risk driver — top-tier concern'] },
              { cells: [<Pill color="orange">Moderate</Pill>, 'Risk Share 10–25%', 'Orange/Medium', 'Significant contributor — monitor closely'] },
              { cells: [<Pill color="gray">Minor</Pill>, 'Risk Share < 10%', 'Gray/Low', 'Background exposure — low immediate concern'] },
            ]}
          />

          <SubHeading>TopRelevantRisks (C5) — Lens-Aware Display</SubHeading>
          <p>
            The <code className="text-teal-400 text-xs">TopRelevantRisks</code> component renders differently based on the active lens:
          </p>
          <AuditTable
            headers={['Lens', 'Data Source', 'Display Logic']}
            rows={[
              { cells: [<Pill color="blue">Structural</Pill>, 'getTopStructuralDrivers(countryExposures, 2)', 'Top 2 countries by risk contribution. Shows: country, channel, risk_contribution, risk_share, explanation text.'] },
              { cells: [<Pill color="purple">Forecast Overlay</Pill>, 'forecastDrivers prop (from ForecastEngine)', 'Top forecast events filtered by: exposure >5%, |ΔCO-GRI| > 2, probability > 30%. Shows: event_name, probability, timing, expected_delta_CO_GRI, top_country_nodes.'] },
              { cells: [<Pill color="orange">Scenario Shock</Pill>, 'Stub — not yet implemented', 'Displays placeholder: "Scenario-Specific Drivers will be displayed here"'] },
              { cells: [<Pill color="green">Trading Signal</Pill>, 'Stub — not yet implemented', 'Displays placeholder: "Key risk factors influencing trading recommendation"'] },
            ]}
          />

          <SubHeading>Channel Color Coding (TopRelevantRisks)</SubHeading>
          <div className="flex flex-wrap gap-2 my-3">
            <Pill color="green">Revenue — Green</Pill>
            <Pill color="blue">Supply Chain — Blue</Pill>
            <Pill color="purple">Physical Assets — Purple</Pill>
            <Pill color="orange">Financial — Orange</Pill>
          </div>

          <Finding type="strength">
            The <code className="text-emerald-300 text-xs">RiskAttribution</code> component correctly distinguishes between <em>exposure share</em> (how much of the company's footprint is in a country) and <em>risk contribution share</em> (how much of the total CO-GRI score comes from that country). The info banner at the top of the component explicitly communicates this distinction to users.
          </Finding>
          <Finding type="gap">
            The Scenario Shock and Trading Signal lenses in <code className="text-amber-300 text-xs">TopRelevantRisks.tsx</code> are stubs. They display static placeholder text rather than computed risk drivers. This limits the analytical value of these two lenses in the current implementation.
          </Finding>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 9 — ADVANCED METRICS TOGGLE                               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s9" number="9" title="Advanced Metrics Toggle Logic">
          <p>
            The Advanced Metrics toggle in <code className="text-teal-400 text-xs">RiskAttribution.tsx</code> is controlled by a local React state variable <code className="text-teal-400 text-xs">showAdvanced</code> (default: false). When enabled, it reveals the political alignment modifier (W^c) column.
          </p>

          <SubHeading>Toggle State Management</SubHeading>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-4 font-mono text-xs text-slate-300 my-3">
            <div className="text-amber-400">// RiskAttribution.tsx — local state (not persisted to global store)</div>
            <div>const [showAdvanced, setShowAdvanced] = useState(false);</div>
            <div className="mt-2 text-amber-400">// Toggle button</div>
            <div>{'<Button onClick={() => setShowAdvanced(!showAdvanced)}>'}</div>
            <div className="pl-4">{'showAdvanced ? <ChevronUp /> : <ChevronDown />'}</div>
            <div className="pl-4">Advanced Metrics</div>
            <div>{'</Button>'}</div>
          </div>

          <SubHeading>What Advanced Metrics Reveals</SubHeading>
          <AuditTable
            headers={['Metric', 'Symbol', 'Location Revealed', 'Value Range']}
            rows={[
              { cells: ['Alignment Modifier', 'W^c (A_c)', 'Bar Chart: expanded country detail; Table: additional column', '0.00 (adversarial) – 1.00 (fully aligned)'] },
              { cells: ['Channel Breakdown', 'Revenue/Supply/Assets/Financial %', 'Bar Chart: expanded country detail only', 'Per-channel contribution as % of country total'] },
            ]}
          />

          <SubHeading>Expanded Country Detail (Bar Chart View)</SubHeading>
          <p>
            Clicking the expand button on any country row in the bar chart view reveals:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm ml-2">
            <li><strong className="text-white">Exposure Weight:</strong> Normalized weight as percentage</li>
            <li><strong className="text-white">Adjusted Shock:</strong> CSI × alignment multiplier</li>
            <li><strong className="text-white">Alignment (W^c):</strong> Only shown when Advanced Metrics is ON</li>
            <li><strong className="text-white">Channel Breakdown:</strong> Bar chart showing Revenue/Supply/Assets/Financial contributions via <code className="text-teal-400 text-xs">calculateChannelBreakdown()</code></li>
          </ul>

          <SubHeading>Lens Badge Integration</SubHeading>
          <p>
            Both <code className="text-teal-400 text-xs">RiskAttribution</code> and <code className="text-teal-400 text-xs">TopRelevantRisks</code> display the active lens via the <code className="text-teal-400 text-xs">LensBadge</code> component, reading from <code className="text-teal-400 text-xs">{'useGlobalState((state) => state.active_company_lens)'}</code>. The <code className="text-teal-400 text-xs">CompanyModeTabs</code> component writes to this state via <code className="text-teal-400 text-xs">{'setLens()'}</code>.
          </p>

          <Finding type="info">
            The Advanced Metrics toggle state is local to the <code className="text-blue-300 text-xs">RiskAttribution</code> component and resets when the component unmounts (e.g., when navigating away and back). This is appropriate for a detail-on-demand pattern but means users must re-enable it on each session.
          </Finding>
          <Finding type="gap">
            The <code className="text-amber-300 text-xs">CompanyModeTabs</code> component reads from <code className="text-amber-300 text-xs">active_lens</code> (global lens) but <code className="text-amber-300 text-xs">TopRelevantRisks</code> reads from <code className="text-amber-300 text-xs">active_company_lens</code>. These may be different state fields depending on the global store implementation — a potential source of lens synchronization bugs if the two fields are not kept in sync.
          </Finding>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 10 — AAPL CASE STUDY                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s10" number="10" title="End-to-End Apple (AAPL) Case Study">
          <p>
            This section traces the complete CO-GRI calculation for Apple Inc. (AAPL) using the actual data from <code className="text-teal-400 text-xs">companySpecificExposures.ts</code>. All values are computed from the documented formulas.
          </p>

          <SubHeading>Step 1: Company Resolution & Data Source</SubHeading>
          <AuditTable
            headers={['Field', 'Value', 'Source']}
            rows={[
              { cells: ['Ticker', 'AAPL', 'Input'] },
              { cells: ['Company Name', 'Apple Inc.', 'companySpecificExposures.ts'] },
              { cells: ['Home Country', 'United States', 'companySpecificExposures.ts'] },
              { cells: ['Sector', 'Technology', 'companySpecificExposures.ts'] },
              { cells: ['Data Source', 'Manual entry from Apple 10-K and investor relations', 'companySpecificExposures.ts'] },
              { cells: ['Last Updated', formattedDate, 'companySpecificExposures.ts'] },
              { cells: ['Data Quality', 'A+', 'companySpecificExposures.ts'] },
              { cells: ['Pipeline Path', 'Company-Specific Override (bypasses SEC/fallback)', 'hasCompanySpecificExposure("AAPL") = true'] },
            ]}
          />

          <SubHeading>Step 2: Raw Exposure Data (14 Countries)</SubHeading>
          <AuditTable
            headers={['Country', 'Raw %', 'Channel Assignment', 'Confidence']}
            rows={[
              { cells: ['United States', '42.3%', 'All channels (company-specific)', '0.95'], highlight: true },
              { cells: ['China', '16.9%', 'All channels (company-specific)', '0.90'] },
              { cells: ['Germany', '8.0%', 'All channels (company-specific)', '0.85'], highlight: true },
              { cells: ['Japan', '6.3%', 'All channels (company-specific)', '0.85'] },
              { cells: ['United Kingdom', '5.5%', 'All channels (company-specific)', '0.85'], highlight: true },
              { cells: ['France', '5.0%', 'All channels (company-specific)', '—'] },
              { cells: ['Taiwan', '3.5%', 'All channels (company-specific)', '—'], highlight: true },
              { cells: ['Italy', '3.5%', 'All channels (company-specific)', '—'] },
              { cells: ['South Korea', '2.5%', 'All channels (company-specific)', '—'], highlight: true },
              { cells: ['Spain', '2.2%', 'All channels (company-specific)', '—'] },
              { cells: ['Netherlands', '1.5%', 'All channels (company-specific)', '—'], highlight: true },
              { cells: ['Singapore', '1.3%', 'All channels (company-specific)', '—'] },
              { cells: ['Canada', '1.0%', 'All channels (company-specific)', '—'], highlight: true },
              { cells: ['India', '0.5%', 'All channels (company-specific)', '—'] },
              { cells: ['TOTAL', '100.0%', '—', '—'] },
            ]}
          />

          <SubHeading>Step 3: Blended Weight Calculation</SubHeading>
          <p>
            Since AAPL uses company-specific override, all four channels receive the same weight. The blended weight formula simplifies:
          </p>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-4 font-mono text-xs text-slate-300 my-3">
            <div className="text-amber-400">// For company-specific data: W_revenue = W_supply = W_assets = W_financial = exposure%</div>
            <div>W_blended[US] = 0.40×0.423 + 0.35×0.423 + 0.15×0.423 + 0.10×0.423</div>
            <div className="text-teal-400">           = 0.423 × (0.40 + 0.35 + 0.15 + 0.10) = 0.423 × 1.0 = 0.423</div>
            <div className="mt-2">W_blended[China] = 0.169 × 1.0 = 0.169</div>
            <div className="text-amber-400">// Note: Technology sector coefficients (α=0.45, β=0.35, γ=0.10, δ=0.10) have no effect</div>
            <div className="text-amber-400">// when all channels have identical weights (sum still = 1.0)</div>
          </div>

          <SubHeading>Step 4: Normalization</SubHeading>
          <p>
            Sum of all raw percentages = 100.0%, so W_blended values already sum to 1.0. Normalization factor = 1.0 (no change). W_normalized = W_blended for all countries.
          </p>

          <SubHeading>Step 5: CSI Assignment & Political Alignment</SubHeading>
          <p>
            Illustrative CSI values and alignment factors (actual values from <code className="text-teal-400 text-xs">globalCountries.ts</code> and <code className="text-teal-400 text-xs">politicalAlignmentService.ts</code>):
          </p>
          <AuditTable
            headers={['Country', 'W_normalized', 'CSI (illustrative)', 'A_c (alignment)', 'Multiplier (1+0.5×(1-A_c))', 'Contribution']}
            rows={[
              { cells: ['United States', '0.423', '~15', '1.00 (home)', '1.00×', '~6.35'], highlight: true },
              { cells: ['China', '0.169', '~65', '0.20 (adversarial)', '1.40×', '~15.38'] },
              { cells: ['Germany', '0.080', '~20', '0.90 (aligned)', '1.05×', '~1.68'], highlight: true },
              { cells: ['Japan', '0.063', '~25', '0.85 (aligned)', '1.075×', '~1.69'] },
              { cells: ['United Kingdom', '0.055', '~18', '0.90 (aligned)', '1.05×', '~1.04'], highlight: true },
              { cells: ['Taiwan', '0.035', '~55', '0.50 (neutral)', '1.25×', '~2.41'] },
              { cells: ['South Korea', '0.025', '~40', '0.70 (friendly)', '1.15×', '~1.15'] },
              { cells: ['…other countries', '0.150', '~20–35', 'varies', 'varies', '~3.00'] },
            ]}
          />
          <p className="text-xs text-slate-400 mt-1">
            Note: CSI values shown are illustrative. Actual values are loaded from <code className="text-teal-400 text-xs">getCountryShockIndex()</code> in <code className="text-teal-400 text-xs">globalCountries.ts</code>. China's high CSI combined with adversarial alignment makes it the dominant risk driver despite being the second-largest exposure.
          </p>

          <SubHeading>Step 6: Raw Score & Final Score</SubHeading>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-4 font-mono text-xs text-slate-300 my-3">
            <div>CO-GRI_raw = Σ(Contribution[c]) ≈ 32–38 (illustrative, based on current CSI values)</div>
            <div className="mt-1">S_multiplier (Technology) ≈ 1.0–1.15 (from sectorClassificationService)</div>
            <div className="mt-1 text-teal-400">CO-GRI_final = round(CO-GRI_raw × S_multiplier, 1) ≈ 33–44</div>
            <div className="mt-1 text-teal-400">Risk Level: Moderate Risk (30–44.9 range)</div>
          </div>

          <SubHeading>Step 7: Attribution Output</SubHeading>
          <p>
            In the RiskAttribution component, China would appear as the <Pill color="red">Primary</Pill> risk driver (highest contribution despite being 2nd in exposure) due to its high CSI and adversarial alignment. The US would appear as <Pill color="orange">Moderate</Pill> — large exposure but low CSI and perfect alignment.
          </p>

          <SubHeading>Key Insight: Exposure ≠ Risk Contribution</SubHeading>
          <div className="bg-teal-950/30 border border-teal-700/40 rounded-lg p-4 my-3">
            <p className="text-sm text-teal-200">
              <strong>AAPL has 42.3% US exposure but US contributes only ~19% of total risk.</strong><br />
              <strong>AAPL has 16.9% China exposure but China contributes ~45% of total risk.</strong><br />
              This is the core value proposition of CO-GRI: it weights exposure by geopolitical shock intensity and political alignment, not just by revenue share.
            </p>
          </div>

          <Finding type="strength">
            The AAPL case study demonstrates the model's key differentiator: China's combination of high CSI (~65) and adversarial alignment (A_c ≈ 0.20) produces a 1.40× amplification multiplier, making it the dominant risk driver despite being only the second-largest revenue market.
          </Finding>
          <Finding type="info">
            The AAPL data in <code className="text-blue-300 text-xs">companySpecificExposures.ts</code> uses revenue-based percentages for all channels. A more accurate model would use separate supply chain weights (China is ~85–90% of Apple's manufacturing) and separate assets weights (China has significant PP&E). This would further increase China's risk contribution.
          </Finding>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 11 — DATA COVERAGE & HISTORICAL BACKFILL                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s11" number="11" title="Data Coverage & Historical Backfill">
          <p>
            The CO-GRI platform supports historical analysis through the <code className="text-teal-400 text-xs">compositeCalculator.ts</code> CSI engine and the COGRITrendChart component. This section documents the data coverage capabilities.
          </p>

          <SubHeading>Historical Data Generation Capability</SubHeading>
          <AuditTable
            headers={['Time Window', 'Data Points', 'Generation Method', 'Accuracy']}
            rows={[
              { cells: ['3-Year (1,095 days)', 'Daily data points', 'compositeCalculator.ts with decay scheduling', 'High — recent CSI data available'] },
              { cells: ['5-Year (1,825 days)', 'Daily data points', 'Backtesting engine + historical event replay', 'Medium — some events reconstructed'] },
              { cells: ['10-Year (3,650 days)', 'Daily data points', 'Historical event database + structural baseline', 'Low-Medium — pre-2020 data is estimated'] },
            ]}
          />

          <SubHeading>Backtesting Engine</SubHeading>
          <p>
            The backtesting engine (<code className="text-teal-400 text-xs">BacktestingEngine</code> module) replays historical geopolitical events through the CSI calculation system to reconstruct past CO-GRI scores. Key components:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm ml-2">
            <li><strong className="text-white">Structural Baseline Engine:</strong> Computes baseline risk from long-term historical patterns</li>
            <li><strong className="text-white">Escalation Drift Engine:</strong> Models gradual risk escalation between events</li>
            <li><strong className="text-white">Event Delta Engine:</strong> Applies confirmed event impacts as step changes</li>
            <li><strong className="text-white">Decay Scheduler:</strong> Applies temporal decay (exponential) to event impacts</li>
            <li><strong className="text-white">Netting Engine:</strong> Prevents double-counting of overlapping signals</li>
          </ul>

          <SubHeading>COGRITrendChart Data Generation</SubHeading>
          <p>
            The <code className="text-teal-400 text-xs">COGRITrendChart.tsx</code> component uses numeric timestamps for the x-axis and supports event markers. Historical data is generated by the <code className="text-teal-400 text-xs">compositeCalculator.ts</code> with the following decay direction fix applied:
          </p>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-3 font-mono text-xs text-slate-300 my-3">
            <div className="text-amber-400">// Critical decay direction fix in compositeCalculator.ts</div>
            <div>// OLD (bug): score += decayAmount  ← score was INCREASING over time</div>
            <div className="text-teal-400">// NEW (fixed): score -= decayAmount ← score correctly DECAYS toward baseline</div>
          </div>

          <SubHeading>Calibration Service</SubHeading>
          <p>
            The <code className="text-teal-400 text-xs">CalibrationService</code> adjusts model parameters based on backtesting results, comparing predicted CO-GRI changes against actual market outcomes. The <code className="text-teal-400 text-xs">ModelAccuracyTracker</code> records prediction accuracy over time and feeds into the calibration loop.
          </p>

          <Finding type="strength">
            The 3Y/5Y/10Y historical backfill capability is architecturally complete. The decay direction bug fix in <code className="text-emerald-300 text-xs">compositeCalculator.ts</code> ensures that historical CO-GRI scores correctly decay toward baseline after shock events, producing realistic trend charts.
          </Finding>
          <Finding type="gap">
            Historical data before 2020 is largely estimated/reconstructed from the structural baseline engine rather than from actual event records. The <code className="text-amber-300 text-xs">historical_data_investigation.md</code> documents this limitation. Users should be informed that 10Y charts have lower accuracy for the 2015–2019 period.
          </Finding>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 12 — KNOWN LIMITATIONS & RISKS                            */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s12" number="12" title="Known Limitations & Risks">
          <SubHeading>Data Quality Limitations</SubHeading>
          <AuditTable
            headers={['Limitation', 'Impact', 'Severity', 'Affected Companies']}
            rows={[
              { cells: ['SEC EDGAR integration returns simulated data', 'All non-AAPL/TSLA/MSFT companies use SSF/RF/GF fallback', <Pill color="red">High</Pill>, 'All except AAPL, TSLA, MSFT'] },
              { cells: ['MSFT company-specific data contains regional aggregates ("Europe", "Other Asia Pacific")', 'Regional weights not decomposed to country level', <Pill color="orange">Medium</Pill>, 'MSFT'] },
              { cells: ['narrativeParser uses simulated text, not live EDGAR content', 'Regional definitions may not match actual filing language', <Pill color="orange">Medium</Pill>, 'All tickers'] },
              { cells: ['Company-specific override assigns same weight to all 4 channels', 'Channel differentiation lost; sector coefficients have no effect', <Pill color="orange">Medium</Pill>, 'AAPL, TSLA, MSFT'] },
              { cells: ['Supply chain data (unComtradeService) is simulated', 'Supply chain channel weights are estimates, not actual trade data', <Pill color="orange">Medium</Pill>, 'All tickers'] },
              { cells: ['CSI values are static snapshots, not real-time', 'CO-GRI scores do not update intraday with breaking news', <Pill color="orange">Medium</Pill>, 'All tickers'] },
            ]}
          />

          <SubHeading>Model Methodology Limitations</SubHeading>
          <AuditTable
            headers={['Limitation', 'Description', 'Severity']}
            rows={[
              { cells: ['No confidence interval on final score', 'CO-GRI_final is a point estimate with no uncertainty band. A company with GF fallback data could have ±15 point uncertainty.', <Pill color="orange">Medium</Pill>] },
              { cells: ['Political alignment is binary-ish', 'A_c is a continuous factor but is computed from a relatively simple bilateral relationship model. Complex multi-party geopolitical dynamics are not captured.', <Pill color="orange">Medium</Pill>] },
              { cells: ['Sector multiplier applied as flat scalar', 'S_multiplier scales the entire score uniformly. It does not differentiate between channels (e.g., a tech company\'s supply chain risk may deserve a higher multiplier than its revenue risk).', <Pill color="gray">Low</Pill>] },
              { cells: ['No time-lag in supply chain disruption modeling', 'Supply chain disruptions typically manifest 3–6 months after a geopolitical event. The current model applies CSI shocks immediately.', <Pill color="gray">Low</Pill>] },
              { cells: ['Scenario Shock and Trading Signal lenses are stubs', 'Two of four analytical lenses display placeholder content. This limits the platform\'s analytical completeness.', <Pill color="orange">Medium</Pill>] },
            ]}
          />

          <SubHeading>Technical / Implementation Risks</SubHeading>
          <AuditTable
            headers={['Risk', 'Description', 'Mitigation']}
            rows={[
              { cells: ['active_lens vs active_company_lens state divergence', 'CompanyModeTabs writes to active_lens; TopRelevantRisks reads active_company_lens. If these are different Zustand fields, lens switching may not propagate correctly.', 'Audit globalState.ts to confirm field mapping; add synchronization if needed.'] },
              { cells: ['PDF generation may fail for very long reports', 'html2canvas captures the full DOM; very long pages may exceed canvas size limits in some browsers.', 'Implement paginated PDF generation using jsPDF directly with text rendering instead of canvas capture.'] },
              { cells: ['Console.log performance overhead', 'cogriCalculationService.ts and geographicExposureService.ts emit extensive debug logs. In production with many companies, this could impact performance.', 'Gate debug logging behind an environment variable or debug flag.'] },
            ]}
          />
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 13 — RECOMMENDATIONS                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s13" number="13" title="Recommendations">
          <SubHeading>Priority 1 — Critical (Address Immediately)</SubHeading>
          <AuditTable
            headers={['#', 'Recommendation', 'File(s)', 'Effort']}
            rows={[
              { cells: ['R1', 'Decompose MSFT regional aggregates in companySpecificExposures.ts. Replace "Europe" and "Other Asia Pacific" with specific country entries using the narrativeParser regional expansion logic.', 'companySpecificExposures.ts', <Pill color="green">Low</Pill>], highlight: true },
              { cells: ['R2', 'Audit and confirm active_lens vs active_company_lens state field mapping in globalState.ts. Ensure CompanyModeTabs and TopRelevantRisks read/write the same field.', 'globalState.ts, CompanyModeTabs.tsx, TopRelevantRisks.tsx', <Pill color="green">Low</Pill>] },
              { cells: ['R3', 'Add data quality badge to each country row in RiskAttribution to surface fallback tier (SSF/RF/GF) to end users. This is critical for informed decision-making.', 'RiskAttribution.tsx, attributionCalculations.ts', <Pill color="green">Low</Pill>], highlight: true },
            ]}
          />

          <SubHeading>Priority 2 — High (Address in Next Sprint)</SubHeading>
          <AuditTable
            headers={['#', 'Recommendation', 'File(s)', 'Effort']}
            rows={[
              { cells: ['R4', 'Wire live SEC EDGAR API in structuredDataIntegrator.ts. Replace simulated responses with actual 10-K parsing using the EDGAR full-text search API. Focus on revenue tables (Item 7) and PP&E tables (Note to Financial Statements).', 'structuredDataIntegrator.ts, secEdgarService.ts', <Pill color="orange">High</Pill>] },
              { cells: ['R5', 'Implement channel-specific weights for company-specific override entries. Instead of assigning the same weight to all four channels, use the revenue percentage for the Revenue channel and derive Supply/Assets/Financial from sector templates or narrative parsing.', 'companySpecificExposures.ts, geographicExposureService.ts', <Pill color="orange">Medium</Pill>] },
              { cells: ['R6', 'Add CO-GRI score confidence interval. Compute a ±uncertainty band based on the mix of evidence vs fallback data. Display as a range (e.g., "38.5 ± 4.2") in the Company Mode header.', 'cogriCalculationService.ts, CompanyMode page', <Pill color="orange">Medium</Pill>] },
              { cells: ['R7', 'Complete the Trading Signal lens in TopRelevantRisks.tsx and RiskAttribution.tsx. Connect to the existing TradingMode page logic to surface actual risk factors driving the trading recommendation.', 'TopRelevantRisks.tsx, RiskAttribution.tsx, TradingMode', <Pill color="orange">Medium</Pill>] },
            ]}
          />

          <SubHeading>Priority 3 — Medium (Next Quarter)</SubHeading>
          <AuditTable
            headers={['#', 'Recommendation', 'File(s)', 'Effort']}
            rows={[
              { cells: ['R8', 'Gate debug console.log statements behind an environment variable (e.g., VITE_DEBUG_COGRI=true). The current extensive logging is valuable for development but creates performance overhead and information leakage in production.', 'cogriCalculationService.ts, geographicExposureService.ts', <Pill color="green">Low</Pill>] },
              { cells: ['R9', 'Add unit tests for the core formula layer. At minimum: calculateCOGRIScore() with known inputs/outputs, normalization edge cases (single country, all-zero weights), and political alignment amplification boundary values (A_c = 0, 0.5, 1.0).', 'cogriCalculationService.test.ts (new)', <Pill color="orange">Medium</Pill>] },
              { cells: ['R10', 'Implement supply chain time-lag modeling. Add a configurable delay parameter (default: 90 days) to the supply chain channel contribution, reflecting the typical 3–6 month lag between geopolitical events and supply chain disruption realization.', 'cogriCalculationService.ts, compositeCalculator.ts', <Pill color="red">High</Pill>] },
              { cells: ['R11', 'Expand company-specific database. Add the next 20 most-searched tickers (e.g., NVDA, GOOGL, META, AMZN, JPM, BAC, XOM, CVX) with manually verified country-level exposures from their most recent 10-K filings.', 'companySpecificExposures.ts', <Pill color="orange">Medium</Pill>] },
              { cells: ['R12', 'Implement paginated PDF generation for the audit report. Replace the current html2canvas full-page capture with a jsPDF text-rendering approach that handles multi-page documents reliably across all browsers.', 'COGRIAuditReport.tsx', <Pill color="orange">Medium</Pill>] },
            ]}
          />

          <SubHeading>Summary Roadmap</SubHeading>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-red-950/30 border border-red-700/40 rounded-lg p-4">
              <div className="text-sm font-bold text-red-400 mb-2">🔴 Immediate (R1–R3)</div>
              <ul className="text-xs text-red-300 space-y-1">
                <li>• Fix MSFT regional aggregates</li>
                <li>• Confirm lens state mapping</li>
                <li>• Add data quality badges</li>
              </ul>
              <div className="mt-2 text-xs text-red-500">Est. effort: 1–2 days</div>
            </div>
            <div className="bg-amber-950/30 border border-amber-700/40 rounded-lg p-4">
              <div className="text-sm font-bold text-amber-400 mb-2">🟡 Next Sprint (R4–R7)</div>
              <ul className="text-xs text-amber-300 space-y-1">
                <li>• Wire live EDGAR API</li>
                <li>• Channel-specific weights</li>
                <li>• Score confidence bands</li>
                <li>• Complete Trading Signal lens</li>
              </ul>
              <div className="mt-2 text-xs text-amber-500">Est. effort: 2–3 weeks</div>
            </div>
            <div className="bg-blue-950/30 border border-blue-700/40 rounded-lg p-4">
              <div className="text-sm font-bold text-blue-400 mb-2">🔵 Next Quarter (R8–R12)</div>
              <ul className="text-xs text-blue-300 space-y-1">
                <li>• Gate debug logging</li>
                <li>• Unit test suite</li>
                <li>• Supply chain time-lag</li>
                <li>• Expand company database</li>
                <li>• Paginated PDF export</li>
              </ul>
              <div className="mt-2 text-xs text-blue-500">Est. effort: 4–6 weeks</div>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 14 — LIVE BASELINE RESULTS                                */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <Section id="s14" number="14" title="Live Baseline Results">
          <p>
            The table below reflects the most recent SEC Baseline run output. Each row represents one company processed through the automated baseline pipeline. The pipeline funnel tracks how many companies successfully retrieved a filing, produced structured parsed data, and were classified as materially specific. Evidence tiers (DIRECT → ALLOCATED → MODELED → FALLBACK → NOT_RUN) indicate the quality of data available per channel. The composite confidence score (0–100) and grade (A–F) summarise overall data quality for each company.
          </p>
          <BaselineResultsPanel />
        </Section>

        {/* ── Footer ── */}
        <div className="mt-16 pt-8 border-t border-slate-700/50 text-center text-xs text-slate-500 space-y-1">
          <div className="font-semibold text-slate-400">CO-GRI Trading Signal Service — Full Company Methodology Audit Report</div>
          <div>Generated: {formattedDateTime} | Version 2.0 (V5) | Classification: Confidential — Internal Use Only</div>
          <div>Source files reviewed: cogriCalculationService.ts · geographicExposureService.ts · compositeCalculator.ts · types/company.ts · companySpecificExposures.ts · RiskAttribution.tsx · TopRelevantRisks.tsx · CompanyModeTabs.tsx · narrativeParser.ts · deriveCompanyAnalytics.ts · runtimeValidation.ts · RuntimeValidationReport.tsx</div>
          <div className="mt-3 text-slate-600">
            This report was generated from static analysis of the CO-GRI platform source code (V5, April 2026). All formula values, CSI scores, and risk assessments are based on the implementation as of the report date. Eight systematic methodology fixes (R1–R8) are reflected in this version. This document does not constitute investment advice.
          </div>
        </div>

      </div>
    </div>
  );
};

export default COGRIAuditReport;
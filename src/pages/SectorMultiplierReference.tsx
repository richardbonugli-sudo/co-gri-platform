import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { SectorMultiplierPDF } from '@/components/SectorMultiplierPDF';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

const getRiskLevelColor = (level: string) => {
  if (level === 'Very High') return 'bg-red-600';
  if (level === 'High') return 'bg-orange-600';
  if (level === 'Elevated') return 'bg-yellow-600';
  if (level === 'Moderate-High') return 'bg-yellow-500';
  if (level === 'Moderate') return 'bg-blue-500';
  if (level === 'Low-Moderate') return 'bg-green-500';
  if (level === 'Low') return 'bg-green-600';
  return 'bg-gray-500';
};

export default function SectorMultiplierReference() {
  return (
    <div className="min-h-screen bg-[#0f1e2e]">
      <header className="bg-[#0d5f5f] text-white py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Sector Multiplier Reference</h1>
              <p className="text-sm text-gray-200">Complete Guide to CO-GRI Sector Sensitivity Adjustments</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-[#0a4a4a]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-8">
        {/* Download Button */}
        <div className="flex justify-end">
          <SectorMultiplierPDF />
        </div>

        {/* Mathematical Framework */}
        <div className="bg-[#0d5f5f] rounded-lg p-6">
          <h2 className="text-white text-2xl font-bold mb-4">Mathematical Framework</h2>
          <div className="bg-[#0a4a4a] rounded-lg p-6">
            <p className="text-white text-lg font-mono mb-4">
              M<sub>sector</sub>(i) = M₀ + β<sub>sector</sub>(i)
            </p>
            <div className="space-y-2 text-gray-300">
              <p><strong className="text-white">M<sub>sector</sub>(i)</strong> = Final sector multiplier for company i</p>
              <p><strong className="text-white">M₀</strong> = Base multiplier (always 1.00 for all sectors)</p>
              <p><strong className="text-white">β<sub>sector</sub>(i)</strong> = Sector-specific sensitivity adjustment (0.00 to 0.15)</p>
            </div>
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6">
          <h2 className="text-white text-2xl font-bold mb-4">Sector Multiplier Summary</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-300">Sector</TableHead>
                  <TableHead className="text-gray-300 text-center">M₀</TableHead>
                  <TableHead className="text-gray-300 text-center">β<sub>sector</sub></TableHead>
                  <TableHead className="text-gray-300 text-center">M<sub>sector</sub></TableHead>
                  <TableHead className="text-gray-300 text-center">Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SECTOR_DATA.map((sector, idx) => (
                  <TableRow key={idx} className="border-gray-700">
                    <TableCell className="text-white font-medium">{sector.sector}</TableCell>
                    <TableCell className="text-gray-300 text-center">{sector.baseMultiplier}</TableCell>
                    <TableCell className="text-gray-300 text-center">{sector.adjustment}</TableCell>
                    <TableCell className="text-white font-bold text-center">{sector.finalMultiplier}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-semibold ${getRiskLevelColor(sector.riskLevel)}`}>
                        {sector.riskLevel}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-6">
          <h3 className="text-blue-300 font-semibold text-lg mb-3">Key Insights</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• All sectors start with M₀ = 1.00 (neutral baseline)</li>
            <li>• β<sub>sector</sub> ranges from 0.00 to 0.15 (Automotive has highest adjustment)</li>
            <li>• Final multipliers range from 1.00 to 1.15 (maximum 15% amplification)</li>
            <li>• A 0.15 difference in multiplier can shift CO-GRI scores by 5-7 points</li>
            <li>• Calibrated using historical geopolitical event analysis (2010-2024)</li>
          </ul>
        </div>

        {/* Detailed Sector Analysis */}
        <div className="space-y-6">
          <h2 className="text-white text-2xl font-bold">Detailed Sector Analysis</h2>
          {SECTOR_DATA.map((sector, idx) => (
            <div key={idx} className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white text-xl font-bold mb-2">
                    {idx + 1}. {sector.sector}
                  </h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-white text-xs font-semibold ${getRiskLevelColor(sector.riskLevel)}`}>
                    {sector.riskLevel}
                  </span>
                </div>
                <div className="bg-[#0a4a4a] rounded-lg px-4 py-3 text-right">
                  <p className="text-gray-400 text-xs mb-1">Final Multiplier</p>
                  <p className="text-white text-2xl font-bold">{sector.finalMultiplier}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {sector.baseMultiplier} + {sector.adjustment}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-2">Calculation:</h4>
                  <p className="text-gray-300 font-mono text-sm">
                    M<sub>sector</sub> = M₀ + β<sub>sector</sub> = {sector.baseMultiplier} + {sector.adjustment} = {sector.finalMultiplier}
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">Rationale:</h4>
                  <p className="text-gray-300 text-sm">{sector.rationale}</p>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">Key Risk Factors:</h4>
                  <ul className="space-y-1">
                    {sector.keyRisks.map((risk, ridx) => (
                      <li key={ridx} className="text-gray-300 text-sm">• {risk}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">Example Companies:</h4>
                  <p className="text-gray-300 text-sm">{sector.examples}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Practical Example */}
        <div className="bg-[#0d5f5f] rounded-lg p-6">
          <h2 className="text-white text-2xl font-bold mb-4">Practical Application Example</h2>
          <h3 className="text-white text-lg font-semibold mb-4">Tesla Inc. (TSLA) - Automotive Sector</h3>
          
          <div className="bg-[#0a4a4a] rounded-lg p-6 mb-4">
            <h4 className="text-white font-semibold mb-3">Step 3: Sector Multiplier</h4>
            <div className="space-y-2 text-gray-300 font-mono text-sm">
              <p>M₀ = 1.00</p>
              <p>β<sub>sector</sub> = 0.15</p>
              <p className="text-white font-bold">M<sub>sector</sub> = 1.00 + 0.15 = 1.15</p>
            </div>
          </div>

          <div className="bg-[#0a4a4a] rounded-lg p-6">
            <h4 className="text-white font-semibold mb-3">Step 4: Raw Score Calculation</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-gray-300 text-left py-2">Country</th>
                    <th className="text-gray-300 text-center py-2">W<sub>i,c</sub></th>
                    <th className="text-gray-300 text-center py-2">S<sub>c</sub></th>
                    <th className="text-gray-300 text-center py-2">M<sub>sector</sub></th>
                    <th className="text-gray-300 text-center py-2">Contribution</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr className="border-b border-gray-700">
                    <td className="text-white py-2">United States</td>
                    <td className="text-gray-300 text-center">0.46</td>
                    <td className="text-gray-300 text-center">35.2</td>
                    <td className="text-gray-300 text-center">1.15</td>
                    <td className="text-white text-center font-bold">18.6</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="text-white py-2">China</td>
                    <td className="text-gray-300 text-center">0.22</td>
                    <td className="text-gray-300 text-center">58.7</td>
                    <td className="text-gray-300 text-center">1.15</td>
                    <td className="text-white text-center font-bold">14.9</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="text-white py-2">Europe</td>
                    <td className="text-gray-300 text-center">0.24</td>
                    <td className="text-gray-300 text-center">28.4</td>
                    <td className="text-gray-300 text-center">1.15</td>
                    <td className="text-white text-center font-bold">7.8</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="text-white py-2">Rest of World</td>
                    <td className="text-gray-300 text-center">0.08</td>
                    <td className="text-gray-300 text-center">42.1</td>
                    <td className="text-gray-300 text-center">1.15</td>
                    <td className="text-white text-center font-bold">3.9</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-white font-bold mt-4">
              Raw_Score = 18.6 + 14.9 + 7.8 + 3.9 = 45.2
            </p>
            <p className="text-gray-300 text-sm mt-2">
              The sector multiplier of 1.15 amplifies Tesla's geopolitical risk by 15% compared to a baseline company, 
              reflecting the automotive sector's high sensitivity to supply chain disruptions, trade policies, and 
              technology transfer restrictions.
            </p>
          </div>
        </div>

        {/* Download Button Bottom */}
        <div className="flex justify-center pt-6">
          <SectorMultiplierPDF />
        </div>
      </main>
    </div>
  );
}
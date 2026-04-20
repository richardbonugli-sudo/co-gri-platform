import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';

type EvidenceTier = 'DIRECT' | 'ALLOCATED' | 'MODELED';

interface CountryExposure {
  country: string;
  exposureWeight: number;
  countryShockIndex: number;
  contribution: number;
  /**
   * GAP 5 FIX: Evidence tier label for transparency display.
   * DIRECT    — explicitly disclosed in filing
   * ALLOCATED — derived from structural constraint (region → prior split)
   * MODELED   — prior-based inference, no direct constraint
   */
  tier?: EvidenceTier;
}

interface GeographicExposureTableProps {
  countryExposures: CountryExposure[];
}

// ── Tier badge config ──────────────────────────────────────────────────────────
const TIER_CONFIG: Record<EvidenceTier, { label: string; className: string; tooltip: string }> = {
  DIRECT: {
    label: 'DIRECT',
    className: 'bg-green-500/20 text-green-400 border border-green-500/40',
    tooltip: 'Directly disclosed in SEC filing',
  },
  ALLOCATED: {
    label: 'ALLOC',
    className: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
    tooltip: 'Allocated from regional total using channel prior',
  },
  MODELED: {
    label: 'MODEL',
    className: 'bg-gray-500/20 text-gray-400 border border-gray-500/40',
    tooltip: 'Prior-based estimate — no direct filing constraint',
  },
};

const TierBadge: React.FC<{ tier: EvidenceTier }> = ({ tier }) => {
  const { label, className, tooltip } = TIER_CONFIG[tier];
  return (
    <span
      className={`inline-flex items-center text-[9px] font-semibold px-1 py-0.5 rounded ${className}`}
      title={tooltip}
    >
      {label}
    </span>
  );
};

// ── Component ──────────────────────────────────────────────────────────────────
export function GeographicExposureTable({ countryExposures }: GeographicExposureTableProps) {
  const activeLens = useGlobalState((state) => state.active_company_lens);
  const sortedExposures = [...countryExposures].sort((a, b) => b.contribution - a.contribution);

  return (
    <Card className="bg-[#0f1e2e] border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
        </div>
        <CardTitle className="text-white">Geographic Exposure Breakdown</CardTitle>
        <CardDescription className="text-gray-200">
          Detailed country-by-country risk analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* GAP 5 FIX: Tier legend */}
        <div className="flex flex-wrap items-center gap-3 mb-4 p-2 bg-white/5 rounded-lg">
          <span className="text-gray-400 text-xs font-medium">Evidence tier:</span>
          {(['DIRECT', 'ALLOCATED', 'MODELED'] as EvidenceTier[]).map((t) => (
            <span key={t} className="flex items-center gap-1">
              <TierBadge tier={t} />
              <span className="text-gray-400 text-xs">{TIER_CONFIG[t].tooltip}</span>
            </span>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-200 font-semibold">Rank</th>
                <th className="text-left py-3 px-4 text-gray-200 font-semibold">Country</th>
                <th className="text-left py-3 px-4 text-gray-200 font-semibold">Tier</th>
                <th className="text-right py-3 px-4 text-gray-200 font-semibold">Exposure %</th>
                <th className="text-right py-3 px-4 text-gray-200 font-semibold">Risk Level</th>
                <th className="text-right py-3 px-4 text-gray-200 font-semibold">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {sortedExposures.map((exposure, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-700 hover:bg-[#1a2332] transition-colors"
                  style={{ opacity: exposure.tier === 'MODELED' ? 0.75 : 1 }}
                >
                  <td className="py-3 px-4 text-gray-200">{index + 1}</td>
                  <td className="py-3 px-4 text-white font-medium">{exposure.country}</td>
                  <td className="py-3 px-4">
                    {exposure.tier ? (
                      <TierBadge tier={exposure.tier} />
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-white font-mono">
                    {(exposure.exposureWeight * 100).toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-right text-white font-mono">
                    {exposure.countryShockIndex.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-right text-white font-mono font-semibold">
                    {exposure.contribution.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-600 font-bold">
                <td colSpan={3} className="py-3 px-4 text-white">Total</td>
                <td className="py-3 px-4 text-right text-white font-mono">
                  {(sortedExposures.reduce((sum, exp) => sum + exp.exposureWeight, 0) * 100).toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-right text-white">—</td>
                <td className="py-3 px-4 text-right text-white font-mono">
                  {sortedExposures.reduce((sum, exp) => sum + exp.contribution, 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
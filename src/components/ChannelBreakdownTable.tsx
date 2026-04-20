import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';

interface ChannelData {
  channel: string;
  percentage: number;
  riskMultiplier: number;
}

interface ChannelBreakdownTableProps {
  channelBreakdown: ChannelData[];
}

export function ChannelBreakdownTable({ channelBreakdown }: ChannelBreakdownTableProps) {
  const activeLens = useGlobalState((state) => state.active_company_lens);
  
  if (!channelBreakdown || channelBreakdown.length === 0) {
    return (
      <Card className="bg-[#0f1e2e] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between mb-3">
            <LensBadge lens={activeLens} />
          </div>
          <CardTitle className="text-white">Channel Breakdown</CardTitle>
          <CardDescription className="text-gray-200">
            No channel data available
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const sortedChannels = [...channelBreakdown].sort((a, b) => b.percentage - a.percentage);

  return (
    <Card className="bg-[#0f1e2e] border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
        </div>
        <CardTitle className="text-white">Sales Channel Breakdown</CardTitle>
        <CardDescription className="text-gray-200">
          Revenue distribution by sales channel with risk multipliers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-200 font-semibold">Channel</th>
                <th className="text-right py-3 px-4 text-gray-200 font-semibold">Revenue %</th>
                <th className="text-right py-3 px-4 text-gray-200 font-semibold">Risk Multiplier</th>
                <th className="text-right py-3 px-4 text-gray-200 font-semibold">Weighted Impact</th>
              </tr>
            </thead>
            <tbody>
              {sortedChannels.map((channel, index) => {
                const weightedImpact = (channel.percentage / 100) * channel.riskMultiplier;
                return (
                  <tr key={index} className="border-b border-gray-700 hover:bg-[#1a2332] transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{channel.channel}</td>
                    <td className="py-3 px-4 text-right text-white font-mono">
                      {channel.percentage.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right text-white font-mono">
                      {channel.riskMultiplier.toFixed(2)}x
                    </td>
                    <td className="py-3 px-4 text-right text-white font-mono font-semibold">
                      {weightedImpact.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-600 font-bold">
                <td className="py-3 px-4 text-white">Total</td>
                <td className="py-3 px-4 text-right text-white font-mono">
                  {sortedChannels.reduce((sum, ch) => sum + ch.percentage, 0).toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-right text-white">—</td>
                <td className="py-3 px-4 text-right text-white font-mono">
                  {sortedChannels.reduce((sum, ch) => sum + (ch.percentage / 100) * ch.riskMultiplier, 0).toFixed(4)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
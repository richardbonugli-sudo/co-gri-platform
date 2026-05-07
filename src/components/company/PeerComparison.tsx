/**
 * Peer Comparison (C6)
 * Table of peer companies in same sector
 * Part of CO-GRI Platform Phase 2 - Week 3
 * 
 * Implements specification Part 3.3 C6
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, TrendingUp, TrendingDown, Minus, ArrowUpDown } from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { RiskLevelBadge } from '@/components/common/RiskLevelBadge';
import { useGlobalState } from '@/store/globalState';
import { RiskLevel, TrendDirection } from '@/types/company';
import { getRiskLevelColor } from '@/utils/riskCalculations';
import { 
  PeerCompany,
  generatePeerCompanies,
  rankPeersByRisk,
  getCompanyRank,
  calculateSectorAverage
} from '@/utils/peerComparison';

interface PeerComparisonProps {
  currentCompany: {
    ticker: string;
    name: string;
    sector: string;
    cogriScore: number;
    riskLevel: RiskLevel;
    delta_30D?: number;
    direction?: TrendDirection;
  };
  peers?: PeerCompany[];  // Optional pre-calculated peers
}

export const PeerComparison: React.FC<PeerComparisonProps> = ({
  currentCompany,
  peers
}) => {
  const activeLens = useGlobalState((state) => state.active_company_lens);
  const [sortBy, setSortBy] = useState<'ticker' | 'score' | 'delta'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Generate peers if not provided
  const peerCompanies = peers || generatePeerCompanies(
    currentCompany.ticker,
    currentCompany.sector,
    currentCompany.cogriScore,
    5
  );

  // Calculate metrics
  const rankedPeers = rankPeersByRisk(peerCompanies);
  const companyRank = getCompanyRank(currentCompany.cogriScore, peerCompanies);
  const sectorAverage = calculateSectorAverage(peerCompanies);

  // Sort peers
  const sortedPeers = [...peerCompanies].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'ticker') {
      comparison = a.ticker.localeCompare(b.ticker);
    } else if (sortBy === 'score') {
      comparison = a.CO_GRI - b.CO_GRI;
    } else if (sortBy === 'delta') {
      comparison = (a.delta_30D || 0) - (b.delta_30D || 0);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'ticker' | 'score' | 'delta') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getTrendIcon = (direction?: TrendDirection) => {
    if (!direction) return Minus;
    switch (direction) {
      case TrendDirection.INCREASING: return TrendingUp;
      case TrendDirection.DECREASING: return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (direction?: TrendDirection) => {
    if (!direction) return 'text-gray-600';
    switch (direction) {
      case TrendDirection.INCREASING: return 'text-red-600';
      case TrendDirection.DECREASING: return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full" data-testid="peer-comparison">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
        </div>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Peer Comparison
        </CardTitle>
        <CardDescription>
          {currentCompany.sector} sector companies (ranked by CO-GRI)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Company Rank</div>
            <div className="text-xl font-bold text-primary">
              #{companyRank.rank} / {companyRank.total}
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Sector Average</div>
            <div className="text-xl font-bold text-primary">
              {sectorAverage.toFixed(1)}
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">vs. Average</div>
            <div className={`text-xl font-bold ${
              currentCompany.cogriScore > sectorAverage ? 'text-red-600' : 'text-green-600'
            }`}>
              {currentCompany.cogriScore > sectorAverage ? '+' : ''}
              {(currentCompany.cogriScore - sectorAverage).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Current Company Row (Highlighted) */}
        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-600 text-white">You</Badge>
              <div>
                <div className="font-semibold">{currentCompany.ticker}</div>
                <div className="text-sm text-muted-foreground">{currentCompany.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {currentCompany.cogriScore.toFixed(1)}
                </div>
                <RiskLevelBadge level={currentCompany.riskLevel} />
              </div>
              {currentCompany.delta_30D !== undefined && (
                <div className="flex items-center gap-1">
                  {React.createElement(
                    getTrendIcon(currentCompany.direction),
                    { className: `h-4 w-4 ${getTrendColor(currentCompany.direction)}` }
                  )}
                  <span className={`font-semibold ${getTrendColor(currentCompany.direction)}`}>
                    {currentCompany.delta_30D > 0 ? '+' : ''}
                    {currentCompany.delta_30D.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Peer Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('ticker')}
                >
                  <div className="flex items-center gap-1">
                    Company
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted text-right"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center justify-end gap-1">
                    CO-GRI
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Risk Level</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted text-right"
                  onClick={() => handleSort('delta')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Δ30D
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                {activeLens === 'Forecast Overlay' && (
                  <TableHead className="text-right">Outlook</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPeers.map((peer) => {
                const TrendIcon = getTrendIcon(peer.direction);
                const trendColor = getTrendColor(peer.direction);

                return (
                  <TableRow key={peer.ticker} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-semibold">{peer.ticker}</div>
                        <div className="text-xs text-muted-foreground">{peer.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {peer.CO_GRI.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <RiskLevelBadge level={peer.risk_level} />
                    </TableCell>
                    <TableCell className="text-right">
                      {peer.delta_30D !== undefined && (
                        <div className="flex items-center justify-end gap-1">
                          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                          <span className={`font-semibold ${trendColor}`}>
                            {peer.delta_30D > 0 ? '+' : ''}
                            {peer.delta_30D.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    {activeLens === 'Forecast Overlay' && (
                      <TableCell className="text-right">
                        <Badge variant="outline" className={
                          peer.forecast_outlook === 'Headwind' 
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : peer.forecast_outlook === 'Tailwind'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                        }>
                          {peer.forecast_outlook}
                        </Badge>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Sector Context */}
        <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          <p>
            <strong>{currentCompany.ticker}</strong> ranks <strong>#{companyRank.rank}</strong> out of{' '}
            <strong>{companyRank.total}</strong> companies in the {currentCompany.sector} sector, with a CO-GRI score{' '}
            <strong>
              {currentCompany.cogriScore > sectorAverage ? 'above' : 'below'}
            </strong>{' '}
            the sector average of <strong>{sectorAverage.toFixed(1)}</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PeerComparison;
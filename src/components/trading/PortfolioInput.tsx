/**
 * Portfolio Input (T4)
 * Input and manage portfolio holdings
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useTradingState } from '@/store/tradingState';
import { getSamplePortfolio } from '@/services/mockData/tradingDataGenerator';
import { Portfolio } from '@/types/trading';

export default function PortfolioInput() {
  const { currentPortfolio, setCurrentPortfolio } = useTradingState();
  const [portfolioName, setPortfolioName] = useState(currentPortfolio?.name || 'My Portfolio');

  const loadSamplePortfolio = (type: 'conservative' | 'balanced' | 'aggressive') => {
    const portfolio = getSamplePortfolio(type);
    setCurrentPortfolio(portfolio);
    setPortfolioName(portfolio.name);
  };

  const totalValue = currentPortfolio?.total_value || 0;
  const weightedCOGRI = currentPortfolio?.weighted_cogri || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Input</CardTitle>
        <CardDescription>Enter your portfolio holdings for optimization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portfolio Name */}
        <div className="space-y-2">
          <Label>Portfolio Name</Label>
          <Input
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            placeholder="Enter portfolio name"
          />
        </div>

        {/* Sample Portfolios */}
        <div className="space-y-2">
          <Label>Load Sample Portfolio</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSamplePortfolio('conservative')}
            >
              Conservative
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSamplePortfolio('balanced')}
            >
              Balanced
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSamplePortfolio('aggressive')}
            >
              Aggressive
            </Button>
          </div>
        </div>

        {/* Holdings Table */}
        {currentPortfolio && (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">CO-GRI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPortfolio.holdings.map((holding) => (
                    <TableRow key={holding.ticker}>
                      <TableCell className="font-medium">{holding.ticker}</TableCell>
                      <TableCell className="text-right">{holding.shares}</TableCell>
                      <TableCell className="text-right">${holding.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${holding.value.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{holding.weight.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{holding.cogri.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Portfolio Metrics */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-xs text-muted-foreground">Total Value</div>
                <div className="text-lg font-semibold">${totalValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Weighted CO-GRI</div>
                <div className="text-lg font-semibold">{weightedCOGRI.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Holdings</div>
                <div className="text-lg font-semibold">{currentPortfolio.holdings.length}</div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Add Holding
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
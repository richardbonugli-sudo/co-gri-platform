/**
 * Portfolio Input (T4)
 * Input and manage portfolio holdings
 *
 * FIXES:
 * - Add Holding: collapsible inline form with Ticker / Shares / Price fields
 * - Import CSV: hidden file input, parses ticker/shares/price columns
 * - Portfolio name onChange now persists to store via setCurrentPortfolio
 * - Delete holding: Trash2 icon button per row
 */

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTradingState } from '@/store/tradingState';
import { getSamplePortfolio } from '@/services/mockData/tradingDataGenerator';
import { Portfolio, Holding } from '@/types/trading';
import { useToast } from '@/components/ui/use-toast';

// ── helpers ──────────────────────────────────────────────────────────────────

function recalcPortfolioTotals(holdings: Holding[]): Pick<Portfolio, 'total_value' | 'weighted_cogri' | 'risk_score'> {
  const total_value = holdings.reduce((s, h) => s + h.value, 0);
  const totalWeight = holdings.reduce((s, h) => s + h.weight, 0) || 1;
  const weighted_cogri = holdings.reduce((s, h) => s + h.cogri * h.weight, 0) / totalWeight;
  return {
    total_value: Math.round(total_value * 100) / 100,
    weighted_cogri: Math.round(weighted_cogri * 10) / 10,
    risk_score: Math.round(weighted_cogri * 10) / 10,
  };
}

function rebuildWeights(holdings: Holding[]): Holding[] {
  const total = holdings.reduce((s, h) => s + h.value, 0) || 1;
  return holdings.map(h => ({
    ...h,
    weight: Math.round((h.value / total) * 1000) / 10, // one decimal %
  }));
}

// ── component ─────────────────────────────────────────────────────────────────

export default function PortfolioInput() {
  const { currentPortfolio, setCurrentPortfolio, signals } = useTradingState();
  const { toast } = useToast();

  const [portfolioName, setPortfolioName] = useState(currentPortfolio?.name || 'My Portfolio');

  // Add-holding dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [addError, setAddError] = useState('');

  // CSV import ref
  const csvInputRef = useRef<HTMLInputElement>(null);

  // ── portfolio name ──────────────────────────────────────────────────────────
  const handleNameChange = (value: string) => {
    setPortfolioName(value);
    if (currentPortfolio) {
      setCurrentPortfolio({ ...currentPortfolio, name: value });
    }
  };

  // ── sample portfolios ───────────────────────────────────────────────────────
  const loadSamplePortfolio = (type: 'conservative' | 'balanced' | 'aggressive') => {
    const portfolio = getSamplePortfolio(type);
    setCurrentPortfolio(portfolio);
    setPortfolioName(portfolio.name);
  };

  // ── look up cogri from live signals ────────────────────────────────────────
  const lookupCogri = (ticker: string): number => {
    const signal = signals.find(s => s.ticker.toUpperCase() === ticker.toUpperCase());
    return signal ? signal.current_cogri : 50;
  };

  const lookupSector = (ticker: string): string => {
    const signal = signals.find(s => s.ticker.toUpperCase() === ticker.toUpperCase());
    return signal ? signal.sector : 'Unknown';
  };

  const lookupCompanyName = (ticker: string): string => {
    const signal = signals.find(s => s.ticker.toUpperCase() === ticker.toUpperCase());
    return signal ? signal.company_name : `${ticker.toUpperCase()} Corp`;
  };

  // ── add holding ─────────────────────────────────────────────────────────────
  const handleAddHolding = () => {
    setAddError('');
    const ticker = newTicker.trim().toUpperCase();
    const shares = parseFloat(newShares);
    const price = parseFloat(newPrice);

    if (!ticker) { setAddError('Ticker is required.'); return; }
    if (isNaN(shares) || shares <= 0) { setAddError('Shares must be a positive number.'); return; }
    if (isNaN(price) || price <= 0) { setAddError('Price must be a positive number.'); return; }

    const value = Math.round(shares * price * 100) / 100;
    const cogri = lookupCogri(ticker);

    const baseHoldings = currentPortfolio?.holdings ?? [];

    // Check for duplicate
    if (baseHoldings.some(h => h.ticker.toUpperCase() === ticker)) {
      setAddError(`${ticker} is already in the portfolio. Remove it first to re-add.`);
      return;
    }

    const newHolding: Holding = {
      ticker,
      company_name: lookupCompanyName(ticker),
      shares,
      price,
      value,
      weight: 0, // recalculated below
      cogri,
      sector: lookupSector(ticker),
    };

    const updatedHoldings = rebuildWeights([...baseHoldings, newHolding]);
    const totals = recalcPortfolioTotals(updatedHoldings);

    const updatedPortfolio: Portfolio = currentPortfolio
      ? { ...currentPortfolio, ...totals, holdings: updatedHoldings, updated_at: new Date() }
      : {
          portfolio_id: `portfolio-${Date.now()}`,
          name: portfolioName,
          holdings: updatedHoldings,
          ...totals,
          created_at: new Date(),
          updated_at: new Date(),
        };

    setCurrentPortfolio(updatedPortfolio);
    toast({ title: `${ticker} added to portfolio` });

    // Reset form
    setNewTicker('');
    setNewShares('');
    setNewPrice('');
    setAddDialogOpen(false);
  };

  // ── delete holding ──────────────────────────────────────────────────────────
  const handleDeleteHolding = (ticker: string) => {
    if (!currentPortfolio) return;
    const updatedHoldings = rebuildWeights(
      currentPortfolio.holdings.filter(h => h.ticker !== ticker)
    );
    const totals = recalcPortfolioTotals(updatedHoldings);
    setCurrentPortfolio({ ...currentPortfolio, ...totals, holdings: updatedHoldings, updated_at: new Date() });
    toast({ title: `${ticker} removed from portfolio` });
  };

  // ── import CSV ──────────────────────────────────────────────────────────────
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          toast({ title: 'CSV must have a header row and at least one data row.', variant: 'destructive' });
          return;
        }

        // Detect header
        const header = lines[0].toLowerCase().split(',').map(h => h.trim());
        const tickerIdx = header.findIndex(h => h.includes('ticker') || h.includes('symbol') || h === 'tick');
        const sharesIdx = header.findIndex(h => h.includes('share') || h.includes('qty') || h.includes('quantity'));
        const priceIdx  = header.findIndex(h => h.includes('price') || h.includes('cost'));

        if (tickerIdx === -1 || sharesIdx === -1 || priceIdx === -1) {
          toast({ title: 'CSV must have columns: ticker, shares, price (headers are case-insensitive).', variant: 'destructive' });
          return;
        }

        const errors: string[] = [];
        const newHoldings: Holding[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          const ticker = cols[tickerIdx]?.toUpperCase();
          const shares = parseFloat(cols[sharesIdx]);
          const price  = parseFloat(cols[priceIdx]);

          if (!ticker) { errors.push(`Row ${i + 1}: missing ticker`); continue; }
          if (isNaN(shares) || shares <= 0) { errors.push(`Row ${i + 1}: invalid shares for ${ticker}`); continue; }
          if (isNaN(price)  || price  <= 0) { errors.push(`Row ${i + 1}: invalid price for ${ticker}`); continue; }

          newHoldings.push({
            ticker,
            company_name: lookupCompanyName(ticker),
            shares,
            price,
            value: Math.round(shares * price * 100) / 100,
            weight: 0,
            cogri: lookupCogri(ticker),
            sector: lookupSector(ticker),
          });
        }

        if (newHoldings.length === 0) {
          toast({ title: 'No valid rows found', description: `${errors.length} error(s): ${errors.slice(0, 3).join('; ')}`, variant: 'destructive' });
          return;
        }

        const builtHoldings = rebuildWeights(newHoldings);
        const totals = recalcPortfolioTotals(builtHoldings);
        const importedPortfolio: Portfolio = {
          portfolio_id: `portfolio-csv-${Date.now()}`,
          name: file.name.replace(/\.csv$/i, '') || portfolioName,
          holdings: builtHoldings,
          ...totals,
          created_at: new Date(),
          updated_at: new Date(),
        };

        setCurrentPortfolio(importedPortfolio);
        setPortfolioName(importedPortfolio.name);

        const msg = errors.length > 0
          ? `Imported ${newHoldings.length} holdings (${errors.length} row(s) skipped)`
          : `Successfully imported ${newHoldings.length} holdings`;
        toast({ title: msg });

        if (errors.length > 0) {
          console.warn('[PortfolioInput] CSV import warnings:', errors);
        }
      } catch (err) {
        toast({ title: 'Failed to parse CSV file. Please check the format and try again.', variant: 'destructive' });
        console.error('[PortfolioInput] CSV parse error:', err);
      } finally {
        // Reset file input so the same file can be re-imported
        if (csvInputRef.current) csvInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
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
            onChange={(e) => handleNameChange(e.target.value)}
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
        {currentPortfolio && currentPortfolio.holdings.length > 0 && (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">CO-GRI</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPortfolio.holdings.map((holding) => (
                    <TableRow key={holding.ticker}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {holding.ticker}
                          {holding.cogri < 40 && (
                            <Badge variant="default" className="text-[10px] px-1 py-0 bg-green-600">Low Risk</Badge>
                          )}
                          {holding.cogri > 65 && (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0">High Risk</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{holding.shares}</TableCell>
                      <TableCell className="text-right">${holding.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${holding.value.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{holding.weight.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <span className={
                          holding.cogri < 40 ? 'text-green-600 font-semibold' :
                          holding.cogri > 65 ? 'text-red-600 font-semibold' :
                          'text-amber-600 font-semibold'
                        }>
                          {holding.cogri.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteHolding(holding.ticker)}
                          title={`Remove ${holding.ticker}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
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

        {/* Empty state */}
        {(!currentPortfolio || currentPortfolio.holdings.length === 0) && (
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <p className="text-sm">No holdings yet.</p>
            <p className="text-xs mt-1">Load a sample portfolio or add holdings manually.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Add Holding Dialog */}
          <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) setAddError(''); }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add Holding
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Add Holding</DialogTitle>
                <DialogDescription>
                  Enter the ticker, number of shares, and current price. CO-GRI will be looked up automatically from live signals.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="add-ticker">Ticker Symbol</Label>
                  <Input
                    id="add-ticker"
                    placeholder="e.g. AAPL"
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHolding()}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="add-shares">Shares</Label>
                    <Input
                      id="add-shares"
                      type="number"
                      placeholder="e.g. 100"
                      min="0"
                      step="any"
                      value={newShares}
                      onChange={(e) => setNewShares(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="add-price">Price ($)</Label>
                    <Input
                      id="add-price"
                      type="number"
                      placeholder="e.g. 185.50"
                      min="0"
                      step="any"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Preview value */}
                {newShares && newPrice && !isNaN(parseFloat(newShares)) && !isNaN(parseFloat(newPrice)) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>
                      Position value: <strong>${(parseFloat(newShares) * parseFloat(newPrice)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                      {newTicker && (
                        <> · CO-GRI: <strong>{lookupCogri(newTicker).toFixed(1)}</strong></>
                      )}
                    </span>
                  </div>
                )}

                {addError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {addError}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddHolding}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Holding
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Import CSV */}
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => csvInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCSVImport}
          />
        </div>

        {/* CSV format hint */}
        <p className="text-xs text-muted-foreground">
          CSV format: <code className="bg-muted px-1 rounded">ticker, shares, price</code> (header row required)
        </p>
      </CardContent>
    </Card>
  );
}
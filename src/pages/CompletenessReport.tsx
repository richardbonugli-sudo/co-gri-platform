import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, CheckCircle2, AlertTriangle, XCircle, FileText, Filter, Search } from 'lucide-react';
import { CompletenessReportService } from '@/services/completeness';
import type { CountryVectorBaseline, CompletenessValidationResult } from '@/services/completeness';

export default function CompletenessReport() {
  const [validationResult, setValidationResult] = useState<CompletenessValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vectorFilter, setVectorFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = () => {
    setLoading(true);
    try {
      const result = CompletenessReportService.validateCompleteness();
      setValidationResult(result);
    } catch (error) {
      console.error('Error generating completeness report:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatrix = useMemo(() => {
    if (!validationResult) return [];

    let filtered = validationResult.matrix;

    if (searchTerm) {
      filtered = filtered.filter(
        row =>
          row.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.vector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (vectorFilter !== 'all') {
      filtered = filtered.filter(row => row.vector === vectorFilter);
    }

    if (qualityFilter !== 'all') {
      filtered = filtered.filter(row => row.dataQuality === qualityFilter);
    }

    return filtered;
  }, [validationResult, searchTerm, vectorFilter, qualityFilter]);

  const paginatedMatrix = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredMatrix.slice(startIndex, endIndex);
  }, [filteredMatrix, currentPage]);

  const totalPages = Math.ceil(filteredMatrix.length / rowsPerPage);

  const handleExportCSV = () => {
    if (validationResult) {
      CompletenessReportService.downloadCSV(
        validationResult.matrix,
        `completeness-report-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case 'Complete':
        return <Badge className="bg-green-500 hover:bg-green-600">Complete</Badge>;
      case 'Fallback Applied':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Fallback</Badge>;
      case 'Missing':
        return <Badge variant="destructive">Missing</Badge>;
      default:
        return <Badge variant="outline">{quality}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-xl">Generating Completeness Report...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!validationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628] p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Failed to generate completeness report.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const { statistics, validationErrors, validationWarnings } = validationResult;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Baseline Completeness Report</h1>
            <p className="text-gray-400">
              Comprehensive validation of country-vector baseline matrix
            </p>
          </div>
          <Button
            onClick={handleExportCSV}
            className="bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e]"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validationWarnings.length > 0 && (
          <Alert className="border-yellow-500 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500">Warnings</AlertTitle>
            <AlertDescription className="text-yellow-400">
              <ul className="list-disc list-inside space-y-1 mt-2">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validationErrors.length === 0 && (
          <Alert className="border-green-500 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-500">Validation Passed</AlertTitle>
            <AlertDescription className="text-green-400">
              All baseline data validation checks passed successfully.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-[#0d5f5f]/20 border-[#0d5f5f]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Total Rows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#7fa89f]">{statistics.totalRows}</div>
              <p className="text-xs text-gray-400 mt-1">
                {statistics.countriesCount} countries × {statistics.vectorsCount} vectors
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0d5f5f]/20 border-[#0d5f5f]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Complete Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{statistics.completeRows}</div>
              <p className="text-xs text-gray-400 mt-1">
                {statistics.completenessPercentage}% completeness
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0d5f5f]/20 border-[#0d5f5f]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Fallback Applied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{statistics.fallbackRows}</div>
              <p className="text-xs text-gray-400 mt-1">
                {statistics.fallbackPercentage}% using fallback
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0d5f5f]/20 border-[#0d5f5f]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Missing Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{statistics.missingRows}</div>
              <p className="text-xs text-gray-400 mt-1">
                {statistics.missingRows === 0 ? 'No gaps' : 'Requires attention'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#0d5f5f]/20 border-[#0d5f5f]/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription className="text-gray-400">
              Filter and search the baseline matrix
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search country or vector..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 bg-[#0a1628] border-[#0d5f5f]/30 text-white"
                />
              </div>

              <Select
                value={vectorFilter}
                onValueChange={(value) => {
                  setVectorFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="bg-[#0a1628] border-[#0d5f5f]/30 text-white">
                  <SelectValue placeholder="Filter by vector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vectors</SelectItem>
                  <SelectItem value="Military Threat">Military Threat</SelectItem>
                  <SelectItem value="Economic Sanctions">Economic Sanctions</SelectItem>
                  <SelectItem value="Diplomatic Crisis">Diplomatic Crisis</SelectItem>
                  <SelectItem value="Territorial Dispute">Territorial Dispute</SelectItem>
                  <SelectItem value="Political Instability">Political Instability</SelectItem>
                  <SelectItem value="Cyber Warfare">Cyber Warfare</SelectItem>
                  <SelectItem value="Trade Restrictions">Trade Restrictions</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={qualityFilter}
                onValueChange={(value) => {
                  setQualityFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="bg-[#0a1628] border-[#0d5f5f]/30 text-white">
                  <SelectValue placeholder="Filter by quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quality Levels</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="Fallback Applied">Fallback Applied</SelectItem>
                  <SelectItem value="Missing">Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0d5f5f]/20 border-[#0d5f5f]/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Baseline Matrix
            </CardTitle>
            <CardDescription className="text-gray-400">
              Showing {paginatedMatrix.length} of {filteredMatrix.length} rows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-[#0d5f5f]/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#0d5f5f]/30 hover:bg-[#0d5f5f]/10">
                    <TableHead className="text-gray-300">Country</TableHead>
                    <TableHead className="text-gray-300">Vector</TableHead>
                    <TableHead className="text-gray-300 text-right">Baseline Value</TableHead>
                    <TableHead className="text-gray-300">Source</TableHead>
                    <TableHead className="text-gray-300">Fallback Method</TableHead>
                    <TableHead className="text-gray-300">Quality</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMatrix.map((row, index) => (
                    <TableRow
                      key={`${row.country}-${row.vector}-${index}`}
                      className="border-[#0d5f5f]/30 hover:bg-[#0d5f5f]/10"
                    >
                      <TableCell className="text-white font-medium">{row.country}</TableCell>
                      <TableCell className="text-gray-300">{row.vector}</TableCell>
                      <TableCell className="text-gray-300 text-right">
                        {row.baselineValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-300">{row.sourceAttribution}</TableCell>
                      <TableCell className="text-gray-300">
                        {row.fallbackMethod || 'N/A'}
                      </TableCell>
                      <TableCell>{getQualityBadge(row.dataQuality)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="border-[#0d5f5f]/30 text-white hover:bg-[#0d5f5f]/20"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="border-[#0d5f5f]/30 text-white hover:bg-[#0d5f5f]/20"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

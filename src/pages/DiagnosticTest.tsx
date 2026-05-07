/**
 * Diagnostic Test Page
 * 
 * Tests SEC parser to diagnose why fallback is being triggered incorrectly
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { runMultipleDiagnostics, DiagnosticResult } from '@/services/diagnosticParser';
import { Loader2 } from 'lucide-react';

export default function DiagnosticTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      const diagnosticResults = await runMultipleDiagnostics(['AAPL', 'BABA', 'TSLA']);
      setResults(diagnosticResults);
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">SEC Parser Diagnostic</h1>
          <p className="text-lg text-slate-600">
            Test what the SEC parser is actually returning for AAPL, BABA, and TSLA
          </p>
          
          <Button 
            onClick={runDiagnostics} 
            disabled={loading}
            size="lg"
            className="mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              'Run Diagnostics'
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result) => (
              <Card key={result.ticker} className="border-2">
                <CardHeader>
                  <CardTitle className="text-2xl">{result.ticker}</CardTitle>
                  <CardDescription>
                    Parsing Success: {result.parsingSuccess ? '✅ Yes' : '❌ No'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Revenue Section */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      Revenue Channel {result.revenueTableFound ? '✅' : '❌'}
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <p>Table Found: <span className="font-mono">{result.revenueTableFound.toString()}</span></p>
                      <p>Segments Count: <span className="font-mono">{result.revenueSegmentsCount}</span></p>
                      <p>Total Coverage: <span className="font-mono">{result.totalRevenuePercentage.toFixed(1)}%</span></p>
                      
                      {result.revenueSegments.length > 0 && (
                        <div className="mt-4">
                          <p className="font-semibold mb-2">Segments:</p>
                          <div className="space-y-1">
                            {result.revenueSegments.map((seg, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{seg.region}</span>
                                <span className="font-mono">{seg.percentage.toFixed(2)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PP&E Section */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      Physical Assets Channel {result.ppeTableFound ? '✅' : '❌'}
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <p>Table Found: <span className="font-mono">{result.ppeTableFound.toString()}</span></p>
                      <p>Segments Count: <span className="font-mono">{result.ppeSegmentsCount}</span></p>
                      <p>Total Coverage: <span className="font-mono">{result.totalPPEPercentage.toFixed(1)}%</span></p>
                      
                      {result.ppeSegments.length > 0 && (
                        <div className="mt-4">
                          <p className="font-semibold mb-2">Segments:</p>
                          <div className="space-y-1">
                            {result.ppeSegments.map((seg, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{seg.region}</span>
                                <span className="font-mono">{seg.percentage.toFixed(2)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Debt Section */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      Financial Channel {result.debtTableFound ? '✅' : '❌'}
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <p>Table Found: <span className="font-mono">{result.debtTableFound.toString()}</span></p>
                      <p>Securities Count: <span className="font-mono">{result.debtSecuritiesCount}</span></p>
                    </div>
                  </div>

                  {/* Other Data */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Other Evidence</h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <p>Supplier Locations: <span className="font-mono">{result.supplierLocationsCount}</span></p>
                      <p>Facility Locations: <span className="font-mono">{result.facilityLocationsCount}</span></p>
                      <p>Treasury Centers: <span className="font-mono">{result.treasuryCentersCount}</span></p>
                      <p>Sections Found: <span className="font-mono">{result.sectionsFound.join(', ') || 'none'}</span></p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Diagnosis</h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-1">
                      {result.diagnosis.map((diag, idx) => (
                        <p key={idx} className={`text-sm ${
                          diag.startsWith('❌') ? 'text-red-600 font-semibold' :
                          diag.startsWith('⚠️') ? 'text-amber-600' :
                          'text-green-600'
                        }`}>
                          {diag}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Errors */}
                  {result.parsingErrors.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-red-600">Parsing Errors</h3>
                      <div className="bg-red-50 p-4 rounded-lg space-y-1">
                        {result.parsingErrors.map((error, idx) => (
                          <p key={idx} className="text-sm text-red-700">{error}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
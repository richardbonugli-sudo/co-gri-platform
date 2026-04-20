/**
 * V4 Debug Download Component
 * 
 * UI component for downloading V.4 debug bundles
 * Always visible - no debug mode toggle required
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, FileJson, FileText, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface V4DebugDownloadProps {
  ticker: string;
  companyName: string;
  onDownload: (format: 'pdf' | 'json' | 'both') => Promise<void>;
  isLoading?: boolean;
}

export function V4DebugDownload({
  ticker,
  companyName,
  onDownload,
  isLoading = false
}: V4DebugDownloadProps) {
  
  const [format, setFormat] = useState<'pdf' | 'json' | 'both'>('pdf');
  const [downloading, setDownloading] = useState(false);
  
  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload(format);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };
  
  return (
    <Card className="border-blue-500 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              V.4 Debug Bundle Export
            </CardTitle>
            <CardDescription>
              Download comprehensive allocation analysis for {ticker}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Debug bundles contain detailed evidence extraction, decision tracing, 
            integrity checks, and UI mapping validation for all 4 channels 
            (Revenue, Supply, Assets, Financial/Operations).
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Export Format</Label>
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'pdf' | 'json' | 'both')}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-blue-100 transition-colors">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer flex-1">
                <FileText className="h-4 w-4 text-red-600" />
                <div>
                  <div className="font-medium">Single Comprehensive PDF</div>
                  <div className="text-xs text-gray-600">
                    All 4 channels in one document with cover page, TOC, and validation checklist
                  </div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-blue-100 transition-colors">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer flex-1">
                <FileJson className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">4 Separate JSON Files</div>
                  <div className="text-xs text-gray-600">
                    One JSON file per channel for programmatic analysis
                  </div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-blue-100 transition-colors">
              <RadioGroupItem value="both" id="both" />
              <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer flex-1">
                <Package className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-medium">Both PDF and JSON</div>
                  <div className="text-xs text-gray-600">
                    Complete package with both formats
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <Button
          onClick={handleDownload}
          disabled={downloading || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Download className="mr-2 h-4 w-4" />
          {downloading ? 'Generating...' : `Download ${format.toUpperCase()}`}
        </Button>
        
        <div className="text-xs text-gray-600 space-y-1">
          <div className="font-semibold">What's included:</div>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Engine metadata (version, run ID, cache status)</li>
            <li>Step-0 evidence (table detection, structured items, narrative)</li>
            <li>Step-1 decision trace (allocation logic, fallback choices)</li>
            <li>Integrity checks (double-counting detection, provenance)</li>
            <li>UI mapping audit (computation vs display validation)</li>
            <li>Revenue-specific details (per-segment allocations)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
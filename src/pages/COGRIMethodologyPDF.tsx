import React, { useEffect, useState } from 'react';
import { PDFExport } from '@/components/PDFExport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, FileText } from 'lucide-react';
import { useLocation } from 'wouter';

const COGRIMethodologyPDF: React.FC = () => {
  const [, setLocation] = useLocation();
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMethodology = async () => {
      try {
        const response = await fetch('/docs/COGRI_METHODOLOGY_COMPLETE.md');
        if (!response.ok) {
          throw new Error('Failed to load methodology document');
        }
        const content = await response.text();
        setMarkdownContent(content);
      } catch (err) {
        console.error('Error loading methodology:', err);
        setError('Failed to load methodology document. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMethodology();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading methodology document...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-destructive">{error}</p>
              <Button onClick={() => setLocation('/')}>Return Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Title Section */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl">CO-GRI Methodology Documentation</CardTitle>
                <CardDescription className="text-base mt-2">
                  Complete Technical Documentation - Version 3.4 with Phase 5D Predictive Forecasting
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">Pages</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">11</p>
                <p className="text-sm text-muted-foreground">Chapters</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">3</p>
                <p className="text-sm text-muted-foreground">Case Studies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Export Component */}
        <PDFExport
          markdownContent={markdownContent}
          filename="COGRI_Methodology_v3.4.pdf"
          title="Corporate Geopolitical Risk Index (CO-GRI) Methodology - Complete Technical Documentation"
          showPreview={true}
        />

        {/* Document Overview */}
        <Card>
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
            <CardDescription>
              Comprehensive documentation covering all aspects of the CO-GRI methodology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs text-primary">1</span>
                  Core Methodology
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8 list-disc">
                  <li>Four-Channel Model (Revenue, Supply, Assets, Financial)</li>
                  <li>Country Shock Index (CSI) Framework</li>
                  <li>Sector Multipliers & Political Alignment Factors</li>
                  <li>Complete Mathematical Formulas</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs text-primary">2</span>
                  Predictive Forecasting
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8 list-disc">
                  <li>Cedar Owl 2026 Integration</li>
                  <li>Multi-Horizon Forecasts (6m, 1y, 2y, 5y)</li>
                  <li>Three-Scenario Analysis Framework</li>
                  <li>Confidence Calculation Methods</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs text-primary">3</span>
                  Assessment Process
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8 list-disc">
                  <li>Data Collection Workflow</li>
                  <li>Channel Decomposition Methods</li>
                  <li>Quality Assurance Steps</li>
                  <li>Validation & Sensitivity Analysis</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs text-primary">4</span>
                  Practical Applications
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8 list-disc">
                  <li>Real-World Case Studies (Apple, Coca-Cola, Tesla)</li>
                  <li>Interpretation Guidelines</li>
                  <li>Investment Decision Framework</li>
                  <li>Reference Tables & Appendices</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Version:</strong> 3.4 with Phase 5D Predictive Forecasting
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Last Updated:</strong> January 2027
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Authors:</strong> CO-GRI Research Team
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default COGRIMethodologyPDF;
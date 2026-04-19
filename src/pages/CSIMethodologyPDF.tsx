import React, { useEffect, useState } from 'react';
import { PDFExport } from '@/components/PDFExport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, FileText } from 'lucide-react';
import { useLocation } from 'wouter';

const CSIMethodologyPDF: React.FC = () => {
  const [, setLocation] = useLocation();
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMethodology = async () => {
      try {
        const response = await fetch('/docs/CSI_METHODOLOGY_COMPLETE.md');
        if (!response.ok) {
          throw new Error('Failed to load CSI methodology document');
        }
        const content = await response.text();
        setMarkdownContent(content);
      } catch (err) {
        console.error('Error loading CSI methodology:', err);
        setError('Failed to load CSI methodology document. Please try again later.');
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
              <p className="text-muted-foreground">Loading CSI methodology document...</p>
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
                <CardTitle className="text-3xl">CSI Methodology Documentation</CardTitle>
                <CardDescription className="text-base mt-2">
                  Country Shock Index - Complete Technical Documentation Version 4.0 (Factor-Scoped Architecture)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">60+</p>
                <p className="text-sm text-muted-foreground">Pages</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">11</p>
                <p className="text-sm text-muted-foreground">Chapters</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">7</p>
                <p className="text-sm text-muted-foreground">Risk Factors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Export Component */}
        <PDFExport
          markdownContent={markdownContent}
          filename="CSI_Methodology_v4.0.pdf"
          title="Country Shock Index (CSI) Methodology - Complete Technical Documentation"
          showPreview={true}
        />

        {/* Document Overview */}
        <Card>
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
            <CardDescription>
              Comprehensive documentation covering the factor-scoped CSI methodology with binding acceptance criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs text-primary">1</span>
                  Purpose and Core Definition
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8 list-disc">
                  <li>Expectation-weighted geopolitical stress measurement</li>
                  <li>Near-term focused, dynamic and directional</li>
                  <li>Explicit separation: baseline, drift, event deltas</li>
                  <li>Full auditability requirements</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs text-primary">2</span>
                  Seven CSI Risk Factors
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8 list-disc">
                  <li>Factor-scoped architecture (all operations per factor)</li>
                  <li>No macroeconomic or environmental contamination</li>
                  <li>Cross-factor operations prohibited</li>
                  <li>Factor-level audit trail</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs text-primary">3</span>
                  Source Role Enforcement
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8 list-disc">
                  <li>Detection sources: generate signals only</li>
                  <li>Confirmation sources: validate events only</li>
                  <li>Baseline sources: structural priors only</li>
                  <li>No source serves all three roles</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs text-primary">4</span>
                  Escalation & Event Engines
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8 list-disc">
                  <li>Expectation-based probability (not frequency)</li>
                  <li>Factor-scoped drift accumulation</li>
                  <li>Events inherit factor from signals</li>
                  <li>Factor-scoped netting only</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs text-primary">5</span>
                  Decay & Netting Systems
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8 list-disc">
                  <li>Factor-scoped decay scheduling</li>
                  <li>Netting within same country AND factor only</li>
                  <li>Diminishing returns strategy</li>
                  <li>Prevents double-counting</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs text-primary">6</span>
                  Acceptance Criteria
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8 list-disc">
                  <li>Binding compliance requirements</li>
                  <li>7 non-compliance conditions defined</li>
                  <li>Confidence as metadata only</li>
                  <li>Appendix B as authoritative reference</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle>Key Methodology Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Seven CSI Risk Factors</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc ml-4">
                  <li>Conflict & Security (20%)</li>
                  <li>Sanctions & Regulatory Pressure (18%)</li>
                  <li>Trade & Logistics Disruption (15%)</li>
                  <li>Governance & Rule of Law (17%)</li>
                  <li>Cyber & Data Sovereignty (10%)</li>
                  <li>Public Unrest & Civil Stability (12%)</li>
                  <li>Currency & Capital Controls (8%)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Risk Score Ranges</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc ml-4">
                  <li>0-25: Low Risk</li>
                  <li>25-40: Moderate Risk</li>
                  <li>40-60: High Risk</li>
                  <li>60-100: Very High Risk</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Factor-Scoped Architecture</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc ml-4">
                  <li>All operations per factor</li>
                  <li>No cross-factor drift/netting</li>
                  <li>Factor-level audit trail</li>
                  <li>Explicit factor breakdown in outputs</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900">Core Properties</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc ml-4">
                  <li>Expectation-weighted (not purely reactive)</li>
                  <li>Near-term focused</li>
                  <li>Dynamic and directional</li>
                  <li>Fully auditable</li>
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
                <strong>Version:</strong> 4.0 - Factor-Scoped Architecture with Binding Acceptance Criteria
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Last Updated:</strong> February 2026
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Authors:</strong> CO-GRI Research Team
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                This document provides a standalone methodology specification with seven CSI risk factors, factor-scoped operations, source role enforcement, and binding implementation acceptance criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CSIMethodologyPDF;
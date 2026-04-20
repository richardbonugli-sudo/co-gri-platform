import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { generateCompanyOutlook } from '@/services/forecast/companyOutlookAggregator';
import type { CompanyOutlook } from '@/types/forecastCompany';

const StrategicForecast = () => {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outlook, setOutlook] = useState<CompanyOutlook | null>(null);

  const handleAnalyze = async () => {
    if (!ticker.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setOutlook(null);

    try {
      const result = await generateCompanyOutlook(ticker.toUpperCase());
      setOutlook(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate outlook');
    } finally {
      setLoading(false);
    }
  };

  const getImpactBadgeVariant = (impact: string) => {
    switch (impact) {
      case 'negative':
        return 'destructive';
      case 'positive':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'negative':
        return <TrendingDown className="w-4 h-4" />;
      case 'positive':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 font-bold';
      case 'medium':
        return 'text-yellow-600 font-semibold';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Strategic Forecast Baseline</h1>
          <p className="text-slate-600">Company-specific geopolitical outlook analysis</p>
        </div>

        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Company Outlook</CardTitle>
            <CardDescription>Enter a ticker symbol to analyze geopolitical risk exposure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="e.g., AAPL, MSFT, TSLA"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                className="max-w-xs"
              />
              <Button onClick={handleAnalyze} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze'
                )}
              </Button>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {outlook && (
          <div className="space-y-6">
            {/* Header Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl">{outlook.companyName}</CardTitle>
                    <CardDescription className="text-lg mt-1">
                      {outlook.ticker} • {outlook.sector}
                    </CardDescription>
                    <p className="text-sm text-slate-600 mt-2">{outlook.horizon}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={getImpactBadgeVariant(outlook.netImpact)} className="text-lg px-4 py-2">
                      {getImpactIcon(outlook.netImpact)}
                      <span className="ml-2 capitalize">{outlook.netImpact} Impact</span>
                    </Badge>
                    <div className="flex items-center gap-2">
                      {outlook.confidence === 'high' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="text-sm capitalize">{outlook.confidence} Confidence</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Narrative Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed text-slate-700">{outlook.narrativeSummary}</p>
              </CardContent>
            </Card>

            {/* Event Relevance Section */}
            <Card>
              <CardHeader>
                <CardTitle>Relevant Geopolitical Events</CardTitle>
                <CardDescription>
                  Top {outlook.relevantEvents.length} events affecting {outlook.companyName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {outlook.relevantEvents.map((event, idx) => (
                    <div key={idx} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg text-slate-900">{event.event}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline">{event.probability}% probability</Badge>
                          <Badge variant="secondary">Score: {event.relevanceScore.toFixed(1)}</Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-slate-700 mb-2">Relevance Factors:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {event.relevanceReasons.map((reason, ridx) => (
                            <li key={ridx} className="text-sm text-slate-600">
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Exposure Pathways Section */}
            <Card>
              <CardHeader>
                <CardTitle>Exposure Pathways Analysis</CardTitle>
                <CardDescription>Impact assessment across four business channels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outlook.channelPathways.map((pathway, idx) => (
                    <div
                      key={idx}
                      className={`border-2 rounded-lg p-4 ${
                        pathway.impact === 'negative'
                          ? 'border-red-200 bg-red-50'
                          : pathway.impact === 'positive'
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-lg">{pathway.channel}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={getImpactBadgeVariant(pathway.impact)}>
                            {getImpactIcon(pathway.impact)}
                            <span className="ml-1 capitalize">{pathway.impact}</span>
                          </Badge>
                          <span className={`text-sm ${getSeverityColor(pathway.severity)} uppercase`}>
                            {pathway.severity}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mb-3">{pathway.explanation}</p>
                      <div className="flex flex-wrap gap-1">
                        {pathway.affectedCountries.map((country, cidx) => (
                          <Badge key={cidx} variant="outline" className="text-xs">
                            {country}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bottom-Line Interpretation */}
            <Card>
              <CardHeader>
                <CardTitle>Bottom-Line Interpretation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-slate-100 rounded-lg p-4">
                    <p className="font-semibold text-slate-900 mb-2">Net Direction:</p>
                    <p className="text-lg capitalize">{outlook.bottomLineInterpretation.netDirection}</p>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-slate-700 leading-relaxed">
                      <span className="font-semibold">Primary Driver: </span>
                      {outlook.bottomLineInterpretation.primaryDriver}
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      <span className="font-semibold">Key Channel: </span>
                      {outlook.bottomLineInterpretation.primaryChannel}
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      <span className="font-semibold">Offsets: </span>
                      {outlook.bottomLineInterpretation.offsets.join(', ') || 'None'}
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      <span className="font-semibold">Conclusion: </span>
                      {outlook.bottomLineInterpretation.conclusion}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantitative Support */}
            {outlook.quantitativeSupport && (
              <Card>
                <CardHeader>
                  <CardTitle>Quantitative Support</CardTitle>
                  <CardDescription>CO-GRI score adjustments and channel contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-4">CO-GRI Scores</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-100 rounded">
                          <span className="text-sm">Structural CO-GRI:</span>
                          <span className="font-bold text-lg">
                            {outlook.quantitativeSupport.structuralCOGRI.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-100 rounded">
                          <span className="text-sm">Forecast-Adjusted CO-GRI:</span>
                          <span className="font-bold text-lg">
                            {outlook.quantitativeSupport.forecastAdjustedCOGRI.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-100 rounded">
                          <span className="text-sm">Directional Change:</span>
                          <Badge variant={getImpactBadgeVariant(
                            outlook.quantitativeSupport.directionalChange === 'up' ? 'negative' :
                            outlook.quantitativeSupport.directionalChange === 'down' ? 'positive' : 'neutral'
                          )}>
                            {outlook.quantitativeSupport.directionalChange === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
                            {outlook.quantitativeSupport.directionalChange === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
                            {outlook.quantitativeSupport.directionalChange === 'neutral' && <Minus className="w-4 h-4 mr-1" />}
                            {outlook.quantitativeSupport.directionalChange}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Channel Contributions</h4>
                      <div className="space-y-2">
                        {Object.entries(outlook.quantitativeSupport.channelContributions).map(([channel, contribution]) => (
                          <div key={channel} className="flex justify-between items-center p-2 border rounded">
                            <span className="text-sm font-medium">{channel}:</span>
                            <span
                              className={`font-semibold ${
                                contribution > 0 ? 'text-red-600' : contribution < 0 ? 'text-green-600' : 'text-gray-600'
                              }`}
                            >
                              {contribution > 0 ? '+' : ''}
                              {contribution.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategicForecast;
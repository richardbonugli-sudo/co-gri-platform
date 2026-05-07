/**
 * CSI Event Review - Manual review queue for event candidates
 * 
 * Displays candidates pending manual review with options to confirm, reject, or edit.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle, XCircle, ExternalLink, AlertCircle, Info } from 'lucide-react';
import { Link } from 'wouter';
import { getManualReviewQueue, removeFromReviewQueue, getSchedulerStatus } from '@/services/csi/detection/detectionScheduler';
import { createEventFromCandidate } from '@/services/csi/detection/autoEventCreator';
import { getDetectionMetrics, getDetectionLogs } from '@/services/csi/detection/detectionMonitor';
import type { EventCandidate } from '@/services/csi';

export default function CSIEventReview() {
  const [candidates, setCandidates] = useState<EventCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<EventCandidate | null>(null);
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterVector, setFilterVector] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);

  useEffect(() => {
    loadCandidates();
    loadSchedulerStatus();
  }, []);

  const loadCandidates = () => {
    const queue = getManualReviewQueue();
    setCandidates(queue);
  };

  const loadSchedulerStatus = () => {
    const status = getSchedulerStatus();
    setSchedulerStatus(status);
  };

  const handleConfirm = async (candidate: EventCandidate) => {
    try {
      setError('');
      setSuccess('');
      
      await createEventFromCandidate(candidate, true);
      removeFromReviewQueue(candidate.candidate_id);
      
      setSuccess(`Event confirmed for ${candidate.country}: ${candidate.description}`);
      loadCandidates();
      setSelectedCandidate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm event');
    }
  };

  const handleReject = (candidate: EventCandidate) => {
    if (confirm('Are you sure you want to reject this candidate?')) {
      removeFromReviewQueue(candidate.candidate_id);
      setSuccess(`Candidate rejected: ${candidate.candidate_id}`);
      loadCandidates();
      setSelectedCandidate(null);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (filterCountry && !candidate.country.toLowerCase().includes(filterCountry.toLowerCase())) {
      return false;
    }
    if (filterVector && candidate.primary_vector !== filterVector) {
      return false;
    }
    return true;
  });

  const metrics = getDetectionMetrics();
  const recentLogs = getDetectionLogs(5);

  return (
    <div className="min-h-screen bg-[#0f1e2e] text-white">
      {/* Header */}
      <header className="bg-[#0d5f5f] py-4 px-8 border-b border-gray-700">
        <div className="max-w-7xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-[#0a4d4d] gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-semibold">Back to Home</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">CSI Event Review</h1>
            <p className="text-sm text-gray-200">Manual review queue for detected event candidates</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Browser Warning */}
        {schedulerStatus?.isBrowser && (
          <Alert className="mb-4 bg-blue-900/20 border-blue-800">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-blue-300">
              <strong>Note:</strong> Automated RSS feed detection requires a Node.js environment. 
              In the browser, you can view the manual review queue and manage existing candidates, 
              but automatic feed fetching is disabled. For full automation, run the detection pipeline 
              in a server-side environment.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-4 bg-red-900/20 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-900/20 border-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="queue">Review Queue ({candidates.length})</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="logs">Recent Runs</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            {/* Filters */}
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">Country</Label>
                    <Input
                      value={filterCountry}
                      onChange={(e) => setFilterCountry(e.target.value)}
                      placeholder="Filter by country..."
                      className="bg-[#1a2332] border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-200">Vector</Label>
                    <Select value={filterVector} onValueChange={setFilterVector}>
                      <SelectTrigger className="bg-[#1a2332] border-gray-700 text-white">
                        <SelectValue placeholder="All vectors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All vectors</SelectItem>
                        <SelectItem value="SC1">SC1 - Conflict</SelectItem>
                        <SelectItem value="SC2">SC2 - Sanctions</SelectItem>
                        <SelectItem value="SC3">SC3 - Trade</SelectItem>
                        <SelectItem value="SC4">SC4 - Governance</SelectItem>
                        <SelectItem value="SC5">SC5 - Capital</SelectItem>
                        <SelectItem value="SC6">SC6 - Unrest</SelectItem>
                        <SelectItem value="SC7">SC7 - Cyber</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidate List */}
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Pending Review ({filteredCandidates.length})</CardTitle>
                <CardDescription className="text-gray-200">
                  Event candidates requiring manual verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredCandidates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-2">No candidates pending review</p>
                    {schedulerStatus?.isBrowser && (
                      <p className="text-gray-500 text-sm">
                        Automated detection is disabled in browser. Run detection in Node.js environment to populate the queue.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCandidates.map(candidate => (
                      <div
                        key={candidate.candidate_id}
                        className="bg-[#1a2332] p-4 rounded border border-gray-700 hover:border-[#0d5f5f] cursor-pointer"
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-blue-600 text-white">
                                {candidate.event_type}
                              </Badge>
                              <span className="text-white font-semibold">{candidate.country}</span>
                              <span className="text-gray-400 text-sm">•</span>
                              <span className="text-gray-400 text-sm">{candidate.primary_vector}</span>
                              <Badge className={`${
                                candidate.confidence >= 75 ? 'bg-green-600' :
                                candidate.confidence >= 65 ? 'bg-yellow-600' :
                                'bg-orange-600'
                              } text-white`}>
                                {candidate.confidence.toFixed(1)}% confidence
                              </Badge>
                            </div>
                            <p className="text-gray-200 text-sm mb-2">{candidate.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>{candidate.source_articles.length} source(s)</span>
                              <span>Detected: {new Date(candidate.detected_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirm(candidate);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(candidate);
                              }}
                              className="border-red-600 text-red-600 hover:bg-red-600/10"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Candidate Details */}
            {selectedCandidate && (
              <Card className="bg-[#0f1e2e] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Candidate Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Country</Label>
                      <p className="text-white">{selectedCandidate.country}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Event Type</Label>
                      <p className="text-white">{selectedCandidate.event_type}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Primary Vector</Label>
                      <p className="text-white">{selectedCandidate.primary_vector}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Confidence</Label>
                      <p className="text-white">{selectedCandidate.confidence.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-400">Description</Label>
                    <p className="text-white">{selectedCandidate.description}</p>
                  </div>

                  <div>
                    <Label className="text-gray-400">Reasoning</Label>
                    <p className="text-white">{selectedCandidate.reasoning}</p>
                  </div>

                  <div>
                    <Label className="text-gray-400">Source Articles ({selectedCandidate.source_articles.length})</Label>
                    <div className="space-y-2 mt-2">
                      {selectedCandidate.source_articles.map((article, i) => (
                        <div key={i} className="bg-[#1a2332] p-3 rounded">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-white text-sm font-semibold">{article.title}</p>
                              <p className="text-gray-400 text-xs">{article.source_name}</p>
                              <p className="text-gray-400 text-xs">{new Date(article.pubDate).toLocaleString()}</p>
                            </div>
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0d5f5f] hover:text-[#0a4d4d]"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-400">Entities Detected</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {selectedCandidate.entities.agencies.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-xs">Agencies</p>
                          <p className="text-white text-sm">{selectedCandidate.entities.agencies.join(', ')}</p>
                        </div>
                      )}
                      {selectedCandidate.entities.sectors.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-xs">Sectors</p>
                          <p className="text-white text-sm">{selectedCandidate.entities.sectors.join(', ')}</p>
                        </div>
                      )}
                      {selectedCandidate.entities.policyTerms.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-xs">Policy Terms</p>
                          <p className="text-white text-sm">{selectedCandidate.entities.policyTerms.slice(0, 5).join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#0f1e2e] border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Total Runs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{metrics.total_runs}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {metrics.successful_runs} successful, {metrics.failed_runs} failed
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1e2e] border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Events Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{metrics.total_events_created}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    From {metrics.total_candidates_detected} candidates
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#0f1e2e] border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Detection Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{(metrics.detection_rate * 100).toFixed(1)}%</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Candidates per article
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Articles Processed</Label>
                    <p className="text-white text-2xl font-semibold">{metrics.total_articles_processed}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Confirmation Rate</Label>
                    <p className="text-white text-2xl font-semibold">{(metrics.confirmation_rate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Avg Duration</Label>
                    <p className="text-white text-2xl font-semibold">{(metrics.avg_duration_ms / 1000).toFixed(1)}s</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Last Run</Label>
                    <p className="text-white text-sm">
                      {metrics.last_run ? new Date(metrics.last_run.start_time).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Detection Runs</CardTitle>
                <CardDescription className="text-gray-200">
                  Last 5 automated detection pipeline executions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentLogs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No detection runs yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentLogs.map(log => (
                      <div key={log.run_id} className="bg-[#1a2332] p-4 rounded border border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-white font-semibold">{log.run_id}</p>
                            <p className="text-gray-400 text-xs">
                              {new Date(log.start_time).toLocaleString()} • {(log.duration_ms / 1000).toFixed(1)}s
                            </p>
                          </div>
                          <Badge className={log.errors.length === 0 ? 'bg-green-600' : 'bg-red-600'}>
                            {log.errors.length === 0 ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs">Sources</p>
                            <p className="text-white">{log.sources_fetched}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Articles</p>
                            <p className="text-white">{log.articles_processed}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Candidates</p>
                            <p className="text-white">{log.candidates_detected}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Events</p>
                            <p className="text-white">{log.events_created}</p>
                          </div>
                        </div>
                        {log.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-red-400 text-xs">Errors:</p>
                            <ul className="list-disc list-inside text-red-300 text-xs">
                              {log.errors.map((error, i) => (
                                <li key={i}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
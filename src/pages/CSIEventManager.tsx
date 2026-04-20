/**
 * CSI Event Manager - Admin interface for managing geopolitical shock events
 * 
 * Allows manual entry, editing, and state management of CSI events.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Save, Trash2, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Link } from 'wouter';
import { eventStore } from '@/services/csi/eventStore';
import { GLOBAL_COUNTRIES } from '@/data/globalCountries';
import type { EventRecord, EventType, VectorCode, EventState, CreateEventInput } from '@/types/csi.types';

export default function CSIEventManager() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<CreateEventInput>>({
    country: '',
    event_type: 'EXPORT_CONTROL',
    primary_vector: 'SC3',
    secondary_vectors: [],
    severity: 5,
    delta_csi: 0,
    detected_date: new Date().toISOString().split('T')[0],
    effective_date: '',
    description: '',
    sources: [],
    rationale: '',
    propagation_eligible: true,
    created_by: 'ADMIN'
  });

  const [sourceInput, setSourceInput] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    const allEvents = eventStore.getAllEvents();
    setEvents(allEvents);
  };

  const handleCreateEvent = () => {
    try {
      setError('');
      setSuccess('');

      // Validate required fields
      if (!formData.country || !formData.description || !formData.rationale) {
        setError('Please fill in all required fields: Country, Description, Rationale');
        return;
      }

      if (formData.sources && formData.sources.length === 0) {
        setError('Please add at least one source URL');
        return;
      }

      const input: CreateEventInput = {
        country: formData.country!,
        event_type: formData.event_type as EventType,
        primary_vector: formData.primary_vector as VectorCode,
        secondary_vectors: formData.secondary_vectors as VectorCode[],
        severity: formData.severity!,
        delta_csi: formData.delta_csi!,
        detected_date: formData.detected_date!,
        effective_date: formData.effective_date,
        description: formData.description!,
        sources: formData.sources!,
        rationale: formData.rationale!,
        propagation_eligible: formData.propagation_eligible ?? true,
        created_by: 'ADMIN'
      };

      const event = eventStore.createEvent(input);
      setSuccess(`Event created successfully: ${event.event_id}`);
      setIsCreating(false);
      loadEvents();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const handleStateTransition = (event: EventRecord, newState: EventState) => {
    try {
      setError('');
      setSuccess('');

      eventStore.transitionEventState({
        event_id: event.event_id,
        new_state: newState,
        user: 'ADMIN',
        reason: `Manual state transition to ${newState}`
      });

      setSuccess(`Event ${event.event_id} transitioned to ${newState}`);
      loadEvents();
      if (selectedEvent?.event_id === event.event_id) {
        setSelectedEvent(eventStore.getEvent(event.event_id) || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transition state');
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      eventStore.deleteEvent(eventId, 'ADMIN', 'Manual deletion');
      setSuccess('Event deleted successfully');
      loadEvents();
      if (selectedEvent?.event_id === eventId) {
        setSelectedEvent(null);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      country: '',
      event_type: 'EXPORT_CONTROL',
      primary_vector: 'SC3',
      secondary_vectors: [],
      severity: 5,
      delta_csi: 0,
      detected_date: new Date().toISOString().split('T')[0],
      effective_date: '',
      description: '',
      sources: [],
      rationale: '',
      propagation_eligible: true,
      created_by: 'ADMIN'
    });
    setSourceInput('');
  };

  const addSource = () => {
    if (sourceInput.trim()) {
      setFormData({
        ...formData,
        sources: [...(formData.sources || []), sourceInput.trim()]
      });
      setSourceInput('');
    }
  };

  const removeSource = (index: number) => {
    setFormData({
      ...formData,
      sources: formData.sources?.filter((_, i) => i !== index)
    });
  };

  const getStateIcon = (state: EventState) => {
    switch (state) {
      case 'DETECTED': return <Clock className="h-4 w-4" />;
      case 'PROVISIONAL': return <AlertCircle className="h-4 w-4" />;
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4" />;
      case 'RESOLVED': return <XCircle className="h-4 w-4" />;
    }
  };

  const getStateBadgeColor = (state: EventState) => {
    switch (state) {
      case 'DETECTED': return 'bg-blue-600';
      case 'PROVISIONAL': return 'bg-yellow-600';
      case 'CONFIRMED': return 'bg-green-600';
      case 'RESOLVED': return 'bg-gray-600';
    }
  };

  const countries = GLOBAL_COUNTRIES.map(c => c.country).sort();

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
            <h1 className="text-3xl font-bold">CSI Event Manager</h1>
            <p className="text-sm text-gray-200">Manage geopolitical shock events and CSI updates</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
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

        <Tabs defaultValue="events" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="events">Event List</TabsTrigger>
            <TabsTrigger value="create">Create Event</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Events ({events.length})</CardTitle>
                <CardDescription className="text-gray-200">
                  Manage and monitor geopolitical shock events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {events.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No events found. Create your first event!</p>
                  ) : (
                    events.map(event => (
                      <div
                        key={event.event_id}
                        className="bg-[#1a2332] p-4 rounded border border-gray-700 hover:border-[#0d5f5f] cursor-pointer"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`${getStateBadgeColor(event.state)} text-white`}>
                                <span className="flex items-center gap-1">
                                  {getStateIcon(event.state)}
                                  {event.state}
                                </span>
                              </Badge>
                              <span className="text-white font-semibold">{event.country}</span>
                              <span className="text-gray-400 text-sm">•</span>
                              <span className="text-gray-400 text-sm">{event.event_type}</span>
                            </div>
                            <p className="text-gray-200 text-sm mb-2">{event.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>ΔCSI: <span className="text-[#0d5f5f] font-semibold">{event.delta_csi > 0 ? '+' : ''}{event.delta_csi}</span></span>
                              <span>Severity: {event.severity}/10</span>
                              <span>Vector: {event.primary_vector}</span>
                              <span>Detected: {new Date(event.detected_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {event.state === 'DETECTED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStateTransition(event, 'PROVISIONAL');
                                }}
                                className="border-yellow-600 text-yellow-600 hover:bg-yellow-600/10"
                              >
                                Mark Provisional
                              </Button>
                            )}
                            {event.state === 'PROVISIONAL' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStateTransition(event, 'CONFIRMED');
                                }}
                                className="border-green-600 text-green-600 hover:bg-green-600/10"
                              >
                                Confirm
                              </Button>
                            )}
                            {event.state === 'CONFIRMED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStateTransition(event, 'RESOLVED');
                                }}
                                className="border-gray-600 text-gray-600 hover:bg-gray-600/10"
                              >
                                Resolve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.event_id);
                              }}
                              className="border-red-600 text-red-600 hover:bg-red-600/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedEvent && (
              <Card className="bg-[#0f1e2e] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Event Details: {selectedEvent.event_id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400">Country</Label>
                        <p className="text-white">{selectedEvent.country}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Event Type</Label>
                        <p className="text-white">{selectedEvent.event_type}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Primary Vector</Label>
                        <p className="text-white">{selectedEvent.primary_vector}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Severity</Label>
                        <p className="text-white">{selectedEvent.severity}/10</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">ΔCSI</Label>
                        <p className="text-white font-semibold">{selectedEvent.delta_csi > 0 ? '+' : ''}{selectedEvent.delta_csi}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">State</Label>
                        <Badge className={`${getStateBadgeColor(selectedEvent.state)} text-white`}>
                          {selectedEvent.state}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-400">Description</Label>
                      <p className="text-white">{selectedEvent.description}</p>
                    </div>

                    <div>
                      <Label className="text-gray-400">Rationale</Label>
                      <p className="text-white">{selectedEvent.rationale}</p>
                    </div>

                    <div>
                      <Label className="text-gray-400">Sources</Label>
                      <ul className="list-disc list-inside text-white">
                        {selectedEvent.sources.map((source, i) => (
                          <li key={i}>
                            <a href={source} target="_blank" rel="noopener noreferrer" className="text-[#0d5f5f] hover:underline">
                              {source}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <Label className="text-gray-400">Audit Trail</Label>
                      <div className="space-y-2 mt-2">
                        {selectedEvent.audit_trail.map((entry, i) => (
                          <div key={i} className="bg-[#1a2332] p-2 rounded text-sm">
                            <div className="flex justify-between text-gray-400">
                              <span>{entry.action}</span>
                              <span>{new Date(entry.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-white">{entry.details}</p>
                            <p className="text-gray-400 text-xs">by {entry.user}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card className="bg-[#0f1e2e] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Create New Event</CardTitle>
                <CardDescription className="text-gray-200">
                  Enter details for a new geopolitical shock event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-200">Country *</Label>
                    <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                      <SelectTrigger className="bg-[#1a2332] border-gray-700 text-white">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-200">Event Type *</Label>
                    <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value as EventType })}>
                      <SelectTrigger className="bg-[#1a2332] border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SANCTION">Sanction</SelectItem>
                        <SelectItem value="EXPORT_CONTROL">Export Control</SelectItem>
                        <SelectItem value="TARIFF">Tariff</SelectItem>
                        <SelectItem value="KINETIC">Kinetic Conflict</SelectItem>
                        <SelectItem value="CAPITAL_CONTROL">Capital Control</SelectItem>
                        <SelectItem value="COUP">Coup</SelectItem>
                        <SelectItem value="CYBER_ATTACK">Cyber Attack</SelectItem>
                        <SelectItem value="TRADE_RESTRICTION">Trade Restriction</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-200">Primary Vector *</Label>
                    <Select value={formData.primary_vector} onValueChange={(value) => setFormData({ ...formData, primary_vector: value as VectorCode })}>
                      <SelectTrigger className="bg-[#1a2332] border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SC1">SC1 - Sanctions/Export Controls</SelectItem>
                        <SelectItem value="SC2">SC2 - Trade/Tariff Barriers</SelectItem>
                        <SelectItem value="SC3">SC3 - Supply Chain Disruption</SelectItem>
                        <SelectItem value="SC4">SC4 - Kinetic Conflict</SelectItem>
                        <SelectItem value="SC5">SC5 - Capital Controls</SelectItem>
                        <SelectItem value="SC6">SC6 - Political Instability</SelectItem>
                        <SelectItem value="SC7">SC7 - Cyber/Tech Restrictions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-200">Severity (1-10) *</Label>
                    <Slider
                      value={[formData.severity || 5]}
                      onValueChange={(value) => setFormData({ ...formData, severity: value[0] })}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-white text-sm mt-1">{formData.severity}/10</p>
                  </div>

                  <div>
                    <Label className="text-gray-200">ΔCSI *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.delta_csi}
                      onChange={(e) => setFormData({ ...formData, delta_csi: parseFloat(e.target.value) })}
                      className="bg-[#1a2332] border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-200">Detected Date *</Label>
                    <Input
                      type="date"
                      value={formData.detected_date}
                      onChange={(e) => setFormData({ ...formData, detected_date: e.target.value })}
                      className="bg-[#1a2332] border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-200">Effective Date (Optional)</Label>
                    <Input
                      type="date"
                      value={formData.effective_date}
                      onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                      className="bg-[#1a2332] border-gray-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-200">Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-[#1a2332] border-gray-700 text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-gray-200">Rationale *</Label>
                  <Textarea
                    value={formData.rationale}
                    onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                    className="bg-[#1a2332] border-gray-700 text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-gray-200">Sources *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={sourceInput}
                      onChange={(e) => setSourceInput(e.target.value)}
                      placeholder="Enter source URL"
                      className="bg-[#1a2332] border-gray-700 text-white"
                    />
                    <Button onClick={addSource} className="bg-[#0d5f5f] hover:bg-[#0a4d4d]">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.sources && formData.sources.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formData.sources.map((source, i) => (
                        <div key={i} className="flex items-center gap-2 bg-[#1a2332] p-2 rounded">
                          <span className="text-white text-sm flex-1">{source}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeSource(i)}
                            className="border-red-600 text-red-600 hover:bg-red-600/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={handleCreateEvent} className="w-full bg-[#0d5f5f] hover:bg-[#0a4d4d]">
                  <Save className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
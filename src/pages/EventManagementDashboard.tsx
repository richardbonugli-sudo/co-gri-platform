/**
 * Event Management Dashboard - Standalone Developer Tool
 * 
 * Real-time event ingestion, classification, and simulation controls.
 * This is a development/testing tool for the event processing pipeline.
 */

import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Radio, Activity } from 'lucide-react';
import { EventManagementPanel } from '@/components/dashboard/EventManagementPanel';
import { LatestRiskEvents } from '@/components/dashboard/LatestRiskEvents';

const EventManagementDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0d1512] to-[#0a0f0d]">
      {/* Header */}
      <header className="border-b border-[#0d5f5f]/30 bg-[#0d1512]/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-[#0d5f5f] text-[#7fa89f] hover:bg-[#0d5f5f]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Radio className="h-6 w-6 text-[#7fa89f]" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Event Management Dashboard</h1>
                  <p className="text-[#7fa89f] text-sm">Real-Time Event Processing & Simulation</p>
                </div>
              </div>
            </div>
            <Link href="/dashboard">
              <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white">
                Go to Main Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Info Banner */}
        <Card className="bg-[#0d5f5f]/10 border-[#0d5f5f]/30 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Activity className="h-6 w-6 text-[#7fa89f] flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-semibold mb-2">Developer Tool - Event Processing Pipeline</h4>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                  This dashboard provides real-time control and monitoring of the event ingestion pipeline. 
                  Use it to simulate geopolitical events, test the classification engine, and observe how events 
                  propagate through the system to update CSI scores.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-[#0a0f0d] p-3 rounded-lg border border-[#0d5f5f]/20">
                    <p className="text-[#7fa89f] font-semibold mb-1">Control Tab</p>
                    <p className="text-gray-400">Start/stop simulation, adjust event frequency and probability</p>
                  </div>
                  <div className="bg-[#0a0f0d] p-3 rounded-lg border border-[#0d5f5f]/20">
                    <p className="text-[#7fa89f] font-semibold mb-1">Stats Tab</p>
                    <p className="text-gray-400">Monitor ingestion statistics and event categories</p>
                  </div>
                  <div className="bg-[#0a0f0d] p-3 rounded-lg border border-[#0d5f5f]/20">
                    <p className="text-[#7fa89f] font-semibold mb-1">Manual Tab</p>
                    <p className="text-gray-400">Create custom events for testing specific scenarios</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Management Panel - Takes 2 columns */}
          <div className="lg:col-span-2">
            <EventManagementPanel />
          </div>

          {/* Latest Risk Events - Shows live events */}
          <div className="lg:col-span-1">
            <LatestRiskEvents 
              showLiveEvents={true}
              maxEvents={10}
            />
          </div>
        </div>

        {/* Technical Details */}
        <Card className="bg-[#0a0f0d] border-[#0d5f5f]/30 mt-8">
          <CardContent className="p-6">
            <h4 className="text-white font-semibold mb-4">Pipeline Architecture</h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#7fa89f] rounded-full mt-2"></div>
                <div>
                  <p className="text-white font-medium">Event Ingestion Pipeline</p>
                  <p className="text-gray-400">Validates, normalizes, and queues incoming events from multiple sources</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#7fa89f] rounded-full mt-2"></div>
                <div>
                  <p className="text-white font-medium">Real-Time Event Processor</p>
                  <p className="text-gray-400">Classifies events, calculates CSI impacts, and manages lifecycle states</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#7fa89f] rounded-full mt-2"></div>
                <div>
                  <p className="text-white font-medium">Event Simulation Service</p>
                  <p className="text-gray-400">Generates realistic event patterns based on current global hotspots</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#7fa89f] rounded-full mt-2"></div>
                <div>
                  <p className="text-white font-medium">Classification Engine</p>
                  <p className="text-gray-400">Maps events to CSI vectors and estimates delta CSI impact</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#0d5f5f]/30 bg-[#0d1512]/50 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2026 CO-GRI Platform. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/disclaimer">
                <span className="text-gray-400 hover:text-white text-sm cursor-pointer">
                  Disclaimer
                </span>
              </Link>
              <Link href="/contact">
                <span className="text-gray-400 hover:text-white text-sm cursor-pointer">
                  Contact
                </span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EventManagementDashboard;
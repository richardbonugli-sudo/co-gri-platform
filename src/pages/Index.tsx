import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Briefcase, TrendingDown, AlertTriangle, Mail, GraduationCap, Lock, Users, LineChart, Shield, Globe, BarChart3, Target, AlertCircle, Brain, Signal, Network, FileText, Layers, Settings, TestTube, Download, Database, Activity, Radio } from 'lucide-react';
import NewsTicker from '@/components/NewsTicker';
import { useState } from 'react';
import { ExpectationWeightingService } from '@/services/diagnostics/ExpectationWeightingService';
import { DecayBehaviorService } from '@/services/diagnostics/DecayBehaviorService';
import { useToast } from '@/hooks/use-toast';

export default function Index() {
  const cacheBuster = new Date().getTime();
  const { toast } = useToast();
  const [isDownloadingPhase2, setIsDownloadingPhase2] = useState(false);
  const [isDownloadingPhase3, setIsDownloadingPhase3] = useState(false);

  const handlePhase2Download = async () => {
    setIsDownloadingPhase2(true);
    try {
      await ExpectationWeightingService.downloadAllPhase2Files();
      toast({
        title: "Phase 2 Files Downloaded",
        description: "Expectation weighting verification files have been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download Phase 2 files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPhase2(false);
    }
  };

  const handlePhase3Download = async () => {
    setIsDownloadingPhase3(true);
    try {
      await DecayBehaviorService.downloadAllPhase3Files();
      toast({
        title: "Phase 3 Files Downloaded",
        description: "Decay behavior validation files have been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download Phase 3 files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPhase3(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628]">
      {/* Navigation Header */}
      <nav className="bg-[#0d5f5f]/95 backdrop-blur-sm border-b border-[#0d5f5f]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5 transition-transform group-hover:scale-105">
                  <img 
                    src="/assets/owl-logo-header.png"
                    alt="CedarOwl Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">CedarOwl</h1>
                  <p className="text-xs text-gray-200 uppercase tracking-wider">Geopolitical Intelligence</p>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <Link href="/unique-approach">
                <span className="text-white hover:text-gray-200 transition-colors text-sm font-medium cursor-pointer">
                  Our Unique Approach
                </span>
              </Link>
              <a href="#features" className="text-white hover:text-gray-200 transition-colors text-sm font-medium">
                Features
              </a>
              <a href="#services" className="text-white hover:text-gray-200 transition-colors text-sm font-medium">
                Services
              </a>
              <Link href="/contact">
                <span className="text-white hover:text-gray-200 transition-colors text-sm font-medium cursor-pointer">
                  Contact
                </span>
              </Link>
              <Link href="/baseline-results">
                <span className="text-[#7fa89f] hover:text-white transition-colors text-sm font-medium cursor-pointer">
                  Baseline Results
                </span>
              </Link>
              <Link href="/dashboard">
                <Button className="bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e] font-semibold px-6">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              <Link href="/baseline-results">
                <Button variant="outline" className="border-[#7fa89f] text-[#7fa89f] hover:bg-[#7fa89f]/10 font-semibold text-sm px-3">
                  Baseline
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e] font-semibold text-sm px-4">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="inline-block">
                <span className="text-[#7fa89f] text-xs font-bold tracking-widest uppercase bg-[#7fa89f]/10 px-4 py-2 rounded-full border border-[#7fa89f]/20">
                  Geopolitical Intelligence
                </span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                <span className="block">Geopolitical Risk</span>
                <span className="block text-[#7fa89f]">Intelligence</span>
                <span className="block">for Global Investors</span>
              </h2>

              <p className="text-gray-300 text-lg leading-relaxed">
                Identify threats to your portfolio before markets react—powered by expert analysis and real-time data from the world's foremost geopolitical minds.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                  <Button className="bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e] font-semibold px-8 py-6 text-base w-full sm:w-auto">
                    <Shield className="mr-2 h-5 w-5" />
                    Assess Your Risk
                  </Button>
                </Link>
                <Link href="/unique-approach">
                  <Button variant="outline" className="border-[#7fa89f] text-[#7fa89f] hover:bg-[#7fa89f]/10 px-8 py-6 text-base w-full sm:w-auto">
                    Our Unique Approach
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="relative z-10">
                <img 
                  src="/assets/cedarowl-hero-image-v2.webp"
                  alt="CedarOwl - Value Investing Intelligence" 
                  className="w-full rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#7fa89f]/20 to-transparent rounded-2xl blur-3xl"></div>
            </div>
          </div>
        </div>

        {/* News Ticker */}
        <div className="border-y border-[#0d5f5f]/30">
          <NewsTicker />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-[#0d5f5f]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-[#7fa89f]">100+</p>
              <p className="text-gray-300 text-sm">Expert Sources</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-[#7fa89f]">24/7</p>
              <p className="text-gray-300 text-sm">Real-Time Monitoring</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-[#7fa89f]">Global</p>
              <p className="text-gray-300 text-sm">Coverage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <blockquote className="text-xl sm:text-2xl text-gray-200 leading-relaxed italic border-l-4 border-[#7fa89f] pl-6 text-left">
              <p className="mb-4">
                In today's volatile world, geopolitical events can wipe out portfolio value overnight.
                <span className="text-[#7fa89f] font-semibold"> CedarOwl's</span> Geopolitical Risk Assessment service gives you the intelligence edge you need.
              </p>
              <p>
                Our proprietary multi-source framework analyzes real-time data from leading geopolitical experts to identify risks before they hit your investments. Stay ahead of asset freezes, nationalizations, capital controls, and regional conflicts that threaten your returns.
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-gradient-to-b from-[#0f1e2e] to-[#0a1628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#7fa89f] text-xs font-bold tracking-widest uppercase">Our Capabilities</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4">The Intelligence Edge</h2>
            <p className="text-gray-300 text-lg mt-4 max-w-3xl mx-auto">
              In today's volatile world, geopolitical events can wipe out portfolio value overnight. Our proprietary framework gives you the intelligence edge you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="group bg-[#0d5f5f]/20 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-8 hover:bg-[#0d5f5f]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="w-14 h-14 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#7fa89f]/20 transition-colors">
                <Target className="h-7 w-7 text-[#7fa89f]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Spot Hidden Risks</h3>
              <p className="text-gray-300 leading-relaxed">
                Identify geopolitical threats to individual stocks before they impact your returns
              </p>
            </div>

            <div className="group bg-[#0d5f5f]/20 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-8 hover:bg-[#0d5f5f]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="w-14 h-14 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#7fa89f]/20 transition-colors">
                <Shield className="h-7 w-7 text-[#7fa89f]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Protect Your Portfolio</h3>
              <p className="text-gray-300 leading-relaxed">
                Get comprehensive risk scores across all your holdings in seconds
              </p>
            </div>

            <div className="group bg-[#0d5f5f]/20 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-8 hover:bg-[#0d5f5f]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="w-14 h-14 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#7fa89f]/20 transition-colors">
                <TrendingDown className="h-7 w-7 text-[#7fa89f]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Find Safe Havens</h3>
              <p className="text-gray-300 leading-relaxed">
                Discover the most stable equities in uncertain times
              </p>
            </div>

            <div className="group bg-[#0d5f5f]/20 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-8 hover:bg-[#0d5f5f]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="w-14 h-14 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#7fa89f]/20 transition-colors">
                <AlertCircle className="h-7 w-7 text-[#7fa89f]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Avoid Danger Zones</h3>
              <p className="text-gray-300 leading-relaxed">
                Screen out high-risk investments before you buy
              </p>
            </div>

            <div className="group bg-[#0d5f5f]/20 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-8 hover:bg-[#0d5f5f]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="w-14 h-14 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#7fa89f]/20 transition-colors">
                <Lock className="h-7 w-7 text-[#7fa89f]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Prevent Asset Loss</h3>
              <p className="text-gray-300 leading-relaxed">
                Early warning system for freezes, confiscations, and nationalizations
              </p>
            </div>

            <div className="group bg-[#0d5f5f]/20 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-8 hover:bg-[#0d5f5f]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="w-14 h-14 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#7fa89f]/20 transition-colors">
                <Globe className="h-7 w-7 text-[#7fa89f]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Safeguard Your Capital</h3>
              <p className="text-gray-300 leading-relaxed">
                Detect capital control risks that could trap your funds
              </p>
            </div>

            <div className="group bg-[#0d5f5f]/20 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-8 hover:bg-[#0d5f5f]/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl md:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#7fa89f]/20 transition-colors">
                <Brain className="h-7 w-7 text-[#7fa89f]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Expert Intelligence</h3>
              <p className="text-gray-300 leading-relaxed">
                Access insights from top geopolitical analysts in real-time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#7fa89f] text-xs font-bold tracking-widest uppercase">Services</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4">Your Gateway to Intelligence</h2>
            <p className="text-gray-300 text-lg mt-4 max-w-3xl mx-auto">
              Access our comprehensive suite of geopolitical risk assessment tools and expert services
            </p>
          </div>

          <div className="mb-12 flex flex-wrap justify-center gap-4">
            <Link href="/unique-approach">
              <Button className="bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e] font-semibold px-8 py-6 text-base">
                <BookOpen className="mr-2 h-5 w-5" />
                Learn about our Unique Approach
              </Button>
            </Link>
            <Link href="/methodology-pdf">
              <Button variant="outline" className="border-[#7fa89f] text-[#7fa89f] hover:bg-[#7fa89f]/10 px-8 py-6 text-base">
                <FileText className="mr-2 h-5 w-5" />
                Download CO-GRI Methodology PDF
              </Button>
            </Link>
            <Link href="/csi-methodology-pdf">
              <Button variant="outline" className="border-[#7fa89f] text-[#7fa89f] hover:bg-[#7fa89f]/10 px-8 py-6 text-base">
                <FileText className="mr-2 h-5 w-5" />
                Download CSI Methodology PDF
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service Cards */}
            <Link href="/cogri">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <TrendingUp className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      Assess Risk on a Company or Ticker
                    </h3>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/enhanced-cogri">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <BarChart3 className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      Enhanced Risk Assessment
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Interactive heat maps, trends, and advanced visualizations
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/cogri-portfolio">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <Briefcase className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      Assess a Portfolio
                    </h3>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/cogri-lowest-risk">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <TrendingDown className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      Lowest Risk Equities
                    </h3>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/cogri-highest-risk">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <AlertTriangle className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      Highest Risk Equities
                    </h3>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/trading-signal-service">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <Signal className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      Caldara-Iacoviello Trading Signal Service
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Index-level GPR signals for S&P 500 (SPY)
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/cogri-trading-signal-service">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <Signal className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      CO-GRI Trading Signal Service
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Company-specific geopolitical risk signals using CO-GRI methodology
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/gurus">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <GraduationCap className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      Geopolitical Investment Risk Gurus
                    </h3>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/consulting-services">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <Users className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      Consulting Services Assistance
                    </h3>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/predictive-analytics">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <LineChart className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      Predictive Analytics
                    </h3>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/csi-analytics">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <BarChart3 className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      CSI Analytics Dashboard
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Advanced analytics, correlations, and predictions
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/csi-refactored">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <Layers className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      CSI Refactored Dashboard
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Three-component architecture: Baseline + Drift + Delta
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/csi-propagation">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <Network className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      CSI Propagation Network
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Visualize event propagation through trade networks
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/contact">
              <div className="group bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 backdrop-blur-sm border border-[#0d5f5f]/30 rounded-2xl p-6 hover:from-[#0d5f5f]/40 hover:to-[#0d5f5f]/20 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#7fa89f]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#7fa89f]/20 transition-colors">
                    <Mail className="h-6 w-6 text-[#7fa89f]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#7fa89f] transition-colors">
                      Contact Us
                    </h3>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1628] border-t border-[#0d5f5f]/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5">
                  <img 
                    src="/assets/owl-logo-header_variant_1.png"
                    alt="CedarOwl Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">CedarOwl</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Geopolitical Intelligence</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Providing elite geopolitical risk intelligence to global investors. Protect your portfolio with insights from the world's foremost experts.
              </p>
            </div>

            {/* Services Column */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Services</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/cogri">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      Risk Assessment
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/enhanced-cogri">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      Enhanced Assessment
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/cogri-portfolio">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      Portfolio Analysis
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/trading-signal-service">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      Caldara-Iacoviello Trading Signals
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/cogri-trading-signal-service">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      CO-GRI Trading Signals
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/predictive-analytics">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      Predictive Analytics
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/csi-refactored">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      CSI Refactored Dashboard
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/consulting-services">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      Consulting
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Developer Tools Column */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Developer Tools
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/csi-verification">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer flex items-center gap-2">
                      <TestTube className="h-3 w-3" />
                      CSI Implementation Verification
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/data-quality">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      Data Quality Dashboard
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/diagnostic-test">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      Diagnostic Tests
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/sector-multiplier-reference">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      Sector Multiplier Reference
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/csi-events">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      CSI Event Manager
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/csi-review">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                      CSI Event Review
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/global-audit">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      Global Audit Dashboard
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/phase2-addendum">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Phase 2 Addendum Report
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/vector-movement-audit">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer flex items-center gap-2">
                      <BarChart3 className="h-3 w-3" />
                      Vector Movement Forensic Audit
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/ground-truth-recall-audit">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer flex items-center gap-2">
                      <Target className="h-3 w-3" />
                      Ground-Truth Recall Audit
                    </span>
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handlePhase2Download}
                    disabled={isDownloadingPhase2}
                    className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Database className="h-3 w-3" />
                    {isDownloadingPhase2 ? 'Downloading...' : 'Phase 2: Expectation Weighting'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={handlePhase3Download}
                    disabled={isDownloadingPhase3}
                    className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Activity className="h-3 w-3" />
                    {isDownloadingPhase3 ? 'Downloading...' : 'Phase 3: Decay Behavior'}
                  </button>
                </li>
                <li>
                  <Link href="/completeness-report">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Completeness Report
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/event-management">
                    <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer flex items-center gap-2">
                      <Radio className="h-3 w-3" />
                      Event Management - LIVE
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contact</h4>
              <Link href="/contact">
                <Button className="bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e] font-semibold w-full sm:w-auto">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-[#0d5f5f]/30">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm text-center sm:text-left">
                © {new Date().getFullYear()} CedarOwl. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a 
                  href="https://geopolitical189-cedarowl.mgx.world/data-quality"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm"
                >
                  Admin Login
                </a>
                <Link href="/data-expansion">
                  <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                    Data Expansion Dashboard
                  </span>
                </Link>
                <Link href="/disclaimer">
                  <span className="text-gray-400 hover:text-[#7fa89f] transition-colors text-sm cursor-pointer">
                    Disclaimer
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
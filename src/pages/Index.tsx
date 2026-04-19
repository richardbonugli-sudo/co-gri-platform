import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Briefcase, TrendingDown, AlertTriangle, Mail, GraduationCap, Lock, Users } from 'lucide-react';
import NewsTicker from '@/components/NewsTicker';

export default function Index() {
  const cacheBuster = Date.now();
  
  return (
    <div className="min-h-screen bg-[#0f1e2e] text-white">
      {/* Header */}
      <header className="bg-[#0d5f5f] py-4 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2">
              <img 
                src={`/assets/owl-logo-v3.png?t=${cacheBuster}`}
                alt="CedarOwl Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white leading-tight">Geopolitical Risk Intelligence for Global Investors</h1>
              <p className="text-white text-sm mt-1">Identify threats to your portfolio before markets react—powered by expert analysis and real-time data</p>
            </div>
          </div>
          <Link href="/data-quality">
            <Button className="bg-white hover:bg-gray-100 text-[#0d5f5f] font-normal text-xs px-2 py-1 h-auto rounded">
              <Lock className="mr-1 h-3 w-3" />
              Admin Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Navigation Buttons */}
      <div className="bg-[#0f1e2e] py-6 px-8 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 justify-center">
          <Link href="/unique-approach">
            <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white">
              <BookOpen className="mr-2 h-4 w-4" />
              Learn about our Unique Approach
            </Button>
          </Link>
          <Link href="/cogri">
            <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white">
              <TrendingUp className="mr-2 h-4 w-4" />
              Assess Risk on a Company or Ticker
            </Button>
          </Link>
          <Link href="/cogri-portfolio">
            <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white">
              <Briefcase className="mr-2 h-4 w-4" />
              Assess a Portfolio
            </Button>
          </Link>
          <Link href="/cogri-lowest-risk">
            <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white">
              <TrendingDown className="mr-2 h-4 w-4" />
              Lowest Risk Equities
            </Button>
          </Link>
          <Link href="/cogri-highest-risk">
            <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Highest Risk Equities
            </Button>
          </Link>
          <Link href="/gurus">
            <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white">
              <GraduationCap className="mr-2 h-4 w-4" />
              Geopolitical Investment Risk Gurus
            </Button>
          </Link>
          <Link href="/consulting-services">
            <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white">
              <Users className="mr-2 h-4 w-4" />
              Consulting Services Assistance
            </Button>
          </Link>
          <Link href="/contact">
            <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white">
              <Mail className="mr-2 h-4 w-4" />
              Contact Us
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left Column - Text Content */}
          <div className="space-y-6">
            <p className="text-gray-200 text-lg leading-relaxed">
              <span className="font-semibold text-white">In today's volatile world, geopolitical events can wipe out portfolio value overnight.</span> CedarOwl's Geopolitical Risk Assessment service gives you the intelligence edge you need. Our proprietary multi-source framework analyzes real-time data from leading geopolitical experts to identify risks before they hit your investments. Stay ahead of asset freezes, nationalizations, capital controls, and regional conflicts that threaten your returns.
            </p>

            <ul className="space-y-4 text-gray-200">
              <li className="flex items-start gap-3">
                <span className="text-[#0d5f5f] mt-1">●</span>
                <span><span className="font-semibold text-white">Spot Hidden Risks</span> - Identify geopolitical threats to individual stocks before they impact your returns</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#0d5f5f] mt-1">●</span>
                <span><span className="font-semibold text-white">Protect Your Portfolio</span> - Get comprehensive risk scores across all your holdings in seconds</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#0d5f5f] mt-1">●</span>
                <span><span className="font-semibold text-white">Find Safe Havens</span> - Discover the most stable equities in uncertain times</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#0d5f5f] mt-1">●</span>
                <span><span className="font-semibold text-white">Avoid Danger Zones</span> - Screen out high-risk investments before you buy</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#0d5f5f] mt-1">●</span>
                <span><span className="font-semibold text-white">Prevent Asset Loss</span> - Early warning system for freezes, confiscations, and nationalizations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#0d5f5f] mt-1">●</span>
                <span><span className="font-semibold text-white">Safeguard Your Capital</span> - Detect capital control risks that could trap your funds</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#0d5f5f] mt-1">●</span>
                <span><span className="font-semibold text-white">Expert Intelligence</span> - Access insights from top geopolitical analysts in real-time</span>
              </li>
            </ul>
          </div>

          {/* Right Column - Image */}
          <div className="flex justify-center items-center">
            <img 
              src={`/assets/cedarowl-hero-image.png?t=${cacheBuster}`}
              alt="CedarOwl Hero" 
              className="w-full max-w-md rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* News Ticker - Added above footer */}
      <NewsTicker />

      {/* Footer */}
      <footer className="bg-[#0f1e2e] border-t border-gray-700 py-6 px-8">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>
            Powered by CedarOwl's advanced geopolitical risk analysis • Integrated Multi-Source Framework{' '}
            <Link href="/disclaimer">
              <a className="text-[#0d5f5f] hover:underline cursor-pointer">Disclaimer</a>
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
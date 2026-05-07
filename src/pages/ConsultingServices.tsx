import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, Users, Shield, TrendingUp, CheckCircle, MessageSquare } from 'lucide-react';

export default function ConsultingServices() {
  return (
    <div className="min-h-screen bg-[#0f1e2e] text-white">
      {/* Header */}
      <header className="bg-[#0d5f5f] py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <img 
                src="/assets/cedarowl-header-logo.png" 
                alt="CedarOwl Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Consulting Services Assistance</h1>
              <p className="text-gray-200 text-sm mt-1">Expert guidance for navigating geopolitical investment risks</p>
            </div>
          </div>
          <Link href="/">
            <Button className="bg-white hover:bg-gray-100 text-[#0d5f5f]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">
            Navigate Global Investment Risks with Confidence
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Partner with our team of seasoned geopolitical risk consultants to protect your investments, 
            identify opportunities, and make informed decisions in an increasingly complex global landscape.
          </p>
        </div>

        {/* Key Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-[#1a2f3f] p-8 rounded-lg border border-gray-700">
            <Globe className="h-12 w-12 text-[#0d5f5f] mb-4" />
            <h3 className="text-xl font-bold text-white mb-3">Global Expertise</h3>
            <p className="text-gray-300">
              Access industry veterans with deep knowledge across multiple jurisdictions, sectors, and geopolitical landscapes worldwide.
            </p>
          </div>

          <div className="bg-[#1a2f3f] p-8 rounded-lg border border-gray-700">
            <Users className="h-12 w-12 text-[#0d5f5f] mb-4" />
            <h3 className="text-xl font-bold text-white mb-3">Sector Specialists</h3>
            <p className="text-gray-300">
              Our consultants specialize in technology, energy, finance, healthcare, manufacturing, and emerging markets.
            </p>
          </div>

          <div className="bg-[#1a2f3f] p-8 rounded-lg border border-gray-700">
            <Shield className="h-12 w-12 text-[#0d5f5f] mb-4" />
            <h3 className="text-xl font-bold text-white mb-3">Risk Mitigation</h3>
            <p className="text-gray-300">
              Develop comprehensive strategies to protect your portfolio from sanctions, nationalizations, and political instability.
            </p>
          </div>
        </div>

        {/* Services Overview */}
        <div className="bg-[#1a2f3f] p-10 rounded-lg border border-gray-700 mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
            <TrendingUp className="mr-3 h-8 w-8 text-[#0d5f5f]" />
            Our Consulting Services
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#0d5f5f] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Geopolitical Risk Assessment & Due Diligence</h3>
                <p className="text-gray-300">
                  Comprehensive analysis of country-specific risks, regulatory changes, and political developments 
                  affecting your investment thesis. We evaluate sanctions exposure, sovereign risk, and cross-border 
                  operational challenges before you commit capital.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#0d5f5f] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Portfolio Stress Testing & Scenario Planning</h3>
                <p className="text-gray-300">
                  Model the impact of geopolitical events on your holdings—from trade wars and sanctions to 
                  regional conflicts and regime changes. Our consultants help you prepare contingency plans 
                  and identify hedging strategies to protect your downside.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#0d5f5f] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Market Entry & Expansion Strategy</h3>
                <p className="text-gray-300">
                  Planning to invest in emerging markets or expand into new jurisdictions? We provide on-the-ground 
                  intelligence about political stability, regulatory frameworks, currency controls, and repatriation 
                  risks to ensure successful market entry.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#0d5f5f] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Sanctions & Compliance Advisory</h3>
                <p className="text-gray-300">
                  Navigate the complex web of international sanctions, export controls, and compliance requirements. 
                  Our experts help you avoid costly violations while maintaining operational flexibility in 
                  challenging jurisdictions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#0d5f5f] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Crisis Management & Rapid Response</h3>
                <p className="text-gray-300">
                  When geopolitical events threaten your investments, time is critical. Our 24/7 rapid response 
                  team provides real-time intelligence, actionable recommendations, and crisis mitigation strategies 
                  to minimize losses and protect your capital.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#0d5f5f] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Custom Research & Intelligence Briefings</h3>
                <p className="text-gray-300">
                  Receive tailored research reports and regular intelligence briefings on specific countries, 
                  sectors, or companies. Our consultants distill complex geopolitical dynamics into actionable 
                  insights that directly inform your investment decisions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-gradient-to-br from-[#0d5f5f] to-[#0a4d4d] p-10 rounded-lg mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Why Choose CedarOwl Consulting?</h2>
          
          <div className="grid md:grid-cols-2 gap-6 text-white">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 className="font-semibold mb-1">Proven Track Record</h3>
                <p className="text-gray-100">
                  Our consultants have advised institutional investors, hedge funds, and family offices 
                  through major geopolitical crises including sanctions regimes, sovereign defaults, and regional conflicts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🌍</span>
              <div>
                <h3 className="font-semibold mb-1">Global Network</h3>
                <p className="text-gray-100">
                  Leverage our extensive network of on-the-ground contacts, government relations experts, 
                  and industry insiders across 100+ countries for unparalleled local intelligence.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="font-semibold mb-1">Real-Time Intelligence</h3>
                <p className="text-gray-100">
                  Access breaking geopolitical developments and their investment implications before they 
                  become mainstream news—giving you the edge to act decisively.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-semibold mb-1">Confidential & Discreet</h3>
                <p className="text-gray-100">
                  All consulting engagements are conducted with the highest level of confidentiality and 
                  discretion to protect your investment strategies and competitive advantages.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-semibold mb-1">Data-Driven Insights</h3>
                <p className="text-gray-100">
                  Our recommendations are backed by rigorous quantitative analysis, proprietary risk models, 
                  and multi-source intelligence frameworks—not just opinions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <h3 className="font-semibold mb-1">Flexible Engagement Models</h3>
                <p className="text-gray-100">
                  Whether you need a one-time assessment, ongoing advisory services, or emergency crisis support, 
                  we tailor our engagement to your specific needs and budget.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Who We Serve */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Who We Serve</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-[#1a2f3f] p-6 rounded-lg border border-gray-700 text-center">
              <div className="text-4xl mb-3">🏦</div>
              <h3 className="font-semibold text-white mb-2">Institutional Investors</h3>
              <p className="text-gray-300 text-sm">
                Pension funds, endowments, and sovereign wealth funds
              </p>
            </div>

            <div className="bg-[#1a2f3f] p-6 rounded-lg border border-gray-700 text-center">
              <div className="text-4xl mb-3">📈</div>
              <h3 className="font-semibold text-white mb-2">Hedge Funds & PE Firms</h3>
              <p className="text-gray-300 text-sm">
                Alternative investment managers and private equity
              </p>
            </div>

            <div className="bg-[#1a2f3f] p-6 rounded-lg border border-gray-700 text-center">
              <div className="text-4xl mb-3">👨‍💼</div>
              <h3 className="font-semibold text-white mb-2">Family Offices</h3>
              <p className="text-gray-300 text-sm">
                Ultra-high-net-worth individuals and multi-family offices
              </p>
            </div>

            <div className="bg-[#1a2f3f] p-6 rounded-lg border border-gray-700 text-center">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="font-semibold text-white mb-2">Corporations</h3>
              <p className="text-gray-300 text-sm">
                Multinational companies with global operations
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[#1a2f3f] p-12 rounded-lg border border-gray-700 text-center">
          <MessageSquare className="h-16 w-16 text-[#0d5f5f] mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Discuss Your Geopolitical Risk Challenges?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Schedule a confidential consultation with one of our senior consultants to explore how we can 
            help protect and grow your investments in today's complex geopolitical environment.
          </p>
          <Link href="/contact">
            <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white text-lg px-8 py-6 h-auto">
              <MessageSquare className="mr-2 h-5 w-5" />
              Contact Our Consulting Team
            </Button>
          </Link>
          <p className="text-gray-400 text-sm mt-4">
            Initial consultations are complimentary and strictly confidential
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f1e2e] border-t border-gray-700 py-6 px-8 mt-12">
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
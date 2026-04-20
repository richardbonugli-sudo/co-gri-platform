import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Database, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import { Link } from 'wouter';

export default function About() {
  const cacheBuster = Date.now();
  
  return (
    <div className="min-h-screen bg-[#0f1e2e]">
      {/* Header */}
      <header className="bg-[#0d5f5f] text-white py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2">
            <img 
              src={`/assets/cedarowl-logo-approach.png?t=${cacheBuster}`}
              alt="CedarOwl Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold">CedarOwl's Unique Approach</h1>
            <p className="text-xl mt-2">The Most Comprehensive Geopolitical Risk Intelligence Platform</p>
          </div>
        </div>
      </header>

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Link href="/">
          <Button variant="ghost" className="text-white hover:bg-[#0a4a4a] hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ← Back to Home
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        
        {/* Hero Statement */}
        <section className="bg-gradient-to-r from-[#0d5f5f] to-[#0a4d4d] border border-[#4db8b8] rounded-lg p-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Why CedarOwl Stands Apart</h2>
          <p className="text-xl text-gray-100 leading-relaxed max-w-4xl mx-auto">
            Traditional risk models fail to capture the complex, interconnected nature of modern geopolitical threats. CedarOwl delivers <strong className="text-[#4db8b8]">actionable intelligence</strong> by combining <strong className="text-[#4db8b8]">real-time data</strong>, <strong className="text-[#4db8b8]">expert analysis</strong>, and <strong className="text-[#4db8b8]">proprietary algorithms</strong> to identify risks before they impact your portfolio.
          </p>
        </section>

        {/* CO-GRI Section */}
        <section className="bg-white/5 border border-white/10 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-10 h-10 text-[#4db8b8]" />
            <h2 className="text-3xl font-bold text-white">CO-GRI: CedarOwl Geopolitical Risk Index</h2>
          </div>
          <p className="text-gray-200 text-lg leading-relaxed mb-6">
            Our proprietary <strong className="text-white">CO-GRI methodology</strong> is the industry's most sophisticated geopolitical risk assessment framework. Unlike generic country risk ratings, CO-GRI analyzes <strong className="text-white">company-specific exposure</strong> across multiple dimensions to deliver precise, actionable risk scores.
          </p>
          <div className="bg-[#0d5f5f]/30 border border-[#0d5f5f] rounded-lg p-6">
            <p className="text-gray-200 text-lg">
              <strong className="text-white">The Result?</strong> You get early warnings on asset freezes, nationalizations, supply chain disruptions, and regulatory changes—<strong className="text-white">before they destroy portfolio value</strong>.
            </p>
          </div>
        </section>

        {/* The CedarOwl Advantage */}
        <section className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">The CedarOwl Advantage</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-[#0d5f5f] to-[#0a4d4d] rounded-lg p-6 border border-[#4db8b8]">
              <Shield className="w-12 h-12 text-[#4db8b8] mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">7 Risk Vectors</h3>
              <p className="text-gray-200">
                We analyze Conflict & Security, Sanctions & Regulatory, Trade & Logistics, Governance & Rule of Law, Public Unrest & Labor, Cyber & Data Sovereignty, and Currency & Capital Controls—covering every angle of geopolitical risk.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#0d5f5f] to-[#0a4d4d] rounded-lg p-6 border border-[#4db8b8]">
              <Database className="w-12 h-12 text-[#4db8b8] mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">5 Exposure Dimensions</h3>
              <p className="text-gray-200">
                Revenue exposure, supply-chain dependencies, physical assets at risk, financial exposure, and counterparty/political alignment—each weighted by sector-specific coefficients for maximum precision.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#0d5f5f] to-[#0a4d4d] rounded-lg p-6 border border-[#4db8b8]">
              <TrendingUp className="w-12 h-12 text-[#4db8b8] mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Sector Intelligence</h3>
              <p className="text-gray-200">
                Industry-specific sensitivity multipliers recognize that semiconductor companies face different risks than utilities. Our model adapts to your sector's unique vulnerability profile.
              </p>
            </div>
          </div>
        </section>

        {/* Our Process */}
        <section className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How CedarOwl Protects Your Investments</h2>
          
          <div className="flex flex-col items-center space-y-6 max-w-3xl mx-auto">
            <div className="w-full bg-gradient-to-r from-[#0d5f5f] to-[#0a4d4d] text-white font-semibold text-center py-5 px-6 rounded-lg border-2 border-[#4db8b8] shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">1</span>
                <span className="text-lg">Data Collection: Real-Time Intelligence from Authoritative Sources</span>
              </div>
            </div>
            <div className="text-4xl text-[#4db8b8]">↓</div>
            
            <div className="w-full bg-[#0d5f5f]/80 text-white font-semibold text-center py-5 px-6 rounded-lg border border-[#4db8b8]">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">2</span>
                <span className="text-lg">Country Shock Index: Quantifying Geopolitical Instability</span>
              </div>
            </div>
            <div className="text-4xl text-[#4db8b8]">↓</div>
            
            <div className="w-full bg-[#0d5f5f]/80 text-white font-semibold text-center py-5 px-6 rounded-lg border border-[#4db8b8]">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">3</span>
                <span className="text-lg">Company Exposure Analysis: Your Unique Risk Profile</span>
              </div>
            </div>
            <div className="text-4xl text-[#4db8b8]">↓</div>
            
            <div className="w-full bg-[#0d5f5f]/80 text-white font-semibold text-center py-5 px-6 rounded-lg border border-[#4db8b8]">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">4</span>
                <span className="text-lg">Sector Sensitivity Adjustment: Industry-Specific Intelligence</span>
              </div>
            </div>
            <div className="text-4xl text-[#4db8b8]">↓</div>
            
            <div className="w-full bg-gradient-to-r from-[#0d5f5f] to-[#0a4d4d] text-white font-semibold text-center py-5 px-6 rounded-lg border-2 border-[#4db8b8] shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">5</span>
                <span className="text-lg">CO-GRI Score: Actionable Risk Assessment (0-100 Scale)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="bg-white/5 border border-white/10 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-10 h-10 text-[#4db8b8]" />
            <h2 className="text-3xl font-bold text-white">Trusted Data Sources</h2>
          </div>
          <p className="text-gray-200 text-lg mb-6">
            CedarOwl integrates intelligence from the world's most authoritative sources, ensuring you have access to the latest, most reliable geopolitical data:
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'GDELT & ACLED', desc: 'Conflict & Security Data' },
              { name: 'OFAC & EU CFSP', desc: 'Sanctions & Regulatory' },
              { name: 'WTO & UN Comtrade', desc: 'Trade & Logistics' },
              { name: 'World Bank WGI', desc: 'Governance Indicators' },
              { name: 'CISA & ENISA', desc: 'Cyber & Data Security' },
              { name: 'IMF & BIS', desc: 'Currency & Capital Flows' },
            ].map((source) => (
              <div key={source.name} className="bg-gradient-to-br from-[#0d5f5f] to-[#0a4d4d] rounded-lg p-4 text-center border border-[#4db8b8]/50">
                <h3 className="font-bold text-white mb-1">{source.name}</h3>
                <p className="text-sm text-gray-200">{source.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why It Matters */}
        <section className="bg-gradient-to-r from-[#0d5f5f] to-[#0a4d4d] border border-[#4db8b8] rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-10 h-10 text-[#4db8b8]" />
            <h2 className="text-3xl font-bold text-white">Why This Matters for Your Portfolio</h2>
          </div>
          
          <div className="space-y-4 text-gray-100 text-lg">
            <div className="flex items-start gap-3">
              <span className="text-[#4db8b8] mt-1 font-bold text-xl">✓</span>
              <p>
                <strong className="text-white">Early Warning System:</strong> Detect threats weeks or months before they materialize, giving you time to adjust positions and protect capital.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#4db8b8] mt-1 font-bold text-xl">✓</span>
              <p>
                <strong className="text-white">Company-Specific Intelligence:</strong> Generic country ratings miss the nuances. We analyze YOUR holdings' unique exposure profiles.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#4db8b8] mt-1 font-bold text-xl">✓</span>
              <p>
                <strong className="text-white">Transparent Methodology:</strong> See exactly how each risk vector contributes to the final score. No black boxes, no guesswork.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#4db8b8] mt-1 font-bold text-xl">✓</span>
              <p>
                <strong className="text-white">Real-Time Updates:</strong> Markets move fast. Our platform delivers continuous monitoring and instant alerts when risk levels change.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#4db8b8] mt-1 font-bold text-xl">✓</span>
              <p>
                <strong className="text-white">Portfolio-Wide Analysis:</strong> Assess aggregate risk across all holdings, identify concentration risks, and optimize for geopolitical resilience.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-white/5 border border-white/10 rounded-lg p-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Protect Your Portfolio?</h2>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Don't wait for the next geopolitical crisis to catch you off guard. Start using CedarOwl's intelligence platform today and stay ahead of the risks that threaten your investments.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/cogri">
              <Button className="bg-[#4db8b8] hover:bg-[#3da7a7] text-white text-lg px-8 py-6 h-auto">
                <TrendingUp className="mr-2 h-5 w-5" />
                Assess a Company Now
              </Button>
            </Link>
            <Link href="/cogri-portfolio">
              <Button className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white text-lg px-8 py-6 h-auto border-2 border-[#4db8b8]">
                Analyze Your Portfolio
              </Button>
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-red-900/20 border border-red-700/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Important Disclaimer</h2>
          <p className="text-gray-200 text-sm leading-relaxed">
            The information on this website and the output of this assessment tool is intended for educational purposes only. Opinions expressed are subject to change without notice and are not intended as investment advice or to predict future performance. The tool assessment output does not constitute a recommendation or a solicitation or offer of the purchase or sale of securities. Furthermore, the information on this website and the output of the assessment tool does not endorse or recommend any tax, legal, or investment related strategy, trading related strategy or model portfolio. The future performance of an investment, trade, strategy or model portfolio cannot be deduced from past performance. As with any investment, trade, strategy or model portfolio, the outcome depends upon many factors including: investment or trading objectives, income, net worth, tax bracket, suitability, risk tolerance, as well as economic and market forecasts set forth may not develop as predicted and there can be no guarantee that investments, trades, strategies or model portfolios will be successful. All information and input used in this assessment tool has been derived from public domain sources that are deemed to be reliable but not guaranteed.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0a1520] text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm">
            Powered by CedarOwl's advanced geopolitical risk analysis • Integrated Multi-Source Framework
          </p>
          <p className="text-xs mt-2 text-gray-500">
            <Link href="/disclaimer">
              <a className="text-[#0d5f5f] hover:underline cursor-pointer">Full Disclaimer</a>
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, TrendingUp, Globe, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

export default function About() {
  const cacheBuster = new Date().getTime();
  
  return (
    <div className="min-h-screen bg-[#0f1e2e]">
      {/* Header */}
      <header className="bg-[#0d5f5f] text-white py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2">
            <img 
              src={`/assets/cedarowl-logo-approach.png?v=${cacheBuster}`}
              alt="CedarOwl Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold">CedarOwl's Unique Approach</h1>
            <p className="text-xl mt-2">The Most Comprehensive Geopolitical Risk Assessment Framework for Investors</p>
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
          <h2 className="text-4xl font-bold text-white mb-6">Why Traditional Risk Models Fall Short</h2>
          <p className="text-xl text-gray-100 leading-relaxed max-w-4xl mx-auto">
            Most investors rely on outdated country risk ratings that ignore <strong>company-specific exposures</strong>, <strong>sector vulnerabilities</strong>, and <strong>real-time geopolitical developments</strong>. CedarOwl changes that with our proprietary <strong>CO-GRI (CedarOwl Geopolitical Risk Index)</strong> methodology—the only framework that combines multi-vector risk analysis with granular company exposure data.
          </p>
        </section>

        {/* What Makes Us Different */}
        <section className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">What Makes CedarOwl Different</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#0d5f5f]/30 border border-[#4db8b8] rounded-lg p-6 text-center">
              <Shield className="w-12 h-12 text-[#4db8b8] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">7 Risk Vectors</h3>
              <p className="text-gray-300">
                We analyze Conflict & Security, Sanctions & Regulatory, Trade & Logistics, Governance & Rule of Law, Public Unrest & Labor, Cyber & Data Sovereignty, and Currency & Capital Controls—not just generic "country risk."
              </p>
            </div>

            <div className="bg-[#0d5f5f]/30 border border-[#4db8b8] rounded-lg p-6 text-center">
              <Globe className="w-12 h-12 text-[#4db8b8] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Company-Specific Exposure</h3>
              <p className="text-gray-300">
                Every company has unique geographic footprints. We calculate exposure across revenue, supply chains, physical assets, financial holdings, and political alignments—tailored to each business.
              </p>
            </div>

            <div className="bg-[#0d5f5f]/30 border border-[#4db8b8] rounded-lg p-6 text-center">
              <TrendingUp className="w-12 h-12 text-[#4db8b8] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Sector Sensitivity Multipliers</h3>
              <p className="text-gray-300">
                A semiconductor company faces different risks than a utility. Our sector-specific multipliers ensure risk scores reflect real-world industry vulnerabilities.
              </p>
            </div>
          </div>
        </section>

        {/* CO-GRI Methodology */}
        <section className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">The CO-GRI Methodology: How It Works</h2>
          <p className="text-gray-200 text-lg leading-relaxed mb-8 text-center max-w-4xl mx-auto">
            <strong className="text-white">CedarOwl's proprietary CO-GRI (CedarOwl Geopolitical Risk Index)</strong> delivers actionable, data-driven risk scores by integrating multiple risk dimensions, company-specific exposure data, and sector sensitivity adjustments. Here's how we do it:
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#0d5f5f] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#4db8b8] rounded-full flex items-center justify-center text-white font-bold">1</div>
                <h3 className="text-xl font-bold text-white">Country Shock Index (CSI)</h3>
              </div>
              <p className="text-gray-200">
                We measure geopolitical risk across 7 key vectors for every country where a company operates. Each vector is scored 0-100 based on real-time data from authoritative sources like GDELT, OFAC, World Bank, IMF, and CISA.
              </p>
            </div>

            <div className="bg-[#0d5f5f] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#4db8b8] rounded-full flex items-center justify-center text-white font-bold">2</div>
                <h3 className="text-xl font-bold text-white">Company Exposure Weights</h3>
              </div>
              <p className="text-gray-200">
                We calculate exposure across 4 dimensions: Revenue exposure, Supply-chain exposure, Physical assets, and Financial exposure. Each dimension is weighted by sector-specific coefficients.
              </p>
            </div>

            <div className="bg-[#0d5f5f] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#4db8b8] rounded-full flex items-center justify-center text-white font-bold">3</div>
                <h3 className="text-xl font-bold text-white">Sector Sensitivity Multiplier</h3>
              </div>
              <p className="text-gray-200">
                Risk scores are adjusted based on industry-specific vulnerability. Semiconductors and Energy sectors show higher sensitivity; Consumer Staples and Healthcare show lower sensitivity to geopolitical shocks.
              </p>
            </div>

            <div className="bg-[#0d5f5f] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#4db8b8] rounded-full flex items-center justify-center text-white font-bold">4</div>
                <h3 className="text-xl font-bold text-white">Final CO-GRI Score</h3>
              </div>
              <p className="text-gray-200">
                Final scores are normalized to a 0-100 scale with clear risk interpretation: Low (0-20), Moderate (20-40), Elevated (40-60), High (60-80), and Critical (80-100). Actionable insights included.
              </p>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3">
            <Database className="w-8 h-8 text-[#4db8b8]" />
            Trusted Data Sources & Integration
          </h2>
          <p className="text-gray-200 text-center mb-8 max-w-3xl mx-auto">
            CedarOwl integrates real-time data from the world's most authoritative geopolitical, economic, and security databases. Our multi-source approach ensures comprehensive, accurate risk assessment.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'GDELT & ACLED', desc: 'Conflict & Security Data', icon: '🛡️' },
              { name: 'OFAC & EU CFSP', desc: 'Sanctions & Regulatory', icon: '⚖️' },
              { name: 'WTO & UN Comtrade', desc: 'Trade & Logistics', icon: '🚢' },
              { name: 'World Bank WGI', desc: 'Governance Indicators', icon: '🏛️' },
              { name: 'CISA & ENISA', desc: 'Cyber & Data Security', icon: '🔒' },
              { name: 'IMF & BIS', desc: 'Currency & Capital Flows', icon: '💱' },
            ].map((source) => (
              <div key={source.name} className="bg-[#0d5f5f] rounded-lg p-4 text-center hover:bg-[#0a4d4d] transition-colors">
                <div className="text-3xl mb-2">{source.icon}</div>
                <h3 className="font-bold text-white mb-1">{source.name}</h3>
                <p className="text-sm text-gray-200">{source.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Assessment Process Flow */}
        <section className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Your Risk Assessment Journey</h2>
          
          <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto">
            <div className="w-full bg-gradient-to-r from-[#0d5f5f] to-[#0a4d4d] text-white font-semibold text-center py-4 px-6 rounded-lg shadow-lg">
              📊 Enter Company Ticker or Name
            </div>
            <div className="text-4xl text-[#4db8b8]">↓</div>
            <div className="w-full bg-[#0d5f5f]/70 text-white font-semibold text-center py-4 px-6 rounded-lg">
              🌍 Analyze Geographic Exposure & Operations
            </div>
            <div className="text-4xl text-[#4db8b8]">↓</div>
            <div className="w-full bg-[#0d5f5f]/70 text-white font-semibold text-center py-4 px-6 rounded-lg">
              📈 Calculate Country Shock Index (7 Risk Vectors)
            </div>
            <div className="text-4xl text-[#4db8b8]">↓</div>
            <div className="w-full bg-[#0d5f5f]/70 text-white font-semibold text-center py-4 px-6 rounded-lg">
              🎯 Apply Company Exposure Weights (4 Dimensions)
            </div>
            <div className="text-4xl text-[#4db8b8]">↓</div>
            <div className="w-full bg-[#0d5f5f]/70 text-white font-semibold text-center py-4 px-6 rounded-lg">
              🤝 Adjust for Counterparty/Political Alignment
            </div>
            <div className="text-4xl text-[#4db8b8]">↓</div>
            <div className="w-full bg-[#0d5f5f]/70 text-white font-semibold text-center py-4 px-6 rounded-lg">
              🔧 Adjust for Sector Sensitivity
            </div>
            <div className="text-4xl text-[#4db8b8]">↓</div>
            <div className="w-full bg-gradient-to-r from-[#0d5f5f] to-[#0a4d4d] text-white font-semibold text-center py-4 px-6 rounded-lg shadow-lg">
              ✅ Receive CO-GRI Score & Actionable Insights
            </div>
          </div>
        </section>

        {/* Key Advantages */}
        <section className="bg-white/5 border border-white/10 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
            <CheckCircle className="w-8 h-8 text-[#4db8b8]" />
            Why Investors Choose CedarOwl
          </h2>
          
          <div className="space-y-6 text-gray-200 max-w-4xl mx-auto">
            <div className="flex items-start gap-4 bg-[#0d5f5f]/20 p-4 rounded-lg">
              <span className="text-[#4db8b8] mt-1 font-bold text-2xl">✓</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Comprehensive Coverage</h3>
                <p>
                  Analyzes 7 distinct geopolitical risk vectors covering conflict, sanctions, trade, governance, public unrest, cyber threats, and currency risks—far beyond traditional country ratings.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 bg-[#0d5f5f]/20 p-4 rounded-lg">
              <span className="text-[#4db8b8] mt-1 font-bold text-2xl">✓</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Company-Specific Intelligence</h3>
                <p>
                  Evaluates each company's unique geographic exposure, supply chain dependencies, and counterparty alignments rather than using generic country ratings that miss critical nuances.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 bg-[#0d5f5f]/20 p-4 rounded-lg">
              <span className="text-[#4db8b8] mt-1 font-bold text-2xl">✓</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Sector-Aware Analysis</h3>
                <p>
                  Adjusts risk assessments based on industry-specific vulnerability to geopolitical shocks, recognizing that technology companies face different risks than utilities or consumer staples.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 bg-[#0d5f5f]/20 p-4 rounded-lg">
              <span className="text-[#4db8b8] mt-1 font-bold text-2xl">✓</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Real-Time Data Integration</h3>
                <p>
                  Integrates live data from authoritative sources including government agencies, international organizations, and market data providers—ensuring your risk assessments reflect current conditions.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 bg-[#0d5f5f]/20 p-4 rounded-lg">
              <span className="text-[#4db8b8] mt-1 font-bold text-2xl">✓</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Transparent Methodology</h3>
                <p>
                  Provides detailed calculation breakdowns showing how each risk vector and exposure dimension contributes to the final score—no black boxes, just clear, actionable intelligence.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 bg-[#0d5f5f]/20 p-4 rounded-lg">
              <span className="text-[#4db8b8] mt-1 font-bold text-2xl">✓</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Portfolio-Level Insights</h3>
                <p>
                  Assess entire portfolios in seconds, identifying concentration risks and diversification opportunities across geopolitical exposure dimensions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-[#0d5f5f] to-[#0a4d4d] border border-[#4db8b8] rounded-lg p-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Protect Your Portfolio?</h2>
          <p className="text-xl text-gray-100 mb-8 max-w-3xl mx-auto">
            Don't let geopolitical risks blindside your investments. Start assessing your exposure today with CedarOwl's comprehensive CO-GRI methodology.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/cogri">
              <Button className="bg-white text-[#0d5f5f] hover:bg-gray-100 text-lg px-8 py-6 h-auto">
                <TrendingUp className="mr-2 h-5 w-5" />
                Assess a Company Now
              </Button>
            </Link>
            <Link href="/cogri-portfolio">
              <Button className="bg-[#4db8b8] text-white hover:bg-[#3da7a7] text-lg px-8 py-6 h-auto">
                <Shield className="mr-2 h-5 w-5" />
                Assess Your Portfolio
              </Button>
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-red-900/20 border border-red-700/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            Important Disclaimer
          </h2>
          <p className="text-gray-200 leading-relaxed text-sm">
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
          <Link href="/disclaimer">
            <a className="text-[#4db8b8] hover:underline text-sm mt-2 inline-block">Full Disclaimer</a>
          </Link>
        </div>
      </footer>
    </div>
  );
}
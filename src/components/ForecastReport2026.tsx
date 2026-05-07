import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, ExternalLink } from 'lucide-react';

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<SectionProps> = ({ id, title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div id={id} className="mb-6 bg-[#0d1512] border border-[#0d5f5f]/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-[#0d5f5f]/10 transition-colors"
      >
        <h2 className="text-2xl font-bold text-[#7fa89f]">{title}</h2>
        {isOpen ? <ChevronUp className="text-[#7fa89f]" /> : <ChevronDown className="text-[#7fa89f]" />}
      </button>
      {isOpen && <div className="p-6 pt-0">{children}</div>}
    </div>
  );
};

const ForecastReport2026: React.FC = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0a0f0d] via-[#0d1512] to-[#0a0f0d] text-white rounded-lg">
      {/* Cover Section */}
      <div className="bg-gradient-to-r from-[#0d5f5f] to-[#0a4d4d] p-12 rounded-t-lg text-center mb-8">
        <h1 className="text-5xl font-bold mb-4">2026 Geopolitical Risk Forecast</h1>
        <p className="text-2xl text-gray-200 mb-2">16 Expert Consensus Analysis</p>
        <p className="text-lg text-gray-300">January 2026 Baseline Scenario</p>
        <div className="mt-8">
          <a
            href="https://c6gh24.atoms.world/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0d5f5f] hover:bg-gray-100 rounded-lg transition-colors font-semibold"
          >
            <Download size={20} />
            <span>Download PDF Report</span>
          </a>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-[#0d1512] border border-[#0d5f5f]/30 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-[#7fa89f] mb-4">Table of Contents</h2>
        <nav className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button onClick={() => scrollToSection('h1-timeline')} className="text-left text-gray-300 hover:text-[#7fa89f] transition-colors">
            → H1 2026 Timeline (Jan-Jun)
          </button>
          <button onClick={() => scrollToSection('h2-timeline')} className="text-left text-gray-300 hover:text-[#7fa89f] transition-colors">
            → H2 2026 Timeline (Jul-Dec)
          </button>
          <button onClick={() => scrollToSection('investment-implications')} className="text-left text-gray-300 hover:text-[#7fa89f] transition-colors">
            → Investment Implications
          </button>
          <button onClick={() => scrollToSection('regional-assessment')} className="text-left text-gray-300 hover:text-[#7fa89f] transition-colors">
            → Regional Risk Assessment
          </button>
          <button onClick={() => scrollToSection('strategic-recommendations')} className="text-left text-gray-300 hover:text-[#7fa89f] transition-colors">
            → Strategic Recommendations
          </button>
          <button onClick={() => scrollToSection('expert-sources')} className="text-left text-gray-300 hover:text-[#7fa89f] transition-colors">
            → Expert Sources
          </button>
        </nav>
      </div>

      {/* H1 2026 Timeline */}
      <CollapsibleSection id="h1-timeline" title="H1 2026 Timeline (January - June)" defaultOpen={true}>
        <div className="space-y-6">
          {/* January */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">January 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Trump Administration Begins:</strong> Immediate policy shifts on Ukraine, NATO, and Middle East</li>
              <li>• <strong>Ukraine Ceasefire Negotiations:</strong> US pressures Kyiv to negotiate; Russia demands territorial recognition</li>
              <li>• <strong>Gaza Humanitarian Crisis Deepens:</strong> International pressure on Israel intensifies</li>
              <li>• <strong>China Economic Stimulus:</strong> Beijing announces major infrastructure spending to counter slowdown</li>
            </ul>
          </div>

          {/* February */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">February 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>NATO Summit Crisis:</strong> Trump threatens withdrawal unless European defense spending increases</li>
              <li>• <strong>Russia-Ukraine Preliminary Agreement:</strong> Ceasefire framework established; frozen conflict likely</li>
              <li>• <strong>Middle East Regional Conference:</strong> Arab states, Iran, Turkey discuss post-Gaza security architecture</li>
              <li>• <strong>US-China Trade Tensions:</strong> New tariffs announced; tech sector particularly impacted</li>
            </ul>
          </div>

          {/* March */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">March 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>European Defense Initiative:</strong> EU announces independent defense fund; €100B commitment</li>
              <li>• <strong>Ukraine Reconstruction Begins:</strong> International donors pledge $300B; Russia excluded</li>
              <li>• <strong>Israel-Lebanon Border Escalation:</strong> Hezbollah attacks increase; regional war risk rises</li>
              <li>• <strong>BRICS+ Expansion:</strong> 8 new members join; dedollarization initiatives accelerate</li>
            </ul>
          </div>

          {/* April */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">April 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Taiwan Strait Incident:</strong> Chinese military exercises near Taiwan; US naval response</li>
              <li>• <strong>Oil Market Volatility:</strong> OPEC+ cuts production; prices spike to $95/barrel</li>
              <li>• <strong>European Elections:</strong> Nationalist parties gain ground in France, Germany; EU cohesion weakens</li>
              <li>• <strong>Russia Sanctions Evasion:</strong> New trade routes through Central Asia, Middle East established</li>
            </ul>
          </div>

          {/* May */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">May 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>G7 Summit Tensions:</strong> US-Europe rift over China policy; trade disputes intensify</li>
              <li>• <strong>Middle East Security Pact:</strong> Saudi Arabia, UAE, Egypt form defense alliance; excludes US</li>
              <li>• <strong>Global Food Crisis Warning:</strong> Ukraine grain exports disrupted; Africa faces shortages</li>
              <li>• <strong>Cryptocurrency Regulation:</strong> Major economies coordinate digital asset frameworks</li>
            </ul>
          </div>

          {/* June */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">June 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>NATO Restructuring:</strong> European pillar strengthens; US reduces troop presence by 30%</li>
              <li>• <strong>China-Russia Strategic Partnership:</strong> $200B energy deal signed; military cooperation deepens</li>
              <li>• <strong>Middle East Peace Framework:</strong> Regional powers propose Gaza reconstruction plan; Israel resists</li>
              <li>• <strong>Global Recession Fears:</strong> IMF downgrades growth forecasts; emerging markets most vulnerable</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* H2 2026 Timeline */}
      <CollapsibleSection id="h2-timeline" title="H2 2026 Timeline (July - December)">
        <div className="space-y-6">
          {/* July */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">July 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>US Midterm Campaign Begins:</strong> Foreign policy becomes major issue; isolationist sentiment grows</li>
              <li>• <strong>Ukraine-Russia Frozen Conflict:</strong> Ceasefire holds but no peace treaty; sanctions remain</li>
              <li>• <strong>Iran Nuclear Program Advances:</strong> IAEA reports 90% enrichment capability; Israel threatens action</li>
              <li>• <strong>BRICS Currency Initiative:</strong> Gold-backed trade currency announced; dollar dominance challenged</li>
            </ul>
          </div>

          {/* August */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">August 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Taiwan Crisis Escalates:</strong> China announces "reunification timeline"; US commitment questioned</li>
              <li>• <strong>European Energy Crisis:</strong> Russia reduces gas flows; prices surge; recession deepens</li>
              <li>• <strong>Middle East Arms Race:</strong> Saudi Arabia, UAE accelerate military modernization programs</li>
              <li>• <strong>Global Supply Chain Disruption:</strong> Red Sea shipping attacks increase; insurance costs soar</li>
            </ul>
          </div>

          {/* September */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">September 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>UN General Assembly Crisis:</strong> US-China confrontation over Taiwan; Security Council paralyzed</li>
              <li>• <strong>Israel-Iran Shadow War Intensifies:</strong> Cyber attacks, assassinations, proxy conflicts escalate</li>
              <li>• <strong>European Political Instability:</strong> Coalition governments collapse in Germany, France; far-right gains</li>
              <li>• <strong>Emerging Market Debt Crisis:</strong> Several countries default; IMF emergency interventions</li>
            </ul>
          </div>

          {/* October */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">October 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Oil Price Shock:</strong> Middle East tensions drive prices to $110/barrel; global inflation surges</li>
              <li>• <strong>China Military Exercises:</strong> Largest-ever drills around Taiwan; invasion fears peak</li>
              <li>• <strong>NATO Article 5 Debate:</strong> Cyber attacks on Baltic states test alliance commitment</li>
              <li>• <strong>Global Food Riots:</strong> Wheat shortages trigger unrest in Africa, Middle East, South Asia</li>
            </ul>
          </div>

          {/* November */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">November 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>US Midterm Elections:</strong> Foreign policy hawks lose ground; isolationism strengthens</li>
              <li>• <strong>Russia-China-Iran Trilateral Summit:</strong> "New World Order" declaration; anti-Western alliance solidifies</li>
              <li>• <strong>European Defense Union:</strong> Independent command structure established; US influence wanes</li>
              <li>• <strong>Cryptocurrency Crash:</strong> Regulatory crackdown triggers 60% decline; systemic risks emerge</li>
            </ul>
          </div>

          {/* December */}
          <div className="border-l-4 border-[#0d5f5f] pl-4">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-2">December 2026</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Year-End Assessment:</strong> Multipolar world order consolidates; US hegemony declines</li>
              <li>• <strong>Ukraine Reconstruction Stalls:</strong> Funding disputes, corruption scandals delay progress</li>
              <li>• <strong>Middle East New Normal:</strong> Regional powers fill US vacuum; Iran influence expands</li>
              <li>• <strong>Global Economic Outlook:</strong> Stagflation fears dominate; 2027 recession probability 65%</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {/* Investment Implications */}
      <CollapsibleSection id="investment-implications" title="Investment Implications by Asset Class">
        <div className="space-y-8">
          {/* Equities */}
          <div className="bg-[#0a0f0d] rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-4">Equities: Defensive Positioning</h3>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">US Large Cap</span>
                <span className="text-yellow-400 font-bold">Neutral (0%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-yellow-400 h-3 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">European Equities</span>
                <span className="text-red-400 font-bold">Underweight (-15%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-red-400 h-3 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Emerging Markets</span>
                <span className="text-red-400 font-bold">Underweight (-20%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-red-400 h-3 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Defense & Energy</span>
                <span className="text-green-400 font-bold">Overweight (+25%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-green-400 h-3 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              <strong>Rationale:</strong> Geopolitical tensions favor defense contractors and energy producers. 
              European exposure carries political risk. Emerging markets vulnerable to dollar strength and capital flight.
            </p>
          </div>

          {/* Fixed Income */}
          <div className="bg-[#0a0f0d] rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-4">Fixed Income: Quality & Duration</h3>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">US Treasuries (Short)</span>
                <span className="text-green-400 font-bold">Overweight (+20%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-green-400 h-3 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Investment Grade Credit</span>
                <span className="text-yellow-400 font-bold">Neutral (0%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-yellow-400 h-3 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">High Yield Bonds</span>
                <span className="text-red-400 font-bold">Underweight (-25%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-red-400 h-3 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">EM Sovereign Debt</span>
                <span className="text-red-400 font-bold">Underweight (-30%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-red-400 h-3 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              <strong>Rationale:</strong> Flight to quality drives Treasury demand. Short duration protects against rate volatility. 
              Credit spreads likely to widen as recession risks rise. Emerging market defaults probable.
            </p>
          </div>

          {/* Commodities */}
          <div className="bg-[#0a0f0d] rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-4">Commodities: Strategic Positioning</h3>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Gold</span>
                <span className="text-green-400 font-bold">Overweight (+30%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-green-400 h-3 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Energy (Oil & Gas)</span>
                <span className="text-green-400 font-bold">Overweight (+25%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-green-400 h-3 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Industrial Metals</span>
                <span className="text-red-400 font-bold">Underweight (-15%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-red-400 h-3 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Agriculture</span>
                <span className="text-green-400 font-bold">Overweight (+20%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-green-400 h-3 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              <strong>Rationale:</strong> Gold benefits from geopolitical uncertainty and dedollarization. Energy prices supported by 
              Middle East tensions and supply constraints. Food security concerns drive agricultural commodity demand.
            </p>
          </div>

          {/* Alternatives */}
          <div className="bg-[#0a0f0d] rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-4">Alternative Assets</h3>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Real Estate (US)</span>
                <span className="text-yellow-400 font-bold">Neutral (0%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-yellow-400 h-3 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Private Equity</span>
                <span className="text-red-400 font-bold">Underweight (-20%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-red-400 h-3 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Cryptocurrency</span>
                <span className="text-red-400 font-bold">Underweight (-35%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-red-400 h-3 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-300">Infrastructure</span>
                <span className="text-green-400 font-bold">Overweight (+15%)</span>
              </div>
              <div className="w-full bg-[#0d1512] rounded-full h-3">
                <div className="bg-green-400 h-3 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              <strong>Rationale:</strong> Real estate faces headwinds from higher rates but offers inflation hedge. 
              Private equity valuations stretched; exit environment challenging. Crypto regulatory risks high. 
              Infrastructure benefits from government spending and essential services demand.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Regional Risk Assessment */}
      <CollapsibleSection id="regional-assessment" title="Regional Risk Assessment">
        <div className="space-y-6">
          {/* Europe */}
          <div className="bg-[#0a0f0d] rounded-lg p-6 border-l-4 border-red-400">
            <h3 className="text-xl font-bold text-red-400 mb-3">Europe: High Risk</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Political Stability</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-red-400 text-sm font-bold">7.5/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Economic Risk</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  <span className="text-red-400 text-sm font-bold">8.0/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Energy Security</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-red-400 text-sm font-bold">8.5/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Military Conflict</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-yellow-400 text-sm font-bold">6.0/10</span>
                </div>
              </div>
            </div>
            <p className="text-gray-300 mb-3">
              <strong>Key Risks:</strong> Energy crisis deepens as Russian gas flows remain constrained. Political fragmentation 
              accelerates with nationalist parties gaining power. NATO cohesion weakens under US pressure. Recession likely in H2 2026.
            </p>
            <p className="text-gray-300">
              <strong>Investment Impact:</strong> Underweight European equities and credit. Focus on defensive sectors and companies 
              with limited Russia/Ukraine exposure. Consider hedging euro exposure.
            </p>
          </div>

          {/* Middle East */}
          <div className="bg-[#0a0f0d] rounded-lg p-6 border-l-4 border-orange-400">
            <h3 className="text-xl font-bold text-orange-400 mb-3">Middle East: Elevated Risk</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Regional Stability</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-orange-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <span className="text-orange-400 text-sm font-bold">7.0/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Oil Price Volatility</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-orange-400 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-orange-400 text-sm font-bold">7.5/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Iran-Israel Conflict</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  <span className="text-red-400 text-sm font-bold">8.0/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Shipping Disruption</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-orange-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-orange-400 text-sm font-bold">6.5/10</span>
                </div>
              </div>
            </div>
            <p className="text-gray-300 mb-3">
              <strong>Key Risks:</strong> Israel-Iran shadow war escalates with potential for direct confrontation. Gaza reconstruction 
              stalls amid political disputes. Regional powers form new security architecture excluding US. Oil supply disruptions possible.
            </p>
            <p className="text-gray-300">
              <strong>Investment Impact:</strong> Overweight energy sector and defense contractors. Hedge oil price exposure. 
              Avoid direct exposure to conflict zones. Monitor Strait of Hormuz shipping risks.
            </p>
          </div>

          {/* Asia-Pacific */}
          <div className="bg-[#0a0f0d] rounded-lg p-6 border-l-4 border-yellow-400">
            <h3 className="text-xl font-bold text-yellow-400 mb-3">Asia-Pacific: Moderate-High Risk</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Taiwan Strait Tension</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-red-400 text-sm font-bold">8.5/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">China Economic Slowdown</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-orange-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <span className="text-orange-400 text-sm font-bold">7.0/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">US-China Decoupling</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-orange-400 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-orange-400 text-sm font-bold">7.5/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Supply Chain Risk</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-yellow-400 text-sm font-bold">6.5/10</span>
                </div>
              </div>
            </div>
            <p className="text-gray-300 mb-3">
              <strong>Key Risks:</strong> Taiwan crisis reaches critical point with Chinese military exercises and US commitment questions. 
              China's economic slowdown persists despite stimulus. Tech decoupling accelerates. Regional allies hedge between US and China.
            </p>
            <p className="text-gray-300">
              <strong>Investment Impact:</strong> Reduce direct China exposure; favor India, Southeast Asia. Avoid Taiwan semiconductor 
              concentration risk. Diversify supply chains. Consider defense and cybersecurity plays.
            </p>
          </div>

          {/* Americas */}
          <div className="bg-[#0a0f0d] rounded-lg p-6 border-l-4 border-green-400">
            <h3 className="text-xl font-bold text-green-400 mb-3">Americas: Low-Moderate Risk</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Political Stability</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '55%' }}></div>
                  </div>
                  <span className="text-yellow-400 text-sm font-bold">5.5/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Economic Resilience</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <span className="text-green-400 text-sm font-bold">4.0/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Trade Policy Risk</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-yellow-400 text-sm font-bold">6.0/10</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">LatAm Instability</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-[#0d1512] rounded-full h-2">
                    <div className="bg-orange-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <span className="text-orange-400 text-sm font-bold">7.0/10</span>
                </div>
              </div>
            </div>
            <p className="text-gray-300 mb-3">
              <strong>Key Risks:</strong> US political polarization intensifies around foreign policy. Isolationist policies strain 
              alliances. Latin America faces economic headwinds and political instability. Mexico-US relations complicated by immigration.
            </p>
            <p className="text-gray-300">
              <strong>Investment Impact:</strong> US remains relative safe haven despite domestic tensions. Favor large-cap quality 
              and defensive sectors. Selective opportunities in nearshoring beneficiaries (Mexico). Avoid high-risk LatAm exposure.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Strategic Recommendations */}
      <CollapsibleSection id="strategic-recommendations" title="Strategic Portfolio Recommendations">
        <div className="space-y-6">
          {/* Model Portfolio */}
          <div className="bg-[#0a0f0d] rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-4">Recommended Asset Allocation (2026)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-300 mb-3">Conservative Portfolio</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Cash & Equivalents</span>
                      <span className="text-white font-bold">25%</span>
                    </div>
                    <div className="w-full bg-[#0d1512] rounded-full h-2">
                      <div className="bg-[#7fa89f] h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Fixed Income</span>
                      <span className="text-white font-bold">40%</span>
                    </div>
                    <div className="w-full bg-[#0d1512] rounded-full h-2">
                      <div className="bg-[#7fa89f] h-2 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Equities</span>
                      <span className="text-white font-bold">20%</span>
                    </div>
                    <div className="w-full bg-[#0d1512] rounded-full h-2">
                      <div className="bg-[#7fa89f] h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Gold & Commodities</span>
                      <span className="text-white font-bold">15%</span>
                    </div>
                    <div className="w-full bg-[#0d1512] rounded-full h-2">
                      <div className="bg-[#7fa89f] h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-300 mb-3">Moderate Portfolio</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Cash & Equivalents</span>
                      <span className="text-white font-bold">15%</span>
                    </div>
                    <div className="w-full bg-[#0d1512] rounded-full h-2">
                      <div className="bg-[#0d5f5f] h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Fixed Income</span>
                      <span className="text-white font-bold">30%</span>
                    </div>
                    <div className="w-full bg-[#0d1512] rounded-full h-2">
                      <div className="bg-[#0d5f5f] h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Equities</span>
                      <span className="text-white font-bold">35%</span>
                    </div>
                    <div className="w-full bg-[#0d1512] rounded-full h-2">
                      <div className="bg-[#0d5f5f] h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Gold & Commodities</span>
                      <span className="text-white font-bold">20%</span>
                    </div>
                    <div className="w-full bg-[#0d1512] rounded-full h-2">
                      <div className="bg-[#0d5f5f] h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Recommendations */}
          <div className="bg-[#0a0f0d] rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-4">Top 10 Strategic Recommendations</h3>
            <ol className="space-y-3 text-gray-300">
              <li className="flex gap-3">
                <span className="text-[#7fa89f] font-bold">1.</span>
                <span><strong>Increase Cash Reserves:</strong> Maintain 15-25% cash for opportunistic deployment during market dislocations</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7fa89f] font-bold">2.</span>
                <span><strong>Overweight Gold:</strong> Allocate 10-15% to gold as geopolitical hedge and dedollarization beneficiary</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7fa89f] font-bold">3.</span>
                <span><strong>Defense Sector Exposure:</strong> Increase allocation to defense contractors benefiting from global rearmament</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7fa89f] font-bold">4.</span>
                <span><strong>Energy Overweight:</strong> Favor oil/gas producers and services; Middle East tensions support prices</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7fa89f] font-bold">5.</span>
                <span><strong>Short Duration Fixed Income:</strong> Protect against rate volatility; focus on 1-3 year maturities</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7fa89f] font-bold">6.</span>
                <span><strong>Reduce Europe Exposure:</strong> Underweight European equities and credit; energy crisis and recession risks</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7fa89f] font-bold">7.</span>
                <span><strong>Avoid Emerging Markets:</strong> High vulnerability to dollar strength, capital flight, and debt crises</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7fa89f] font-bold">8.</span>
                <span><strong>Hedge Currency Risk:</strong> Consider hedging euro and emerging market currency exposures</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7fa89f] font-bold">9.</span>
                <span><strong>Diversify Supply Chains:</strong> Favor companies with geographically diversified operations</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#7fa89f] font-bold">10.</span>
                <span><strong>Monitor Tail Risks:</strong> Maintain stop-losses and rebalancing discipline; volatility likely to spike</span>
              </li>
            </ol>
          </div>

          {/* Risk Management */}
          <div className="bg-[#0a0f0d] rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-4">Risk Management Framework</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-300 mb-3">Scenario Planning</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>• <strong>Base Case (60%):</strong> Managed tensions, no major escalation</li>
                  <li>• <strong>Optimistic (15%):</strong> De-escalation, diplomatic breakthroughs</li>
                  <li>• <strong>Pessimistic (25%):</strong> Major conflict (Taiwan, Iran-Israel, Ukraine)</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-300 mb-3">Trigger Points</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>• Taiwan military action by China</li>
                  <li>• Iran-Israel direct confrontation</li>
                  <li>• NATO Article 5 invocation</li>
                  <li>• Major emerging market defaults</li>
                  <li>• Oil price above $120/barrel</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Expert Sources */}
      <CollapsibleSection id="expert-sources" title="Expert Sources & Methodology">
        <div className="space-y-6">
          <div className="bg-[#0a0f0d] rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-4">16 Contributing Analysts</h3>
            <p className="text-gray-300 mb-6">
              This forecast represents the consensus view of 16 leading experts across military intelligence, diplomacy, 
              economics, and strategic analysis. Each analyst provided independent assessments which were synthesized to 
              produce this baseline scenario.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-400">Larry C. Johnson</div>
                <div className="text-xs text-gray-500">CIA Veteran</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Lt. Col. Daniel Davis</div>
                <div className="text-xs text-gray-500">Military Analyst</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Col. Larry Wilkerson</div>
                <div className="text-xs text-gray-500">Former Chief of Staff</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Jacques Baud</div>
                <div className="text-xs text-gray-500">UN Security Expert</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Scott Ritter</div>
                <div className="text-xs text-gray-500">UN Weapons Inspector</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Amb. Chas Freeman</div>
                <div className="text-xs text-gray-500">Former Ambassador</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Andrei Martyanov</div>
                <div className="text-xs text-gray-500">Military Analyst</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Prof. Mohammad Marandi</div>
                <div className="text-xs text-gray-500">Middle East Expert</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Sean Foo</div>
                <div className="text-xs text-gray-500">Economic Analyst</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Dr. Marc Faber</div>
                <div className="text-xs text-gray-500">Investment Strategist</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Michael Every</div>
                <div className="text-xs text-gray-500">Global Strategist</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Louis-Vincent Gave</div>
                <div className="text-xs text-gray-500">Macro Analyst</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Alex Krainer</div>
                <div className="text-xs text-gray-500">Hedge Fund Manager</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Dr. Anas Al-Hajji</div>
                <div className="text-xs text-gray-500">Energy Economist</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Prof. Glenn Diesen</div>
                <div className="text-xs text-gray-500">Political Scientist</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Stanislav Krapivnik</div>
                <div className="text-xs text-gray-500">Financial Analyst</div>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0f0d] rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-4">Methodology</h3>
            <div className="space-y-4 text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Data Collection</h4>
                <p className="text-sm">
                  Analysts provided independent forecasts covering 195 countries across political, economic, military, 
                  and social dimensions. Assessments were collected through structured questionnaires and follow-up interviews.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Consensus Building</h4>
                <p className="text-sm">
                  Individual forecasts were aggregated using weighted averaging based on analyst expertise in specific regions 
                  and domains. Outlier views were flagged for special consideration. Confidence intervals were calculated for 
                  each prediction.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Scenario Development</h4>
                <p className="text-sm">
                  Three scenarios were developed: Baseline (60% probability), Optimistic (15%), and Pessimistic (25%). 
                  This report presents the baseline scenario. Alternative scenarios available upon request.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Investment Translation</h4>
                <p className="text-sm">
                  Geopolitical forecasts were translated into investment implications through quantitative modeling of 
                  historical relationships between geopolitical events and asset class performance. Risk-return profiles 
                  were calculated for various portfolio allocations.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0f0d] rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#7fa89f] mb-4">Disclaimer</h3>
            <p className="text-gray-400 text-sm">
              This report is for informational purposes only and does not constitute investment advice. Past performance 
              is not indicative of future results. Geopolitical forecasting involves significant uncertainty, and actual 
              events may differ materially from predictions. Investors should conduct their own due diligence and consult 
              with qualified financial advisors before making investment decisions. The analysts and publishers of this 
              report do not guarantee the accuracy of forecasts and are not liable for investment losses resulting from 
              reliance on this information.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Footer */}
      <div className="mt-8 text-center">
        <a
          href="https://c6gh24.atoms.world/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#0d5f5f] hover:bg-[#0a4d4d] rounded-lg transition-colors text-lg font-semibold"
        >
          <Download size={20} />
          <span>Download Complete PDF Report</span>
          <ExternalLink size={18} />
        </a>
        <p className="text-gray-500 mt-4 text-sm">
          © 2026 Geopolitical Risk Analysis • All Rights Reserved
        </p>
      </div>
    </div>
  );
};

export default ForecastReport2026;
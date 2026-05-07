/**
 * Geopolitical Insights Knowledge Base
 * 
 * Distilled insights from leading geopolitical analysts and sources:
 * - BlackRock Geopolitical Risk Dashboard
 * - Sean Foo (YouTube geopolitical analyst)
 * - Michael Every (Rabobank Global Strategist)
 * - Alex Krainer (financial analyst, Russia/China expert)
 * - Louis-Vincent Gave (Gavekal Research CEO, Asia expert)
 * - Dr. Marc Faber (Gloom, Boom & Doom Report)
 * - Tom Luongo (geopolitical analyst, Fed/ECB expert)
 * - Swen Lorenz (Undervalued-Shares.com, frontier markets specialist)
 * - Recent geopolitical news (2024-2025)
 * - Current capital controls and currency restrictions (2024-2025)
 * - Trade tariffs and protectionism analysis (2024-2025)
 */

interface CountryInsights {
  primaryRisks: string[];
  economicWarfare: string[];
  marketImplications: string[];
  expertAnalysis: string[];
  recentDevelopments: string[];
  capitalControls?: string[];
  tradeTariffRisks?: string[];
}

/**
 * Country-specific geopolitical insights database
 */
export const GEOPOLITICAL_INSIGHTS: Record<string, CountryInsights> = {
  'China': {
    primaryRisks: [
      'US-China technology decoupling and semiconductor restrictions',
      'Taiwan Strait tensions and potential military escalation',
      'South China Sea territorial disputes',
      'Hong Kong autonomy concerns and capital flight risks',
      'Real estate sector debt crisis and financial contagion'
    ],
    economicWarfare: [
      'Sanctions growth rate of 96% in 2024 (BlackRock Dashboard)',
      'Targeting of Western defense industry supporting Taiwan',
      'Currency manipulation concerns and yuan internationalization',
      'Rare earth export controls as economic leverage',
      'Technology transfer restrictions and IP enforcement'
    ],
    marketImplications: [
      'Louis-Vincent Gave: China has "leapfrogged" the West in EVs, solar panels, nuclear power, industrial robots, batteries, and AI (DeepSeek)',
      'Gave: Strong growth trajectory despite Western narratives, bringing Japan and Korea along',
      'Gave: Western analysts missed China\'s transformation due to limited on-the-ground presence and over-focus on real estate problems',
      'Michael Every: Germany at risk of closer ties with China, fragmenting European unity',
      'Marc Faber: Asian markets including China present undervalued contrarian opportunities',
      'Swen Lorenz: Digital decolonisation creating opportunities in local Chinese tech companies competing against Western multinationals',
      'BlackRock: US-China tensions remain top-tier geopolitical risk with high market attention'
    ],
    expertAnalysis: [
      'Alex Krainer: China-Russia alliance strengthening through sanctions pressure',
      'Gave: Russia-China-India triangle could create "epic economic boom" combining cheap commodities, low-cost capital, and inexpensive labor',
      'Gave: Danger of being "caught in your own narrative" - Western consensus views on China often based on poor-quality information',
      'Every: Financial markets overly optimistic about China given trade Balkanization',
      'Sean Foo: Technology decoupling accelerating with semiconductor export controls',
      'Faber: Despite property crisis, China\'s manufacturing base remains competitive advantage',
      'Tom Luongo: China playing long game in financial warfare, positioning yuan as alternative to dollar',
      'Lorenz: Post-conflict and sanctioned Chinese markets present contrarian opportunities for patient investors'
    ],
    recentDevelopments: [
      '2024: Sanctions designations doubled from 102 to 200',
      '2024: Aggressive targeting of Taiwan supporters (98 actions vs 10 in 2023)',
      'Q4 2024: Continued military exercises around Taiwan',
      '2024: BRICS expansion strengthening alternative trade networks',
      '2024: Yuan internationalization efforts accelerating through bilateral trade agreements',
      '2024: Rare earth export controls expanded, prompting US threats of 100% tariff'
    ],
    capitalControls: [
      'September 2025: SAFE cancelled registration requirements for upfront expenses by foreign investors',
      'September 2025: Eliminated registration for domestic reinvestment by foreign-invested enterprises (FIEs)',
      '2025: Streamlined cross-border financing for technology SMEs',
      '2025: Lifted barriers on property purchases by overseas individuals',
      'Ongoing: Strict controls on capital outflows remain despite recent easing measures',
      'Ongoing: Annual $50,000 foreign exchange quota for individuals persists'
    ],
    tradeTariffRisks: [
      'November 2025: US tariffs on Chinese goods reached 57% at peak, reduced to 32% after October 2025 Trump-Xi trade truce',
      '2025: Fentanyl-related tariffs reduced from 20% to 10%, reciprocal tariff of 24% suspended for one year',
      '2025: China expanded export controls on rare earth metals and related technology',
      '2024-2025: Trade volume with US estimated to drop by $742 billion (22%) due to tariffs',
      '2025: Coercive protectionism using trade dependencies to extract economic and political concessions',
      'Long-term: Fragmentation of global trade patterns accelerating US-China decoupling'
    ]
  },
  'Russia': {
    primaryRisks: [
      'Ukraine conflict escalation and military mobilization',
      'Comprehensive Western sanctions regime',
      'Energy export restrictions and pipeline vulnerabilities',
      'Nuclear rhetoric and strategic weapons deployment',
      'Hybrid warfare including cyber attacks and infrastructure targeting'
    ],
    economicWarfare: [
      'Nearly 4x more sanctions than rest of top 10 countries combined',
      'Asset seizures without due process undermining rule of law (Gave)',
      'SWIFT disconnection and payment system isolation',
      'Oil price cap mechanisms and export restrictions',
      'Technology import bans and industrial supply chain disruption'
    ],
    marketImplications: [
      'Alex Krainer: Sanctions strengthened Russia through import-substitution and Asian pivot',
      'Krainer: Russia became Europe\'s second-largest LNG provider despite sanctions',
      'Gave: Russia-China-India alliance creates commodity-capital-labor synergy',
      'Gave: Russia bridging China-India divide is potential "game-changer" for global economics',
      'Every: Sanctions accelerated Russia\'s reorientation toward Asia',
      'Tom Luongo: Russia playing strategic game, leveraging energy and commodities against Western financial warfare',
      'Swen Lorenz: Post-conflict Russia presents long-term contrarian opportunities despite current sanctions',
      'BlackRock: Russia-Ukraine conflict remains primary geopolitical flashpoint'
    ],
    expertAnalysis: [
      'Krainer: Western sanctions counterproductive, strengthening Russian economy',
      'Gave: Asset seizures without due process damaging West\'s fundamental comparative advantage in rule of law',
      'Every: Russia\'s Far East development doubled down amid Western isolation',
      'Sean Foo: Energy leverage over Europe remains despite sanctions',
      'Faber: Geopolitical conflicts creating persistent inflationary pressures',
      'Luongo: ECB-Fed tensions reflected in Russia policy, Europe bearing brunt of sanctions costs',
      'Lorenz: Frontier market investors should monitor Russia for eventual sanctions relief opportunities'
    ],
    recentDevelopments: [
      '2024: Military escalation trending in Donetsk region',
      'Q4 2024: Hybrid escalation risks targeting energy infrastructure',
      '2024: Strengthened trade relationships with China, India, Central Asia',
      '2024: Ruble internationalization through commodity-backed trade',
      '2024: Arctic development and Northern Sea Route expansion',
      '2024: Arms trade with North Korea undermining sanctions effectiveness'
    ],
    capitalControls: [
      '2024-2025: Comprehensive capital controls remain due to Western sanctions',
      '2024: Mandatory conversion of export earnings to rubles',
      '2024: Restrictions on foreign currency withdrawals and transfers',
      '2024: Limits on cross-border payments to "unfriendly countries"',
      '2024: Parallel payment systems developed with China, India, and other partners',
      '2024: Cryptocurrency increasingly used to circumvent Western financial restrictions'
    ],
    tradeTariffRisks: [
      '2024-2025: Comprehensive Western trade sanctions beyond traditional tariffs',
      '2024: Technology import bans creating supply chain disruption',
      '2024: Oil price cap mechanisms limiting export revenues',
      '2024: Secondary sanctions threatening third-party trade partners',
      '2024: Pivot to Asian markets partially offsetting Western trade loss',
      'Long-term: Permanent reorientation of trade flows away from Europe toward Asia'
    ]
  },
  'United States': {
    primaryRisks: [
      'Political polarization and election-related instability',
      'Debt ceiling crises and fiscal sustainability concerns',
      'Trade war escalation and protectionist policies',
      'Dollar weaponization backlash and reserve currency challenges',
      'Domestic extremism and social fragmentation'
    ],
    economicWarfare: [
      'Issued more sanctions in 2024 than all other countries combined',
      'Biden administration issued 2x sanctions vs Trump or Obama',
      'Secondary sanctions preventing Western investment in target countries',
      'Technology export controls as economic weapon',
      'Asset freezes and financial system exclusion tactics'
    ],
    marketImplications: [
      'Marc Faber: Financial markets in significant bubble, predicting 50% deflation in real terms',
      'Faber: Standard of living declining for 20 years despite GDP growth narratives',
      'Michael Every: Shift from globalism to "protectionism vs mercantilism"',
      'Every: Post-Cold War vision of conflict-free economy was "noble but naïve"',
      'Gave: Dollar weakening accelerating emerging market boom',
      'Gave: Insufficient US investor exposure to emerging markets and commodities',
      'Tom Luongo: Federal Reserve policy diverging from ECB, creating tensions in transatlantic relationship',
      'Luongo: Dollar weaponization creating backlash and accelerating de-dollarization',
      'BlackRock: Market attention high on US political instability and debt concerns'
    ],
    expertAnalysis: [
      'Faber: USD dominance under threat from BRICS alternative systems',
      'Krainer: Asset seizures without due process damaging Western rule of law advantage',
      'Sean Foo: Dollar weaponization driving de-dollarization efforts globally',
      'Luongo: Fed-ECB power struggle manifesting in Ukraine policy and sanctions regime',
      'Every: Coercive protectionism doing significant damage to international trade regime',
      'Gave: Western narrative risk - danger of relying on consensus views rather than rigorous analysis',
      'Lorenz: US policy uncertainty creating opportunities in undervalued emerging markets'
    ],
    recentDevelopments: [
      '2024: Banking sector instability concerns persist',
      '2024: Cryptocurrency sanctions surged to 967 wallet designations',
      'Q4 2024: Election-related volatility and policy uncertainty',
      '2024: BRICS nations expanding alternative payment systems',
      '2024: Terrorism sanctions far outstripping other categories (478 designations)',
      'January 2, 2025: Outbound investment screening effective for sensitive technologies to Countries of Concern'
    ],
    capitalControls: [
      'January 2, 2025: Outbound investment screening effective for semiconductors, quantum tech, and AI investments in Countries of Concern',
      '2025: Prohibits certain transactions to China, Hong Kong, Macau in sensitive technologies',
      '2025: Requires post-closing notifications for covered transactions',
      '2024: CFIUS (Committee on Foreign Investment) expanded review authority',
      'Minimal traditional capital controls: No restrictions on capital outflows or currency exchange for US persons',
      '2024-2025: Focus on sanctions enforcement and technology export controls rather than capital controls'
    ],
    tradeTariffRisks: [
      'November 2025: Weighted average applied tariff rate reached 17.6% - highest since 1941',
      '2025: Average effective tariff rate at 12.5% accounting for behavioral responses',
      '2025: Tariffs represent largest US tax increase as % of GDP (0.52%) since 1993',
      '2025: GDP growth projected to decline 0.23 percentage points in 2025, 0.62 points in 2026',
      '2025: Long-run GDP estimated to fall 0.6% before accounting for foreign retaliation',
      '2025: Consumer price inflation 1 percentage point higher than baseline',
      '2025: Average tax increase of $1,200 per household in 2025, $1,600 in 2026',
      '2025: Employment declines concentrated in durable goods manufacturing, mining, agriculture',
      '2024-2025: Tariff revenues raised $174 billion through September 2025',
      'Long-term: Projected to raise $2.3 trillion conventionally or $1.8 trillion accounting for negative economic effects over next decade',
      'Strategic: Coercive protectionism exploiting trade dependencies for economic and political concessions'
    ]
  },
  'European Union': {
    primaryRisks: [
      'Energy security dependence on external suppliers',
      'Political fragmentation and populist movements',
      'Economic stagnation and competitiveness decline',
      'Migration pressures and border security',
      'Brexit aftermath and potential further exits'
    ],
    economicWarfare: [
      'Russian energy cutoff and diversification challenges',
      'Sanctions compliance costs and economic impact',
      'Trade disputes with US and China',
      'Technology sovereignty and digital regulation',
      'Carbon border adjustment mechanism trade implications'
    ],
    marketImplications: [
      'Michael Every: Europe\'s future alignment uncertain, Germany at risk of China-Russia ties',
      'Every: European unity fracturing with different nations choosing different trade blocs',
      'Marc Faber: European assets underperforming due to structural challenges',
      'Faber: Declining living standards despite official GDP narratives',
      'Louis-Vincent Gave: Europe excluded from emerging market boom',
      'Gave: Europe losing ground to Asia in manufacturing and innovation',
      'Sean Foo: Energy crisis creating long-term competitiveness issues',
      'Tom Luongo: ECB policy diverging from Fed, creating transatlantic tensions',
      'Luongo: Europe bearing disproportionate cost of Russia sanctions',
      'Swen Lorenz: European small/mid-caps trading at crisis-level valuations, presenting opportunities',
      'BlackRock: Political fragmentation creating policy uncertainty'
    ],
    expertAnalysis: [
      'Krainer: Sanctions on Russia backfiring on European economy',
      'Sean Foo: Energy dependence creating strategic vulnerability',
      'Luongo: ECB-Fed power struggle manifesting in Ukraine policy',
      'Every: Germany caught between US security guarantees and China economic ties',
      'Gave: Weakened US security guarantees forcing Europe to fund defense independently',
      'Lorenz: UK small/mid-caps particularly undervalued, offering contrarian opportunities',
      'Faber: Structural challenges include aging demographics, regulatory burden, energy costs'
    ],
    recentDevelopments: [
      '2024: Energy diversification efforts ongoing but incomplete',
      '2024: Political shifts toward right-wing populist parties',
      '2024: Economic growth lagging US and Asia',
      '2024: Ukraine support creating fiscal pressures',
      '2024: Migration crisis intensifying political divisions',
      '2025: Germany worst affected by US tariffs among European nations'
    ],
    capitalControls: [
      '2024-2025: Generally open capital accounts across EU member states',
      '2024: Free movement of capital within EU under Single Market rules',
      '2024: No restrictions on intra-EU capital flows',
      '2024: Some members maintain restrictions on third-country capital movements',
      '2024: Enhanced monitoring of large transactions for anti-money laundering',
      'Exception - Cyprus: Removed last capital controls from 2013 banking crisis in 2015, now fully open'
    ],
    tradeTariffRisks: [
      '2025: Blanket 15% US import tariffs on European goods including cars, chips, pharmaceuticals',
      '2025: 50% US tariffs on European metals',
      '2025: Germany worst affected among European nations',
      '2025: Export growth initially boosted by front-loading to beat tariffs, now ended',
      '2025: Lacklustre growth outlook due to US tariff impact',
      '2025: Consumer spending expected to be supported by lower inflation and interest rates in 2026',
      '2025: Disinflation driven by US tariffs, strong euro, and rising Chinese imports',
      '2025: New era of geopolitical and trade risk with rapid US policy changes',
      '2025: Damaged business and consumer sentiment from trade uncertainty',
      'Long-term: Increased pressure to fund European defense independently amid weakened US security guarantees'
    ]
  },
  'Iran': {
    primaryRisks: [
      'Nuclear program advancement and enrichment activities',
      'Regional proxy conflicts and militia support',
      'Israel tensions and potential military escalation',
      'Comprehensive sanctions regime and economic isolation',
      'Internal political instability and protest movements'
    ],
    economicWarfare: [
      'Comprehensively sanctioned country with broad restrictions',
      'Oil export limitations and tanker tracking',
      'Banking sector completely isolated from Western systems',
      'Technology and dual-use goods import bans',
      'Cryptocurrency increasingly used for sanctions evasion'
    ],
    marketImplications: [
      'BlackRock: Heightened tensions over nuclear ambitions',
      'Concerns about escalating regional conflicts impacting oil markets',
      'Stricter sanctions could severely impact global oil supply',
      'Marc Faber: Middle East conflicts contributing to inflationary pressures',
      'Sean Foo: Regional instability creating persistent energy price volatility',
      'Swen Lorenz: Iran represents extreme frontier market opportunity for post-sanctions era',
      'Tom Luongo: Iran part of alternative financial architecture with Russia and China'
    ],
    expertAnalysis: [
      'Every: Iran part of "the Rest" in West vs Rest trade Balkanization',
      'Gave: Iran-Russia-China cooperation strengthening under sanctions pressure',
      'Krainer: Sanctions driving Iran deeper into alternative trade networks',
      'Sean Foo: Nuclear breakout timeline shortening despite diplomatic efforts',
      'Faber: Regional conflicts creating long-term commodity price support',
      'Lorenz: Post-conflict Iran could present significant opportunities similar to Iraq',
      'Luongo: Iran leveraging regional position in multipolar world order'
    ],
    recentDevelopments: [
      '2024: Continued nuclear enrichment despite negotiations',
      'Q4 2024: Regional tensions elevated with Israel-Gaza conflict',
      '2024: Strengthened military cooperation with Russia',
      '2024: Oil exports to China via "dark fleet" tankers',
      '2024: Increased cyber warfare capabilities and attacks',
      '2024: Barter trade arrangements with sanctioned partners'
    ],
    capitalControls: [
      '2024-2025: Severe capital controls due to comprehensive Western sanctions',
      '2024: Multiple exchange rate system with official and black market rates',
      '2024: Strict limits on foreign currency access for individuals and businesses',
      '2024: Mandatory surrender of export earnings at official rates',
      '2024: Cryptocurrency adoption accelerating to circumvent banking restrictions',
      '2024: Barter trade arrangements with sanctioned partners (Russia, Venezuela)'
    ],
    tradeTariffRisks: [
      '2024-2025: Comprehensive sanctions beyond traditional tariffs',
      '2024: Oil export sanctions creating revenue constraints',
      '2024: Technology and dual-use goods import bans',
      '2024: Banking sector isolation preventing normal trade finance',
      '2024: "Dark fleet" tanker operations to circumvent sanctions',
      'Long-term: Permanent reorientation toward China and alternative trade networks'
    ]
  },
  'Argentina': {
    primaryRisks: [
      'Chronic economic instability and currency crises',
      'High inflation and debt default history',
      'Political volatility and policy unpredictability',
      'IMF debt restructuring challenges',
      'Social unrest and labor strikes'
    ],
    economicWarfare: [
      'Limited sanctions but severe economic self-imposed restrictions',
      'Currency controls and capital flight restrictions (recently liberalized)',
      'Debt restructuring negotiations with creditors',
      'Trade restrictions and protectionist policies',
      'Agricultural export taxes and quotas'
    ],
    marketImplications: [
      'Marc Faber: Argentina example of currency devaluation and precious metals importance',
      'Faber: Argentina perfect case study for gold as inflation hedge',
      'Gave: Argentina excluded from emerging market boom due to policy failures',
      'Gave: Policy unpredictability preventing participation in regional growth',
      'Michael Every: Argentina demonstrates failed import-substitution policies',
      'Every: Argentina trapped in middle-income trap through protectionism',
      'Sean Foo: Chronic instability preventing foreign investment despite resources',
      'Swen Lorenz: Argentina presents contrarian opportunities if reforms succeed',
      'BlackRock: Political risk elevated with radical policy shifts'
    ],
    expertAnalysis: [
      'Krainer: IMF debt restructuring creating perpetual dependency',
      'Sean Foo: Currency crisis cycles repeating despite reform attempts',
      'Lorenz: Milei administration reforms could create turnaround opportunity',
      'Faber: Extreme currency devaluation demonstrating importance of hard assets',
      'Every: Decades of protectionism and import-substitution failed to create sustainable growth',
      'Luongo: Argentina test case for IMF reform approach in emerging markets'
    ],
    recentDevelopments: [
      '2024: New administration implementing shock therapy economic reforms',
      '2024: Currency devaluation and inflation exceeding 100%',
      '2024: IMF negotiations for debt restructuring ongoing',
      '2024: Social protests against austerity measures',
      '2024: Dollarization debates and currency policy uncertainty',
      'April 2025: Major capital controls liberalization'
    ],
    capitalControls: [
      'April 14, 2025: MAJOR LIBERALIZATION - Eliminated most capital controls ("cepo cambiario")',
      'April 2025: Individuals and businesses can now purchase US dollars WITHOUT restrictions',
      'April 2025: Removed 30-day waiting period for import payments',
      'April 2025: Companies can now repatriate profits abroad freely',
      'April 2025: Reform supported by $20 billion IMF agreement',
      'July 2024: RIGI (Incentive Regime for Large Investments) introduced - eliminates capital controls on credit lines, debt servicing, and dividend payments for qualifying investments over $200 million'
    ],
    tradeTariffRisks: [
      '2024-2025: Agricultural export taxes creating revenue but discouraging production',
      '2024: Import restrictions to protect domestic industries',
      '2024: Multiple exchange rate system complicating trade',
      '2025: Liberalization reducing trade barriers',
      'Long-term: Shift from protectionism toward open trade policy under new administration'
    ]
  },
  'Brazil': {
    primaryRisks: [
      'Political polarization and institutional stress',
      'Amazon deforestation and environmental concerns',
      'Corruption scandals and governance challenges',
      'Fiscal sustainability and debt concerns',
      'Social inequality and urban violence'
    ],
    economicWarfare: [
      'Limited sanctions exposure but trade policy uncertainty',
      'Environmental restrictions on agricultural exports',
      'BRICS membership creating alternative trade alignment',
      'Currency volatility and capital flow management',
      'Technology transfer restrictions in sensitive sectors'
    ],
    marketImplications: [
      'Louis-Vincent Gave: Brazil part of emerging market boom in southern hemisphere',
      'Gave: Brazil positioned to benefit from globalization shift from China',
      'Marc Faber: Brazilian assets undervalued with contrarian opportunities',
      'Faber: Real estate and equities presenting value after corrections',
      'Michael Every: Brazil benefiting from China-US trade fragmentation',
      'Every: Brazil strengthening ties with China while maintaining US relations',
      'Sean Foo: Commodity exporter benefiting from global supply constraints',
      'Sean Foo: Agricultural powerhouse with growing Asian market access',
      'Swen Lorenz: Brazil offers emerging market exposure with relatively developed infrastructure',
      'BlackRock: Political risk moderate but manageable for investors'
    ],
    expertAnalysis: [
      'Krainer: BRICS expansion strengthening Brazil\'s alternative trade options',
      'Luongo: Brazil playing both sides in US-China competition',
      'Lorenz: Brazilian equities undervalued relative to fundamentals',
      'Gave: Southern hemisphere shift benefits Brazil as manufacturing relocates',
      'Every: Brazil maintaining strategic autonomy while engaging both power blocs'
    ],
    recentDevelopments: [
      '2024: BRICS expansion with Brazil as founding member',
      '2024: Strengthened trade relationships with China and India',
      '2024: Political tensions between executive and judiciary',
      '2024: Amazon deforestation rates declining under new policies',
      '2024: Currency stabilization efforts showing results'
    ],
    capitalControls: [
      '2024-2025: Relatively open capital account with floating exchange rate',
      '2024: No significant restrictions on capital inflows or outflows',
      '2024: Foreign exchange market operates freely',
      '2024: Central bank intervenes occasionally to smooth volatility',
      '2024: Tax on foreign exchange transactions (IOF) used as policy tool',
      '2024: Regulatory requirements for foreign investment registration but no prohibitions'
    ],
    tradeTariffRisks: [
      '2024-2025: Beneficiary of US-China trade tensions as alternative supplier',
      '2024: Environmental restrictions on agricultural exports to EU',
      '2024: BRICS membership creating alternative trade channels',
      '2025: Relatively insulated from US tariff escalation',
      'Long-term: Positioned to benefit from nearshoring and supply chain diversification'
    ]
  },
  'India': {
    primaryRisks: [
      'Border tensions with China and Pakistan',
      'Religious and ethnic communal tensions',
      'Infrastructure constraints limiting growth',
      'Regulatory complexity and bureaucratic challenges',
      'Water scarcity and climate change impacts'
    ],
    economicWarfare: [
      'Minimal sanctions exposure with strategic autonomy policy',
      'Russian oil imports despite Western pressure',
      'Technology transfer restrictions from US and allies',
      'Trade disputes with China over border issues',
      'Balancing act between US and Russia relationships'
    ],
    marketImplications: [
      'Louis-Vincent Gave: India central to emerging market boom with cheap labor advantage',
      'Gave: Russia-China-India triangle creating "epic economic boom" potential',
      'Gave: India\'s inexpensive labor force completing commodity-capital-labor synergy',
      'Marc Faber: Indian markets presenting long-term growth opportunities',
      'Faber: Infrastructure development creating multi-decade investment opportunity',
      'Michael Every: India benefiting from manufacturing shift from China',
      'Every: India emerging as alternative manufacturing hub to China',
      'Sean Foo: Demographic dividend providing sustained growth potential',
      'Swen Lorenz: India offers emerging market growth with improving governance',
      'BlackRock: India positive outlook with manageable geopolitical risks'
    ],
    expertAnalysis: [
      'Krainer: India maintaining strategic autonomy while strengthening ties with Russia',
      'Luongo: India playing sophisticated balancing game between US and Russia-China',
      'Lorenz: Indian markets present long-term structural growth story',
      'Gave: Shift of globalization from China to India creates massive opportunities',
      'Every: "Make in India" success demonstrating manufacturing competitiveness'
    ],
    recentDevelopments: [
      '2024: Manufacturing sector expansion with "Make in India" success',
      '2024: Continued Russian oil imports despite Western sanctions',
      '2024: Border tensions with China managed without escalation',
      '2024: Technology sector growth and startup ecosystem expansion',
      '2024: Infrastructure investment accelerating under government programs'
    ],
    capitalControls: [
      '2024-2025: Moderate capital controls with gradual liberalization trend',
      '2024: Current account transactions fully convertible',
      '2024: Capital account partially convertible with some restrictions',
      '2024: Limits on foreign portfolio investment in certain sectors',
      '2024: External Commercial Borrowing (ECB) regulations for corporate foreign debt',
      '2024: Liberalized Remittance Scheme allows residents to remit up to $250,000 per year'
    ],
    tradeTariffRisks: [
      '2024-2025: Beneficiary of US-China decoupling as alternative manufacturing hub',
      '2024: Strategic autonomy policy allowing Russian oil imports despite Western pressure',
      '2024: Trade disputes with China over border issues',
      '2025: Relatively insulated from US tariff escalation',
      'Long-term: Positioned as major beneficiary of supply chain diversification from China'
    ]
  },
  'Mexico': {
    primaryRisks: [
      'Drug cartel violence and organized crime',
      'Corruption and weak rule of law',
      'Migration pressures and border security',
      'Energy sector underinvestment and reliability',
      'US trade policy uncertainty'
    ],
    economicWarfare: [
      'Limited sanctions exposure with USMCA protections',
      'Drug trafficking sanctions on cartels and individuals',
      'Border security and migration policy disputes',
      'Energy trade dependencies with US',
      'Nearshoring beneficiary from China trade tensions'
    ],
    marketImplications: [
      'Louis-Vincent Gave: Mexico benefiting from nearshoring and China trade shift',
      'Gave: Nearshoring creating multi-decade investment opportunity',
      'Marc Faber: Mexican assets presenting opportunities despite security concerns',
      'Faber: Security concerns creating value opportunities for contrarians',
      'Michael Every: Mexico positioned to benefit from US-China decoupling',
      'Every: Mexico benefiting from US desire to reduce China dependence',
      'Sean Foo: Nearshoring trend creating manufacturing investment boom',
      'Sean Foo: Manufacturing investment accelerating with US companies relocating',
      'Swen Lorenz: Mexico nearshoring theme offers compelling investment case',
      'BlackRock: Mexico moderate-high risk but improving economic outlook'
    ],
    expertAnalysis: [
      'Krainer: USMCA providing stable trade framework despite political tensions',
      'Luongo: Mexico caught between US demands and domestic political pressures',
      'Lorenz: Nearshoring investment surge creating infrastructure and manufacturing opportunities',
      'Every: Geographic proximity to US creating structural advantage',
      'Gave: Multi-decade opportunity as companies relocate from Asia'
    ],
    recentDevelopments: [
      '2024: Nearshoring investment surge with manufacturing expansion',
      '2024: Cartel violence remaining elevated in certain regions',
      '2024: New administration implementing security and economic reforms',
      '2024: USMCA review process approaching with policy uncertainty',
      '2024: Energy sector reforms debated with investment implications'
    ],
    capitalControls: [
      '2024-2025: Open capital account with floating exchange rate',
      '2024: No restrictions on capital inflows or outflows',
      '2024: Free foreign exchange market',
      '2024: Foreign investment welcomed with minimal restrictions',
      '2024: USMCA provisions protect cross-border investment',
      '2024: Central bank intervenes occasionally to smooth peso volatility'
    ],
    tradeTariffRisks: [
      '2024-2025: Primary beneficiary of US-China trade war through nearshoring',
      '2024: USMCA protections limiting tariff exposure',
      '2024: Manufacturing investment surge driven by supply chain relocation',
      '2025: Potential vulnerability to US policy changes',
      'Long-term: Structural advantage from geographic proximity to US market'
    ]
  },
  'Taiwan': {
    primaryRisks: [
      'Chinese military pressure and invasion threats',
      'Semiconductor supply chain concentration risk',
      'Political tensions over independence vs unification',
      'Diplomatic isolation and limited international recognition',
      'Cyber warfare and disinformation campaigns'
    ],
    economicWarfare: [
      'Chinese economic coercion and trade restrictions',
      'Military exercises disrupting shipping and air routes',
      'Diplomatic pressure on countries recognizing Taiwan',
      'Technology transfer restrictions and IP theft concerns',
      'Western support through arms sales and unofficial relations'
    ],
    marketImplications: [
      'BlackRock: Taiwan Strait tensions remain top geopolitical risk',
      'Sean Foo: Semiconductor concentration creating global supply chain vulnerability',
      'Marc Faber: Taiwan assets discounted due to invasion risk premium',
      'Faber: Geopolitical risk creating investment opportunities for contrarians',
      'Michael Every: Taiwan central to US-China technology decoupling',
      'Every: Semiconductor dependence giving Taiwan strategic importance beyond size',
      'Louis-Vincent Gave: Taiwan situation key variable in Asia-Pacific stability',
      'Gave: Taiwan tensions accelerating regional military buildup',
      'Tom Luongo: Taiwan flashpoint in US-China financial and technological warfare',
      'Swen Lorenz: Taiwan semiconductor dominance creates unique geopolitical leverage'
    ],
    expertAnalysis: [
      'Krainer: Taiwan issue driving US-China strategic competition',
      'Sean Foo: Invasion timeline uncertain but military pressure increasing',
      'Luongo: Taiwan represents critical node in global technology supply chain',
      'Every: US-China competition over Taiwan reflects broader technology decoupling',
      'Gave: Regional stability hinges on Taiwan status quo maintenance'
    ],
    recentDevelopments: [
      '2024: Increased Chinese military exercises and incursions',
      '2024: US arms sales and unofficial support continuing',
      '2024: Semiconductor industry expansion despite geopolitical risks',
      '2024: Diplomatic isolation intensifying with few remaining allies',
      '2024: Cyber attacks and disinformation campaigns escalating'
    ],
    capitalControls: [
      '2024-2025: Open capital account with minimal restrictions',
      '2024: Free foreign exchange market with floating exchange rate',
      '2024: No restrictions on capital inflows or outflows',
      '2024: Foreign investors can freely repatriate profits and capital',
      '2024: Regulatory oversight for large transactions but no prohibitions',
      '2024: One of the most open financial systems in Asia'
    ],
    tradeTariffRisks: [
      '2024-2025: Semiconductor exports critical to global supply chain',
      '2024: US technology export controls affecting chip manufacturing equipment',
      '2024: Chinese economic coercion through trade restrictions',
      '2025: Beneficiary of nearshoring as companies diversify from China',
      'Long-term: Strategic importance of semiconductor industry provides economic leverage'
    ]
  },
  'Turkey': {
    primaryRisks: [
      'Currency volatility and inflation challenges',
      'Geopolitical tensions with Greece and Cyprus',
      'Syrian refugee crisis and border security',
      'Political authoritarianism and democratic backsliding',
      'NATO alliance strains and Russian relations'
    ],
    economicWarfare: [
      'Limited US sanctions on defense sector',
      'Balancing act between NATO and Russia',
      'Energy dependence on Russia and Iran',
      'Trade disputes with EU and US',
      'Syrian conflict involvement and regional interventions'
    ],
    marketImplications: [
      'Marc Faber: Turkish assets volatile but presenting contrarian opportunities',
      'Faber: Currency devaluation creating extreme volatility for investors',
      'Michael Every: Turkey playing both sides in West vs Rest divide',
      'Every: Turkey attempting to leverage strategic position between East and West',
      'Sean Foo: Strategic location making Turkey critical but unpredictable partner',
      'Sean Foo: Energy hub ambitions complicated by geopolitical alignments',
      'Tom Luongo: Turkey playing sophisticated game between NATO, Russia, and regional powers',
      'Swen Lorenz: Turkey extreme volatility creates opportunities for risk-tolerant investors',
      'BlackRock: High risk due to policy unpredictability and currency instability',
      'Gave: Turkey excluded from major investment flows due to governance concerns',
      'Gave: Orthodox economic policies abandoned in favor of political considerations'
    ],
    expertAnalysis: [
      'Krainer: Erdogan\'s independent foreign policy creating friction with NATO',
      'Luongo: Turkey leveraging position between competing power blocs',
      'Lorenz: Frontier market characteristics with developed market infrastructure',
      'Every: Strategic location provides leverage but creates multiple vulnerabilities',
      'Faber: Extreme case of unorthodox monetary policy creating currency crisis'
    ],
    recentDevelopments: [
      '2024: Continued high inflation despite central bank interventions',
      '2024: Lira depreciation accelerating',
      '2024: Tensions with Greece over Aegean Sea and Cyprus',
      '2024: Balancing relations between Russia and NATO',
      '2024: Syrian refugee population exceeding 3.6 million'
    ],
    capitalControls: [
      '2024-2025: Informal capital controls and foreign exchange restrictions',
      '2024: Limits on foreign currency deposits and conversions',
      '2024: Restrictions on corporate foreign exchange holdings',
      '2024: Mandatory conversion requirements for export earnings',
      '2024: Central bank interventions to manage lira volatility',
      '2024: Periodic restrictions on foreign currency withdrawals from banks'
    ],
    tradeTariffRisks: [
      '2024-2025: Balancing trade relationships between EU, US, Russia, and Middle East',
      '2024: Energy dependence creating trade vulnerabilities',
      '2024: Syrian conflict complicating regional trade',
      '2025: Potential exposure to EU and US tariff policies',
      'Long-term: Strategic location offers trade hub potential if stability improves'
    ]
  },
  'Venezuela': {
    primaryRisks: [
      'Political authoritarianism and democratic backsliding',
      'Economic collapse and hyperinflation',
      'Humanitarian crisis and mass migration',
      'Oil sector deterioration and production collapse',
      'Comprehensive US and EU sanctions'
    ],
    economicWarfare: [
      'Broadly sanctioned with limited government business interactions',
      'State-owned enterprises including banks under restrictions',
      'Oil export sanctions and payment system limitations',
      'Asset freezes on government officials and entities',
      'Gold export restrictions and mining sector sanctions'
    ],
    marketImplications: [
      'BlackRock: Interactions with government-owned businesses severely limited',
      'Marc Faber: Emerging market opportunities exist but require careful navigation',
      'Faber: Currency devaluation extreme case study for precious metals strategy',
      'Michael Every: Venezuela example of failed state under sanctions pressure',
      'Every: Venezuela demonstrates limits of economic warfare without regime change',
      'Sean Foo: Oil production collapse despite world\'s largest reserves',
      'Sean Foo: Chinese and Russian investment unable to reverse economic decline',
      'Louis-Vincent Gave: Southern hemisphere shift excludes Venezuela due to governance failures',
      'Gave: Political instability prevents participation in emerging market boom',
      'Swen Lorenz: Venezuela extreme frontier market, potential post-sanctions opportunity',
      'Tom Luongo: Venezuela test case for limits of sanctions-based regime change'
    ],
    expertAnalysis: [
      'Krainer: Sanctions contributed to economic collapse and humanitarian crisis',
      'Lorenz: Post-conflict Venezuela could present opportunities similar to Iraq if regime changes',
      'Luongo: Alternative financial architecture with Russia and China sustaining regime',
      'Every: Decades of sanctions failed to achieve regime change objective',
      'Faber: Extreme hyperinflation demonstrating importance of hard asset preservation'
    ],
    recentDevelopments: [
      '2024: Continued political repression and electoral irregularities',
      '2024: Migration crisis intensifying with millions fleeing',
      '2024: Oil production remains fraction of historical capacity',
      '2024: Cryptocurrency adoption for sanctions evasion',
      '2024: Limited sanctions relief discussions with no breakthrough',
      '2024: Barter trade with Iran and Russia'
    ],
    capitalControls: [
      '2024-2025: Extreme capital controls amid economic collapse and hyperinflation',
      '2024: Multiple exchange rate system with massive spread between official and black market',
      '2024: Severe restrictions on foreign currency access and international transfers',
      '2024: Mandatory conversion of export earnings at unfavorable official rates',
      '2024: Widespread use of US dollars and cryptocurrency to bypass controls',
      '2024: Banking system largely dysfunctional with limited international connectivity'
    ],
    tradeTariffRisks: [
      '2024-2025: Comprehensive sanctions beyond traditional tariffs',
      '2024: Oil export sanctions devastating primary revenue source',
      '2024: State-owned enterprises unable to engage in normal trade',
      '2024: Barter arrangements with Iran and Russia to circumvent sanctions',
      'Long-term: Economic isolation continues absent regime change or sanctions relief'
    ]
  },
  'Ukraine': {
    primaryRisks: [
      'Active military conflict with Russia',
      'Infrastructure destruction and economic devastation',
      'Refugee crisis and demographic challenges',
      'Corruption concerns amid reconstruction efforts',
      'Dependency on Western military and financial aid'
    ],
    economicWarfare: [
      'Recipient of unprecedented Western financial support',
      'Russian sanctions regime targeting Ukrainian economy',
      'Energy infrastructure repeatedly targeted',
      'Agricultural export disruptions affecting global food security',
      'Reconstruction funding requirements exceeding $400 billion'
    ],
    marketImplications: [
      'BlackRock: Conflict trending toward military escalation in Q4 2024',
      'Sean Foo: Prolonged conflict creating persistent commodity price pressures',
      'Marc Faber: War contributing to global inflationary environment',
      'Faber: War creating long-term commodity supply constraints',
      'Michael Every: Conflict accelerating global trade fragmentation',
      'Every: Ukraine war symbol of end of post-Cold War cooperative globalism',
      'Louis-Vincent Gave: Ukraine crisis catalyst for Russia-China-India alignment',
      'Gave: Conflict accelerating de-dollarization and alternative payment systems',
      'Tom Luongo: Ukraine conflict reflects ECB-Fed power struggle and transatlantic tensions',
      'Swen Lorenz: Post-conflict Ukraine presents long-term reconstruction opportunities'
    ],
    expertAnalysis: [
      'Krainer: Conflict represents proxy war between NATO and Russia',
      'Sean Foo: Stalemate conditions creating prolonged uncertainty',
      'Luongo: Europe bearing disproportionate cost of conflict and sanctions',
      'Lorenz: Reconstruction phase could offer significant investment opportunities',
      'Every: Conflict accelerating fragmentation of global trade and financial systems'
    ],
    recentDevelopments: [
      '2024: Ukraine incursion into Kursk region',
      'Q4 2024: Russia advancing in Donetsk',
      '2024: Moderate risk of hybrid escalation on infrastructure',
      '2024: Grain export corridor agreements remain fragile',
      '2024: Western military aid commitments facing political challenges'
    ],
    capitalControls: [
      '2024-2025: Wartime capital controls remain in effect',
      '2024: Restrictions on foreign currency withdrawals and transfers',
      '2024: Mandatory conversion of export earnings to hryvnia',
      '2024: Limits on cross-border payments and international transactions',
      '2024: Central bank controls to prevent capital flight and maintain currency stability',
      '2024: Special exemptions for humanitarian aid and reconstruction financing'
    ],
    tradeTariffRisks: [
      '2024-2025: Agricultural exports disrupted by conflict',
      '2024: Grain export corridor agreements fragile',
      '2024: Energy infrastructure targeting affecting industrial production',
      '2024: Western support maintaining some trade flows',
      'Long-term: Reconstruction phase will require massive investment and trade normalization'
    ]
  },
  'Japan': {
    primaryRisks: [
      'Demographic decline and aging population',
      'Massive public debt exceeding 250% of GDP',
      'China tensions over territorial disputes',
      'North Korea missile threats',
      'Natural disaster vulnerability'
    ],
    economicWarfare: [
      'Minimal sanctions exposure with strong US alliance',
      'Technology export controls coordinating with US',
      'Trade dependencies on China despite tensions',
      'Currency intervention to manage yen weakness',
      'Rare earth import dependence on China'
    ],
    marketImplications: [
      'Louis-Vincent Gave: Japan will be "brought along" by China\'s strong growth',
      'Gave: Japan benefiting from China growth despite geopolitical tensions',
      'Marc Faber: Japanese assets presenting value after decades of stagnation',
      'Faber: Yen weakness creating export competitiveness and investment opportunities',
      'Michael Every: Japan caught between US alliance and China trade dependence',
      'Every: Japan forced to choose between US security and China economics',
      'Sean Foo: Demographic crisis creating long-term fiscal sustainability questions',
      'Sean Foo: Remilitarization accelerating in response to regional threats',
      'Tom Luongo: Japan caught in Fed-BOJ policy coordination challenges',
      'Swen Lorenz: Japanese equities undervalued despite strong corporate fundamentals',
      'BlackRock: Japan moderate risk with stable political environment'
    ],
    expertAnalysis: [
      'Krainer: Japan\'s massive debt sustainable only through financial repression',
      'Luongo: BOJ policy constrained by Fed actions and dollar dynamics',
      'Lorenz: Japanese small/mid-caps particularly undervalued',
      'Every: Technology sector cooperation with Taiwan critical for semiconductor security',
      'Gave: Regional growth benefits Japan despite domestic demographic challenges'
    ],
    recentDevelopments: [
      '2024: Defense spending increases to 2% of GDP target',
      '2024: Yen weakness prompting currency intervention',
      '2024: Demographic decline accelerating with record low births',
      '2024: Strengthened security cooperation with US and allies',
      '2024: Technology sector cooperation with Taiwan on semiconductors'
    ],
    capitalControls: [
      '2024-2025: Fully open capital account with no restrictions',
      '2024: Free foreign exchange market with floating yen',
      '2024: No limits on capital inflows or outflows',
      '2024: Foreign investors can freely invest and repatriate',
      '2024: Occasional currency interventions to manage volatility',
      '2024: One of the world\'s most open financial systems'
    ],
    tradeTariffRisks: [
      '2024-2025: Strong US alliance provides trade protection',
      '2024: Technology export controls coordinated with US',
      '2024: Trade dependencies on China despite tensions',
      '2025: Relatively insulated from US tariff escalation',
      'Long-term: Caught between US security alliance and China economic ties'
    ]
  },
  'South Korea': {
    primaryRisks: [
      'North Korea nuclear and missile threats',
      'Demographic decline and low birth rates',
      'China economic dependence and trade vulnerabilities',
      'Semiconductor industry concentration risk',
      'Political polarization and corruption scandals'
    ],
    economicWarfare: [
      'Minimal sanctions exposure with strong US alliance',
      'Technology export controls aligned with US policy',
      'Trade dependencies on China creating vulnerability',
      'North Korea sanctions enforcement challenges',
      'Semiconductor supply chain strategic importance'
    ],
    marketImplications: [
      'Louis-Vincent Gave: South Korea will be "brought along" by China growth',
      'Gave: Korea benefiting from regional growth despite North Korea risks',
      'Marc Faber: Korean assets undervalued with technology leadership',
      'Faber: Technology sector providing long-term competitive advantage',
      'Michael Every: Korea caught in US-China technology competition',
      'Every: Korea balancing US alliance with China economic ties',
      'Sean Foo: Semiconductor concentration creating geopolitical leverage',
      'Sean Foo: Demographic crisis threatening long-term growth potential',
      'Tom Luongo: Korea navigating complex US-China-Japan triangle',
      'Swen Lorenz: Korean technology companies undervalued relative to global peers',
      'BlackRock: Korea moderate risk with strong fundamentals'
    ],
    expertAnalysis: [
      'Krainer: Korean peninsula tensions managed but unresolved',
      'Luongo: Korea balancing act between US security and China economics increasingly difficult',
      'Lorenz: Semiconductor dominance provides strategic leverage',
      'Every: Strengthened trilateral cooperation with US and Japan',
      'Gave: Regional growth benefits Korea despite domestic challenges'
    ],
    recentDevelopments: [
      '2024: North Korea missile tests continuing regularly',
      '2024: Semiconductor industry expansion despite geopolitical risks',
      '2024: Demographic decline accelerating with world\'s lowest birth rate',
      '2024: Strengthened trilateral cooperation with US and Japan',
      '2024: Trade dependencies on China remaining high despite diversification efforts'
    ],
    capitalControls: [
      '2024-2025: Generally open capital account with some monitoring',
      '2024: Free foreign exchange market with floating won',
      '2024: Minimal restrictions on capital flows',
      '2024: Foreign investment encouraged with few sectoral restrictions',
      '2024: Enhanced monitoring of volatile capital flows (hot money)',
      '2024: Macroprudential measures to manage financial stability risks'
    ],
    tradeTariffRisks: [
      '2024-2025: Strong US alliance provides trade protection',
      '2024: Technology export controls aligned with US',
      '2024: Trade dependencies on China creating vulnerability',
      '2025: Semiconductor exports critical to global supply chain',
      'Long-term: Caught between US technology alliance and China market access'
    ]
  },
  'Middle East': {
    primaryRisks: [
      'Israel-Gaza conflict and regional escalation',
      'Iran nuclear program and proxy warfare',
      'Yemen civil war and Houthi attacks on shipping',
      'Syria instability and humanitarian crisis',
      'Oil supply disruption risks'
    ],
    economicWarfare: [
      'Multiple comprehensive sanctions regimes (Iran, Syria)',
      'Houthi attacks disrupting Red Sea shipping routes',
      'Oil price volatility from supply disruption fears',
      'Regional banking sector sanctions and restrictions',
      'Technology transfer controls to prevent military applications'
    ],
    marketImplications: [
      'BlackRock: Israel-Gaza conflict trending toward military and hybrid escalation',
      'Sean Foo: Regional tensions creating persistent oil price premiums',
      'Marc Faber: Middle East instability supporting commodity prices long-term',
      'Faber: Ongoing conflicts ensure elevated commodity prices for years',
      'Michael Every: Regional conflicts part of broader West vs Rest fragmentation',
      'Every: Middle East becoming battleground for competing spheres of influence',
      'Louis-Vincent Gave: Middle East instability accelerating Asian energy security investments',
      'Gave: China and India securing long-term energy deals amid instability',
      'Tom Luongo: Regional conflicts reflect multipolar competition for energy resources',
      'Swen Lorenz: Post-conflict opportunities in Iraq, potential in Iran long-term'
    ],
    expertAnalysis: [
      'Krainer: Regional conflicts reflect broader multipolar world order emergence',
      'Sean Foo: Regional proxy wars unlikely to resolve without great power accommodation',
      'Luongo: Energy security driving Asian investment in Middle East infrastructure',
      'Lorenz: Iraq and other post-conflict markets present frontier opportunities',
      'Every: Competing spheres of influence creating persistent instability'
    ],
    recentDevelopments: [
      'October 7, 2024: One-year anniversary of Israel-Gaza war',
      'Q4 2024: Conflict trending toward escalation',
      '2024: Houthi attacks on commercial shipping continuing',
      '2024: Iran-Israel tensions elevated with direct military exchanges',
      '2024: Regional oil producers hedging with Asian buyers'
    ],
    capitalControls: [
      'Varies by country: GCC states (UAE, Saudi Arabia, Qatar) maintain open capital accounts',
      'Iran: Severe controls due to sanctions (see Iran entry)',
      'Syria: Comprehensive controls amid civil war and sanctions',
      'Lebanon: De facto capital controls since 2019 banking crisis, informal restrictions on withdrawals',
      'Egypt: Periodic foreign exchange shortages and informal restrictions on dollar access',
      'Turkey: See separate Turkey entry for detailed capital control measures'
    ],
    tradeTariffRisks: [
      '2024-2025: Oil export disruptions from regional conflicts',
      '2024: Houthi attacks disrupting Red Sea shipping routes',
      '2024: Iran sanctions limiting oil exports',
      '2024: Syria comprehensive sanctions',
      '2025: Regional instability creating supply chain uncertainties',
      'Long-term: Energy security concerns driving Asian investment and long-term contracts'
    ]
  },
  'North Korea': {
    primaryRisks: [
      'Nuclear weapons program expansion',
      'Ballistic missile testing and proliferation',
      'Complete economic isolation and humanitarian crisis',
      'Cyber warfare capabilities and cryptocurrency theft',
      'Military cooperation with Russia and China'
    ],
    economicWarfare: [
      'Comprehensively sanctioned with total economic isolation',
      'Cryptocurrency theft as primary sanctions evasion method',
      'Arms sales to Russia and other sanctioned states',
      'Illicit trade networks through China',
      'Forced labor and human trafficking for revenue'
    ],
    marketImplications: [
      'BlackRock: Identified as Country of Concern with significant military threat',
      'Sean Foo: Nuclear program advancement creating regional instability',
      'Marc Faber: North Korea example of complete sanctions regime limits',
      'Faber: Extreme case of currency collapse and economic dysfunction',
      'Michael Every: DPRK demonstrates impossibility of total isolation',
      'Every: North Korea surviving through China relationship despite isolation',
      'Louis-Vincent Gave: North Korea-Russia military cooperation complicating regional security',
      'Gave: DPRK-Russia arms trade undermining sanctions effectiveness',
      'Tom Luongo: North Korea demonstrates limits of sanctions-based isolation',
      'Swen Lorenz: North Korea extreme case with no investment opportunities'
    ],
    expertAnalysis: [
      'Krainer: Sanctions failed to achieve denuclearization objective',
      'Sean Foo: Cyber capabilities providing asymmetric sanctions evasion tool',
      'Luongo: China relationship sustaining regime despite comprehensive sanctions',
      'Every: Arms trade with Russia demonstrating sanctions circumvention',
      'Gave: Military cooperation complicating regional security dynamics'
    ],
    recentDevelopments: [
      '2024: Continued nuclear weapons and missile development',
      '2024: Military cooperation with Russia intensifying',
      '2024: Cryptocurrency sanctions targeting DPRK wallet networks',
      '2024: Cyber attacks on financial institutions for revenue',
      '2024: Arms shipments to Russia for Ukraine conflict'
    ],
    capitalControls: [
      '2024-2025: Total capital controls under autarkic economic system',
      '2024: No legal foreign exchange market or convertible currency',
      '2024: All foreign trade conducted through state entities',
      '2024: Citizens prohibited from holding foreign currency',
      '2024: Black market exchange rates exist but highly illegal',
      '2024: Cryptocurrency theft operations as primary hard currency source'
    ],
    tradeTariffRisks: [
      '2024-2025: Comprehensive sanctions beyond traditional tariffs',
      '2024: Total economic isolation from global trade',
      '2024: Illicit trade networks through China',
      '2024: Arms sales to Russia and other sanctioned states',
      'Long-term: No normalization absent denuclearization or regime change'
    ]
  },
  'Syria': {
    primaryRisks: [
      'Ongoing civil war and humanitarian catastrophe',
      'Russian and Iranian military presence',
      'ISIS resurgence risks in ungoverned areas',
      'Refugee crisis affecting neighboring countries',
      'Economic collapse and infrastructure destruction'
    ],
    economicWarfare: [
      'Comprehensively sanctioned with no political track',
      'Caesar Act sanctions targeting reconstruction efforts',
      'Oil sector completely disrupted and sanctioned',
      'Banking sector isolated from international systems',
      'Humanitarian aid restrictions complicating relief efforts'
    ],
    marketImplications: [
      'BlackRock: Active conflict winding down but no political resolution',
      'Sean Foo: Syria becoming permanent Russian and Iranian military base',
      'Marc Faber: Syria example of failed state with no investment opportunities',
      'Faber: Extreme humanitarian crisis with no economic prospects',
      'Michael Every: Syria demonstrates limits of regime change through sanctions',
      'Every: Syria frozen conflict with no resolution pathway',
      'Louis-Vincent Gave: Regional instability preventing any economic recovery',
      'Gave: Russian and Iranian presence ensuring continued Western isolation',
      'Tom Luongo: Syria test case for limits of sanctions-based regime change',
      'Swen Lorenz: Post-conflict Syria potential long-term opportunity if sanctions lifted'
    ],
    expertAnalysis: [
      'Krainer: Sanctions preventing reconstruction while Assad remains in power',
      'Sean Foo: Syria becoming testing ground for Russian military equipment',
      'Luongo: Russian and Iranian presence ensuring regime survival despite sanctions',
      'Lorenz: Reconstruction opportunities contingent on political settlement',
      'Every: Frozen conflict with no pathway to resolution'
    ],
    recentDevelopments: [
      '2024: Active fighting reduced but no political settlement',
      '2024: Comprehensive sanctions remain with no relief',
      '2024: Humanitarian crisis persisting with millions displaced',
      '2024: Russian military presence consolidating',
      '2024: Economic conditions deteriorating further under sanctions'
    ],
    capitalControls: [
      '2024-2025: Extreme capital controls amid war and comprehensive sanctions',
      '2024: Multiple exchange rate system with massive black market premium',
      '2024: Severe restrictions on foreign currency access',
      '2024: Banking system largely non-functional for international transactions',
      '2024: Cash-based economy with widespread use of US dollars and Lebanese pounds',
      '2024: Humanitarian exemptions for aid organizations face significant bureaucratic hurdles'
    ],
    tradeTariffRisks: [
      '2024-2025: Comprehensive sanctions beyond traditional tariffs',
      '2024: Caesar Act targeting reconstruction efforts',
      '2024: Oil sector completely sanctioned',
      '2024: Banking sector isolated preventing trade finance',
      'Long-term: No normalization absent political settlement and sanctions relief'
    ]
  }
};

/**
 * Get country-specific geopolitical insights
 */
export function getCountryInsights(country: string): CountryInsights | null {
  return GEOPOLITICAL_INSIGHTS[country] || null;
}

/**
 * Get all countries with insights
 */
export function getCountriesWithInsights(): string[] {
  return Object.keys(GEOPOLITICAL_INSIGHTS);
}

/**
 * Search insights by keyword
 */
export function searchInsights(keyword: string): Record<string, CountryInsights> {
  const results: Record<string, CountryInsights> = {};
  const lowerKeyword = keyword.toLowerCase();
  
  for (const [country, insights] of Object.entries(GEOPOLITICAL_INSIGHTS)) {
    const allText = [
      ...insights.primaryRisks,
      ...insights.economicWarfare,
      ...insights.marketImplications,
      ...insights.expertAnalysis,
      ...insights.recentDevelopments,
      ...(insights.capitalControls || []),
      ...(insights.tradeTariffRisks || [])
    ].join(' ').toLowerCase();
    
    if (allText.includes(lowerKeyword)) {
      results[country] = insights;
    }
  }
  
  return results;
}
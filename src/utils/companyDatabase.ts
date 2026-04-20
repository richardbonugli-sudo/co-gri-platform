// Company Database Module - Enhanced with search functionality
// Comprehensive database of international stocks across major global exchanges

export interface Company {
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  sector: string;
  isADR?: boolean; // CRITICAL: Added isADR field for ADR detection
  aliases?: string[]; // Alternative names or common abbreviations
}

// Comprehensive company database
const companies: Company[] = [
  // United States - Technology
  { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', aliases: ['Apple'] },
  { ticker: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', aliases: ['Microsoft'] },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', aliases: ['Google', 'Alphabet'] },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', aliases: ['Amazon'] },
  { ticker: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', aliases: ['Facebook', 'Meta'] },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', aliases: ['NVIDIA', 'Nvidia'] },
  { ticker: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Automotive', aliases: ['Tesla'] },
  { ticker: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', aliases: ['Netflix'] },
  { ticker: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', aliases: ['Adobe'] },
  { ticker: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', country: 'United States', sector: 'Technology', aliases: ['Salesforce'] },
  { ticker: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE', country: 'United States', sector: 'Technology', aliases: ['Oracle'] },
  { ticker: 'CSCO', name: 'Cisco Systems Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', aliases: ['Cisco'] },
  { ticker: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', aliases: ['Intel'] },
  { ticker: 'AMD', name: 'Advanced Micro Devices Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', aliases: ['AMD'] },
  { ticker: 'IBM', name: 'International Business Machines', exchange: 'NYSE', country: 'United States', sector: 'Technology', aliases: ['IBM'] },

  // United States - Communication Services (ADDED VZ HERE)
  { ticker: 'VZ', name: 'Verizon Communications Inc.', exchange: 'NYSE', country: 'United States', sector: 'Communication Services', aliases: ['Verizon'] },

  // United States - Financial Services
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', aliases: ['JPMorgan', 'Chase'] },
  { ticker: 'BAC', name: 'Bank of America Corporation', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', aliases: ['Bank of America', 'BofA'] },
  { ticker: 'WFC', name: 'Wells Fargo & Company', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', aliases: ['Wells Fargo'] },
  { ticker: 'GS', name: 'Goldman Sachs Group Inc.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', aliases: ['Goldman Sachs', 'Goldman'] },
  { ticker: 'MS', name: 'Morgan Stanley', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', aliases: ['Morgan Stanley'] },
  { ticker: 'C', name: 'Citigroup Inc.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', aliases: ['Citigroup', 'Citi'] },
  { ticker: 'V', name: 'Visa Inc.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', aliases: ['Visa'] },
  { ticker: 'MA', name: 'Mastercard Incorporated', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', aliases: ['Mastercard'] },
  { ticker: 'AXP', name: 'American Express Company', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', aliases: ['American Express', 'Amex'] },
  { ticker: 'BLK', name: 'BlackRock Inc.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', aliases: ['BlackRock'] },

  // United States - Healthcare
  { ticker: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', aliases: ['J&J'] },
  { ticker: 'UNH', name: 'UnitedHealth Group Inc.', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', aliases: ['UnitedHealth'] },
  { ticker: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', aliases: ['Pfizer'] },
  { ticker: 'ABBV', name: 'AbbVie Inc.', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', aliases: ['AbbVie'] },
  { ticker: 'TMO', name: 'Thermo Fisher Scientific', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', aliases: ['Thermo Fisher'] },
  { ticker: 'ABT', name: 'Abbott Laboratories', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', aliases: ['Abbott'] },
  { ticker: 'DHR', name: 'Danaher Corporation', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', aliases: ['Danaher'] },
  { ticker: 'MRK', name: 'Merck & Co. Inc.', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', aliases: ['Merck'] },
  { ticker: 'LLY', name: 'Eli Lilly and Company', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', aliases: ['Eli Lilly', 'Lilly'] },

  // United States - Energy
  { ticker: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE', country: 'United States', sector: 'Energy', aliases: ['Exxon', 'ExxonMobil'] },
  { ticker: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', country: 'United States', sector: 'Energy', aliases: ['Chevron'] },
  { ticker: 'COP', name: 'ConocoPhillips', exchange: 'NYSE', country: 'United States', sector: 'Energy', aliases: ['Conoco'] },
  { ticker: 'SLB', name: 'Schlumberger Limited', exchange: 'NYSE', country: 'United States', sector: 'Energy', aliases: ['Schlumberger'] },

  // United States - Consumer
  { ticker: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', country: 'United States', sector: 'Consumer Cyclical', aliases: ['Walmart'] },
  { ticker: 'HD', name: 'Home Depot Inc.', exchange: 'NYSE', country: 'United States', sector: 'Consumer Cyclical', aliases: ['Home Depot'] },
  { ticker: 'MCD', name: 'McDonald\'s Corporation', exchange: 'NYSE', country: 'United States', sector: 'Consumer Cyclical', aliases: ['McDonald\'s', 'McDonalds'] },
  { ticker: 'NKE', name: 'Nike Inc.', exchange: 'NYSE', country: 'United States', sector: 'Consumer Cyclical', aliases: ['Nike'] },
  { ticker: 'SBUX', name: 'Starbucks Corporation', exchange: 'NASDAQ', country: 'United States', sector: 'Consumer Cyclical', aliases: ['Starbucks'] },
  { ticker: 'DIS', name: 'Walt Disney Company', exchange: 'NYSE', country: 'United States', sector: 'Consumer Cyclical', aliases: ['Disney'] },
  { ticker: 'PG', name: 'Procter & Gamble Company', exchange: 'NYSE', country: 'United States', sector: 'Consumer Cyclical', aliases: ['P&G', 'Procter Gamble'] },
  { ticker: 'KO', name: 'Coca-Cola Company', exchange: 'NYSE', country: 'United States', sector: 'Consumer Cyclical', aliases: ['Coca Cola', 'Coke'] },
  { ticker: 'PEP', name: 'PepsiCo Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Consumer Cyclical', aliases: ['Pepsi', 'PepsiCo'] },

  // United States - Basic Materials
  { ticker: 'VALE', name: 'Vale S.A.', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Vale', 'Vale SA', 'Vale ADR'] },

  // United States - ADRs from China (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'BABA', name: 'Alibaba Group Holding Limited', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Alibaba', 'Alibaba ADR'] },
  { ticker: 'PDD', name: 'PDD Holdings Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Pinduoduo', 'PDD ADR'] },
  { ticker: 'JD', name: 'JD.com Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', isADR: true, aliases: ['JD', 'JD.com', 'JD ADR'] },
  { ticker: 'BIDU', name: 'Baidu Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Baidu', 'Baidu ADR'] },
  { ticker: 'NIO', name: 'NIO Inc.', exchange: 'NYSE', country: 'United States', sector: 'Automotive', isADR: true, aliases: ['NIO', 'NIO ADR'] },
  { ticker: 'LI', name: 'Li Auto Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Automotive', isADR: true, aliases: ['Li Auto', 'Li ADR'] },
  { ticker: 'XPEV', name: 'XPeng Inc.', exchange: 'NYSE', country: 'United States', sector: 'Automotive', isADR: true, aliases: ['XPeng', 'XPeng ADR'] },
  { ticker: 'NTES', name: 'NetEase Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', isADR: true, aliases: ['NetEase', 'NetEase ADR'] },
  { ticker: 'BILI', name: 'Bilibili Inc.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Bilibili', 'Bilibili ADR'] },
  { ticker: 'YUMC', name: 'Yum China Holdings Inc.', exchange: 'NYSE', country: 'United States', sector: 'Consumer Cyclical', isADR: true, aliases: ['Yum China', 'Yum China ADR'] },

  // United States - ADRs from Taiwan (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'TSM', name: 'Taiwan Semiconductor Manufacturing', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['TSMC', 'TSMC ADR'] },
  { ticker: 'UMC', name: 'United Microelectronics Corporation', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['UMC', 'UMC ADR'] },
  { ticker: 'ASX', name: 'ASE Technology Holding Co. Ltd.', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['ASE Technology', 'ASE ADR'] },
  { ticker: 'CHT', name: 'Chunghwa Telecom Co. Ltd.', exchange: 'NYSE', country: 'United States', sector: 'Communication Services', isADR: true, aliases: ['Chunghwa Telecom', 'CHT ADR'] },
  { ticker: 'AUO', name: 'AU Optronics Corp.', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['AU Optronics', 'AUO ADR'] },

  // United States - ADRs from South Korea (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'KB', name: 'KB Financial Group Inc.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['KB Financial', 'KB ADR'] },
  { ticker: 'SHG', name: 'Shinhan Financial Group Co Ltd', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Shinhan', 'Shinhan ADR'] },
  { ticker: 'PKX', name: 'POSCO Holdings Inc.', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['POSCO', 'POSCO ADR'] },
  { ticker: 'LPL', name: 'LG Display Co. Ltd.', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['LG Display', 'LG Display ADR'] },
  { ticker: 'KEP', name: 'Korea Electric Power Corporation', exchange: 'NYSE', country: 'United States', sector: 'Utilities', isADR: true, aliases: ['KEPCO', 'Korea Electric ADR'] },

  // United States - ADRs from Japan (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'TM', name: 'Toyota Motor Corporation', exchange: 'NYSE', country: 'United States', sector: 'Automotive', isADR: true, aliases: ['Toyota', 'Toyota ADR'] },
  { ticker: 'SONY', name: 'Sony Group Corporation', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Sony', 'Sony ADR'] },
  { ticker: 'MUFG', name: 'Mitsubishi UFJ Financial Group', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['MUFG', 'Mitsubishi UFJ', 'MUFG ADR'] },
  { ticker: 'SMFG', name: 'Sumitomo Mitsui Financial Group', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['SMFG', 'Sumitomo Mitsui', 'SMFG ADR'] },
  { ticker: 'NMR', name: 'Nomura Holdings Inc.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Nomura', 'Nomura ADR'] },
  { ticker: 'MFG', name: 'Mizuho Financial Group Inc.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Mizuho', 'Mizuho ADR'] },
  { ticker: 'HMC', name: 'Honda Motor Co. Ltd.', exchange: 'NYSE', country: 'United States', sector: 'Automotive', isADR: true, aliases: ['Honda', 'Honda ADR'] },
  { ticker: 'NTDOY', name: 'Nintendo Co. Ltd.', exchange: 'OTC', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Nintendo', 'Nintendo ADR'] },
  { ticker: 'SNE', name: 'Sony Corporation', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Sony Corp', 'Sony ADR'] },
  { ticker: 'FUJIY', name: 'Fujitsu Limited', exchange: 'OTC', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Fujitsu', 'Fujitsu ADR'] },

  // United States - ADRs from India (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'INFY', name: 'Infosys Limited', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Infosys', 'Infosys ADR'] },
  { ticker: 'WIT', name: 'Wipro Limited', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Wipro', 'Wipro ADR'] },
  { ticker: 'HDB', name: 'HDFC Bank Limited', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['HDFC Bank', 'HDFC ADR'] },
  { ticker: 'IBN', name: 'ICICI Bank Limited', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['ICICI Bank', 'ICICI ADR'] },
  { ticker: 'VEDL', name: 'Vedanta Limited', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Vedanta', 'Vedanta ADR'] },
  { ticker: 'TTM', name: 'Tata Motors Limited', exchange: 'NYSE', country: 'United States', sector: 'Automotive', isADR: true, aliases: ['Tata Motors', 'Tata ADR'] },
  { ticker: 'SIFY', name: 'Sify Technologies Limited', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Sify', 'Sify ADR'] },
  { ticker: 'REDY', name: 'Dr. Reddy\'s Laboratories Ltd.', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', isADR: true, aliases: ['Dr Reddy', 'Dr Reddys ADR'] },
  { ticker: 'WNS', name: 'WNS Holdings Limited', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['WNS', 'WNS ADR'] },
  { ticker: 'INDY', name: 'India Fund Inc.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['India Fund', 'India Fund ADR'] },

  // United States - ADRs from Brazil (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'PBR', name: 'Petróleo Brasileiro S.A.', exchange: 'NYSE', country: 'United States', sector: 'Energy', isADR: true, aliases: ['Petrobras', 'Petrobras ADR'] },
  { ticker: 'VALE', name: 'Vale S.A.', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Vale', 'Vale ADR'] },
  { ticker: 'ITUB', name: 'Itaú Unibanco Holding S.A.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Itau', 'Itaú', 'Itau ADR'] },
  { ticker: 'BBD', name: 'Banco Bradesco S.A.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Bradesco', 'Bradesco ADR'] },
  { ticker: 'ABEV', name: 'Ambev S.A.', exchange: 'NYSE', country: 'United States', sector: 'Consumer Cyclical', isADR: true, aliases: ['Ambev', 'Ambev ADR'] },
  { ticker: 'SBS', name: 'Companhia de Saneamento Básico do Estado de São Paulo', exchange: 'NYSE', country: 'United States', sector: 'Utilities', isADR: true, aliases: ['Sabesp', 'Sabesp ADR'] },
  { ticker: 'TIMB', name: 'TIM S.A.', exchange: 'NYSE', country: 'United States', sector: 'Communication Services', isADR: true, aliases: ['TIM Brasil', 'TIM ADR'] },
  { ticker: 'BRFS', name: 'BRF S.A.', exchange: 'NYSE', country: 'United States', sector: 'Consumer Defensive', isADR: true, aliases: ['BRF', 'BRF ADR'] },
  { ticker: 'CBD', name: 'Companhia Brasileira de Distribuição', exchange: 'NYSE', country: 'United States', sector: 'Consumer Defensive', isADR: true, aliases: ['Pao de Acucar', 'CBD ADR'] },
  { ticker: 'GGB', name: 'Gerdau S.A.', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Gerdau', 'Gerdau ADR'] },

  // United States - ADRs from United Kingdom (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'BP', name: 'BP plc', exchange: 'NYSE', country: 'United States', sector: 'Energy', isADR: true, aliases: ['BP', 'British Petroleum', 'BP ADR'] },
  { ticker: 'SHEL', name: 'Shell plc', exchange: 'NYSE', country: 'United States', sector: 'Energy', isADR: true, aliases: ['Shell', 'Royal Dutch Shell', 'Shell ADR'] },
  { ticker: 'HSBC', name: 'HSBC Holdings plc', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['HSBC', 'HSBC ADR'] },
  { ticker: 'AZN', name: 'AstraZeneca PLC', exchange: 'NASDAQ', country: 'United States', sector: 'Healthcare', isADR: true, aliases: ['AstraZeneca', 'AstraZeneca ADR'] },
  { ticker: 'GSK', name: 'GSK plc', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', isADR: true, aliases: ['GlaxoSmithKline', 'GSK', 'GSK ADR'] },
  { ticker: 'DEO', name: 'Diageo plc', exchange: 'NYSE', country: 'United States', sector: 'Consumer Cyclical', isADR: true, aliases: ['Diageo', 'Diageo ADR'] },
  { ticker: 'UL', name: 'Unilever PLC', exchange: 'NYSE', country: 'United States', sector: 'Consumer Cyclical', isADR: true, aliases: ['Unilever', 'Unilever ADR'] },
  { ticker: 'BCS', name: 'Barclays PLC', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Barclays', 'Barclays ADR'] },
  { ticker: 'RIO', name: 'Rio Tinto Group', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Rio Tinto', 'Rio Tinto ADR'] },
  { ticker: 'BTI', name: 'British American Tobacco plc', exchange: 'NYSE', country: 'United States', sector: 'Consumer Defensive', isADR: true, aliases: ['BAT', 'British American Tobacco ADR'] },

  // United States - ADRs from France (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'SAN', name: 'Banco Santander S.A.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Santander', 'Santander ADR'] },
  { ticker: 'SNY', name: 'Sanofi', exchange: 'NASDAQ', country: 'United States', sector: 'Healthcare', isADR: true, aliases: ['Sanofi', 'Sanofi ADR'] },
  { ticker: 'TTE', name: 'TotalEnergies SE', exchange: 'NYSE', country: 'United States', sector: 'Energy', isADR: true, aliases: ['TotalEnergies', 'Total', 'TotalEnergies ADR'] },
  { ticker: 'BNP', name: 'BNP Paribas SA', exchange: 'OTC', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['BNP Paribas', 'BNP ADR'] },
  { ticker: 'LVMUY', name: 'LVMH Moët Hennessy Louis Vuitton', exchange: 'OTC', country: 'United States', sector: 'Consumer Cyclical', isADR: true, aliases: ['LVMH', 'Louis Vuitton ADR'] },
  { ticker: 'AXAHY', name: 'AXA SA', exchange: 'OTC', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['AXA', 'AXA ADR'] },
  { ticker: 'OREDY', name: 'L\'Oréal SA', exchange: 'OTC', country: 'United States', sector: 'Consumer Defensive', isADR: true, aliases: ['L\'Oreal', 'Loreal ADR'] },
  { ticker: 'DANOY', name: 'Danone SA', exchange: 'OTC', country: 'United States', sector: 'Consumer Defensive', isADR: true, aliases: ['Danone', 'Danone ADR'] },
  { ticker: 'AIQUY', name: 'Air Liquide SA', exchange: 'OTC', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Air Liquide', 'Air Liquide ADR'] },
  { ticker: 'SAFRY', name: 'Safran SA', exchange: 'OTC', country: 'United States', sector: 'Industrials', isADR: true, aliases: ['Safran', 'Safran ADR'] },

  // United States - ADRs from Germany (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'SAP', name: 'SAP SE', exchange: 'NYSE', country: 'United States', sector: 'Technology', isADR: true, aliases: ['SAP', 'SAP ADR'] },
  { ticker: 'SIEGY', name: 'Siemens AG', exchange: 'OTC', country: 'United States', sector: 'Industrials', isADR: true, aliases: ['Siemens', 'Siemens ADR'] },
  { ticker: 'BAYRY', name: 'Bayer AG', exchange: 'OTC', country: 'United States', sector: 'Healthcare', isADR: true, aliases: ['Bayer', 'Bayer ADR'] },
  { ticker: 'DAIMAY', name: 'Mercedes-Benz Group AG', exchange: 'OTC', country: 'United States', sector: 'Automotive', isADR: true, aliases: ['Mercedes', 'Daimler ADR'] },
  { ticker: 'BMWYY', name: 'Bayerische Motoren Werke AG', exchange: 'OTC', country: 'United States', sector: 'Automotive', isADR: true, aliases: ['BMW', 'BMW ADR'] },
  { ticker: 'VLKAF', name: 'Volkswagen AG', exchange: 'OTC', country: 'United States', sector: 'Automotive', isADR: true, aliases: ['Volkswagen', 'VW ADR'] },
  { ticker: 'BASFY', name: 'BASF SE', exchange: 'OTC', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['BASF', 'BASF ADR'] },
  { ticker: 'ADDYY', name: 'Adidas AG', exchange: 'OTC', country: 'United States', sector: 'Consumer Cyclical', isADR: true, aliases: ['Adidas', 'Adidas ADR'] },
  { ticker: 'DTEGY', name: 'Deutsche Telekom AG', exchange: 'OTC', country: 'United States', sector: 'Communication Services', isADR: true, aliases: ['Deutsche Telekom', 'DT ADR'] },
  { ticker: 'ALIZY', name: 'Allianz SE', exchange: 'OTC', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Allianz', 'Allianz ADR'] },

  // United States - ADRs from Netherlands (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'ASML', name: 'ASML Holding N.V.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', isADR: true, aliases: ['ASML', 'ASML ADR'] },
  { ticker: 'ING', name: 'ING Groep N.V.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['ING', 'ING Group', 'ING ADR'] },
  { ticker: 'PHG', name: 'Koninklijke Philips N.V.', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', isADR: true, aliases: ['Philips', 'Philips ADR'] },
  { ticker: 'STLA', name: 'Stellantis N.V.', exchange: 'NYSE', country: 'United States', sector: 'Automotive', isADR: true, aliases: ['Stellantis', 'Stellantis ADR'] },
  { ticker: 'HEIA', name: 'Heineken N.V.', exchange: 'OTC', country: 'United States', sector: 'Consumer Defensive', isADR: true, aliases: ['Heineken', 'Heineken ADR'] },

  // United States - ADRs from Switzerland (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'NVO', name: 'Novo Nordisk A/S', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', isADR: true, aliases: ['Novo Nordisk', 'Novo Nordisk ADR'] },
  { ticker: 'NVS', name: 'Novartis AG', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', isADR: true, aliases: ['Novartis', 'Novartis ADR'] },
  { ticker: 'RHHBY', name: 'Roche Holding AG', exchange: 'OTC', country: 'United States', sector: 'Healthcare', isADR: true, aliases: ['Roche', 'Roche ADR'] },
  { ticker: 'NSRGY', name: 'Nestlé S.A.', exchange: 'OTC', country: 'United States', sector: 'Consumer Defensive', isADR: true, aliases: ['Nestle', 'Nestlé ADR'] },
  { ticker: 'UBS', name: 'UBS Group AG', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['UBS', 'UBS ADR'] },
  { ticker: 'CS', name: 'Credit Suisse Group AG', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Credit Suisse', 'CS ADR'] },
  { ticker: 'ABBNY', name: 'ABB Ltd', exchange: 'OTC', country: 'United States', sector: 'Industrials', isADR: true, aliases: ['ABB', 'ABB ADR'] },
  { ticker: 'ZURN', name: 'Zurich Insurance Group AG', exchange: 'OTC', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Zurich Insurance', 'Zurich ADR'] },

  // United States - ADRs from Australia (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'BHP', name: 'BHP Group Limited', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['BHP', 'BHP Billiton', 'BHP ADR'] },
  { ticker: 'RIO', name: 'Rio Tinto Limited', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Rio Tinto Australia', 'Rio Tinto ADR'] },
  { ticker: 'WBK', name: 'Westpac Banking Corporation', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Westpac', 'Westpac ADR'] },
  { ticker: 'NAB', name: 'National Australia Bank Limited', exchange: 'OTC', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['NAB', 'NAB ADR'] },
  { ticker: 'ANZ', name: 'Australia and New Zealand Banking Group', exchange: 'OTC', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['ANZ', 'ANZ ADR'] },

  // United States - ADRs from Israel (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'TEVA', name: 'Teva Pharmaceutical Industries', exchange: 'NYSE', country: 'United States', sector: 'Healthcare', isADR: true, aliases: ['Teva', 'Teva ADR'] },
  { ticker: 'CHKP', name: 'Check Point Software Technologies', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Check Point', 'Check Point ADR'] },
  { ticker: 'NICE', name: 'NICE Ltd.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', isADR: true, aliases: ['NICE', 'NICE ADR'] },
  { ticker: 'WIX', name: 'Wix.com Ltd.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Wix', 'Wix ADR'] },
  { ticker: 'MNDY', name: 'Monday.com Ltd.', exchange: 'NASDAQ', country: 'United States', sector: 'Technology', isADR: true, aliases: ['Monday', 'Monday.com ADR'] },

  // United States - ADRs from Mexico (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'AMX', name: 'América Móvil S.A.B. de C.V.', exchange: 'NYSE', country: 'United States', sector: 'Communication Services', isADR: true, aliases: ['America Movil', 'AMX', 'America Movil ADR'] },
  { ticker: 'FMX', name: 'Fomento Económico Mexicano S.A.B. de C.V.', exchange: 'NYSE', country: 'United States', sector: 'Consumer Defensive', isADR: true, aliases: ['FEMSA', 'FEMSA ADR'] },
  { ticker: 'TV', name: 'Grupo Televisa S.A.B.', exchange: 'NYSE', country: 'United States', sector: 'Communication Services', isADR: true, aliases: ['Televisa', 'Televisa ADR'] },
  { ticker: 'GFNORTEO', name: 'Grupo Financiero Banorte S.A.B. de C.V.', exchange: 'OTC', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Banorte', 'Banorte ADR'] },
  { ticker: 'CX', name: 'CEMEX S.A.B. de C.V.', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['CEMEX', 'CEMEX ADR'] },

  // United States - ADRs from Argentina (Top 10 by Market Cap) - INCLUDING CRESY AND IRS - CRITICAL: Added isADR: true
  { ticker: 'YPF', name: 'YPF Sociedad Anónima', exchange: 'NYSE', country: 'United States', sector: 'Energy', isADR: true, aliases: ['YPF', 'YPF ADR'] },
  { ticker: 'CRESY', name: 'Cresud S.A.C.I.F.A.', exchange: 'NASDAQ', country: 'United States', sector: 'Real Estate', isADR: true, aliases: ['Cresud', 'CRESY ADR'] },
  { ticker: 'IRS', name: 'IRSA Inversiones y Representaciones S.A.', exchange: 'NYSE', country: 'United States', sector: 'Real Estate', isADR: true, aliases: ['IRSA', 'IRS ADR'] },
  { ticker: 'BMA', name: 'Banco Macro S.A.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Banco Macro', 'BMA ADR'] },
  { ticker: 'GGAL', name: 'Grupo Financiero Galicia S.A.', exchange: 'NASDAQ', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Galicia', 'GGAL ADR'] },
  { ticker: 'SUPV', name: 'Grupo Supervielle S.A.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Supervielle', 'SUPV ADR'] },
  { ticker: 'TEO', name: 'Telecom Argentina S.A.', exchange: 'NYSE', country: 'United States', sector: 'Communication Services', isADR: true, aliases: ['Telecom Argentina', 'TEO ADR'] },
  { ticker: 'TX', name: 'Ternium S.A.', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Ternium', 'TX ADR'] },
  { ticker: 'PAM', name: 'Pampa Energía S.A.', exchange: 'NYSE', country: 'United States', sector: 'Utilities', isADR: true, aliases: ['Pampa Energia', 'PAM ADR'] },
  { ticker: 'LOMA', name: 'Loma Negra Compañía Industrial Argentina', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Loma Negra', 'LOMA ADR'] },

  // United States - ADRs from Chile (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'SQM', name: 'Sociedad Química y Minera de Chile S.A.', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['SQM', 'SQM ADR'] },
  { ticker: 'LTM', name: 'Latam Airlines Group S.A.', exchange: 'NYSE', country: 'United States', sector: 'Industrials', isADR: true, aliases: ['LATAM', 'LATAM ADR'] },
  { ticker: 'ENIA', name: 'Enel Americas S.A.', exchange: 'NYSE', country: 'United States', sector: 'Utilities', isADR: true, aliases: ['Enel Americas', 'ENIA ADR'] },
  { ticker: 'CHL', name: 'China Mobile Limited', exchange: 'NYSE', country: 'United States', sector: 'Communication Services', isADR: true, aliases: ['China Mobile Chile', 'CHL ADR'] },

  // United States - ADRs from Colombia - CRITICAL: Added isADR: true AND FIXED CIB NAME
  { ticker: 'CIB', name: 'Bancolombia S.A.', exchange: 'NYSE', country: 'United States', sector: 'Financial Services', isADR: true, aliases: ['Bancolombia', 'CIB ADR'] },

  // United States - ADRs from South Africa (Top 10 by Market Cap) - CRITICAL: Added isADR: true
  { ticker: 'GOLD', name: 'Barrick Gold Corporation', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Barrick Gold', 'Barrick ADR'] },
  { ticker: 'AU', name: 'AngloGold Ashanti Limited', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['AngloGold', 'AngloGold ADR'] },
  { ticker: 'GFI', name: 'Gold Fields Limited', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Gold Fields', 'GFI ADR'] },
  { ticker: 'SBSW', name: 'Sibanye Stillwater Limited', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Sibanye', 'SBSW ADR'] },
  { ticker: 'HMY', name: 'Harmony Gold Mining Company Limited', exchange: 'NYSE', country: 'United States', sector: 'Basic Materials', isADR: true, aliases: ['Harmony Gold', 'HMY ADR'] },

  // Canada - Energy (Expanded with additional major producers)
  { ticker: 'TOU.TO', name: 'Tourmaline Oil Corp.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Tourmaline Oil', 'Tourmaline'] },
  { ticker: 'ARX.TO', name: 'ARC Resources Ltd.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['ARC Resources', 'ARC'] },
  { ticker: 'WCP.TO', name: 'Whitecap Resources Inc.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Whitecap Resources', 'Whitecap'] },
  { ticker: 'MEG.TO', name: 'MEG Energy Corp.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['MEG Energy', 'MEG'] },
  { ticker: 'BTE.TO', name: 'Baytex Energy Corp.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Baytex Energy', 'Baytex'] },
  { ticker: 'TVE.TO', name: 'Tamarack Valley Energy Ltd.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Tamarack Valley', 'Tamarack'] },
  { ticker: 'ERF.TO', name: 'Enerplus Corporation', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Enerplus'] },
  { ticker: 'CPG.TO', name: 'Crescent Point Energy Corp.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Crescent Point', 'Crescent Point Energy'] },
  { ticker: 'VET.TO', name: 'Vermilion Energy Inc.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Vermilion Energy', 'Vermilion'] },
  { ticker: 'OVV.TO', name: 'Ovintiv Inc.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Ovintiv'] },
  { ticker: 'NVA.TO', name: 'NuVista Energy Ltd.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['NuVista Energy', 'NuVista'] },
  { ticker: 'KEL.TO', name: 'Kelt Exploration Ltd.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Kelt Exploration', 'Kelt'] },
  { ticker: 'SGY.TO', name: 'Surge Energy Inc.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Surge Energy', 'Surge'] },
  { ticker: 'BIR.TO', name: 'Birchcliff Energy Ltd.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Birchcliff Energy', 'Birchcliff'] },
  { ticker: 'POU.TO', name: 'Paramount Resources Ltd.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Paramount Resources', 'Paramount'] },
  { ticker: 'PXT.TO', name: 'Parex Resources Inc.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Parex Resources', 'Parex'] },
  { ticker: 'CNQ.TO', name: 'Canadian Natural Resources', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Canadian Natural'] },
  { ticker: 'SU.TO', name: 'Suncor Energy Inc.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Suncor'] },
  { ticker: 'IMO.TO', name: 'Imperial Oil Limited', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Imperial Oil'] },
  { ticker: 'CVE.TO', name: 'Cenovus Energy Inc.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Cenovus'] },
  { ticker: 'TRP.TO', name: 'TC Energy Corporation', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['TC Energy', 'TransCanada'] },
  { ticker: 'ENB.TO', name: 'Enbridge Inc.', exchange: 'TSX', country: 'Canada', sector: 'Energy', aliases: ['Enbridge'] },

  // Canada - Financial Services
  { ticker: 'RY.TO', name: 'Royal Bank of Canada', exchange: 'TSX', country: 'Canada', sector: 'Financial Services', aliases: ['RBC', 'Royal Bank'] },
  { ticker: 'TD.TO', name: 'Toronto-Dominion Bank', exchange: 'TSX', country: 'Canada', sector: 'Financial Services', aliases: ['TD Bank', 'TD'] },
  { ticker: 'BNS.TO', name: 'Bank of Nova Scotia', exchange: 'TSX', country: 'Canada', sector: 'Financial Services', aliases: ['Scotiabank', 'BNS'] },
  { ticker: 'BMO.TO', name: 'Bank of Montreal', exchange: 'TSX', country: 'Canada', sector: 'Financial Services', aliases: ['BMO'] },
  { ticker: 'CM.TO', name: 'Canadian Imperial Bank of Commerce', exchange: 'TSX', country: 'Canada', sector: 'Financial Services', aliases: ['CIBC'] },
  { ticker: 'MFC.TO', name: 'Manulife Financial Corporation', exchange: 'TSX', country: 'Canada', sector: 'Financial Services', aliases: ['Manulife'] },
  { ticker: 'SLF.TO', name: 'Sun Life Financial Inc.', exchange: 'TSX', country: 'Canada', sector: 'Financial Services', aliases: ['Sun Life'] },

  // Canada - Technology & Other
  { ticker: 'SHOP.TO', name: 'Shopify Inc.', exchange: 'TSX', country: 'Canada', sector: 'Technology', aliases: ['Shopify'] },
  { ticker: 'BCE.TO', name: 'BCE Inc.', exchange: 'TSX', country: 'Canada', sector: 'Communication Services', aliases: ['Bell Canada', 'BCE'] },
  { ticker: 'T.TO', name: 'Telus Corporation', exchange: 'TSX', country: 'Canada', sector: 'Communication Services', aliases: ['Telus'] },
  { ticker: 'CNR.TO', name: 'Canadian National Railway', exchange: 'TSX', country: 'Canada', sector: 'Industrials', aliases: ['CN Rail', 'CNR'] },
  { ticker: 'CP.TO', name: 'Canadian Pacific Railway', exchange: 'TSX', country: 'Canada', sector: 'Industrials', aliases: ['CP Rail', 'CPR'] },

  // Colombia
  { ticker: 'CIB.CO', name: 'Grupo Cebest S.A.', exchange: 'BVC', country: 'Colombia', sector: 'Financial Services', aliases: ['Grupo Cebest', 'Cebest'] },
  { ticker: 'ECOPETROL.CO', name: 'Ecopetrol S.A.', exchange: 'BVC', country: 'Colombia', sector: 'Energy', aliases: ['Ecopetrol'] },
  { ticker: 'BANCOLOMBIA.CO', name: 'Bancolombia S.A.', exchange: 'BVC', country: 'Colombia', sector: 'Financial Services', aliases: ['Bancolombia'] },
  { ticker: 'GRUPOSURA.CO', name: 'Grupo de Inversiones Suramericana S.A.', exchange: 'BVC', country: 'Colombia', sector: 'Financial Services', aliases: ['Grupo Sura', 'Sura'] },

  // United Kingdom
  { ticker: 'SHEL.L', name: 'Shell plc', exchange: 'LSE', country: 'United Kingdom', sector: 'Energy', aliases: ['Shell', 'Royal Dutch Shell'] },
  { ticker: 'BP.L', name: 'BP plc', exchange: 'LSE', country: 'United Kingdom', sector: 'Energy', aliases: ['BP', 'British Petroleum'] },
  { ticker: 'HSBA.L', name: 'HSBC Holdings plc', exchange: 'LSE', country: 'United Kingdom', sector: 'Financial Services', aliases: ['HSBC'] },
  { ticker: 'AZN.L', name: 'AstraZeneca PLC', exchange: 'LSE', country: 'United Kingdom', sector: 'Healthcare', aliases: ['AstraZeneca'] },
  { ticker: 'ULVR.L', name: 'Unilever PLC', exchange: 'LSE', country: 'United Kingdom', sector: 'Consumer Cyclical', aliases: ['Unilever'] },
  { ticker: 'DGE.L', name: 'Diageo plc', exchange: 'LSE', country: 'United Kingdom', sector: 'Consumer Cyclical', aliases: ['Diageo'] },
  { ticker: 'GSK.L', name: 'GSK plc', exchange: 'LSE', country: 'United Kingdom', sector: 'Healthcare', aliases: ['GlaxoSmithKline', 'GSK'] },
  { ticker: 'BARC.L', name: 'Barclays PLC', exchange: 'LSE', country: 'United Kingdom', sector: 'Financial Services', aliases: ['Barclays'] },
  { ticker: 'LLOY.L', name: 'Lloyds Banking Group', exchange: 'LSE', country: 'United Kingdom', sector: 'Financial Services', aliases: ['Lloyds'] },
  { ticker: 'VOD.L', name: 'Vodafone Group Plc', exchange: 'LSE', country: 'United Kingdom', sector: 'Communication Services', aliases: ['Vodafone'] },

  // Hong Kong
  { ticker: '0700.HK', name: 'Tencent Holdings Limited', exchange: 'HKEX', country: 'Hong Kong', sector: 'Technology', aliases: ['Tencent'] },
  { ticker: '9988.HK', name: 'Alibaba Group Holding Limited', exchange: 'HKEX', country: 'Hong Kong', sector: 'Technology', aliases: ['Alibaba'] },
  { ticker: '0005.HK', name: 'HSBC Holdings plc', exchange: 'HKEX', country: 'Hong Kong', sector: 'Financial Services', aliases: ['HSBC HK'] },
  { ticker: '0941.HK', name: 'China Mobile Limited', exchange: 'HKEX', country: 'Hong Kong', sector: 'Communication Services', aliases: ['China Mobile'] },
  { ticker: '0388.HK', name: 'Hong Kong Exchanges and Clearing', exchange: 'HKEX', country: 'Hong Kong', sector: 'Financial Services', aliases: ['HKEX'] },
  { ticker: '1299.HK', name: 'AIA Group Limited', exchange: 'HKEX', country: 'Hong Kong', sector: 'Financial Services', aliases: ['AIA'] },
  { ticker: '0001.HK', name: 'CK Hutchison Holdings Limited', exchange: 'HKEX', country: 'Hong Kong', sector: 'Industrials', aliases: ['CK Hutchison'] },
  { ticker: '0002.HK', name: 'CLP Holdings Limited', exchange: 'HKEX', country: 'Hong Kong', sector: 'Utilities', aliases: ['CLP'] },

  // Singapore
  { ticker: 'D05.SI', name: 'DBS Group Holdings Ltd', exchange: 'SGX', country: 'Singapore', sector: 'Financial Services', aliases: ['DBS'] },
  { ticker: 'O39.SI', name: 'Oversea-Chinese Banking Corp', exchange: 'SGX', country: 'Singapore', sector: 'Financial Services', aliases: ['OCBC'] },
  { ticker: 'U11.SI', name: 'United Overseas Bank Ltd', exchange: 'SGX', country: 'Singapore', sector: 'Financial Services', aliases: ['UOB'] },
  { ticker: 'Z74.SI', name: 'Singapore Telecommunications', exchange: 'SGX', country: 'Singapore', sector: 'Communication Services', aliases: ['Singtel'] },
  { ticker: 'C52.SI', name: 'ComfortDelGro Corporation', exchange: 'SGX', country: 'Singapore', sector: 'Industrials', aliases: ['ComfortDelGro'] },

  // Brazil
  { ticker: 'PETR4.SA', name: 'Petróleo Brasileiro S.A.', exchange: 'B3', country: 'Brazil', sector: 'Energy', aliases: ['Petrobras'] },
  { ticker: 'VALE3.SA', name: 'Vale S.A.', exchange: 'B3', country: 'Brazil', sector: 'Basic Materials', aliases: ['Vale Brazil', 'Vale SA'] },
  { ticker: 'ITUB4.SA', name: 'Itaú Unibanco Holding S.A.', exchange: 'B3', country: 'Brazil', sector: 'Financial Services', aliases: ['Itau', 'Itaú'] },
  { ticker: 'BBDC4.SA', name: 'Banco Bradesco S.A.', exchange: 'B3', country: 'Brazil', sector: 'Financial Services', aliases: ['Bradesco'] },
  { ticker: 'ABEV3.SA', name: 'Ambev S.A.', exchange: 'B3', country: 'Brazil', sector: 'Consumer Cyclical', aliases: ['Ambev'] },
  { ticker: 'B3SA3.SA', name: 'B3 S.A.', exchange: 'B3', country: 'Brazil', sector: 'Financial Services', aliases: ['B3'] },

  // Taiwan
  { ticker: '2330.TW', name: 'Taiwan Semiconductor Manufacturing', exchange: 'TWSE', country: 'Taiwan', sector: 'Technology', aliases: ['TSMC'] },
  { ticker: '2317.TW', name: 'Hon Hai Precision Industry', exchange: 'TWSE', country: 'Taiwan', sector: 'Technology', aliases: ['Foxconn', 'Hon Hai'] },
  { ticker: '2454.TW', name: 'MediaTek Inc.', exchange: 'TWSE', country: 'Taiwan', sector: 'Technology', aliases: ['MediaTek'] },
  { ticker: '2882.TW', name: 'Cathay Financial Holding Co.', exchange: 'TWSE', country: 'Taiwan', sector: 'Financial Services', aliases: ['Cathay Financial'] },
  { ticker: '2881.TW', name: 'Fubon Financial Holding Co.', exchange: 'TWSE', country: 'Taiwan', sector: 'Financial Services', aliases: ['Fubon Financial'] },

  // South Africa
  { ticker: 'NPN.JO', name: 'Naspers Limited', exchange: 'JSE', country: 'South Africa', sector: 'Technology', aliases: ['Naspers'] },
  { ticker: 'SOL.JO', name: 'Sasol Limited', exchange: 'JSE', country: 'South Africa', sector: 'Energy', aliases: ['Sasol'] },
  { ticker: 'SHP.JO', name: 'Shoprite Holdings Ltd', exchange: 'JSE', country: 'South Africa', sector: 'Consumer Cyclical', aliases: ['Shoprite'] },
  { ticker: 'MTN.JO', name: 'MTN Group Limited', exchange: 'JSE', country: 'South Africa', sector: 'Communication Services', aliases: ['MTN'] },
  { ticker: 'FSR.JO', name: 'FirstRand Limited', exchange: 'JSE', country: 'South Africa', sector: 'Financial Services', aliases: ['FirstRand'] },
  { ticker: 'SBK.JO', name: 'Standard Bank Group Limited', exchange: 'JSE', country: 'South Africa', sector: 'Financial Services', aliases: ['Standard Bank'] },
  { ticker: 'AGL.JO', name: 'Anglo American plc', exchange: 'JSE', country: 'South Africa', sector: 'Basic Materials', aliases: ['Anglo American'] },
];

/**
 * Lookup company by ticker symbol
 */
export function lookupCompany(ticker: string): Company | undefined {
  const normalizedTicker = ticker.trim().toUpperCase();
  return companies.find(c => c.ticker.toUpperCase() === normalizedTicker);
}

/**
 * Search companies by name or ticker
 */
export function searchCompanies(query: string): Company[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  
  return companies.filter(company => {
    // Check ticker match
    if (company.ticker.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Check name match
    if (company.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Check aliases match
    if (company.aliases) {
      return company.aliases.some(alias => 
        alias.toLowerCase().includes(normalizedQuery)
      );
    }
    
    return false;
  }).sort((a, b) => {
    // Prioritize exact ticker matches
    const aTickerMatch = a.ticker.toLowerCase() === normalizedQuery;
    const bTickerMatch = b.ticker.toLowerCase() === normalizedQuery;
    if (aTickerMatch && !bTickerMatch) return -1;
    if (!aTickerMatch && bTickerMatch) return 1;
    
    // Then prioritize ticker starts with
    const aTickerStarts = a.ticker.toLowerCase().startsWith(normalizedQuery);
    const bTickerStarts = b.ticker.toLowerCase().startsWith(normalizedQuery);
    if (aTickerStarts && !bTickerStarts) return -1;
    if (!aTickerStarts && bTickerStarts) return 1;
    
    // Then alphabetical
    return a.ticker.localeCompare(b.ticker);
  });
}

/**
 * Get exchange suffix from ticker
 */
export function getExchangeSuffix(ticker: string): string | null {
  const suffixMatch = ticker.match(/\.([A-Z]+)$/);
  return suffixMatch ? suffixMatch[1] : null;
}

/**
 * Get exchange name from suffix
 */
export function getExchangeName(suffix: string): string {
  const exchangeMap: Record<string, string> = {
    'TO': 'Toronto Stock Exchange (TSX)',
    'V': 'TSX Venture Exchange',
    'L': 'London Stock Exchange (LSE)',
    'LON': 'London Stock Exchange (LSE)',
    'HK': 'Hong Kong Stock Exchange (HKEX)',
    'SI': 'Singapore Exchange (SGX)',
    'SA': 'B3 (Brazil)',
    'TW': 'Taiwan Stock Exchange (TWSE)',
    'TWO': 'Taipei Exchange',
    'JO': 'Johannesburg Stock Exchange (JSE)',
    'CO': 'Bolsa de Valores de Colombia (BVC)'
  };
  return exchangeMap[suffix] || suffix;
}

/**
 * Get all companies from a specific country
 */
export function getCompaniesByCountry(country: string): Company[] {
  return companies.filter(c => c.country.toLowerCase() === country.toLowerCase());
}

/**
 * Get all companies from a specific sector
 */
export function getCompaniesBySector(sector: string): Company[] {
  return companies.filter(c => c.sector.toLowerCase() === sector.toLowerCase());
}

/**
 * Get all unique countries
 */
export function getAllCountries(): string[] {
  return Array.from(new Set(companies.map(c => c.country))).sort();
}

/**
 * Get all unique sectors
 */
export function getAllSectors(): string[] {
  return Array.from(new Set(companies.map(c => c.sector))).sort();
}
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, Shield, Database, FileText, Settings } from 'lucide-react';

const Phase2Phase3Dashboard = () => {
  const dashboardCards = [
    {
      title: 'CO-GRI Analysis',
      description: 'Real-time geopolitical risk analysis and company exposure tracking',
      icon: Activity,
      link: '/phase23/cogri-analysis',
      color: 'bg-blue-500'
    },
    {
      title: 'Trading Signals',
      description: 'Advanced trading signals based on geopolitical risk assessments',
      icon: TrendingUp,
      link: '/phase23/trading-signals',
      color: 'bg-green-500'
    },
    {
      title: 'Risk Management',
      description: 'Portfolio risk management and optimization tools',
      icon: Shield,
      link: '/phase23/risk-management',
      color: 'bg-orange-500'
    },
    {
      title: 'Data Sources',
      description: 'Real-time data integration and monitoring dashboard',
      icon: Database,
      link: '/phase23/data-sources',
      color: 'bg-purple-500'
    },
    {
      title: 'Reports',
      description: 'Comprehensive audit reports and validation results',
      icon: FileText,
      link: '/phase23/reports',
      color: 'bg-indigo-500'
    },
    {
      title: 'Configuration',
      description: 'System settings and parameter configuration',
      icon: Settings,
      link: '/phase23/configuration',
      color: 'bg-gray-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Phase 2/3 Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">CO-GRI Trading Signal Service</p>
            </div>
            <Link href="/">
              <Button className="bg-gray-700 hover:bg-gray-600 text-white">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to Phase 2/3</h2>
          <p className="text-gray-400 text-lg">
            Advanced geopolitical risk analysis and trading signal generation platform
          </p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link key={index} href={card.link}>
                <div className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 hover:bg-gray-800/70 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/50 cursor-pointer">
                  <div className="flex items-start space-x-4">
                    <div className={`${card.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* System Status */}
        <div className="mt-12 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Data Pipeline</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
              <p className="text-white font-semibold">Operational</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Signal Generation</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
              <p className="text-white font-semibold">Active</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Risk Monitoring</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
              <p className="text-white font-semibold">Running</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Phase2Phase3Dashboard;
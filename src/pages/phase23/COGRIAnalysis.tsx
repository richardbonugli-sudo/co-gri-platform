import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const COGRIAnalysis = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/phase23-dashboard">
              <Button variant="ghost" className="p-2 hover:bg-gray-700">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">CO-GRI Analysis</h1>
              <p className="text-gray-400 text-sm mt-1">Real-time geopolitical risk analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">CO-GRI Analysis Dashboard</h2>
          <p className="text-gray-400">
            This page will display real-time CO-GRI calculations, company exposure analysis,
            and geopolitical risk assessments. Implementation in progress.
          </p>
        </div>
      </main>
    </div>
  );
};

export default COGRIAnalysis;
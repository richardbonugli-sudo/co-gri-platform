import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Globe, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#0f1e2e]">
      {/* Header */}
      <header className="bg-[#0d5f5f] text-white py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-[#0a4a4a] hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ← Back to Tool Home Page
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contact CedarOwl
          </h1>
          <p className="text-xl text-gray-300">
            Get in touch with us for more information
          </p>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-12">
          <img 
            src="/assets/cedarowl-logo.webp" 
            alt="CedarOwl Logo" 
            className="w-48 h-48 object-contain"
          />
        </div>

        {/* Contact Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">👇</div>
            <h2 className="text-3xl font-bold text-white">Reach Out to Us</h2>
          </div>

          <div className="space-y-6">
            {/* Email Card */}
            <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-[#0d5f5f] p-3 rounded-full">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">Email</h3>
                    <a
                      href="mailto:info@cedarportfolio.com"
                      className="text-[#4db8b8] hover:text-[#6dcfcf] text-lg transition-colors"
                    >
                      info@cedarportfolio.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Website Card */}
            <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-[#0d5f5f] p-3 rounded-full">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">Website</h3>
                    <a
                      href="https://cedarportfolio.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4db8b8] hover:text-[#6dcfcf] text-lg transition-colors"
                    >
                      cedarportfolio.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Substack Card */}
            <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-[#0d5f5f] p-3 rounded-full">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">Substack</h3>
                    <a
                      href="https://cedarowl.substack.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4db8b8] hover:text-[#6dcfcf] text-lg transition-colors"
                    >
                      cedarowl.substack.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0a1520] text-gray-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm">
            Powered by CedarOwl's advanced geopolitical risk analysis • Integrated Multi-Source Framework
          </p>
          <p className="text-xs mt-2 text-gray-500">Made with MGX</p>
        </div>
      </footer>
    </div>
  );
}
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function Disclaimer() {
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
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Disclaimer
          </h1>
          <p className="text-xl text-gray-300">
            Important Information About CedarOwl's Services
          </p>
        </div>

        {/* Disclaimer Content */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 space-y-6 text-gray-200">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">General Information</h2>
            <p className="leading-relaxed">
              The information provided by CedarOwl's Geopolitical Risk Assessment tool is for informational and educational purposes only. It should not be considered as financial advice, investment recommendations, or a guarantee of future performance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">No Investment Advice</h2>
            <p className="leading-relaxed">
              CedarOwl does not provide personalized investment advice or recommendations. The geopolitical risk assessments, scores, and analyses presented are based on publicly available information and our proprietary methodology. Users should conduct their own research and consult with qualified financial advisors before making any investment decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Risk Assessment Limitations</h2>
            <p className="leading-relaxed">
              While our Integrated Multi-Source Framework strives to provide comprehensive geopolitical risk analysis, no assessment can predict all future events or guarantee accuracy. Geopolitical situations are dynamic and can change rapidly. Past performance and historical risk assessments do not guarantee future results.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Accuracy</h2>
            <p className="leading-relaxed">
              We make every effort to ensure the accuracy and timeliness of the information provided. However, CedarOwl does not warrant or guarantee the accuracy, completeness, or reliability of any information, data, or analysis presented through our platform. Users should verify all information independently.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Investment Risks</h2>
            <p className="leading-relaxed">
              All investments carry inherent risks, including but not limited to the potential loss of principal. Geopolitical risks represent only one category of investment risk. Users should consider all relevant factors, including market risk, economic risk, regulatory risk, and their own financial situation and risk tolerance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">No Liability</h2>
            <p className="leading-relaxed">
              CedarOwl, its affiliates, and its data providers shall not be liable for any losses, damages, or claims arising from the use of this tool or reliance on the information provided. Users assume full responsibility for their investment decisions and any consequences thereof.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Information</h2>
            <p className="leading-relaxed">
              Our analysis may incorporate information from third-party sources. While we select sources we believe to be reliable, we cannot guarantee the accuracy of third-party information and are not responsible for any errors or omissions in such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Changes to Service</h2>
            <p className="leading-relaxed">
              CedarOwl reserves the right to modify, update, or discontinue any aspect of our services, methodologies, or assessments at any time without prior notice. We may also update this disclaimer periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Professional Advice</h2>
            <p className="leading-relaxed">
              Users are strongly encouraged to seek advice from qualified professionals, including financial advisors, tax advisors, and legal counsel, before making any investment decisions. CedarOwl's tools and assessments are designed to supplement, not replace, professional financial advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By using CedarOwl's Geopolitical Risk Assessment tool, you acknowledge that you have read, understood, and agree to be bound by this disclaimer. If you do not agree with any part of this disclaimer, please discontinue use of our services.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-sm text-gray-400 text-center">
              Last Updated: November 2024
            </p>
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
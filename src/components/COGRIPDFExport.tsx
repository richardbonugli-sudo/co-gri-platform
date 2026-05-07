import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface COGRIPDFExportProps {
  ticker: string;
  company: string;
  finalScore: number;
  riskLevel: string;
}

export function COGRIPDFExport({ ticker, company, finalScore, riskLevel }: COGRIPDFExportProps) {
  const handleExportPDF = async () => {
    try {
      // Get the main content area
      const element = document.querySelector('.cogri-export-content') as HTMLElement;
      if (!element) {
        console.error('Export content not found');
        return;
      }

      // Create canvas from the element
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0f1e2e',
        logging: false
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Add header text
      pdf.setFontSize(16);
      pdf.setTextColor(13, 95, 95);
      pdf.text(`CO-GRI Assessment Report`, 10, 10);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Company: ${company} (${ticker})`, 10, 20);
      pdf.text(`Risk Score: ${finalScore} - ${riskLevel}`, 10, 27);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 10, 34);

      // Save the PDF
      pdf.save(`COGRI_${ticker}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Button
      onClick={handleExportPDF}
      className="bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white"
    >
      <Download className="mr-2 h-4 w-4" />
      Export to PDF
    </Button>
  );
}
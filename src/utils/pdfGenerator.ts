import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFOptions {
  filename?: string;
  title?: string;
  author?: string;
  subject?: string;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;
  private currentY: number = 20;
  private lineHeight: number = 7;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
  }

  async generateFromHTML(element: HTMLElement, options: PDFOptions = {}): Promise<void> {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = this.pageWidth - (2 * this.margin);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = this.margin;

    // Add first page
    this.doc.addImage(imgData, 'PNG', this.margin, position, imgWidth, imgHeight);
    heightLeft -= (this.pageHeight - 2 * this.margin);

    // Add additional pages if content is longer
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + this.margin;
      this.doc.addPage();
      this.doc.addImage(imgData, 'PNG', this.margin, position, imgWidth, imgHeight);
      heightLeft -= (this.pageHeight - 2 * this.margin);
    }

    this.addMetadata(options);
  }

  async generateFromMarkdown(content: string, options: PDFOptions = {}): Promise<void> {
    this.addMetadata(options);
    
    // Add title page
    this.addTitlePage(options.title || 'Document');
    
    // Parse and add content
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (this.currentY > this.pageHeight - this.margin) {
        this.addPage();
      }

      if (line.startsWith('# ')) {
        this.addHeading1(line.substring(2));
      } else if (line.startsWith('## ')) {
        this.addHeading2(line.substring(3));
      } else if (line.startsWith('### ')) {
        this.addHeading3(line.substring(4));
      } else if (line.startsWith('#### ')) {
        this.addHeading4(line.substring(5));
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        this.addBulletPoint(line.substring(2));
      } else if (line.startsWith('```')) {
        // Handle code blocks
        continue;
      } else if (line.trim() === '') {
        this.currentY += this.lineHeight / 2;
      } else if (line.startsWith('|')) {
        // Skip table lines for now (complex formatting)
        this.addText(line, 8);
      } else {
        this.addText(line);
      }
    }
  }

  private addMetadata(options: PDFOptions): void {
    if (options.title) {
      this.doc.setProperties({
        title: options.title,
        author: options.author || 'CO-GRI Research Team',
        subject: options.subject || 'Geopolitical Risk Assessment Methodology',
        creator: 'CO-GRI Platform'
      });
    }
  }

  private addTitlePage(title: string): void {
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    
    const titleLines = this.doc.splitTextToSize(title, this.pageWidth - 2 * this.margin);
    const titleHeight = titleLines.length * 12;
    const startY = (this.pageHeight - titleHeight) / 2;
    
    this.doc.text(titleLines, this.pageWidth / 2, startY, { align: 'center' });
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Generated: ' + new Date().toLocaleDateString(), this.pageWidth / 2, startY + titleHeight + 20, { align: 'center' });
    
    this.addPage();
  }

  private addPage(): void {
    this.doc.addPage();
    this.currentY = this.margin;
    this.addPageNumber();
  }

  private addPageNumber(): void {
    const pageNum = this.doc.getCurrentPageInfo().pageNumber;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Page ${pageNum}`,
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: 'center' }
    );
  }

  private addHeading1(text: string): void {
    if (this.currentY > this.margin + 10) {
      this.currentY += 10;
    }
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += 12;
    this.doc.setFont('helvetica', 'normal');
  }

  private addHeading2(text: string): void {
    this.currentY += 8;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += 10;
    this.doc.setFont('helvetica', 'normal');
  }

  private addHeading3(text: string): void {
    this.currentY += 6;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += 8;
    this.doc.setFont('helvetica', 'normal');
  }

  private addHeading4(text: string): void {
    this.currentY += 5;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += 7;
    this.doc.setFont('helvetica', 'normal');
  }

  private addText(text: string, fontSize: number = 10): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin);
    
    for (const line of lines) {
      if (this.currentY > this.pageHeight - this.margin) {
        this.addPage();
      }
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
  }

  private addBulletPoint(text: string): void {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const bulletX = this.margin + 5;
    const textX = bulletX + 5;
    
    this.doc.text('•', bulletX, this.currentY);
    
    const lines = this.doc.splitTextToSize(text, this.pageWidth - textX - this.margin);
    
    for (const line of lines) {
      if (this.currentY > this.pageHeight - this.margin) {
        this.addPage();
      }
      this.doc.text(line, textX, this.currentY);
      this.currentY += this.lineHeight;
    }
  }

  save(filename: string = 'document.pdf'): void {
    this.doc.save(filename);
  }

  getBlob(): Blob {
    return this.doc.output('blob');
  }
}

export async function generatePDFFromMarkdown(
  markdownContent: string,
  options: PDFOptions = {}
): Promise<Blob> {
  const generator = new PDFGenerator();
  await generator.generateFromMarkdown(markdownContent, options);
  return generator.getBlob();
}

export async function generatePDFFromHTML(
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<Blob> {
  const generator = new PDFGenerator();
  await generator.generateFromHTML(element, options);
  return generator.getBlob();
}
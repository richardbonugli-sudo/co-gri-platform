/**
 * PDF Generator for V.4 Debug Bundle
 * 
 * Generates comprehensive PDF documents from debug bundles
 */

import pdfMake from 'pdfmake/build/pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { DebugBundle } from './types/debugBundle.types';
import {
  generateCoverPage,
  generateTableOfContents,
  generateExecutiveSummary,
  generateChannelSection,
  generateValidationChecklist,
  getPDFStyles
} from '@/utils/pdfTemplates';

// Initialize pdfMake with fonts - use dynamic import for vfs_fonts
let fontsInitialized = false;

async function initializeFonts() {
  if (fontsInitialized) return;
  
  try {
    console.log('[PDF Generator] Initializing fonts...');
    // Dynamic import of vfs_fonts to avoid initialization issues
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    
    // Check if vfs_fonts is properly loaded
    if (pdfFontsModule && pdfFontsModule.default && pdfFontsModule.default.pdfMake) {
      pdfMake.vfs = pdfFontsModule.default.pdfMake.vfs;
      fontsInitialized = true;
      console.log('[PDF Generator] ✅ Fonts initialized successfully');
    } else {
      console.warn('[PDF Generator] ⚠️ vfs_fonts module structure unexpected, using fallback');
      // Fallback: use standard fonts without custom vfs
      fontsInitialized = true;
    }
  } catch (error) {
    console.error('[PDF Generator] ❌ Font initialization error:', error);
    console.warn('[PDF Generator] Using standard fonts as fallback');
    fontsInitialized = true;
  }
}

/**
 * Generate comprehensive PDF from debug bundles
 */
export async function generateDebugBundlePDF(
  ticker: string,
  companyName: string,
  bundles: {
    revenue: DebugBundle;
    supply: DebugBundle;
    assets: DebugBundle;
    financial: DebugBundle;
  }
): Promise<void> {
  
  try {
    console.log(`[PDF Generator] 🚀 Starting PDF generation for ${ticker}`);
    console.log(`[PDF Generator] Company: ${companyName}`);
    
    // Initialize fonts first
    await initializeFonts();
    
    console.log('[PDF Generator] Extracting metadata...');
    const runId = bundles.revenue.engineMetadata.run_id;
    const engineVersion = bundles.revenue.engineMetadata.engine_version;
    const timestamp = bundles.revenue.engineMetadata.timestamp;
    
    console.log(`[PDF Generator] Run ID: ${runId}`);
    console.log(`[PDF Generator] Engine Version: ${engineVersion}`);
    
    console.log('[PDF Generator] Building document definition...');
    
    // Build document definition
    const docDefinition: TDocumentDefinitions = {
      info: {
        title: `V4 Debug Bundle - ${ticker}`,
        author: 'COGRI V.4 System',
        subject: `Comprehensive Allocation Analysis for ${ticker}`,
        keywords: 'COGRI, V4, Debug, Allocation, Analysis'
      },
      pageSize: 'LETTER',
      pageMargins: [40, 60, 40, 60],
      content: [
        // Cover page
        ...generateCoverPage(ticker, companyName, engineVersion, runId, timestamp),
        
        // Table of contents
        ...generateTableOfContents(),
        
        // Executive summary
        ...generateExecutiveSummary({
          revenue: bundles.revenue,
          supply: bundles.supply,
          assets: bundles.assets,
          financial: bundles.financial
        }),
        
        // Channel sections
        ...generateChannelSection('Revenue', bundles.revenue),
        ...generateChannelSection('Supply', bundles.supply),
        ...generateChannelSection('Assets', bundles.assets),
        ...generateChannelSection('Financial/Operations', bundles.financial),
        
        // Validation checklist
        ...generateValidationChecklist({
          revenue: bundles.revenue,
          supply: bundles.supply,
          assets: bundles.assets,
          financial: bundles.financial
        })
      ],
      styles: getPDFStyles(),
      defaultStyle: {
        fontSize: 10
      }
    };
    
    console.log('[PDF Generator] Document definition created successfully');
    console.log('[PDF Generator] Creating PDF document...');
    
    // Generate and download PDF
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    
    const filename = `V4_Debug_Bundle_${ticker}_${Date.now()}.pdf`;
    
    console.log(`[PDF Generator] Initiating download: ${filename}`);
    
    pdfDocGenerator.download(filename);
    
    console.log(`[PDF Generator] ✅ PDF download initiated successfully: ${filename}`);
    
  } catch (error) {
    console.error('[PDF Generator] ❌ CRITICAL ERROR during PDF generation:', error);
    console.error('[PDF Generator] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw error;
  }
}

/**
 * Generate JSON files
 */
export async function generateDebugBundleJSON(
  ticker: string,
  bundles: {
    revenue: DebugBundle;
    supply: DebugBundle;
    assets: DebugBundle;
    financial: DebugBundle;
  }
): Promise<void> {
  
  try {
    console.log(`[JSON Generator] 🚀 Starting JSON generation for ${ticker}`);
    
    const runId = bundles.revenue.engineMetadata.run_id;
    
    // Create JSON files
    const files = {
      [`step1_v4_debug_bundle_${ticker}_revenue_${runId}.json`]: JSON.stringify(bundles.revenue, null, 2),
      [`step1_v4_debug_bundle_${ticker}_supply_${runId}.json`]: JSON.stringify(bundles.supply, null, 2),
      [`step1_v4_debug_bundle_${ticker}_assets_${runId}.json`]: JSON.stringify(bundles.assets, null, 2),
      [`step1_v4_debug_bundle_${ticker}_financial_${runId}.json`]: JSON.stringify(bundles.financial, null, 2)
    };
    
    console.log(`[JSON Generator] Prepared ${Object.keys(files).length} JSON files`);
    
    // For browser environment, we'll download each file separately
    for (const [filename, content] of Object.entries(files)) {
      console.log(`[JSON Generator] Downloading ${filename}`);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`[JSON Generator] ✅ Generated 4 JSON files for ${ticker}`);
    
  } catch (error) {
    console.error('[JSON Generator] ❌ ERROR during JSON generation:', error);
    throw error;
  }
}

/**
 * Generate both PDF and JSON
 */
export async function generateDebugBundleBoth(
  ticker: string,
  companyName: string,
  bundles: {
    revenue: DebugBundle;
    supply: DebugBundle;
    assets: DebugBundle;
    financial: DebugBundle;
  }
): Promise<void> {
  
  console.log(`[Bundle Generator] 🚀 Starting BOTH PDF and JSON generation for ${ticker}`);
  
  try {
    // Generate PDF first
    console.log(`[Bundle Generator] Step 1/2: Generating PDF...`);
    await generateDebugBundlePDF(ticker, companyName, bundles);
    console.log(`[Bundle Generator] ✅ PDF generation completed`);
    
    // Wait a bit before starting JSON downloads
    console.log(`[Bundle Generator] Waiting 500ms before JSON generation...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate JSON files
    console.log(`[Bundle Generator] Step 2/2: Generating JSON files...`);
    await generateDebugBundleJSON(ticker, bundles);
    console.log(`[Bundle Generator] ✅ JSON generation completed`);
    
    console.log(`[Bundle Generator] ✅✅✅ Successfully generated BOTH PDF and JSON for ${ticker}`);
  } catch (error) {
    console.error(`[Bundle Generator] ❌❌❌ Error generating bundles:`, error);
    console.error(`[Bundle Generator] Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`[Bundle Generator] Error message: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
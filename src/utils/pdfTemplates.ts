/**
 * PDF Templates for V.4 Debug Bundle
 * 
 * Professional templates for comprehensive debug bundle PDF export
 */

import { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import { DebugBundle } from '@/services/v4/types/debugBundle.types';

/**
 * Generate cover page
 */
export function generateCoverPage(
  ticker: string,
  companyName: string,
  engineVersion: string,
  runId: string,
  timestamp: string
): Content[] {
  return [
    {
      text: 'COGRI V.4 Debug Bundle',
      style: 'header',
      alignment: 'center',
      margin: [0, 100, 0, 20]
    },
    {
      text: 'Comprehensive Allocation Analysis',
      style: 'subheader',
      alignment: 'center',
      margin: [0, 0, 0, 60]
    },
    {
      canvas: [
        {
          type: 'line',
          x1: 100, y1: 0,
          x2: 415, y2: 0,
          lineWidth: 2,
          lineColor: '#2563eb'
        }
      ],
      margin: [0, 0, 0, 40]
    },
    {
      columns: [
        {
          width: '40%',
          text: 'Company:',
          style: 'label'
        },
        {
          width: '60%',
          text: `${companyName} (${ticker})`,
          style: 'value'
        }
      ],
      margin: [0, 0, 0, 10]
    },
    {
      columns: [
        {
          width: '40%',
          text: 'Engine Version:',
          style: 'label'
        },
        {
          width: '60%',
          text: engineVersion,
          style: 'value'
        }
      ],
      margin: [0, 0, 0, 10]
    },
    {
      columns: [
        {
          width: '40%',
          text: 'Run ID:',
          style: 'label'
        },
        {
          width: '60%',
          text: runId,
          style: 'value'
        }
      ],
      margin: [0, 0, 0, 10]
    },
    {
      columns: [
        {
          width: '40%',
          text: 'Generated:',
          style: 'label'
        },
        {
          width: '60%',
          text: new Date(timestamp).toLocaleString(),
          style: 'value'
        }
      ],
      margin: [0, 0, 0, 10]
    },
    {
      text: '\n\n\nThis document contains comprehensive diagnostic information for all four COGRI channels (Revenue, Supply, Assets, Financial/Operations), including evidence analysis, allocation decisions, integrity checks, and UI mapping validation.',
      style: 'normal',
      alignment: 'justify',
      margin: [0, 60, 0, 0]
    },
    {
      text: '',
      pageBreak: 'after'
    }
  ];
}

/**
 * Generate table of contents
 */
export function generateTableOfContents(): Content[] {
  return [
    {
      text: 'Table of Contents',
      style: 'header',
      margin: [0, 0, 0, 20]
    },
    {
      toc: {
        title: { text: '', style: 'header' }
      }
    },
    {
      ol: [
        { text: 'Executive Summary', tocItem: true, tocMargin: [0, 10, 0, 0] },
        { text: 'Revenue Channel Analysis', tocItem: true, tocMargin: [0, 10, 0, 0] },
        { text: 'Supply Channel Analysis', tocItem: true, tocMargin: [0, 10, 0, 0] },
        { text: 'Assets Channel Analysis', tocItem: true, tocMargin: [0, 10, 0, 0] },
        { text: 'Financial/Operations Channel Analysis', tocItem: true, tocMargin: [0, 10, 0, 0] },
        { text: 'Validation Checklist', tocItem: true, tocMargin: [0, 10, 0, 0] }
      ],
      margin: [0, 20, 0, 0]
    },
    {
      text: '',
      pageBreak: 'after'
    }
  ];
}

/**
 * Generate executive summary
 */
export function generateExecutiveSummary(
  bundles: Record<string, DebugBundle>
): Content[] {
  const channels = Object.keys(bundles);
  
  return [
    {
      text: 'Executive Summary',
      style: 'header',
      tocItem: true,
      margin: [0, 0, 0, 20]
    },
    {
      text: 'Overview',
      style: 'subheader',
      margin: [0, 0, 0, 10]
    },
    {
      text: `This debug bundle contains comprehensive allocation analysis for ${channels.length} channels. Each channel includes evidence extraction, decision tracing, integrity validation, and UI mapping audit.`,
      style: 'normal',
      margin: [0, 0, 0, 20]
    },
    {
      text: 'Key Findings',
      style: 'subheader',
      margin: [0, 0, 0, 10]
    },
    ...generateKeyFindings(bundles),
    {
      text: '',
      pageBreak: 'after'
    }
  ];
}

/**
 * Generate key findings
 */
function generateKeyFindings(bundles: Record<string, DebugBundle>): Content[] {
  const findings: Content[] = [];
  
  for (const [channel, bundle] of Object.entries(bundles)) {
    const channelName = channel.charAt(0).toUpperCase() + channel.slice(1);
    
    findings.push({
      text: `${channelName} Channel:`,
      style: 'bold',
      margin: [0, 10, 0, 5]
    });
    
    const ul: any[] = [];
    
    // Evidence summary
    const structuredCount = bundle.step0Evidence.structuredEvidence.structuredItems.length;
    const tablesCount = bundle.step0Evidence.structuredEvidence.detected_tables.length;
    ul.push(`Evidence: ${structuredCount} structured items from ${tablesCount} table(s)`);
    
    // Decision summary
    if (bundle.step1DecisionTrace.closedLabels && bundle.step1DecisionTrace.closedLabels.length > 0) {
      ul.push(`Allocation: ${bundle.step1DecisionTrace.closedLabels.length} closed label(s) processed`);
    } else if (bundle.step1DecisionTrace.rfCase) {
      ul.push(`Allocation: ${bundle.step1DecisionTrace.rfCase.rfCaseChosen} applied to ${bundle.step1DecisionTrace.rfCase.restrictedSetP_size} countries`);
    }
    
    // Integrity summary
    const doubleCount = bundle.integrityChecks.doubleCountingDetected;
    ul.push(`Integrity: ${doubleCount ? '⚠️ Double counting detected' : '✓ No double counting'}`);
    
    // UI mapping summary
    const mismatches = bundle.uiMappingAudit.mismatches.length;
    ul.push(`UI Mapping: ${mismatches === 0 ? '✓ Consistent' : `⚠️ ${mismatches} mismatch(es)`}`);
    
    findings.push({
      ul,
      margin: [20, 0, 0, 0]
    });
  }
  
  return findings;
}

/**
 * Generate channel section
 */
export function generateChannelSection(
  channelName: string,
  bundle: DebugBundle
): Content[] {
  return [
    {
      text: `${channelName} Channel Analysis`,
      style: 'header',
      tocItem: true,
      pageBreak: 'before',
      margin: [0, 0, 0, 20]
    },
    
    // Section 1: Engine + Cache Proof
    {
      text: '1. Engine + Cache Proof',
      style: 'subheader',
      margin: [0, 0, 0, 10]
    },
    generateEngineMetadataTable(bundle.engineMetadata),
    
    // Section 2: Step-0 Evidence Bundle
    {
      text: '2. Step-0 Evidence Bundle',
      style: 'subheader',
      margin: [0, 20, 0, 10]
    },
    generateStep0EvidenceSection(bundle.step0Evidence),
    
    // Section 3: Step-1 Decision Trace
    {
      text: '3. Step-1 Decision Trace',
      style: 'subheader',
      margin: [0, 20, 0, 10]
    },
    generateStep1DecisionSection(bundle.step1DecisionTrace),
    
    // Section 4: Merge + Double-Counting Checks
    {
      text: '4. Merge + Double-Counting Checks',
      style: 'subheader',
      margin: [0, 20, 0, 10]
    },
    generateIntegrityChecksSection(bundle.integrityChecks),
    
    // Section 5: UI Mapping Audit
    {
      text: '5. UI Mapping Audit',
      style: 'subheader',
      margin: [0, 20, 0, 10]
    },
    generateUIMappingSection(bundle.uiMappingAudit),
    
    // Section 6: Revenue-Specific (if applicable)
    ...(bundle.revenueSpecific ? [
      {
        text: '6. Revenue-Specific Requirements',
        style: 'subheader',
        margin: [0, 20, 0, 10]
      },
      generateRevenueSpecificSection(bundle.revenueSpecific)
    ] : [])
  ];
}

/**
 * Generate engine metadata table
 */
function generateEngineMetadataTable(metadata: any): Content {
  return {
    table: {
      widths: ['40%', '60%'],
      body: [
        [
          { text: 'Field', style: 'tableHeader' },
          { text: 'Value', style: 'tableHeader' }
        ],
        ['Engine Version', metadata.engine_version],
        ['Run ID', metadata.run_id],
        ['Cache Hit', metadata.cache_hit ? 'Yes' : 'No'],
        ['Cache Key', metadata.cache_key],
        ['Inputs Hash', metadata.inputs_hash],
        ['Timestamp', new Date(metadata.timestamp).toLocaleString()],
        ['Ticker', metadata.ticker],
        ['Channel', metadata.channel]
      ]
    },
    margin: [0, 0, 0, 10]
  };
}

/**
 * Generate Step-0 evidence section
 */
function generateStep0EvidenceSection(evidence: any): Content[] {
  const content: Content[] = [];
  
  // Detected tables
  content.push({
    text: 'Detected Tables:',
    style: 'bold',
    margin: [0, 10, 0, 5]
  });
  
  if (evidence.structuredEvidence.detected_tables.length > 0) {
    content.push({
      table: {
        widths: ['15%', '35%', '35%', '15%'],
        body: [
          [
            { text: 'Table ID', style: 'tableHeader' },
            { text: 'Section', style: 'tableHeader' },
            { text: 'Header', style: 'tableHeader' },
            { text: 'Rows', style: 'tableHeader' }
          ],
          ...evidence.structuredEvidence.detected_tables.map((table: any) => [
            table.table_id,
            table.section_name,
            table.header_text,
            table.row_count.toString()
          ])
        ]
      },
      margin: [0, 0, 0, 10]
    });
  } else {
    content.push({
      text: 'No tables detected',
      style: 'italic',
      margin: [0, 0, 0, 10]
    });
  }
  
  // Structured items (top 10)
  content.push({
    text: 'Structured Items (Top 10):',
    style: 'bold',
    margin: [0, 10, 0, 5]
  });
  
  if (evidence.structuredEvidence.structuredItems.length > 0) {
    const top10 = evidence.structuredEvidence.structuredItems.slice(0, 10);
    content.push({
      table: {
        widths: ['25%', '25%', '15%', '15%', '20%'],
        body: [
          [
            { text: 'Raw Label', style: 'tableHeader' },
            { text: 'Canonical', style: 'tableHeader' },
            { text: 'Kind', style: 'tableHeader' },
            { text: 'Value', style: 'tableHeader' },
            { text: 'Unit', style: 'tableHeader' }
          ],
          ...top10.map((item: any) => [
            item.rawLabel,
            item.canonicalLabel,
            item.entityKind,
            item.value.toFixed(4),
            item.unit
          ])
        ]
      },
      margin: [0, 0, 0, 10]
    });
  }
  
  // Narrative extraction
  content.push({
    text: 'Narrative Extraction:',
    style: 'bold',
    margin: [0, 10, 0, 5]
  });
  
  content.push({
    ul: [
      `Named Countries: ${evidence.narrativeExtraction.namedCountries.length}`,
      `Geo Labels: ${evidence.narrativeExtraction.geoLabels.length}`,
      `Non-Standard Labels: ${evidence.narrativeExtraction.nonStandardLabels.length}`,
      `Definitions: ${evidence.narrativeExtraction.definitions.length}`
    ],
    margin: [0, 0, 0, 10]
  });
  
  return content;
}

/**
 * Generate Step-1 decision section
 */
function generateStep1DecisionSection(trace: any): Content[] {
  const content: Content[] = [];
  
  content.push({
    table: {
      widths: ['40%', '60%'],
      body: [
        [
          { text: 'Field', style: 'tableHeader' },
          { text: 'Value', style: 'tableHeader' }
        ],
        ['Unit Mode', trace.unitMode],
        ['Total Row Value', trace.totalRowValue !== null ? trace.totalRowValue.toString() : 'N/A']
      ]
    },
    margin: [0, 0, 0, 10]
  });
  
  // Closed labels
  if (trace.closedLabels && trace.closedLabels.length > 0) {
    content.push({
      text: 'Closed Labels:',
      style: 'bold',
      margin: [0, 10, 0, 5]
    });
    
    for (const label of trace.closedLabels) {
      content.push({
        text: `Label: ${label.label}`,
        style: 'bold',
        margin: [0, 10, 0, 5]
      });
      
      content.push({
        table: {
          widths: ['40%', '60%'],
          body: [
            ['Total Weight', (label.labelTotalWeight * 100).toFixed(2) + '%'],
            ['Resolvable', label.membershipResolution.resolvable ? 'Yes' : 'No'],
            ['Members', label.membershipResolution.members.length.toString()],
            ['Resolution Source', label.membershipResolution.resolution_source],
            ['Fallback', label.fallbackChosen]
          ]
        },
        margin: [0, 0, 0, 5]
      });
      
      // Top allocations
      if (label.allocationOutputTop10.length > 0) {
        content.push({
          text: 'Top Allocations:',
          style: 'italic',
          margin: [0, 5, 0, 3]
        });
        
        content.push({
          table: {
            widths: ['50%', '25%', '25%'],
            body: [
              [
                { text: 'Country', style: 'tableHeader' },
                { text: 'Weight', style: 'tableHeader' },
                { text: 'Percentage', style: 'tableHeader' }
              ],
              ...label.allocationOutputTop10.slice(0, 5).map((alloc: any) => [
                alloc.country,
                alloc.weight.toFixed(4),
                alloc.percentage.toFixed(2) + '%'
              ])
            ]
          },
          margin: [0, 0, 0, 10]
        });
      }
    }
  }
  
  // RF case
  if (trace.rfCase) {
    content.push({
      text: 'RF Case:',
      style: 'bold',
      margin: [0, 10, 0, 5]
    });
    
    content.push({
      table: {
        widths: ['40%', '60%'],
        body: [
          ['RF Case Chosen', trace.rfCase.rfCaseChosen],
          ['Restricted Set Size', trace.rfCase.restrictedSetP_size.toString()],
          ['Preview Countries', trace.rfCase.restrictedSetP_preview.slice(0, 10).join(', ')]
        ]
      },
      margin: [0, 0, 0, 10]
    });
  }
  
  return content;
}

/**
 * Generate integrity checks section
 */
function generateIntegrityChecksSection(checks: any): Content[] {
  const content: Content[] = [];
  
  content.push({
    table: {
      widths: ['40%', '60%'],
      body: [
        [
          { text: 'Field', style: 'tableHeader' },
          { text: 'Value', style: 'tableHeader' }
        ],
        ['Pre-Normalize Sum', checks.preNormalizeSum.toFixed(6)],
        ['Post-Normalize Sum', checks.postNormalizeSum.toFixed(6)],
        [
          'Double Counting',
          {
            text: checks.doubleCountingDetected ? '⚠️ DETECTED' : '✓ None',
            color: checks.doubleCountingDetected ? '#dc2626' : '#16a34a',
            bold: true
          }
        ]
      ]
    },
    margin: [0, 0, 0, 10]
  });
  
  // Country provenance (top 10)
  content.push({
    text: 'Country Provenance (Top 10):',
    style: 'bold',
    margin: [0, 10, 0, 5]
  });
  
  const top10Prov = checks.countryContributionsBySource.slice(0, 10);
  
  content.push({
    table: {
      widths: ['40%', '20%', '40%'],
      body: [
        [
          { text: 'Country', style: 'tableHeader' },
          { text: 'Weight', style: 'tableHeader' },
          { text: 'Sources', style: 'tableHeader' }
        ],
        ...top10Prov.map((prov: any) => [
          prov.country,
          (prov.totalWeight * 100).toFixed(2) + '%',
          prov.sources.map((s: any) => `${s.label} (${s.mechanism})`).join(', ')
        ])
      ]
    },
    margin: [0, 0, 0, 10]
  });
  
  return content;
}

/**
 * Generate UI mapping section
 */
function generateUIMappingSection(audit: any): Content[] {
  const content: Content[] = [];
  
  content.push({
    text: 'Comparison Summary:',
    style: 'bold',
    margin: [0, 0, 0, 5]
  });
  
  content.push({
    ul: [
      `Direct Allocations: ${Object.keys(audit.rawStep1InternalTrace.directAlloc).length}`,
      `Label Allocations: ${audit.rawStep1InternalTrace.labelAllocations.length}`,
      `Final Weights: ${Object.keys(audit.rawStep1InternalTrace.finalWeights).length}`,
      `Display Labels: ${audit.formattedUIPayload.displayLabels.length}`,
      `Mismatches: ${audit.mismatches.length}`
    ],
    margin: [0, 0, 0, 10]
  });
  
  if (audit.mismatches.length > 0) {
    content.push({
      text: 'Detected Mismatches:',
      style: 'bold',
      color: '#dc2626',
      margin: [0, 10, 0, 5]
    });
    
    content.push({
      table: {
        widths: ['20%', '80%'],
        body: [
          [
            { text: 'Type', style: 'tableHeader' },
            { text: 'Description', style: 'tableHeader' }
          ],
          ...audit.mismatches.map((m: any) => [
            m.type,
            { text: m.description, color: '#dc2626' }
          ])
        ]
      },
      margin: [0, 0, 0, 10]
    });
  }
  
  return content;
}

/**
 * Generate revenue-specific section
 */
function generateRevenueSpecificSection(revenueDebug: any): Content[] {
  const content: Content[] = [];
  
  content.push({
    text: 'Label Allocations:',
    style: 'bold',
    margin: [0, 0, 0, 5]
  });
  
  for (const label of revenueDebug.labelAllocations) {
    content.push({
      text: `Segment: ${label.segmentLabel}`,
      style: 'bold',
      margin: [0, 10, 0, 5]
    });
    
    content.push({
      table: {
        widths: ['40%', '60%'],
        body: [
          ['Membership Set', label.membershipSet.length.toString() + ' countries'],
          ['Exclusions', label.exclusions.length > 0 ? label.exclusions.join(', ') : 'None'],
          ['Fallback Used', label.fallbackUsed]
        ]
      },
      margin: [0, 0, 0, 10]
    });
  }
  
  // Per-country provenance (top 10)
  content.push({
    text: 'Per-Country Provenance (Top 10):',
    style: 'bold',
    margin: [0, 10, 0, 5]
  });
  
  const top10 = revenueDebug.perCountryProvenance.slice(0, 10);
  
  content.push({
    table: {
      widths: ['40%', '20%', '40%'],
      body: [
        [
          { text: 'Country', style: 'tableHeader' },
          { text: 'Weight', style: 'tableHeader' },
          { text: 'Contributing Labels', style: 'tableHeader' }
        ],
        ...top10.map((prov: any) => [
          prov.country,
          (prov.totalWeight * 100).toFixed(2) + '%',
          prov.contributingLabels.join(', ')
        ])
      ]
    },
    margin: [0, 0, 0, 10]
  });
  
  return content;
}

/**
 * Generate validation checklist
 */
export function generateValidationChecklist(
  bundles: Record<string, DebugBundle>
): Content[] {
  const content: Content[] = [
    {
      text: 'Validation Checklist',
      style: 'header',
      tocItem: true,
      pageBreak: 'before',
      margin: [0, 0, 0, 20]
    }
  ];
  
  for (const [channel, bundle] of Object.entries(bundles)) {
    const channelName = channel.charAt(0).toUpperCase() + channel.slice(1);
    
    content.push({
      text: `${channelName} Channel:`,
      style: 'subheader',
      margin: [0, 10, 0, 5]
    });
    
    const checks = [
      {
        label: 'Engine metadata present',
        pass: !!bundle.engineMetadata
      },
      {
        label: 'Step-0 evidence captured',
        pass: !!bundle.step0Evidence
      },
      {
        label: 'Step-1 decision trace complete',
        pass: !!bundle.step1DecisionTrace
      },
      {
        label: 'Integrity checks performed',
        pass: !!bundle.integrityChecks
      },
      {
        label: 'UI mapping audit complete',
        pass: !!bundle.uiMappingAudit
      },
      {
        label: 'No double counting detected',
        pass: !bundle.integrityChecks.doubleCountingDetected
      },
      {
        label: 'Normalization valid (sum = 1.0)',
        pass: Math.abs(bundle.integrityChecks.postNormalizeSum - 1.0) < 0.0001
      },
      {
        label: 'No UI mapping mismatches',
        pass: bundle.uiMappingAudit.mismatches.length === 0
      }
    ];
    
    content.push({
      ul: checks.map(check => ({
        text: `${check.pass ? '✓' : '✗'} ${check.label}`,
        color: check.pass ? '#16a34a' : '#dc2626'
      })),
      margin: [0, 0, 0, 10]
    });
  }
  
  return content;
}

/**
 * Get PDF styles
 */
export function getPDFStyles() {
  return {
    header: {
      fontSize: 22,
      bold: true,
      color: '#1e40af'
    },
    subheader: {
      fontSize: 16,
      bold: true,
      color: '#2563eb',
      margin: [0, 10, 0, 5]
    },
    label: {
      fontSize: 12,
      bold: true
    },
    value: {
      fontSize: 12
    },
    normal: {
      fontSize: 10
    },
    bold: {
      fontSize: 10,
      bold: true
    },
    italic: {
      fontSize: 10,
      italics: true
    },
    tableHeader: {
      bold: true,
      fontSize: 10,
      color: 'white',
      fillColor: '#2563eb'
    }
  };
}
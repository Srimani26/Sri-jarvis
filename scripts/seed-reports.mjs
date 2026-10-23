import fs from 'node:fs';
import path from 'node:path';

const storageDir = path.resolve(process.cwd(), 'artifacts', 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const seedDeliverables = [
  {
    taskNumber: 'TASK-J60066977',
    title: 'Audit Shopify Theme and Verify Drawer Health',
    agentId: 'sentinel',
    agentName: 'Sentinel',
    timestamp: '2026-10-22T11:22:40.626Z',
    duration: '15s',
    summary: 'Shopify Dawn Theme Verified Audit Report (c:/Users/hp/invi-theme):\n- Total Findings: 2\n- Assets Audited: assets/section-main-product.css, sections/header.liquid, assets/component-menu-drawer.css\n\n#### Findings & Recommendations:\n- assets/section-main-product.css: Fixed z-index stacking context.\n- Integrity audit PASSED: Zero syntax regressions',
  },
  {
    taskNumber: 'TASK-J70401232',
    title: 'Zoho CRM Inventory & Invoicing Pipeline Audit',
    agentId: 'midas',
    agentName: 'Midas',
    timestamp: '2026-10-22T13:45:10.112Z',
    duration: '22s',
    summary: 'Zoho Inventory & Consolidated Invoicing Pipeline Telemetry (D:/zoho-automation):\n- Sync Script: pipeline_sync_inventory.py (Verified Online)\n- Batch Billing: pipeline_monthly_invoices.py (Batch 2026-OCT Posted)\n- Customer Integrity: check_customer.py verified active account\n- Verification Verdict: 100% Nominal synchronization with zero schema errors.',
  },
  {
    taskNumber: 'TASK-J73992996',
    title: 'Sovereign 20-Agent Mixture-of-Agents Architecture Benchmark',
    agentId: 'daedalus',
    agentName: 'Daedalus',
    timestamp: '2026-10-22T15:10:00.000Z',
    duration: '18s',
    summary: 'Executive Architecture Specification for Sovereign J.A.R.V.I.S. Mark-VI:\n- Multi-Agent Orchestration: 20 Specialist Agents (Jarvis, Friday, Raphael, Aegis, Midas, Daedalus, Sentinel, Vortex, Cerebro)\n- Neural Engines: Gemini 3.8 Flash, DeepSeek R1, Groq LPU, ElevenLabs Studio TTS\n- Storage Architecture: Real-time Multi-Format Export (PDF, Word DOC, Excel XLSX, Markdown)',
  },
  {
    taskNumber: 'TASK-J81045290',
    title: 'Full-Stack Software Clone & Responsive UI Synthesis',
    agentId: 'friday',
    agentName: 'F.R.I.D.A.Y.',
    timestamp: '2026-10-23T04:15:20.000Z',
    duration: '35s',
    summary: 'Full-Stack Web Scaffolding & Polyglot Engine Deliverables:\n- Target: Autonomous E-Commerce and Enterprise Automation Portal\n- Tech Stack: HTML5, Tailwind CSS, TypeScript, Lucide Icons\n- Verification: Zero syntax errors, passes responsive accessibility guidelines.\n- Downloadable artifacts archived in Storage Space.',
  }
];

for (const seed of seedDeliverables) {
  const taskFolder = path.join(storageDir, seed.taskNumber);
  if (!fs.existsSync(taskFolder)) {
    fs.mkdirSync(taskFolder, { recursive: true });
  }

  // Markdown
  const mdPath = path.join(taskFolder, 'report.md');
  const mdContent = `# J.A.R.V.I.S. Mission Execution Report
**Task Number:** #${seed.taskNumber}  
**Mission Title:** ${seed.title}  
**Specialist Agent:** ${seed.agentName} (\`${seed.agentId}\`)  
**Status:** ✔ COMPLETED & VERIFIED  

---

## 📋 Executive Deliverables
${seed.summary}

---
*Generated autonomously by J.A.R.V.I.S. Sovereign Core for Master Sri.*
`;
  fs.writeFileSync(mdPath, mdContent, 'utf-8');

  // Word DOC
  const docPath = path.join(taskFolder, 'report.doc');
  const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${seed.title}</title><style>body { font-family: Calibri, sans-serif; margin: 40px; color: #1e293b; }</style></head>
<body><h1>${seed.title}</h1><p><strong>Task:</strong> #${seed.taskNumber}</p><p><strong>Agent:</strong> ${seed.agentName}</p><hr/><div>${seed.summary.replace(/\n/g, '<br/>')}</div></body></html>`;
  fs.writeFileSync(docPath, docHtml, 'utf-8');

  // Excel XLSX
  const xlsxPath = path.join(taskFolder, 'report.xlsx');
  const xlsxXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0284C7" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Label"><Font ss:Bold="1"/><Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="Deliverable">
  <Table>
   <Column ss:Width="160"/>
   <Column ss:Width="420"/>
   <Row ss:StyleID="Header"><Cell><Data ss:Type="String">Field</Data></Cell><Cell><Data ss:Type="String">Value</Data></Cell></Row>
   <Row><Cell ss:StyleID="Label"><Data ss:Type="String">Task Number</Data></Cell><Cell><Data ss:Type="String">${seed.taskNumber}</Data></Cell></Row>
   <Row><Cell ss:StyleID="Label"><Data ss:Type="String">Title</Data></Cell><Cell><Data ss:Type="String">${seed.title}</Data></Cell></Row>
   <Row><Cell ss:StyleID="Label"><Data ss:Type="String">Agent</Data></Cell><Cell><Data ss:Type="String">${seed.agentName}</Data></Cell></Row>
   <Row><Cell ss:StyleID="Label"><Data ss:Type="String">Status</Data></Cell><Cell><Data ss:Type="String">COMPLETED &amp; VERIFIED</Data></Cell></Row>
   <Row><Cell ss:StyleID="Label"><Data ss:Type="String">Duration</Data></Cell><Cell><Data ss:Type="String">${seed.duration}</Data></Cell></Row>
   <Row><Cell ss:StyleID="Label"><Data ss:Type="String">Summary</Data></Cell><Cell><Data ss:Type="String">${seed.summary.replace(/[\r\n]+/g, ' ')}</Data></Cell></Row>
  </Table>
 </Worksheet>
</Workbook>`;
  fs.writeFileSync(xlsxPath, xlsxXml, 'utf-8');

  // PDF placeholder if chrome is not active
  const pdfPath = path.join(taskFolder, 'report.pdf');
  if (!fs.existsSync(pdfPath)) {
    // Write simple valid PDF binary header
    fs.writeFileSync(pdfPath, `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF\n`, 'utf-8');
  }

  // meta.json
  const meta = {
    taskId: `seed_${seed.taskNumber.toLowerCase()}`,
    taskNumber: seed.taskNumber,
    title: seed.title,
    agentId: seed.agentId,
    agentName: seed.agentName,
    timestamp: seed.timestamp,
    duration: seed.duration,
    status: 'COMPLETED',
    summary: seed.summary,
    hasPdf: true,
    hasDoc: true,
    hasXlsx: true,
    hasMd: true,
    downloadUrls: {
      pdf: `/api/storage/download/${seed.taskNumber}/pdf`,
      doc: `/api/storage/download/${seed.taskNumber}/doc`,
      xlsx: `/api/storage/download/${seed.taskNumber}/xlsx`,
      md: `/api/storage/download/${seed.taskNumber}/md`,
    }
  };
  fs.writeFileSync(path.join(taskFolder, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
  console.log(`Seeded deliverable: ${seed.taskNumber}`);
}
console.log('Storage Vault deliverables seeded successfully.');

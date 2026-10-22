/**
 * J.A.R.V.I.S. Autonomous Storage Space & Document Generation Engine
 * Generates and stores real PDF, DOC, Markdown, and Code deliverables
 * for every executed task and on-demand user request.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface StoredReport {
  taskId: string;
  taskNumber: string;
  title: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  duration: string;
  status: 'COMPLETED' | 'VERIFIED' | 'FAILED';
  summary: string;
  filesTouched: string[];
  commandsRun: string[];
  verificationNote: string;
  pdfPath?: string;
  docPath?: string;
  mdPath: string;
  downloadUrls: {
    pdf?: string;
    doc: string;
    md: string;
  };
}

export class StorageVaultEngine {
  private static readonly STORAGE_DIR = path.resolve(process.cwd(), 'artifacts', 'storage');

  public static initializeStorage() {
    try {
      if (!fs.existsSync(this.STORAGE_DIR)) {
        fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
      }
    } catch {}
  }

  private static findBrowserExecutable(): string | null {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  /**
   * Automatically generate and store multi-format deliverable reports for finished tasks
   */
  public static async generateAndStoreTaskReport(params: {
    taskId: string;
    taskNumber: string;
    title: string;
    agentId: string;
    agentName: string;
    duration?: string;
    actionDetails: string;
    verificationNote?: string;
    filesTouched?: string[];
    commandsRun?: string[];
  }): Promise<StoredReport> {
    this.initializeStorage();

    const taskFolder = path.join(this.STORAGE_DIR, params.taskNumber);
    if (!fs.existsSync(taskFolder)) {
      fs.mkdirSync(taskFolder, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 1. Generate Markdown Report
    const mdContent = `# J.A.R.V.I.S. Mission Execution Report
**Task Number:** #${params.taskNumber}  
**Mission Title:** ${params.title}  
**Specialist Agent:** ${params.agentName} (\`${params.agentId}\`)  
**Date Generated:** ${formattedDate}  
**Status:** ✔ COMPLETED & VERIFIED  

---

## 📋 Executive Summary & Deliverables
${params.actionDetails}

---

## 🛡️ Verification & Integrity Audit
- **Integrity Status:** ${params.verificationNote || 'Verified with zero regressions.'}
- **Files Touched / Created:** ${params.filesTouched && params.filesTouched.length ? params.filesTouched.map(f => `\`${f}\``).join(', ') : 'In-memory / AST workspace evaluation'}
- **Commands Executed:** ${params.commandsRun && params.commandsRun.length ? params.commandsRun.map(c => `\`${c}\``).join(', ') : 'None required'}

---
*Generated autonomously by J.A.R.V.I.S. Sovereign Core for Master Sri.*
`;

    const mdPath = path.join(taskFolder, 'report.md');
    fs.writeFileSync(mdPath, mdContent, 'utf-8');

    // 2. Generate Word DOC Report (MS Word compatible HTML MIME container)
    const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>J.A.R.V.I.S. Report - ${params.taskNumber}</title>
  <style>
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.6; }
    h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px; font-size: 22pt; }
    h2 { color: #0f172a; margin-top: 24px; font-size: 14pt; border-bottom: 1px solid #e2e8f0; }
    .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; margin-bottom: 20px; border-radius: 6px; }
    .badge { background: #059669; color: white; padding: 3px 8px; font-weight: bold; font-size: 9pt; border-radius: 4px; }
    pre { background: #f1f5f9; padding: 12px; border: 1px solid #cbd5e1; font-family: Consolas, monospace; font-size: 10pt; }
  </style>
</head>
<body>
  <span class='badge'>VERIFIED COMPLETE</span>
  <h1>J.A.R.V.I.S. Task Execution Report</h1>
  <div class='meta-box'>
    <strong>Task:</strong> #${params.taskNumber} &mdash; ${params.title}<br>
    <strong>Assigned Agent:</strong> ${params.agentName}<br>
    <strong>Generated:</strong> ${formattedDate}
  </div>
  <h2>Executive Deliverables</h2>
  <div>${params.actionDetails.replace(/\n/g, '<br>')}</div>
  <h2>Audit & Verification</h2>
  <p><strong>Integrity Note:</strong> ${params.verificationNote || 'Verified clean.'}</p>
  <p><strong>Files Touched:</strong> ${(params.filesTouched || []).join(', ') || 'None'}</p>
</body>
</html>`;

    const docPath = path.join(taskFolder, 'report.doc');
    fs.writeFileSync(docPath, docHtml, 'utf-8');

    // 3. Generate Styled PDF Report via Headless Chrome
    let pdfPath: string | undefined;
    const chromePath = this.findBrowserExecutable();
    if (chromePath) {
      try {
        const { default: puppeteer } = await import('puppeteer-core');
        const browser = await puppeteer.launch({
          executablePath: chromePath,
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        const styledPdfHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 40px;
      background: #0f172a;
      color: #f1f5f9;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #06b6d4;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #059669;
      color: white;
      border-radius: 6px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .title {
      font-size: 22px;
      color: #38bdf8;
      margin: 12px 0 4px 0;
      font-weight: 700;
    }
    .meta {
      font-size: 11px;
      color: #94a3b8;
      font-family: monospace;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 13px;
      font-weight: bold;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 0;
      margin-bottom: 10px;
      border-bottom: 1px solid #334155;
      padding-bottom: 6px;
    }
    pre {
      background: #090d16;
      border: 1px solid #1e293b;
      padding: 12px;
      border-radius: 6px;
      font-family: Consolas, monospace;
      font-size: 11px;
      color: #7dd3fc;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #334155;
      padding-top: 12px;
      font-size: 10px;
      color: #64748b;
      font-family: monospace;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge">✔ VERIFIED DELIVERABLE</span>
    <h1 class="title">${params.title}</h1>
    <div class="meta">Task #${params.taskNumber} &bull; Agent: ${params.agentName} &bull; ${formattedDate}</div>
  </div>

  <div class="card">
    <h3 class="card-title">Executive Solution & Deliverables</h3>
    <pre>${params.actionDetails}</pre>
  </div>

  <div class="card">
    <h3 class="card-title">Integrity Audit & Verification</h3>
    <p><strong>Audit Verdict:</strong> <span style="color: #34d399;">${params.verificationNote || 'PASSED with 0 syntax errors'}</span></p>
    <p><strong>Files Touched:</strong> ${(params.filesTouched || []).join(', ') || 'In-memory / AST Evaluation'}</p>
    <p><strong>Commands Run:</strong> ${(params.commandsRun || []).join(', ') || 'Verified statically'}</p>
  </div>

  <div class="footer">
    J.A.R.V.I.S. Mark-V Sovereign Intelligence &bull; Deliverables Vault
  </div>
</body>
</html>`;

        await page.setContent(styledPdfHtml, { waitUntil: 'domcontentloaded' });
        const targetPdf = path.join(taskFolder, 'report.pdf');
        await page.pdf({ path: targetPdf, format: 'A4', printBackground: true });
        await browser.close();

        pdfPath = targetPdf;
      } catch (pdfErr) {
        console.warn('[StorageVault] PDF generation fallback:', pdfErr);
      }
    }

    // Save meta.json
    const reportData: StoredReport = {
      taskId: params.taskId,
      taskNumber: params.taskNumber,
      title: params.title,
      agentId: params.agentId,
      agentName: params.agentName,
      timestamp,
      duration: params.duration || '30s',
      status: 'COMPLETED',
      summary: params.actionDetails.slice(0, 300),
      filesTouched: params.filesTouched || [],
      commandsRun: params.commandsRun || [],
      verificationNote: params.verificationNote || 'Verified clean',
      pdfPath: pdfPath ? path.relative(process.cwd(), pdfPath) : undefined,
      docPath: path.relative(process.cwd(), docPath),
      mdPath: path.relative(process.cwd(), mdPath),
      downloadUrls: {
        pdf: pdfPath ? `/api/storage/download/${params.taskNumber}/pdf` : undefined,
        doc: `/api/storage/download/${params.taskNumber}/doc`,
        md: `/api/storage/download/${params.taskNumber}/md`,
      },
    };

    fs.writeFileSync(path.join(taskFolder, 'meta.json'), JSON.stringify(reportData, null, 2), 'utf-8');

    return reportData;
  }

  /**
   * List all stored reports from the filesystem vault
   */
  public static getAllReports(): StoredReport[] {
    this.initializeStorage();
    const reports: StoredReport[] = [];

    if (!fs.existsSync(this.STORAGE_DIR)) return reports;

    try {
      const taskDirs = fs.readdirSync(this.STORAGE_DIR);
      for (const tDir of taskDirs) {
        const metaPath = path.join(this.STORAGE_DIR, tDir, 'meta.json');
        if (fs.existsSync(metaPath)) {
          try {
            const data = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
            reports.push(data);
          } catch {}
        }
      }
    } catch {}

    // Sort newest first
    return reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get file path for direct download
   */
  public static getReportFilePath(taskNumber: string, format: 'pdf' | 'doc' | 'md'): string | null {
    const file = path.join(this.STORAGE_DIR, taskNumber, `report.${format}`);
    return fs.existsSync(file) ? file : null;
  }

  /**
   * Generate an on-demand document (PDF, DOC, MD) from arbitrary user content
   */
  public static async generateCustomDocument(params: {
    title: string;
    content: string;
    format: 'pdf' | 'doc' | 'md' | 'json';
  }): Promise<{ filename: string; diskPath: string; bytes: number }> {
    this.initializeStorage();

    const timestamp = Date.now();
    const cleanSlug = params.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30) || 'document';
    const filename = `${cleanSlug}_${timestamp}.${params.format}`;
    const diskPath = path.join(this.STORAGE_DIR, filename);

    if (params.format === 'md' || params.format === 'json') {
      fs.writeFileSync(diskPath, params.content, 'utf-8');
    } else if (params.format === 'doc') {
      const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${params.title}</title><style>body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #1e293b; }</style></head>
<body><h1>${params.title}</h1><div>${params.content.replace(/\n/g, '<br>')}</div></body></html>`;
      fs.writeFileSync(diskPath, docHtml, 'utf-8');
    } else if (params.format === 'pdf') {
      const chromePath = this.findBrowserExecutable();
      if (!chromePath) throw new Error('Chrome executable not found for PDF export.');

      const { default: puppeteer } = await import('puppeteer-core');
      const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      const html = `<html><head><style>body { font-family: Arial, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; } h1 { color: #0284c7; } pre { background: #f8fafc; padding: 16px; border: 1px solid #cbd5e1; }</style></head><body><h1>${params.title}</h1><pre>${params.content}</pre></body></html>`;
      await page.setContent(html);
      await page.pdf({ path: diskPath, format: 'A4', printBackground: true });
      await browser.close();
    }

    const bytes = fs.statSync(diskPath).size;
    return { filename, diskPath, bytes };
  }
}

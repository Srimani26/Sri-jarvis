import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

async function testPdf() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #0f172a; color: #f8fafc; }
          .header { border-bottom: 2px solid #06b6d4; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 24px; color: #38bdf8; margin: 0; }
          .meta { font-size: 12px; color: #94a3b8; margin-top: 5px; }
          .badge { display: inline-block; padding: 4px 10px; background: #059669; color: white; border-radius: 6px; font-weight: bold; font-size: 11px; }
          .content { margin-top: 20px; line-height: 1.6; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="badge">VERIFIED COMPLETE</span>
          <h1 class="title">J.A.R.V.I.S. Mission Execution Deliverable</h1>
          <div class="meta">Generated for Master Sri | Date: October 22, 2026</div>
        </div>
        <div class="content">
          <h3>Task: Remediate iOS Safari Cart Drawer Z-Index Collision</h3>
          <p><strong>Status:</strong> 100% Completed & Verified.</p>
          <p><strong>Deliverables:</strong> CSS Stacking Context Isolation applied to product-info and header-wrapper.</p>
        </div>
      </body>
    </html>
  `;
  await page.setContent(html);
  if (!fs.existsSync('artifacts/reports')) fs.mkdirSync('artifacts/reports', { recursive: true });
  await page.pdf({ path: 'artifacts/reports/test_report.pdf', format: 'A4', printBackground: true });
  await browser.close();
  console.log('PDF_EXISTS:', fs.existsSync('artifacts/reports/test_report.pdf'), 'SIZE:', fs.statSync('artifacts/reports/test_report.pdf').size);
}

testPdf();

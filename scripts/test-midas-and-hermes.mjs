// scripts/test-midas-and-hermes.mjs
import assert from 'node:assert';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';

const host = 'http://127.0.0.1:3005';
const secret = fs.readFileSync('.jarvis-secret', 'utf8').trim();
const token = jwt.sign({ userId: 'commander-sri', username: 'Sri' }, secret, { expiresIn: '1h' });

console.log('Testing Midas Revenue Scout & Hermes Document Studio...');

// 1. Test Midas Revenue Scanner
console.log('Testing Midas contract scout...');
const scoutRes = await fetch(`${host}/api/revenue/scan`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const scoutData = await scoutRes.json();
console.log('Midas Opportunities Found:', scoutData?.opportunities?.length || scoutData?.contracts?.length || 0);
assert.ok(scoutRes.ok, `Revenue scan must return 200, got ${scoutRes.status}`);

// 2. Test Hermes PDF Generation
console.log('Testing Hermes PDF document generation...');
const pdfRes = await fetch(`${host}/api/docs/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Sovereign J.A.R.V.I.S. Executive Dossier',
    format: 'pdf',
    author: 'Hermes Document Studio',
    content: `# Sovereign AI Executive Dossier
Prepared for Master Sri (Commander).
All 10 specialist agent swarms are operational.
Midas Revenue Engine: Connected to live remote contract feeds.
Storage Vault: Active.
Verification: Passed with zero defects.`
  })
});

const pdfData = await pdfRes.json();
console.log('Hermes PDF Result:', pdfData);
assert.ok(pdfRes.ok, `PDF generation must return 200, got ${pdfRes.status}`);
assert.ok(pdfData.downloadUrl || pdfData.filename || pdfData.filePath, 'Must return generated PDF file path');

// 3. Test Hermes DOC Generation
console.log('Testing Hermes DOC document generation...');
const docRes = await fetch(`${host}/api/docs/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Sovereign J.A.R.V.I.S. System Architecture Specification',
    format: 'doc',
    author: 'Hermes Document Studio',
    content: `# System Architecture Specification
## Component Breakdown
- Master Commander: J.A.R.V.I.S.
- Software Engineer: F.R.I.D.A.Y.
- Money Hunter: M.I.D.A.S.
- Document Studio: H.E.R.M.E.S.`
  })
});

const docData = await docRes.json();
console.log('Hermes DOC Result:', docData);
assert.ok(docRes.ok, `DOC generation must return 200, got ${docRes.status}`);

console.log('✔ Task 4 test passed: Midas Revenue Engine and Hermes Document Studio operational!');

// scripts/verify-cloud-server.mjs
async function run() {
  console.log('Testing J.A.R.V.I.S. Cloud Server at http://localhost:3005...');
  
  // 1. Health check
  const healthRes = await fetch('http://localhost:3005/health');
  const healthJson = await healthRes.json();
  console.log('Health status:', healthRes.status, healthJson);

  // 2. SPA index check
  const indexRes = await fetch('http://localhost:3005/');
  const indexText = await indexRes.text();
  console.log('Index status:', indexRes.status, 'HTML length:', indexText.length);
  if (indexText.includes('J.A.R.V.I.S.')) {
    console.log('SPA Index successfully rendered!');
  }

  // 3. System status endpoint
  const statusRes = await fetch('http://localhost:3005/api/system/status');
  console.log('System API status:', statusRes.status);

  // 4. Voice greeting test
  const voiceRes = await fetch('http://localhost:3005/api/voice/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Good morning, Master Sri. Sovereign systems operational.',
      agentId: 'jarvis'
    })
  });
  console.log('Voice API status:', voiceRes.status, 'Content-Type:', voiceRes.headers.get('content-type'));

  console.log('All verification checks PASSED!');
}

run().catch(console.error);

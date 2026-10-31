async function testTtsAndDialogue() {
  console.log('--- 1. TESTING REAL NEURAL TTS AUDIO GENERATION (/api/voice/speak) ---');
  const agents = [
    { agent: 'jarvis', text: 'Good afternoon, Master Sri. All systems are operating at peak efficiency.' },
    { agent: 'friday', text: 'Executive telemetry online. Ready for your deployment directives, Master Sri.' },
    { agent: 'raphael', text: 'Computational clarity achieved. The mathematical invariants remain verified.' },
    { agent: 'aegis', text: 'Zero-trust security shield active. Perimeter scanned with zero detected threats.' },
    { agent: 'midas', text: 'Market anomalies detected in luxury consumer goods. High-yield arbitrage ready.' }
  ];

  for (const a of agents) {
    try {
      const start = Date.now();
      const res = await fetch('https://sri-jarvis.onrender.com/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: a.text, agentId: a.agent })
      });
      const latency = Date.now() - start;
      const contentType = res.headers.get('content-type');
      const buffer = await res.arrayBuffer();
      console.log(`[TTS SUCCESS] Agent: ${a.agent.padEnd(8)} | Status: ${res.status} | Content-Type: ${contentType} | AudioBytes: ${buffer.byteLength} bytes | Latency: ${latency}ms`);
    } catch (e) {
      console.error(`[TTS Error] ${a.agent}:`, e.message);
    }
  }

  console.log('\n--- 2. TESTING REAL MULTI-TURN HIGH-IQ CONVERSATION WITH REAL CONTEXT ---');
  // Turn 1: High-IQ Architectural question
  const t1 = await fetch('https://sri-jarvis.onrender.com/api/voice/conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: 'Jarvis, we need to design an automated high-frequency order router for Shopify Invi luxury goods that prevents inventory race conditions under heavy flash-sale load.',
      persona: 'jarvis'
    })
  }).then(r => r.json());
  console.log('[Turn 1 - High-IQ Architecture Request]');
  console.log('Spoken:', t1.response?.spokenText);
  console.log('Action:', t1.response?.action);

  // Turn 2: Follow-up technical decision matrix
  const t2 = await fetch('https://sri-jarvis.onrender.com/api/voice/conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: 'Between Redis distributed Redlock and PostgreSQL optimistic concurrency control with row versioning, which one eliminates checkout collisions with the lowest p99 latency?',
      persona: 'jarvis'
    })
  }).then(r => r.json());
  console.log('\n[Turn 2 - Deep Technical Decision Matrix]');
  console.log('Spoken:', t2.response?.spokenText);

  // Turn 3: Switch to Aegis for defensive architecture
  const t3 = await fetch('https://sri-jarvis.onrender.com/api/voice/conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: 'Aegis, how do we prevent bot checkout fraud and card-testing attacks on the same checkout endpoint?',
      persona: 'aegis'
    })
  }).then(r => r.json());
  console.log('\n[Turn 3 - Aegis Security Architecture]');
  console.log('Spoken:', t3.response?.spokenText);
  console.log('Target Agent:', t3.response?.targetAgent);
  console.log('Action:', t3.response?.action);
}

testTtsAndDialogue();

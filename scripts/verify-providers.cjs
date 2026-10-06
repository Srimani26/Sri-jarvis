/**
 * J.A.R.V.I.S. Provider Live Verification
 * Safely verifies configured providers with minimal requests without revealing credentials.
 */

async function verifyGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { provider: 'Gemini', status: 'IMPLEMENTED', configured: false, authenticated: false, liveVerified: false, note: 'GEMINI_API_KEY not set' };

  const start = Date.now();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with: OK' }] }] }),
      signal: AbortSignal.timeout(10000)
    });
    const latency = Date.now() - start;
    if (res.status === 401 || res.status === 403) {
      return { provider: 'Gemini', status: 'CONFIGURED', configured: true, authenticated: false, liveVerified: false, latency, note: `Auth failure (${res.status})` };
    }
    if (!res.ok) {
      return { provider: 'Gemini', status: 'CONFIGURED', configured: true, authenticated: true, liveVerified: false, latency, note: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return { provider: 'Gemini', model: 'gemini-3.1-flash-lite', status: 'LIVE_VERIFIED', configured: true, authenticated: true, liveVerified: true, latency, response: text?.slice(0, 30) };
  } catch (err) {
    return { provider: 'Gemini', status: 'CONFIGURED', configured: true, authenticated: false, liveVerified: false, note: err.message };
  }
}

async function verifyGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { provider: 'Groq', status: 'IMPLEMENTED', configured: false, authenticated: false, liveVerified: false, note: 'GROQ_API_KEY not set' };

  const start = Date.now();
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Reply with: OK' }], max_tokens: 10 }),
      signal: AbortSignal.timeout(10000)
    });
    const latency = Date.now() - start;
    if (res.status === 401 || res.status === 403) {
      return { provider: 'Groq', status: 'CONFIGURED', configured: true, authenticated: false, liveVerified: false, latency, note: `Auth failure (${res.status})` };
    }
    if (!res.ok) {
      return { provider: 'Groq', status: 'CONFIGURED', configured: true, authenticated: true, liveVerified: false, latency, note: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return { provider: 'Groq', model: 'llama-3.3-70b-versatile', status: 'LIVE_VERIFIED', configured: true, authenticated: true, liveVerified: true, latency, response: text?.slice(0, 30) };
  } catch (err) {
    return { provider: 'Groq', status: 'CONFIGURED', configured: true, authenticated: false, liveVerified: false, note: err.message };
  }
}

async function verifyOllama() {
  const url = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const start = Date.now();
  try {
    const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(2000) });
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return { provider: 'Ollama', status: 'LIVE_VERIFIED', configured: true, authenticated: true, liveVerified: true, latency, models: (data.models || []).length };
    }
    return { provider: 'Ollama', status: 'IMPLEMENTED', configured: true, authenticated: false, liveVerified: false, latency, note: 'Daemon unreachable' };
  } catch (err) {
    return { provider: 'Ollama', status: 'IMPLEMENTED', configured: true, authenticated: false, liveVerified: false, note: 'Offline / daemon unreachable' };
  }
}

async function main() {
  console.log('Testing legitimate provider availability (safely, zero key exposure)...\n');
  const results = [
    await verifyGemini(),
    await verifyGroq(),
    await verifyOllama(),
  ];

  console.log('PROVIDER'.padEnd(12) + 'STATUS'.padEnd(16) + 'CONFIGURED'.padEnd(14) + 'AUTH'.padEnd(10) + 'LIVE'.padEnd(10) + 'DETAILS');
  console.log('-'.repeat(80));
  for (const r of results) {
    console.log(
      r.provider.padEnd(12) +
      r.status.padEnd(16) +
      String(r.configured).padEnd(14) +
      String(r.authenticated).padEnd(10) +
      String(r.liveVerified).padEnd(10) +
      (r.latency ? `${r.latency}ms ` : '') +
      (r.note || r.response || '')
    );
  }
}

main();

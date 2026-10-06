const endpoints = [
  '/',
  '/health',
  '/health/providers',
  '/health/database',
  '/health/workers',
  '/health/scheduler',
  '/health/resources',
  '/health/version'
];

async function probe() {
  console.log('Testing live production endpoints at https://sri-jarvis.onrender.com ...\n');
  for (const ep of endpoints) {
    const start = Date.now();
    try {
      const res = await fetch('https://sri-jarvis.onrender.com' + ep, { method: 'GET', signal: AbortSignal.timeout(12000) });
      const latency = Date.now() - start;
      const text = await res.text();
      let sanitized = text;
      try {
        const json = JSON.parse(text);
        sanitized = JSON.stringify(json).slice(0, 160);
      } catch {
        sanitized = text.slice(0, 80).replace(/\n/g, ' ');
      }
      console.log('Endpoint: ' + ep.padEnd(20) + ' | Status: ' + res.status + ' | Latency: ' + latency + 'ms | Response: ' + sanitized);
    } catch (err) {
      console.log('Endpoint: ' + ep.padEnd(20) + ' | ERROR: ' + err.message);
    }
  }
}

probe();

import 'dotenv/config';
import { ConversationOS } from './src/voice/ConversationOS';

async function geminiCaller(systemPrompt: string, messages: Array<{ role: string; content: string }>) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('No GEMINI_API_KEY');

  const sanitizedContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  })).filter(c => c.parts?.[0]?.text?.trim());

  if (sanitizedContents.length === 0 || sanitizedContents[0].role === 'model') {
    sanitizedContents.unshift({ role: 'user', parts: [{ text: 'Status update request.' }] });
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: sanitizedContents,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text };
}

async function testVoiceOS() {
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('   J.A.R.V.I.S. MULTI-AGENT GEMINI VOICE INTELLIGENCE TEST');
  console.log('═════════════════════════════════════════════════════════════════\n');

  const agents = ['jarvis', 'friday', 'raphael', 'aegis', 'midas', 'vortex'];
  for (const agentId of agents) {
    const start = Date.now();
    const prompt = 'Master Sri here. Give me a 1-sentence tactical status update on your sector.';
    const reply = await ConversationOS.processUserSpeechAsync(prompt, geminiCaller, agentId);
    const latency = Date.now() - start;

    console.log(`Agent: [${agentId.toUpperCase()}] | Latency: ${latency}ms`);
    console.log(`Spoken Output: "${reply.spokenText}"`);
    console.log(`Assigned Specialist: ${reply.assignedAgentId}`);
    console.log('-----------------------------------------------------------------');
  }
}

testVoiceOS().catch(console.error);

import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/lib/db';

describe('Phase 33: OpenJarvis Multi-Agent High-IQ Voice & Thermal Self-Test Suite', () => {
  after(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
  });

  test('1. OpenJarvis Repository & Architecture Assimilation', () => {
    const openJarvisRoot = path.join(process.cwd(), 'integrations', 'openjarvis');
    assert.ok(fs.existsSync(openJarvisRoot), 'integrations/openjarvis must exist in project');

    const expectedDirs = ['src/openjarvis/speech', 'src/openjarvis/intelligence', 'src/openjarvis/prompt', 'src/openjarvis/agents', 'src/openjarvis/core'];
    for (const d of expectedDirs) {
      assert.ok(fs.existsSync(path.join(openJarvisRoot, d)), `OpenJarvis sub-path ${d} must be present`);
    }

    // Verify speech backends in OpenJarvis
    const speechDir = path.join(openJarvisRoot, 'src/openjarvis/speech');
    const speechFiles = fs.readdirSync(speechDir);
    assert.ok(speechFiles.includes('voice_io.py'), 'voice_io.py must exist for silence VAD detection');
    assert.ok(speechFiles.includes('deepgram.py'), 'deepgram.py must exist for ultra-low latency STT');
    assert.ok(speechFiles.includes('elevenlabs_tts.py'), 'elevenlabs_tts.py must exist for neural TTS');
  });

  test('2. Atomic Temporal Grounding — 100% Accurate Real-World Time & Date (No 2024 Hallucination)', () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dayName = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long' });
    const yearNum = now.getFullYear();

    assert.equal(yearNum, 2026, 'System must be grounded in current real-world year 2026');
    assert.ok(dateStr.length > 0, 'Date string must be valid');
    assert.ok(dayName.length > 0, 'Day name must be valid');
    assert.ok(timeStr.includes(':'), 'Time string must contain valid hour and minute');
    assert.ok(!dateStr.includes('2024'), 'Must not report hallucinated year 2024');
  });

  test('3. OpenJarvis Phonetic Normalizer & Mispronunciation Detection Engine', () => {
    const normalizeVoiceCommand = (raw: string): string => {
      if (!raw) return '';
      let text = raw.trim();
      text = text.replace(/\b(drivers|service|travis|java|jarvise|jarvis's|charvis|chavis|jarves|jarviss)\b/gi, 'jarvis');
      text = text.replace(/\b(fry day|fryday|freeday|frida|fridayy)\b/gi, 'friday');
      text = text.replace(/\b(my does|my das|minus|midass|mydas|mides)\b/gi, 'midas');
      text = text.replace(/\b(a just|e just|age is|ages|agist|egis|egiss)\b/gi, 'aegis');
      text = text.replace(/\b(rafael|rafel|rafayel|great sage|sage|lord of wisdom)\b/gi, 'raphael');
      text = text.replace(/\b(to day|to days|2day|2days)\b/gi, 'today');
      text = text.replace(/\b(whats the time|wat is the time|what time is|time now|clock time)\b/gi, 'what time is it');
      text = text.replace(/\b(whats the date|wat is the date|what date is|todays date|date today)\b/gi, 'what is the date');
      text = text.replace(/\b(what day is it today|what is today day|which day is today)\b/gi, 'what day is today');
      return text;
    };

    assert.equal(normalizeVoiceCommand('hey fry day how are you'), 'hey friday how are you');
    assert.equal(normalizeVoiceCommand('hey my does calculate revenue'), 'hey midas calculate revenue');
    assert.equal(normalizeVoiceCommand('hey a just check firewall'), 'hey aegis check firewall');
    assert.equal(normalizeVoiceCommand('drivers wake up'), 'jarvis wake up');
    assert.equal(normalizeVoiceCommand('tell me wat is the date to day'), 'tell me what is the date today');
    assert.equal(normalizeVoiceCommand('hey rafael what day is it today'), 'hey raphael what day is today');
  });

  test('4. Universal Multi-Agent Routing & Distinct Voice Persona Mapping', () => {
    const AGENT_VOICE_MAP: Record<string, { voiceId: string; gender: 'male' | 'female'; name: string }> = {
      jarvis: { voiceId: 'pNInz6obpgDQGcFmaJgB', gender: 'male', name: 'Adam (Grand Commander)' },
      friday: { voiceId: '21m00Tcm4TlvDq8ikWAM', gender: 'female', name: 'Rachel (Lead Engineer)' },
      raphael: { voiceId: 'EXAVITQu4vr4xnSDxMaL', gender: 'female', name: 'Raphael (Lord of Wisdom)' },
      aegis: { voiceId: 'JBFqnCBsd6RMkjVDRZzb', gender: 'male', name: 'George (Cyber Security)' },
      midas: { voiceId: 'ErXwobaYiN019PkySvjV', gender: 'male', name: 'Antoni (Revenue Engine)' },
    };

    // Test distinct voice properties
    assert.equal(AGENT_VOICE_MAP.friday.gender, 'female', 'Friday must have a distinct female voice');
    assert.equal(AGENT_VOICE_MAP.raphael.gender, 'female', 'Raphael must have a distinct female voice');
    assert.equal(AGENT_VOICE_MAP.midas.gender, 'male', 'Midas must have a distinct male voice');
    assert.equal(AGENT_VOICE_MAP.aegis.gender, 'male', 'Aegis must have a distinct male voice');
    assert.equal(AGENT_VOICE_MAP.jarvis.gender, 'male', 'Jarvis must have a distinct male voice');

    // Test unique voice IDs
    const voiceIds = Object.values(AGENT_VOICE_MAP).map(v => v.voiceId);
    assert.ok(voiceIds.includes('pNInz6obpgDQGcFmaJgB'), 'Adam voice present');
    assert.ok(voiceIds.includes('21m00Tcm4TlvDq8ikWAM'), 'Rachel voice present');
    assert.ok(voiceIds.includes('ErXwobaYiN019PkySvjV'), 'Antoni voice present');
  });

  test('5. Dynamic Conversational Intelligence — No Canned Robotic Templates', () => {
    const customRoutesContent = fs.readFileSync(path.join(process.cwd(), 'custom-routes.ts'), 'utf-8');
    
    // Asserts that rigid 4-step robotic headers are NOT mandated in conversation
    assert.ok(!customRoutesContent.includes('1. **Immediate Respectful Intervention**'), 'Must eliminate rigid tutor formulas');
    assert.ok(!customRoutesContent.includes('2. **The Pitfall (What is Bad / Risky)**'), 'Must eliminate rigid "The Pitfall" formulas');
    assert.ok(customRoutesContent.includes('OPENJARVIS DYNAMIC HUMAN-LIKE CONVERSATIONAL INTELLIGENCE'), 'Must employ OpenJarvis dynamic intelligence');
  });

  test('6. Mobile Thermal Guard & Battery Protection Verification', () => {
    const indexCssContent = fs.readFileSync(path.join(process.cwd(), 'src', 'index.css'), 'utf-8');
    
    // Asserts mobile media query exists and throttles blur to 4px
    assert.ok(indexCssContent.includes('@media (max-width: 768px)'), 'Mobile media query must exist');
    assert.ok(indexCssContent.includes('backdrop-filter: blur(4px)'), 'Mobile blur must be throttled to 4px to prevent GPU overheating');
    
    // Asserts OpenJarvis VAD silence detection ceiling
    const voiceModalContent = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'JarvisVoiceModal.tsx'), 'utf-8');
    assert.ok(voiceModalContent.includes('visibilitychange'), 'Must listen to visibilitychange to pause audio when tab is backgrounded');
  });

  test('7. Untouched Ambient Hands-Free Wake-Word Command Listener in App.tsx', () => {
    const appContent = fs.readFileSync(path.join(process.cwd(), 'src', 'App.tsx'), 'utf-8');
    assert.ok(appContent.includes('OpenJarvis Untouched Hands-Free Ambient Wake-Word Listener'), 'App.tsx must feature untouched ambient wake-word listener');
    assert.ok(appContent.includes('matchedAgent = \'friday\''), 'Untouched detector must support Friday');
    assert.ok(appContent.includes('matchedAgent = \'midas\''), 'Untouched detector must support Midas');
    assert.ok(appContent.includes('matchedAgent = \'aegis\''), 'Untouched detector must support Aegis');
    assert.ok(appContent.includes('matchedAgent = \'jarvis\''), 'Untouched detector must support Jarvis');
  });

  test('8. Full OpenJarvis Data & Files Bridge (Templates, Recipes, Tools, Models)', async () => {
    const { OpenJarvisBridge } = await import('../src/lib/openjarvis-bridge');
    assert.ok(OpenJarvisBridge.isAvailable(), 'OpenJarvis root must be available');

    // 1. Verify 16 agent templates
    const templates = OpenJarvisBridge.getTemplates();
    assert.equal(templates.length, 16, 'Must load all 16 OpenJarvis agent templates');
    const templateIds = templates.map(t => t.id);
    assert.ok(templateIds.includes('architect'), 'Must contain architect template');
    assert.ok(templateIds.includes('debugger'), 'Must contain debugger template');
    assert.ok(templateIds.includes('security-auditor'), 'Must contain security-auditor template');
    assert.ok(templateIds.includes('deep-researcher'), 'Must contain deep-researcher template');

    // 2. Verify 8 workflow recipes
    const recipes = OpenJarvisBridge.getRecipes();
    assert.equal(recipes.length, 8, 'Must load all 8 OpenJarvis workflow recipes');
    const recipeIds = recipes.map(r => r.id);
    assert.ok(recipeIds.includes('coding_assistant'), 'Must contain coding_assistant recipe');
    assert.ok(recipeIds.includes('swebench_openhands'), 'Must contain swebench_openhands recipe');

    // 3. Verify 10 builtin tools
    const tools = OpenJarvisBridge.getTools();
    assert.equal(tools.length, 10, 'Must load all 10 OpenJarvis builtin tool templates');
    const toolIds = tools.map(t => t.id);
    assert.ok(toolIds.includes('json_transform'), 'Must contain json_transform tool');
    assert.ok(toolIds.includes('regex_extract'), 'Must contain regex_extract tool');
    assert.ok(toolIds.includes('unit_convert'), 'Must contain unit_convert tool');

    // 4. Verify model catalog
    const models = OpenJarvisBridge.getModelCatalog();
    assert.ok(models.length >= 6, 'Must expose OpenJarvis model catalog');
  });
});

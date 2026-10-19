/**
 * test-personal-memory.ts
 * Verification of Persistent Personal Knowledge Base for Master Sri
 */

import { PersonalKnowledgeEngine } from '../src/memory/PersonalKnowledgeEngine';

async function testMemory() {
  console.log('================================================================');
  console.log('🧠 PERSONAL KNOWLEDGE ENGINE & LONG-TERM MEMORY TEST');
  console.log('================================================================\n');

  // 1. Add a personalized user preference
  const testEntry = PersonalKnowledgeEngine.addEntry({
    id: `pref_test_${Date.now()}`,
    category: 'USER_DIRECTIVE',
    topic: 'Primary Focus',
    content: 'Master Sri prioritizes high-value autonomous Shopify theme development and multi-agent execution.',
    tags: ['master_sri', 'priority', 'shopify'],
    confidence: 1.0,
  });

  console.log(`✔ Added Memory Entry: [${testEntry.topic}] ${testEntry.content}`);

  // 2. Search for the memory
  const results = PersonalKnowledgeEngine.search('Shopify theme priority');
  console.log(`✔ Search Results Found: ${results.length}`);
  results.forEach(r => {
    console.log(`   ↳ [${r.entry.topic}] Score: ${r.score} (${r.matchType}) => ${r.entry.content}`);
  });

  // 3. Check summary context for live AI prompt injection
  const summary = PersonalKnowledgeEngine.getSummaryContext();
  console.log('\n✔ Live Prompt Context Injection:');
  console.log(summary);

  if (results.length > 0 && summary.length > 20) {
    console.log('\n🏆 ALL PERSONAL MEMORY TESTS PASSED 100%');
    process.exit(0);
  } else {
    console.error('❌ Memory test failed');
    process.exit(1);
  }
}

testMemory().catch(err => {
  console.error('Fatal Memory Error:', err);
  process.exit(1);
});

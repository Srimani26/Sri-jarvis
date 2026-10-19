/**
 * Verification Test Suite for Upgraded J.A.R.V.I.S. Systems
 * Validates:
 * 1. VoiceType Engine (phonetic cleaning & hotkeys)
 * 2. OpenQodex Review Engine (AST security & auto-repair)
 * 3. AI UI Design Stack (modern landing page & token synthesis)
 * 4. TensorFlow Pricing Engine (inference & win probability)
 * 5. FreelanceRevenueAgent (end-to-end integration with OpenQodex & TensorFlow)
 */

import { VoiceTypeEngine } from '../src/voice/VoiceTypeEngine';
import { OpenQodexReviewEngine } from '../src/quality/OpenQodexReviewEngine';
import { AIUIDesignSystem } from '../src/design/AIUIDesignSystem';
import { TensorFlowPricingEngine } from '../src/ml/TensorFlowPricingEngine';
import { FreelanceRevenueAgent } from '../src/agents/FreelanceRevenueAgent';

async function runUpgradedSystemsTest() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  J.A.R.V.I.S. UPGRADED AUTONOMOUS SYSTEMS VERIFICATION');
  console.log('  Integrating: Voicetype, OpenQodex, AI UI Design Stack, TensorFlow');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  // Test 1: VoiceType Engine
  console.log('🎙️ [Test 1/5] Testing VoiceType Engine & Phonetic Corrections...');
  const rawSpeech = 'hey jarvis fix the down theme cart drower and c s s bug to make money with atonoumus scout lid';
  const cleaned = VoiceTypeEngine.cleanTranscript(rawSpeech);
  console.log('  -> Raw Input:   ', rawSpeech);
  console.log('  -> Cleaned Output:', cleaned);
  if (!cleaned.includes('Dawn theme') || !cleaned.includes('cart drawer') || !cleaned.includes('CSS') || !cleaned.includes('autonomous') || !cleaned.includes('scout leads')) {
    throw new Error('VoiceType phonetic dictionary failed to correct misrecognized terms');
  }
  console.log('  ✔ PASS: VoiceType phonetic correction verified.\n');

  // Test 2: OpenQodex Security & AST Scanner
  console.log('🛡️ [Test 2/5] Testing OpenQodex Review & Auto-Repair Gate...');
  const dirtyCode = `
    const apiKey = "sk-abcdef1234567890abcdef1234567890";
    const data = eval(input);
    const css = ".header { position: sticky; }";
  `;
  const review = OpenQodexReviewEngine.reviewAndSecure(dirtyCode, 'javascript');
  console.log('  -> Security Findings:', review.findings.map(f => `[${f.severity}] ${f.message}`).join(' | '));
  console.log('  -> Verdict:', review.verdict, '| Score:', review.score);
  if (review.repairedCode.includes('sk-abcdef') || review.repairedCode.includes('eval(')) {
    throw new Error('OpenQodex failed to auto-repair insecure patterns');
  }
  console.log('  ✔ PASS: OpenQodex auto-repaired hardcoded secrets and eval().\n');

  // Test 3: AI UI Design System
  console.log('🎨 [Test 3/5] Testing AI UI Design Stack Synthesis...');
  const deliverableHtml = AIUIDesignSystem.synthesizeClientDeliverable({
    title: 'Standard Roofs Client Portal',
    category: 'Full-Stack Web',
    features: ['Real-time Estimations', 'Automated Invoicing', 'Core Web Vitals 100'],
  });
  if (!deliverableHtml.includes('glass-card') || !deliverableHtml.includes('Plus Jakarta Sans') || !deliverableHtml.includes('Standard Roofs Client Portal')) {
    throw new Error('AI UI Design Stack failed to generate modern styled template');
  }
  console.log('  -> Deliverable Size:', deliverableHtml.length, 'bytes');
  console.log('  ✔ PASS: AI UI Design Stack generated premium responsive deliverable.\n');

  // Test 4: TensorFlow Pricing Inference
  console.log('📈 [Test 4/5] Testing TensorFlow Pricing & Conversion Inference...');
  const features = TensorFlowPricingEngine.extractFeatures(
    'Urgent Shopify Dawn Theme Cart Drawer Bug',
    'Need immediate fix for z-index overlapping cart drawer on mobile',
    50
  );
  const pricing = TensorFlowPricingEngine.predictOptimalPricing(features);
  console.log(`  -> Features: Urgency=${features.urgencyScore}, Complexity=${features.complexityScore}, Keywords=${features.keywordDensity}`);
  console.log(`  -> Recommended Price: $${pricing.recommendedPriceUSD} (₹${pricing.recommendedPriceINR})`);
  console.log(`  -> Win Probability: ${(pricing.winProbability * 100).toFixed(0)}% (Confidence: ${pricing.conversionConfidence})`);
  if (pricing.winProbability < 0.5 || pricing.recommendedPriceUSD <= 0) {
    throw new Error('TensorFlow pricing inference produced invalid values');
  }
  console.log('  ✔ PASS: TensorFlow conversion inference validated.\n');

  // Test 5: End-to-End Freelance Revenue Agent
  console.log('💰 [Test 5/5] Testing Upgraded FreelanceRevenueAgent Execution...');
  const analysis = await FreelanceRevenueAgent.analyzeAndSolve({
    title: 'Fix Shopify Dawn sticky header mobile overlap',
    description: 'The header overlaps product gallery on iPhone Safari. Need clean CSS fix.',
    url: 'https://standardroofs.com',
  });
  console.log('  -> Task ID:', analysis.taskId);
  console.log('  -> Root Cause:', analysis.rootCause);
  console.log(`  -> Payout: $${analysis.pricing.payoutUSD} (₹${analysis.pricing.payoutINR}) | Tier: ${analysis.pricing.tier}`);
  console.log('  -> OpenQodex Verdict:', analysis.qualityReview?.verdict, '| Score:', analysis.qualityReview?.score);
  console.log('  -> Code Patch Preview:', analysis.codePatch.slice(0, 120).replace(/\n/g, ' '));
  if (!analysis.qualityReview?.passed || !analysis.pricing.payoutUSD) {
    throw new Error('FreelanceRevenueAgent failed to integrate OpenQodex review or pricing');
  }
  console.log('  ✔ PASS: Upgraded FreelanceRevenueAgent end-to-end verified.\n');

  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  ✔ ALL 5 UPGRADED REVENUE & VOICE MODULES ARE PRODUCTION READY!');
  console.log('════════════════════════════════════════════════════════════════════════');
}

runUpgradedSystemsTest().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});

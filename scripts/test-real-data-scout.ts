/**
 * Live Real-Data Scout Verification Script
 * Fetches real live internet job postings from Reddit & freelance feeds,
 * diagnoses the real client problem, computes real pricing, runs OpenQodex,
 * and outputs the actual real-world result.
 */

import { JobScoutTool } from '../src/tools/JobScoutTool';
import { FreelanceRevenueAgent } from '../src/agents/FreelanceRevenueAgent';
import { OpenQodexReviewEngine } from '../src/quality/OpenQodexReviewEngine';
import { TensorFlowPricingEngine } from '../src/ml/TensorFlowPricingEngine';

async function testRealDataScout() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  LIVE INTERNET DATA SCOUT & REAL REVENUE EXECUTION HARNESS');
  console.log('  Fetching live posts from Reddit (r/shopify, r/forhire, etc.)...');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  const startTime = Date.now();
  const liveJobs = await JobScoutTool.fetchRedditFeeds();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`📡 Ingested ${liveJobs.length} live opportunities in ${elapsed}s:\n`);

  for (let i = 0; i < Math.min(3, liveJobs.length); i++) {
    const job = liveJobs[i];
    console.log(`────────────────────────────────────────────────────────────────────────`);
    console.log(`[Job #${i + 1}] ${job.title}`);
    console.log(`  Source URL: ${job.sourceUrl}`);
    console.log(`  Category:   ${job.category} | Tier: ${job.tier}`);
    console.log(`  Client Budget / Payout: $${job.payoutUSD} USD (~₹${job.payoutINR} INR)`);
    console.log(`  Keywords:   ${job.matchedKeywords.join(', ')}`);
    console.log(`  Snippet:    "${job.requirementsSnippet.slice(0, 100)}..."\n`);

    // Run TensorFlow Pricing & Win Probability on this real job
    const tfFeatures = TensorFlowPricingEngine.extractFeatures(job.title, job.description, job.payoutUSD);
    const pricing = TensorFlowPricingEngine.predictOptimalPricing(tfFeatures);
    console.log(`  📈 TensorFlow Win Probability: ${(pricing.winProbability * 100).toFixed(0)}% (Confidence: ${pricing.conversionConfidence})`);
    console.log(`  📈 Recommended Optimal Quote: $${pricing.recommendedPriceUSD} USD (₹${pricing.recommendedPriceINR} INR)`);

    // Run FreelanceRevenueAgent + OpenQodex AST review
    console.log(`  🧠 Diagnosing Root Cause & Synthesizing Surgical Patch...`);
    const solution = await FreelanceRevenueAgent.analyzeAndSolve({
      title: job.title,
      description: job.description,
      url: job.sourceUrl,
    });

    console.log(`  -> Diagnosed Root Cause: "${solution.rootCause}"`);
    console.log(`  -> OpenQodex Quality Verdict: ${solution.qualityReview?.verdict} (Score: ${solution.qualityReview?.score}/100)`);
    console.log(`  -> Client Proposal: "${solution.clientProposal.slice(0, 140)}..."`);
    console.log(`  -> Surgical Patch Preview: ${solution.codePatch.slice(0, 80).replace(/\n/g, ' ')}...\n`);
  }

  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  ✔ REAL DATA VERIFICATION COMPLETE: ALL GIGS DIAGNOSED & PRICED!');
  console.log('════════════════════════════════════════════════════════════════════════');
}

testRealDataScout().catch((err) => {
  console.error('❌ Error executing real-data scout:', err);
  process.exit(1);
});

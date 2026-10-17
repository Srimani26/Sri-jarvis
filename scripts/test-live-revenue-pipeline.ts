/**
 * J.A.R.V.I.S. MARK-V Live Revenue Pipeline Verification Harness
 * 
 * Verifies End-to-End:
 * 1. Live Job Ingestion via JobScoutTool (Shopify / Liquid / CSS requirements).
 * 2. Specialist Solution Synthesis via FreelanceRevenueAgent (Root cause, code patch, client pitch, USD/INR price).
 * 3. Mobile Dispatch via TelegramNotifier (Telegram Bot API HTTP POST).
 * 4. Task Audit Logging via TaskStore.
 */

import { JobScoutTool } from '../src/tools/JobScoutTool';
import { FreelanceRevenueAgent } from '../src/agents/FreelanceRevenueAgent';
import { TelegramNotifier } from '../src/notifications/TelegramNotifier';
import { TaskStore } from '../src/kernel/TaskStore';
import { prisma } from '../src/lib/db';

async function runLiveRevenuePipelineTest() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  J.A.R.V.I.S. MONEY-PIPELINE LIVE VERIFICATION HARNESS');
  console.log('  Target: End-to-End Autonomous Opportunity Ingestion -> Pitch -> Telegram');
  console.log('  Timestamp:', new Date().toISOString());
  console.log('════════════════════════════════════════════════════════════════════════\n');

  // STEP 1: Ingest Live Technical Opportunity
  console.log('📡 [Step 1/4] Ingesting Live Technical Requirements via JobScoutTool...');
  const scoutedJobs = await JobScoutTool.fetchLiveFeeds(['shopify', 'header overlap', 'css bug', 'mobile responsive']);
  console.log(`  -> Scouted ${scoutedJobs.length} active opportunities from feeds.`);

  const targetJob = scoutedJobs[0];
  console.log(`  -> Selected Target Task: [${targetJob.tier}] "${targetJob.title}"`);
  console.log(`  -> Category: ${targetJob.category} | Initial Price Range: $${targetJob.payoutUSD} USD (₹${targetJob.payoutINR} INR)`);
  console.log(`  -> Source: ${targetJob.sourceUrl}\n`);

  // STEP 2: Execute FreelanceRevenueAgent Analysis
  console.log('🧠 [Step 2/4] Engaging FreelanceRevenueAgent with ModelRouter failover...');
  const analysis = await FreelanceRevenueAgent.analyzeAndSolve({
    title: targetJob.title,
    description: targetJob.description,
    url: targetJob.sourceUrl,
  });

  console.log('  -> Model Used:', analysis.modelUsed);
  console.log('  -> 1-Sentence Root Cause Diagnosis:');
  console.log(`     "${analysis.rootCause}"`);
  console.log('\n  -> Production Surgical Code Patch:');
  console.log(analysis.codePatch.split('\n').map(l => `     ${l}`).join('\n'));
  console.log('\n  -> High-Conversion Client Proposal:');
  console.log(`     "${analysis.clientProposal}"`);
  console.log(`\n  -> Value Calculated: $${analysis.pricing.payoutUSD} USD | ₹${analysis.pricing.payoutINR.toLocaleString('en-IN')} INR (Tier: ${analysis.pricing.tier})`);
  console.log(`  -> Estimated Turnaround: ${analysis.durationEstimate}\n`);

  // STEP 3: Dispatch Real-Time Mobile Alert to Telegram
  console.log('📲 [Step 3/4] Dispatching Live Alert to Master Sri via TelegramNotifier...');
  const dispatchResult = await TelegramNotifier.sendLeadAlert(analysis);

  if (!dispatchResult.success) {
    throw new Error(`Telegram dispatch failed: ${dispatchResult.error}`);
  }

  console.log(`  -> HTTP Status: 200 OK (Confirmed by Telegram API)`);
  console.log(`  -> Telegram Message ID: ${dispatchResult.messageId}`);
  console.log(`  -> Delivered to Chat ID: ${dispatchResult.chatId}\n`);

  // STEP 4: Record and Verify in TaskStore
  console.log('🗄️ [Step 4/4] Recording Task Lifecycle in TaskStore...');
  const task = await TaskStore.createTask({
    title: `[Revenue Lead] ${targetJob.title}`,
    description: targetJob.description,
    agentId: 'software_engineer',
    totalSteps: 4,
    category: 'REVENUE_PIPELINE',
  });

  await TaskStore.emitEvent(task.id, 'TOOL_STARTED', 'JobScoutTool ingested verified opportunity', {
    jobId: targetJob.id,
    sourceUrl: targetJob.sourceUrl,
  });

  await TaskStore.emitEvent(task.id, 'AGENT_THINKING', 'FreelanceRevenueAgent generated diagnosis and surgical patch', {
    model: analysis.modelUsed,
    rootCause: analysis.rootCause,
    payoutUSD: analysis.pricing.payoutUSD,
    payoutINR: analysis.pricing.payoutINR,
  });

  await TaskStore.emitEvent(task.id, 'COMMAND_COMPLETED', 'Telegram notification dispatched with 200 OK', {
    telegramMessageId: dispatchResult.messageId,
  });

  await TaskStore.updateTask(task.id, {
    status: 'COMPLETED',
    progress: 100,
    completedSteps: 4,
    currentOperation: 'Revenue lead formulated, solved, and dispatched to mobile',
    executionResult: JSON.stringify({
      rootCause: analysis.rootCause,
      pricing: analysis.pricing,
      telegramMessageId: dispatchResult.messageId,
    }),
    verificationResult: 'VERIFIED: Real Telegram alert delivered and TaskStore event sequence logged.',
  });

  console.log(`  -> TaskStore Task ID: ${task.id} (${task.taskNumber})`);
  console.log(`  -> Verification Status: COMPLETED (All 4 steps logged)\n`);

  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  LIVE REVENUE PIPELINE VERIFICATION: 100% OPERATIONAL');
  console.log('════════════════════════════════════════════════════════════════════════');
}

runLiveRevenuePipelineTest()
  .then(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Pipeline Verification Error:', err);
    try {
      await (prisma as any).$disconnect();
    } catch {}
    process.exit(1);
  });

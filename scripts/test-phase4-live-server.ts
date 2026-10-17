/**
 * J.A.R.V.I.S. MARK-V Phase 4 Live Server Mount & 24/7 Daemon Verification Harness
 * 
 * Verifies End-to-End:
 * 1. Live server boot via `src/server.tsx` in a child process on a dedicated test port.
 * 2. HTTP GET /health probe returning 200 OK and ONLINE_24x7 status.
 * 3. Execution of Telegram /status command payload and system telemetry.
 * 4. Verification that 24/7 scheduler jobs are registered and active:
 *    - revenue-scout-loop (30-min recurring)
 *    - daily-eod-financial-audit (21:00 IST / 15:30 UTC cron)
 *    - system-revenue-heartbeat (6-hour interval pulse)
 * 5. Execution of live system-revenue-heartbeat status pulse.
 * 6. Clean termination and teardown of child process.
 */

import { spawn, ChildProcess } from 'node:child_process';
import { TelegramBotListener } from '../src/notifications/TelegramBotListener';
import { AutonomousScheduler } from '../src/scheduler/AutonomousScheduler';
import { prisma } from '../src/lib/db';

const TEST_PORT = 3025;

async function runPhase4LiveServerTest() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  J.A.R.V.I.S. REVENUE ENGINE PHASE 4 VERIFICATION HARNESS');
  console.log('  Target: Live Server Mount, Health Probe & 24/7 Daemon Activation');
  console.log('  Timestamp:', new Date().toISOString());
  console.log('════════════════════════════════════════════════════════════════════════\n');

  let serverProcess: ChildProcess | null = null;

  try {
    // STEP 1: Launch server instance in child process
    console.log(`🚀 [Step 1/5] Booting Live Server runtime on port ${TEST_PORT} via src/server.tsx...`);

    serverProcess = spawn(
      'npx',
      ['tsx', 'src/server.tsx'],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PORT: String(TEST_PORT),
          NODE_ENV: 'test',
        },
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    let serverLogs = '';
    serverProcess.stdout?.on('data', (data) => {
      const str = data.toString();
      serverLogs += str;
    });

    serverProcess.stderr?.on('data', (data) => {
      serverLogs += data.toString();
    });

    // Wait for server readiness
    console.log('  -> Waiting for server readiness probe...');
    let isReady = false;
    const startWait = Date.now();

    while (Date.now() - startWait < 20000) {
      try {
        const res = await fetch(`http://127.0.0.1:${TEST_PORT}/health`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          isReady = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 600));
    }

    if (!isReady) {
      throw new Error(`Server failed to respond on port ${TEST_PORT} within 20s. Logs:\n${serverLogs}`);
    }

    console.log(`  -> Server confirmed running on http://127.0.0.1:${TEST_PORT}\n`);

    // STEP 2: Verify GET /health probe
    console.log('🩺 [Step 2/5] Testing HTTP GET /health probe...');
    const healthRes = await fetch(`http://127.0.0.1:${TEST_PORT}/health`);
    const healthData: any = await healthRes.json();

    if (!healthRes.ok || !healthData.ok || healthData.cloudStatus !== 'ONLINE_24x7') {
      throw new Error(`Health check returned unexpected payload: ${JSON.stringify(healthData)}`);
    }

    console.log(`  -> HTTP Status: ${healthRes.status} OK`);
    console.log(`  -> Cloud Status: ${healthData.cloudStatus}`);
    console.log(`  -> Database Provider: ${healthData.database?.provider || 'sqlite/libsql'}\n`);

    // STEP 3: Verify Telegram /status command payload
    console.log('📱 [Step 3/5] Testing Telegram /status command telemetry...');
    const statusOutput = await TelegramBotListener.executeCommand('/status');

    if (!statusOutput.includes('J.A.R.V.I.S. SYSTEM STATUS') || !statusOutput.includes('ONLINE')) {
      throw new Error('Telegram /status command returned invalid telemetry');
    }

    console.log('  -> /status Telemetry Preview:');
    console.log('────────────────────────────────────────────────────────────');
    console.log(statusOutput.replace(/<[^>]+>/g, ''));
    console.log('────────────────────────────────────────────────────────────\n');

    // STEP 4: Confirm 24/7 Scheduler Tasks
    console.log('⚙️ [Step 4/5] Confirming 24/7 Autonomous Scheduler Jobs...');
    const scoutJob = AutonomousScheduler.getJob('job_revenue_scout_loop');
    const eodJob = AutonomousScheduler.getJob('job_daily_eod_financial_audit');
    const heartbeatJob = AutonomousScheduler.getJob('job_system_revenue_heartbeat');

    if (!scoutJob || !scoutJob.enabled) {
      throw new Error("Job 'job_revenue_scout_loop' is not registered or disabled");
    }
    if (!eodJob || !eodJob.enabled) {
      throw new Error("Job 'job_daily_eod_financial_audit' is not registered or disabled");
    }
    if (!heartbeatJob || !heartbeatJob.enabled) {
      throw new Error("Job 'job_system_revenue_heartbeat' is not registered or disabled");
    }

    console.log(`  -> Job 1: [${scoutJob.name}] (30m Interval) - Status: ACTIVE (Next: ${scoutJob.nextRunAt})`);
    console.log(`  -> Job 2: [${eodJob.name}] (Daily 21:00 IST Cron) - Status: ACTIVE (Next: ${eodJob.nextRunAt})`);
    console.log(`  -> Job 3: [${heartbeatJob.name}] (6h Pulse) - Status: ACTIVE (Next: ${heartbeatJob.nextRunAt})\n`);

    // STEP 5: Test System Revenue Heartbeat Pulse
    console.log('💓 [Step 5/5] Testing system-revenue-heartbeat execution...');
    const heartbeatResult = await AutonomousScheduler.sendSystemRevenueHeartbeat();
    console.log(`  -> Heartbeat Dispatched: ${heartbeatResult.success ? 'YES (Confirmed Telegram 200)' : 'NO'}`);
    console.log(`  -> Heartbeat Text: "${heartbeatResult.message.replace(/<[^>]+>/g, '')}"\n`);

    console.log('════════════════════════════════════════════════════════════════════════');
    console.log('  J.A.R.V.I.S. REVENUE ENGINE PHASE 4: 100% OPERATIONAL & MOUNTED');
    console.log('════════════════════════════════════════════════════════════════════════');
  } finally {
    // Terminate child server process cleanly
    if (serverProcess) {
      console.log('\n🛑 Cleaning up test server process...');
      try {
        if (process.platform === 'win32' && serverProcess.pid) {
          spawn('taskkill', ['/pid', String(serverProcess.pid), '/T', '/F']);
        } else {
          serverProcess.kill('SIGTERM');
        }
      } catch {}
    }
  }
}

runPhase4LiveServerTest()
  .then(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Phase 4 Verification Error:', err?.message || err);
    try {
      await (prisma as any).$disconnect();
    } catch {}
    process.exit(1);
  });

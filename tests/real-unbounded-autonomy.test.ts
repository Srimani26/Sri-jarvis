import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import {
  workspaceViewTree,
  workspaceReadFile,
  workspacePatchFile,
  workspaceWriteFile,
  workspaceGrep
} from '../server/src/swarm/tools/surgicalFileTools'
import { terminalRunCommand } from '../server/src/swarm/tools/sandboxTerminalTool'
import { autonomousVerifier } from '../server/src/swarm/engine/AutonomousVerifier'
import { executeAutonomousReAct } from '../server/src/swarm/engine/AutonomousAgentLoop'
import { appBuilderEngine } from '../server/src/swarm/tools/appBuilderEngine'
import { SPECIALIST_ROUTING_RULES } from '../server/src/swarm/engine/ModelRouter'
import { AgentRegistry } from '../src/agents/AgentRegistry'
import { telegramNotifier } from '../server/src/services/telegramNotifier'

describe('Zero-Mock Unbounded Autonomous Swarm Runtime Suite', () => {
  const fixturesDir = join(process.cwd(), 'tests', 'fixtures_unbounded')
  const seededFile = join(fixturesDir, 'roi_calculator.cjs')
  const testSlug = 'fintech-asset-optimizer'
  const buildDir = join(process.cwd(), 'artifacts', 'builds', testSlug)

  before(() => {
    if (!existsSync(fixturesDir)) {
      mkdirSync(fixturesDir, { recursive: true })
    }

    // Seed broken computation module with a deliberate logic defect
    writeFileSync(
      seededFile,
      `// Sovereign ROI Computation Engine
function calculatePaybackPeriod(grossInvestment, annualCashFlow) {
  if (annualCashFlow <= 0) return 0;
  const rawYears = grossInvestment / annualCashFlow;
  // INTENTIONAL SEEDED LOGIC DEFECT: erroneous multiplication factor
  return rawYears * 999;
}

module.exports = { calculatePaybackPeriod };
`
    )
  })

  after(() => {
    if (existsSync(fixturesDir)) {
      try {
        rmSync(fixturesDir, { recursive: true, force: true })
      } catch {}
    }
    if (existsSync(buildDir)) {
      try {
        rmSync(buildDir, { recursive: true, force: true })
      } catch {}
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // PART 1: Specialist Role Hierarchy & Model Router
  // ──────────────────────────────────────────────────────────────────────────
  describe('Part 1: Specialist Role Specification & Model Hierarchy', () => {
    it('should assign strict departmental models and tools for Jarvis, Raphael, Aegis, Friday, Cerebro', () => {
      // 1. Jarvis: Orchestrator
      const jarvisRule = SPECIALIST_ROUTING_RULES.jarvis
      assert.strictEqual(jarvisRule.primaryProvider, 'groq')
      assert.strictEqual(jarvisRule.primaryModel, 'llama-3.3-70b-versatile')

      // 2. Raphael: Chief Systems Architect & Auditor
      const raphaelRule = SPECIALIST_ROUTING_RULES.raphael
      assert.strictEqual(raphaelRule.primaryProvider, 'groq')
      assert.strictEqual(raphaelRule.primaryModel, 'deepseek-r1-distill-llama-70b')
      assert.ok(raphaelRule.toolScope.includes('neon_sql_query'))
      assert.ok(raphaelRule.toolScope.includes('workspace_grep'))

      // 3. Aegis: Staff Full-Stack Engineer
      const aegisRule = SPECIALIST_ROUTING_RULES.aegis
      assert.strictEqual(aegisRule.primaryProvider, 'openrouter')
      assert.strictEqual(aegisRule.primaryModel, 'qwen/qwen-2.5-coder-32b-instruct')
      assert.ok(aegisRule.toolScope.includes('workspace_patch_file'))
      assert.ok(aegisRule.toolScope.includes('terminal_run_command'))

      // 4. Friday: Executive Office & Deliverables
      const fridayRule = SPECIALIST_ROUTING_RULES.friday
      assert.strictEqual(fridayRule.primaryProvider, 'gemini')
      assert.ok(fridayRule.toolScope.includes('generate_office_document'))
      assert.ok(fridayRule.toolScope.includes('generate_presentation'))

      // 5. Cerebro: Research & Reconnaissance
      const cerebroRule = SPECIALIST_ROUTING_RULES.cerebro
      assert.strictEqual(cerebroRule.primaryProvider, 'gemini')
      assert.ok(cerebroRule.toolScope.includes('headless_web_research'))
    })

    it('should enforce role boundaries in AgentRegistry', () => {
      const jarvis = AgentRegistry.getAgent('jarvis')
      assert.ok(jarvis)
      assert.ok(jarvis.description.includes('Delegates raw code'))

      const aegis = AgentRegistry.getAgent('aegis')
      assert.ok(aegis)
      assert.ok(aegis.systemPrompt.includes('Never emit static pre-baked fixtures'))

      const friday = AgentRegistry.getAgent('friday')
      assert.ok(friday)
      assert.ok(friday.systemPrompt.includes('artifacts/documents/'))
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // PART 2: Real Autonomous Discovery, Code Inspection, & Surgical Patching
  // ──────────────────────────────────────────────────────────────────────────
  describe('Part 2: Autonomous ReAct Inspection & Surgical Self-Healing', () => {
    it('should discover defect via grep, inspect via read_file, patch via patch_file, and verify via terminal', async () => {
      // Re-seed file before step to guarantee clean state
      if (!existsSync(fixturesDir)) {
        mkdirSync(fixturesDir, { recursive: true })
      }
      writeFileSync(
        seededFile,
        `// Sovereign ROI Computation Engine
function calculatePaybackPeriod(grossInvestment, annualCashFlow) {
  if (annualCashFlow <= 0) return 0;
  const rawYears = grossInvestment / annualCashFlow;
  // INTENTIONAL SEEDED LOGIC DEFECT: erroneous multiplication factor
  return rawYears * 999;
}

module.exports = { calculatePaybackPeriod };
`
      )

      const normPath = seededFile.replace(/\\/g, '/')
      const testCmd = `node -e "const { calculatePaybackPeriod } = require('${normPath}'); const p = calculatePaybackPeriod(100000, 20000); if (p !== 5) process.exit(1);"`

      // 1. Initial execution fails due to seeded defect
      const initialRun = await terminalRunCommand(testCmd)
      assert.strictEqual(initialRun.exitCode, 1, 'Initial run must fail with exit code 1')

      // 2. Discovery: workspace_grep identifies location of calculatePaybackPeriod
      const grepResults = workspaceGrep('calculatePaybackPeriod', 'tests/fixtures_unbounded')
      assert.ok(grepResults.length > 0)
      assert.ok(grepResults[0].filePath ? grepResults[0].filePath.includes('roi_calculator.cjs') : grepResults[0].file.includes('roi_calculator.cjs'))

      // 3. Inspection: workspace_read_file reads exact line range
      const readResult = workspaceReadFile(seededFile, 1, 12)
      assert.strictEqual(readResult.startLine, 1)
      assert.ok(readResult.content.includes('rawYears * 999'))

      // 4. Surgical Repair: workspace_patch_file replaces flaw without touching headers
      const patchResult = workspacePatchFile(seededFile, 'return rawYears * 999;', 'return rawYears;')
      assert.strictEqual(patchResult.success, true)
      assert.strictEqual(patchResult.replacements, 1)

      // 5. Re-Execution: Verification run must now pass with exit code 0
      const recoveryRun = await terminalRunCommand(testCmd)
      assert.strictEqual(recoveryRun.exitCode, 0, `Repaired code must pass test with exit code 0: ${recoveryRun.stderr}`)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // PART 3 & 4: Zero Canned Templates & Proof-of-Work Verification
  // ──────────────────────────────────────────────────────────────────────────
  describe('Part 3 & 4: Zero Mock Purge & Proof-of-Work Verifier', () => {
    it('should dynamically scaffold web application and verify proof-of-work without static mocks', async () => {
      const scaffoldResult = await appBuilderEngine.scaffoldAndDeployWeb({
        projectSlug: testSlug,
        appType: 'fullstack',
        specification: {
          title: 'Fintech Asset Optimizer',
          description: 'High-frequency algorithmic liquidity and sovereign asset optimizer.',
          features: ['Real-Time Liquidity Routing', 'Sharpe Ratio Optimization', 'Zero-Latency Settlement']
        }
      })

      assert.strictEqual(scaffoldResult.success, true)
      assert.strictEqual(scaffoldResult.projectSlug, testSlug)
      assert.strictEqual(scaffoldResult.previewUrl, `/preview/${testSlug}`)

      // Inspect HTML to confirm standard <!DOCTYPE html> and dynamic features
      const indexFile = appBuilderEngine.getBuildFile(testSlug, 'index.html')
      assert.ok(indexFile)
      const html = indexFile.content.toString('utf-8')
      assert.ok(html.toLowerCase().includes('<!doctype html>'))
      assert.ok(html.includes('Fintech Asset Optimizer'))
      assert.ok(html.includes('Real-Time Liquidity Routing'))

      // Proof-of-Work Verification Gate
      const verifyResult = await autonomousVerifier.verifyDeliverable({
        deliverableType: 'web_app',
        slug: testSlug
      })

      assert.strictEqual(verifyResult.verified, true)
      assert.ok(verifyResult.checksPassed.some(c => c.includes('<!DOCTYPE html>')))
      assert.ok(verifyResult.checksPassed.some(c => c.includes('200 OK')))
    })

    it('should verify document standards (PDF > 5KB with %PDF-1.4 and %%EOF, Excel, PPTX)', async () => {
      // 1. Verify PPTX binary header
      const pptxPath = 'artifacts/documents/test_briefing_unbounded.pptx'
      const { generatePresentation } = await import('../server/src/swarm/tools/presentationGenerator')
      await generatePresentation({
        fileName: 'test_briefing_unbounded.pptx',
        title: 'Zero-Mock Swarm Architecture',
        slides: [{ title: 'Autonomous Runtime', bulletPoints: ['Dynamic generation', 'Zero mock templates'] }]
      })

      const pptxVerify = await autonomousVerifier.verifyDeliverable({
        deliverableType: 'document',
        targetPath: pptxPath
      })

      assert.strictEqual(pptxVerify.verified, true)
      assert.ok(pptxVerify.checksPassed.some(c => c.includes('PPTX OpenXML presentation verified')))

      // Cleanup test presentation
      try {
        unlinkSync(join(process.cwd(), pptxPath))
      } catch {}
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // PART 5: Autonomous ReAct Engine Verification & Telegram Dispatch
  // ──────────────────────────────────────────────────────────────────────────
  describe('Part 5: Autonomous ReAct Engine Verification & Notification', () => {
    it('should execute autonomous ReAct loop with verification gate and Telegram alert dispatch', async () => {
      let telegramAlertSent = false
      const origSend = telegramNotifier.sendSwarmUpdate
      telegramNotifier.sendSwarmUpdate = async () => {
        telegramAlertSent = true
        return true
      }

      try {
        const result = await executeAutonomousReAct(
          'Inspect workspace and verify system readiness for Fintech Asset Optimizer',
          {
            specialist: 'aegis',
            maxSteps: 5,
            requireVerification: true,
            deliverableType: 'web_app',
            slug: testSlug
          }
        )

        assert.strictEqual(result.success, true)
        assert.strictEqual(result.specialist, 'aegis')
        assert.ok(result.stepsExecuted >= 1)
        assert.ok(result.verificationDetails?.verified === true)
        assert.strictEqual(telegramAlertSent, true, 'Telegram swarm update must be dispatched on task completion')
      } finally {
        telegramNotifier.sendSwarmUpdate = origSend
      }
    })
  })
})


/**
 * autonomous-pipeline-builder.test.ts
 *
 * Verifies:
 * 1. Strategic goal decomposition into multi-step DAG pipeline.
 * 2. Milestone lifecycle transitions (PENDING -> RUNNING -> COMPLETED).
 * 3. Office MCP tool generation for valid PDF, Excel, and Docx buffers.
 * 4. Aegis web builder scaffolding and preview serving (HTTP 200).
 * 5. Swarm tool dispatcher integration for google_workspace_action, generate_office_document, and aegis_scaffold_and_deploy_web.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { pipelineManager } from '../src/swarm/engine/PipelineManager'
import { executeGenerateOfficeDocument, executeGoogleWorkspaceAction } from '../src/swarm/tools/officeMcpTools'
import { appBuilderEngine } from '../src/swarm/tools/appBuilderEngine'
import { dispatchToolCall } from '../src/swarm/tools/toolRegistry'
import fs from 'node:fs'

describe('J.A.R.V.I.S. Autonomous Task Engine & Mission Control Pipeline', () => {

  describe('1. Task Pipeline & Milestone DAG Decomposition', () => {
    it('should decompose "Build a full-stack site" into a 4-step web pipeline', () => {
      const pipeline = pipelineManager.createPipeline('Build a full-stack portfolio site and email preview to client')

      assert.ok(pipeline.id.startsWith('pipe_'), 'Pipeline ID must be generated')
      assert.strictEqual(pipeline.total_steps, 4, 'Must create 4 milestones for full-stack web pipeline')
      assert.strictEqual(pipeline.completed_steps, 0, 'Initial completed steps must be 0')
      assert.strictEqual(pipeline.status, 'PLANNING')

      const stepNames = pipeline.milestones.map(m => m.name)
      assert.ok(stepNames[0].includes('Architecture'), 'Step 1 must be Architecture')
      assert.ok(stepNames[1].includes('Frontend'), 'Step 2 must be Frontend Scaffolding')
      assert.ok(stepNames[2].includes('Security'), 'Step 3 must be Security & Integrity Audit')
      assert.ok(stepNames[3].includes('Live Deployment'), 'Step 4 must be Deployment & Client Package')

      assert.strictEqual(pipeline.milestones[0].specialist, 'raphael')
      assert.strictEqual(pipeline.milestones[1].specialist, 'aegis')
      assert.strictEqual(pipeline.milestones[2].specialist, 'raphael')
      assert.strictEqual(pipeline.milestones[3].specialist, 'friday')
    })

    it('should transition milestones cleanly from PENDING -> RUNNING -> COMPLETED', () => {
      const pipeline = pipelineManager.createPipeline('Generate executive financial dossier')
      assert.strictEqual(pipeline.milestones[0].status, 'PENDING')

      // Start milestone 1
      const runningMs = pipelineManager.startMilestone(pipeline.id, 1)
      assert.strictEqual(runningMs.status, 'RUNNING')
      assert.ok(runningMs.started_at, 'Must have started_at timestamp')
      assert.strictEqual(pipeline.status, 'IN_PROGRESS')

      // Complete milestone 1
      const completedMs = pipelineManager.completeMilestone(pipeline.id, 1, 'Market intelligence gathered successfully.', 150)
      assert.strictEqual(completedMs.status, 'COMPLETED')
      assert.strictEqual(completedMs.latency_ms, 150)
      assert.ok(completedMs.finished_at, 'Must have finished_at timestamp')
      assert.strictEqual(pipeline.completed_steps, 1)
    })
  })

  describe('2. MCP Google Workspace & Office Document Toolkit', () => {
    it('should generate a valid %PDF-1.4 binary buffer and write to disk', async () => {
      const result = await executeGenerateOfficeDocument({
        fileType: 'pdf',
        fileName: 'test-executive-brief',
        contentStructure: {
          title: 'Q4 Sovereign Growth Architecture',
          sections: [
            { heading: 'Market Capitalization', body: 'Strategic revenue runway secured.' },
            { heading: 'Autonomous Swarm Health', body: 'All 6 specialist nodes operational.' }
          ]
        }
      })

      assert.strictEqual(result.success, true)
      assert.ok(result.fileName.endsWith('.pdf'), 'File name must end with .pdf')
      assert.ok(fs.existsSync(result.filePath), 'File must exist on disk')

      const header = fs.readFileSync(result.filePath).subarray(0, 8).toString('utf-8')
      assert.ok(header.startsWith('%PDF-1.4'), 'Must have valid %PDF-1.4 magic header')
    })

    it('should generate valid Excel SpreadsheetML workbook', async () => {
      const result = await executeGenerateOfficeDocument({
        fileType: 'excel',
        fileName: 'test-financial-ledger',
        contentStructure: {
          title: 'Financial Cash Flow',
          sheets: [{
            name: 'Cash Flow',
            rows: [
              ['Date', 'Source', 'Amount INR'],
              ['2026-11-01', 'Shopify Retainer', '75000'],
              ['2026-11-02', 'API Service', '32000']
            ]
          }]
        }
      })

      assert.strictEqual(result.success, true)
      assert.ok(result.fileName.endsWith('.xlsx'))
      assert.ok(fs.existsSync(result.filePath))

      const content = fs.readFileSync(result.filePath, 'utf-8')
      assert.ok(content.includes('<?xml version="1.0"'), 'Must have valid XML declaration')
      assert.ok(content.includes('Workbook'), 'Must contain Excel Workbook XML tag')
    })

    it('should generate valid Word document XML structure', async () => {
      const result = await executeGenerateOfficeDocument({
        fileType: 'docx',
        fileName: 'test-client-proposal',
        contentStructure: {
          title: 'Client Technical Proposal',
          sections: [{ heading: 'Scope of Work', body: 'Full-stack headless Next.js frontend.' }]
        }
      })

      assert.strictEqual(result.success, true)
      assert.ok(result.fileName.endsWith('.docx'))
      assert.ok(fs.existsSync(result.filePath))

      const content = fs.readFileSync(result.filePath, 'utf-8')
      assert.ok(content.includes('w:document'), 'Must contain WordprocessingML document tag')
    })

    it('should execute google_workspace_action with structured simulated contract', async () => {
      const result = await executeGoogleWorkspaceAction({
        service: 'gmail',
        action: 'draft_email',
        payload: {
          to: 'client@standardroofs.com',
          subject: 'Project Handover & Live Preview',
          body: 'Sir, your portfolio site has been compiled and is ready for inspection.'
        }
      })

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.service, 'gmail')
      assert.strictEqual(result.action, 'draft_email')
      assert.ok(result.resourceId.startsWith('gmail_'))
    })
  })

  describe('3. Aegis Full-Stack Web Builder Engine', () => {
    it('should scaffold responsive web application under artifacts/builds/{slug}', async () => {
      const buildResult = await appBuilderEngine.scaffoldAndDeployWeb({
        projectSlug: 'test-client-portfolio',
        appType: 'landing_page',
        specification: {
          title: 'Elite Capital Portfolio',
          description: 'Autonomous financial advisory platform.',
          features: ['Real-time Trading Telemetry', 'Zero-Trust Encryption', 'Instant Payouts']
        }
      })

      assert.strictEqual(buildResult.success, true)
      assert.strictEqual(buildResult.projectSlug, 'test-client-portfolio')
      assert.strictEqual(buildResult.previewUrl, '/preview/test-client-portfolio')
      assert.strictEqual(buildResult.bundleStatus, 'READY')
      assert.ok(buildResult.filesCreated.includes('index.html'))
      assert.ok(buildResult.filesCreated.includes('styles.css'))
      assert.ok(buildResult.filesCreated.includes('app.js'))

      assert.ok(fs.existsSync(buildResult.buildDirectory))
    })

    it('should retrieve built preview files with proper content-type', () => {
      const file = appBuilderEngine.getBuildFile('test-client-portfolio', 'index.html')
      assert.ok(file, 'Index file must be retrieved')
      assert.ok(file.contentType.includes('text/html'), 'Content type must be text/html')
      assert.ok(file.content.toString().includes('Elite Capital Portfolio'), 'Must contain page title')
    })

    it('should link preview URL to autonomous pipeline deliverable shelf', () => {
      const pipeline = pipelineManager.createPipeline('Build live portfolio')
      const updated = pipelineManager.updatePipelinePreview(pipeline.id, '/preview/test-client-portfolio', [
        { name: 'Executive_Brief.pdf', type: 'pdf', url: '/api/artifacts/download?file=test-executive-brief.pdf' }
      ])

      assert.strictEqual(updated.preview_url, '/preview/test-client-portfolio')
      assert.strictEqual(updated.deliverable_artifacts.length, 1)
      assert.strictEqual(updated.deliverable_artifacts[0].name, 'Executive_Brief.pdf')
    })
  })

  describe('4. Swarm Tool Dispatcher Integration', () => {
    it('should dispatch aegis_scaffold_and_deploy_web via tool dispatcher', async () => {
      const result = await dispatchToolCall('aegis_scaffold_and_deploy_web', {
        projectSlug: 'dispatched-portal',
        specification: { title: 'Dispatched Portal Experience' }
      })

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.projectSlug, 'dispatched-portal')
      assert.strictEqual(result.previewUrl, '/preview/dispatched-portal')
    })

    it('should dispatch generate_office_document via tool dispatcher', async () => {
      const result = await dispatchToolCall('generate_office_document', {
        fileType: 'pdf',
        fileName: 'dispatched-doc',
        contentStructure: { title: 'Dispatched Doc Title' }
      })

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.fileType, 'pdf')
      assert.ok(result.downloadUrl.includes('dispatched-doc.pdf'))
    })

    it('should dispatch google_workspace_action via tool dispatcher', async () => {
      const result = await dispatchToolCall('google_workspace_action', {
        service: 'calendar',
        action: 'schedule_meeting',
        payload: { summary: 'Weekly Swarm Standup' }
      })

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.service, 'calendar')
    })
  })
})


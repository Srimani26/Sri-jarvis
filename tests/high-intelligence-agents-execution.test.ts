/**
 * tests/high-intelligence-agents-execution.test.ts
 * Rigorous integration test verifying:
 * 1. Specialist agent model routing (Raphael, Aegis, Friday, Jarvis, Cerebro)
 * 2. Real deliverable production (Aegis web scaffolding, Friday PDF >5KB, Excel SpreadsheetML)
 * 3. End-to-end multi-agent swarm pipeline execution with Neon DB milestone audit tracking
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AgentRegistry } from '../src/agents/AgentRegistry'
import { swarmModelRouter, SPECIALIST_ROUTING_RULES } from '../src/swarm/engine/ModelRouter'
import { appBuilderEngine } from '../src/swarm/tools/appBuilderEngine'
import {
  executeGenerateOfficeDocument,
  buildValidPdfBuffer,
  buildValidSpreadsheetBuffer
} from '../src/swarm/tools/officeMcpTools'
import { pipelineManager } from '../src/swarm/engine/PipelineManager'
import { taskAuditService } from '../src/services/taskAuditService'

describe('Specialist Agent High-Intelligence Upgrade & Real Deliverable Production', () => {

  describe('Criterion 1: Specialized Model Routing by Role', () => {
    it('should configure Raphael with DeepSeek-R1 deep reasoning and schema tools', () => {
      const routing = swarmModelRouter.getSpecialistRouting('raphael')
      assert.strictEqual(routing.primaryProvider, 'groq')
      assert.strictEqual(routing.primaryModel, 'deepseek-r1-distill-llama-70b')
      assert.ok(routing.fallbackChain.some(f => f.model.includes('deepseek-r1')))
      assert.ok(routing.toolScope.includes('neon_sql_query'))

      const spec = AgentRegistry.getAgent('raphael')
      assert.ok(spec, 'Raphael agent specification must be registered')
      assert.ok(spec.preferredModels.some(m => m.includes('deepseek-r1')))
    })

    it('should configure Aegis with Qwen 2.5 Coder and full-stack web scaffolding tools', () => {
      const routing = swarmModelRouter.getSpecialistRouting('aegis')
      assert.strictEqual(routing.primaryProvider, 'openrouter')
      assert.strictEqual(routing.primaryModel, 'qwen/qwen-2.5-coder-32b-instruct')
      assert.ok(routing.fallbackChain.some(f => f.model.includes('llama-3.3-70b-versatile')))
      assert.ok(routing.toolScope.includes('aegis_scaffold_and_deploy_web'))

      const spec = AgentRegistry.getAgent('aegis')
      assert.ok(spec, 'Aegis agent specification must be registered')
      assert.ok(spec.preferredModels.some(m => m.includes('qwen/qwen-2.5-coder-32b-instruct')))
    })

    it('should configure Friday with Gemini infinite-context document tools', () => {
      const routing = swarmModelRouter.getSpecialistRouting('friday')
      assert.strictEqual(routing.primaryProvider, 'gemini')
      assert.strictEqual(routing.primaryModel, 'gemini-flash-lite-latest')
      assert.ok(routing.toolScope.includes('generate_office_document'))
      assert.ok(routing.toolScope.includes('google_workspace_action'))

      const spec = AgentRegistry.getAgent('friday')
      assert.ok(spec, 'Friday agent specification must be registered')
      assert.ok(spec.preferredModels.some(m => m.includes('gemini-flash-lite-latest')))
    })

    it('should configure Jarvis with Groq high-speed executive orchestrator', () => {
      const routing = swarmModelRouter.getSpecialistRouting('jarvis')
      assert.strictEqual(routing.primaryProvider, 'groq')
      assert.strictEqual(routing.primaryModel, 'llama-3.3-70b-versatile')
      assert.ok(routing.toolScope.includes('*'))

      const spec = AgentRegistry.getAgent('jarvis')
      assert.ok(spec, 'Jarvis agent specification must be registered')
      assert.ok(spec.preferredModels.some(m => m.includes('groq/llama-3.3-70b-versatile')))
    })
  })

  describe('Criterion 2: Enforce Non-Empty Real Artifact Creation', () => {
    const slug = 'solar-roofing-suite'

    it('Aegis: should scaffold functional Commercial Solar & Roofing Cost Estimation Suite', async () => {
      const result = await appBuilderEngine.scaffoldAndDeployWeb({
        projectSlug: slug,
        appType: 'fullstack',
        specification: {
          title: 'Commercial Solar & Roofing Cost Estimation Suite',
          description: 'Autonomous turnkey budgeting, structural load analysis, and IRA 30% Investment Tax Credit modeling.'
        }
      })

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.projectSlug, slug)
      assert.strictEqual(result.previewUrl, `/preview/${slug}`)
      assert.ok(result.filesCreated.includes('index.html'))
      assert.ok(result.filesCreated.includes('styles.css'))
      assert.ok(result.filesCreated.includes('app.js'))

      // Inspect served files at /preview/{slug}
      const indexFile = appBuilderEngine.getBuildFile(slug, 'index.html')
      assert.ok(indexFile, 'index.html must be served')
      assert.strictEqual(indexFile.contentType, 'text/html; charset=UTF-8')

      const htmlContent = indexFile.content.toString('utf-8')
      assert.ok(htmlContent.includes('Commercial Solar & Roofing Cost Estimation Suite'))
      assert.ok(htmlContent.includes('roof-sqft'), 'Must contain interactive range inputs')
      assert.ok(htmlContent.includes('solar-kw'), 'Must contain solar capacity slider')
      assert.ok(htmlContent.includes('battery-kwh'), 'Must contain battery storage input')
      assert.ok(htmlContent.includes('itc-incentive'), 'Must contain Federal ITC 30% incentive badge')

      const jsFile = appBuilderEngine.getBuildFile(slug, 'app.js')
      assert.ok(jsFile, 'app.js must be served')
      const jsContent = jsFile.content.toString('utf-8')
      assert.ok(jsContent.includes('calculate()'), 'Must contain working JavaScript calculation engine')
      assert.ok(jsContent.includes('grossCapex'), 'Must perform real monetary arithmetic')

      const cssFile = appBuilderEngine.getBuildFile(slug, 'styles.css')
      assert.ok(cssFile, 'styles.css must be served')
      const cssContent = cssFile.content.toString('utf-8')
      assert.ok(cssContent.includes('--surface'), 'Must contain dark-mode glassmorphic theme variables')
    })

    it('Friday: should compile genuine binary PDF proposal (>5KB binary buffer)', async () => {
      const docResult = await executeGenerateOfficeDocument({
        fileType: 'pdf',
        fileName: 'Solar_Roofing_Proposal.pdf',
        contentStructure: {
          title: 'Commercial Solar & Roofing Turnkey Engineering Proposal',
          sections: [
            {
              heading: 'Executive Engineering Scope',
              body: 'Turnkey solar PV installation and roof membrane revitalization for commercial facility.'
            },
            {
              heading: 'Structural Load & Technical Specifications',
              body: 'Ballasted racking designed to withstand 140mph wind uplift with certified PE structural stamp.'
            }
          ]
        }
      })

      assert.strictEqual(docResult.success, true)
      assert.strictEqual(docResult.fileName, 'Solar_Roofing_Proposal.pdf')
      assert.ok(docResult.filePath.endsWith('.pdf'))
      assert.ok(existsSync(docResult.filePath), 'File must exist on disk')

      const fileBuffer = readFileSync(docResult.filePath)
      assert.ok(fileBuffer.length > 5120, `PDF size must exceed 5KB (>5120 bytes), actual was ${fileBuffer.length} bytes`)

      // Verify PDF 1.4 header and trailer
      const fileHeader = fileBuffer.subarray(0, 8).toString('utf-8')
      assert.ok(fileHeader.startsWith('%PDF-1.4'), 'Must be a valid %PDF-1.4 file')
      const fileString = fileBuffer.toString('utf-8')
      assert.ok(fileString.includes('trailer'), 'Must contain valid PDF trailer')
      assert.ok(fileString.includes('startxref'), 'Must contain xref offset pointer')
      assert.ok(fileString.includes('%%EOF'), 'Must end with PDF EOF marker')
    })

    it('Friday: should compile valid Excel (.xlsx) cost breakdown with populated rows and formulas', async () => {
      const docResult = await executeGenerateOfficeDocument({
        fileType: 'excel',
        fileName: 'Solar_Cost_Breakdown.xlsx',
        contentStructure: {
          title: 'Commercial Solar & Roofing Capital Expenditure Matrix',
          sheets: [
            {
              name: 'Cost Breakdown',
              rows: [
                ['Category', 'Scope', 'Unit Rate', 'Total Amount'],
                ['TPO Commercial Roofing', '15,000 sq ft', 8.50, 127500.00],
                ['Bifacial Solar Modules', '120 kW', 950.00, 114000.00],
                ['BESS Battery System', '80 kWh', 650.00, 52000.00]
              ]
            }
          ]
        }
      })

      assert.strictEqual(docResult.success, true)
      assert.strictEqual(docResult.fileName, 'Solar_Cost_Breakdown.xlsx')
      assert.ok(existsSync(docResult.filePath), 'Excel file must exist on disk')

      const fileBuffer = readFileSync(docResult.filePath)
      const xmlString = fileBuffer.toString('utf-8')
      assert.ok(xmlString.includes('<Workbook'), 'Must be valid SpreadsheetML XML workbook')
      assert.ok(xmlString.includes('<Worksheet ss:Name="Cost Breakdown"'), 'Must contain Cost Breakdown sheet')
      assert.ok(xmlString.includes('127500'), 'Must contain actual numerical capex figures')
    })
  })

  describe('Criterion 3: Multi-Agent Swarm Integration & Milestone Audit Tracking', () => {
    it('should coordinate Raphael, Aegis, and Friday through a full milestone lifecycle', async () => {
      const directive = 'Build a Commercial Solar & Roofing Cost Estimation Suite with an interactive web calculator, an executive PDF proposal, and an Excel cost breakdown.'
      const pipeline = pipelineManager.createPipeline(directive, 'Commercial Solar & Roofing Initiative')

      assert.ok(pipeline.id.startsWith('pipe_'))
      assert.strictEqual(pipeline.status, 'PLANNING')
      assert.ok(pipeline.milestones.length >= 3, 'Must decompose into at least 3 milestones')

      // Milestone 1: Raphael (Architecture)
      const ms1 = pipelineManager.startMilestone(pipeline.id, 1)
      assert.strictEqual(ms1.status, 'RUNNING')
      assert.strictEqual(pipeline.status, 'IN_PROGRESS')

      const raphaelSpec = 'Raphael Architecture Spec: DDL schema created, 140mph wind load certified, zero AST security violations.'
      pipelineManager.completeMilestone(pipeline.id, 1, raphaelSpec, 45)
      assert.strictEqual(ms1.status, 'COMPLETED')

      // Milestone 2: Aegis (Scaffolding)
      const ms2 = pipelineManager.startMilestone(pipeline.id, 2)
      assert.strictEqual(ms2.status, 'RUNNING')

      const aegisResult = await appBuilderEngine.scaffoldAndDeployWeb({
        projectSlug: 'solar-roofing-suite',
        specification: { title: 'Commercial Solar & Roofing Cost Estimation Suite' }
      })
      pipelineManager.completeMilestone(pipeline.id, 2, `Aegis Scaffolded Live Web: ${aegisResult.previewUrl}`, 80)
      assert.strictEqual(ms2.status, 'COMPLETED')

      // Milestone 3: Friday (Office Deliverables)
      const ms3 = pipelineManager.startMilestone(pipeline.id, 3)
      assert.strictEqual(ms3.status, 'RUNNING')

      const pdfDoc = await executeGenerateOfficeDocument({
        fileType: 'pdf',
        fileName: 'Solar_Roofing_Proposal.pdf',
        contentStructure: { title: 'Solar Roofing Turnkey Proposal' }
      })
      const excelDoc = await executeGenerateOfficeDocument({
        fileType: 'excel',
        fileName: 'Solar_Cost_Breakdown.xlsx',
        contentStructure: { title: 'Solar Cost Breakdown' }
      })

      pipelineManager.updatePipelinePreview(pipeline.id, aegisResult.previewUrl, [
        { name: 'Solar_Roofing_Proposal.pdf', type: 'pdf', url: pdfDoc.downloadUrl, sizeBytes: pdfDoc.sizeBytes },
        { name: 'Solar_Cost_Breakdown.xlsx', type: 'excel', url: excelDoc.downloadUrl, sizeBytes: excelDoc.sizeBytes }
      ])

      // Complete any remaining milestones
      for (let s = 3; s <= pipeline.total_steps; s++) {
        const m = pipeline.milestones.find(item => item.step_order === s)
        if (m && m.status !== 'COMPLETED') {
          pipelineManager.startMilestone(pipeline.id, s)
          pipelineManager.completeMilestone(pipeline.id, s, 'Stage deliverable validated and signed off.', 60)
        }
      }

      // Final Pipeline Verification
      const finalPipeline = pipelineManager.getPipeline(pipeline.id)
      assert.ok(finalPipeline)
      assert.strictEqual(finalPipeline.status, 'COMPLETED')
      assert.strictEqual(finalPipeline.completed_steps, finalPipeline.total_steps)
      assert.strictEqual(finalPipeline.preview_url, '/preview/solar-roofing-suite')
      assert.ok(finalPipeline.deliverable_artifacts.length >= 2)

      // Verify Audit Logging
      const recentAudit = await taskAuditService.getRecentLogs(10)
      assert.ok(recentAudit.length > 0, 'Audit records must be persisted in task audit log')
    })
  })
})


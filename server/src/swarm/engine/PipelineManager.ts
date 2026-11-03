/**
 * PipelineManager.ts — Autonomous Task DAG & Milestone Execution Engine
 * Target: src/swarm/engine/PipelineManager.ts & server/src/swarm/engine/PipelineManager.ts
 *
 * Implements:
 * 1. Strategic goal decomposition into multi-step DAG pipelines.
 * 2. Real-time milestone state tracking (PENDING -> RUNNING -> COMPLETED).
 * 3. Integrated execution via Swarm specialists (Raphael, Aegis, Friday, Jarvis).
 * 4. WebSocket & REST telemetry updates for Visual HUD.
 */

import { executeAutonomousTask } from './AgentLoop'
import { SwarmSpecialist } from './ModelRouter'
import { telegramNotifier } from '../../services/telegramNotifier'
import { taskAuditService } from '../../services/taskAuditService'

export interface PipelineMilestone {
  id: string
  pipeline_id: string
  step_order: number
  name: string
  specialist: SwarmSpecialist
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  output_summary?: string
  latency_ms?: number
  started_at?: string
  finished_at?: string
}

export interface AutonomousPipeline {
  id: string
  title: string
  goal: string
  status: 'PLANNING' | 'IN_PROGRESS' | 'AWAITING_REVIEW' | 'COMPLETED' | 'FAILED'
  assigned_agents: string[]
  total_steps: number
  completed_steps: number
  estimated_duration_sec: number
  started_at: string
  completed_at?: string
  preview_url?: string
  deliverable_artifacts: Array<{ name: string; type: string; url: string; sizeBytes?: number }>
  milestones: PipelineMilestone[]
}

export class PipelineManager {
  private static instance: PipelineManager
  private pipelines: Map<string, AutonomousPipeline> = new Map()

  public static getInstance(): PipelineManager {
    if (!PipelineManager.instance) {
      PipelineManager.instance = new PipelineManager()
    }
    return PipelineManager.instance
  }

  /**
   * Decomposes a high-level goal into an execution DAG with milestones
   */
  public createPipeline(goal: string, customTitle?: string): AutonomousPipeline {
    const id = `pipe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const lower = goal.toLowerCase()

    let title = customTitle || 'Autonomous Swarm Initiative'
    let milestonesSpec: Array<{ name: string; specialist: SwarmSpecialist }> = []

    if (lower.includes('site') || lower.includes('web') || lower.includes('portfolio') || lower.includes('app')) {
      title = customTitle || 'Full-Stack Web Application Pipeline'
      milestonesSpec = [
        { name: 'Architecture & System Specification', specialist: 'raphael' },
        { name: 'Frontend Scaffolding & Responsive Styling', specialist: 'aegis' },
        { name: 'Security Perimeter & Code Integrity Audit', specialist: 'raphael' },
        { name: 'Live Deployment Preview & Client Package', specialist: 'friday' }
      ]
    } else if (lower.includes('document') || lower.includes('report') || lower.includes('dossier') || lower.includes('excel')) {
      title = customTitle || 'Executive Intelligence & Office Document Pipeline'
      milestonesSpec = [
        { name: 'Deep Market & Data Gathering', specialist: 'cerebro' },
        { name: 'Structured Financial & Document Synthesis', specialist: 'midas' },
        { name: 'Office Artifact Generation & Quality Sign-Off', specialist: 'friday' }
      ]
    } else {
      milestonesSpec = [
        { name: 'Strategic Requirement Analysis', specialist: 'jarvis' },
        { name: 'Autonomous Task Execution & Synthesis', specialist: 'aegis' },
        { name: 'Executive Deliverable Review', specialist: 'friday' }
      ]
    }

    const milestones: PipelineMilestone[] = milestonesSpec.map((spec, idx) => ({
      id: `ms_${id}_${idx + 1}`,
      pipeline_id: id,
      step_order: idx + 1,
      name: spec.name,
      specialist: spec.specialist,
      status: 'PENDING'
    }))

    const assigned_agents = Array.from(new Set(milestones.map(m => m.specialist)))
    const estimated_duration_sec = milestones.length * 15

    const pipeline: AutonomousPipeline = {
      id,
      title,
      goal,
      status: 'PLANNING',
      assigned_agents,
      total_steps: milestones.length,
      completed_steps: 0,
      estimated_duration_sec,
      started_at: new Date().toISOString(),
      deliverable_artifacts: [],
      milestones
    }

    this.pipelines.set(id, pipeline)
    return pipeline
  }

  public getPipeline(id: string): AutonomousPipeline | undefined {
    return this.pipelines.get(id)
  }

  public listPipelines(): AutonomousPipeline[] {
    return Array.from(this.pipelines.values()).sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
  }

  /**
   * Start a specific milestone
   */
  public startMilestone(pipelineId: string, stepOrder: number): PipelineMilestone {
    const pipeline = this.pipelines.get(pipelineId)
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`)

    const milestone = pipeline.milestones.find(m => m.step_order === stepOrder)
    if (!milestone) throw new Error(`Milestone ${stepOrder} not found in pipeline ${pipelineId}`)

    milestone.status = 'RUNNING'
    milestone.started_at = new Date().toISOString()
    pipeline.status = 'IN_PROGRESS'

    taskAuditService.logToolExecution(
      pipelineId,
      `milestone_start_${milestone.specialist}`,
      { stepOrder, name: milestone.name, specialist: milestone.specialist },
      { status: 'RUNNING' },
      'SUCCESS',
      0
    ).catch(() => {})

    return milestone
  }

  /**
   * Complete a milestone and increment completed_steps
   */
  public completeMilestone(
    pipelineId: string,
    stepOrder: number,
    outputSummary: string,
    latencyMs: number
  ): PipelineMilestone {
    const pipeline = this.pipelines.get(pipelineId)
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`)

    const milestone = pipeline.milestones.find(m => m.step_order === stepOrder)
    if (!milestone) throw new Error(`Milestone ${stepOrder} not found in pipeline ${pipelineId}`)

    milestone.status = 'COMPLETED'
    milestone.output_summary = outputSummary
    milestone.latency_ms = latencyMs
    milestone.finished_at = new Date().toISOString()

    taskAuditService.logToolExecution(
      pipelineId,
      `milestone_complete_${milestone.specialist}`,
      { stepOrder, name: milestone.name, specialist: milestone.specialist },
      { status: 'COMPLETED', outputSummary },
      'SUCCESS',
      latencyMs
    ).catch(() => {})

    pipeline.completed_steps = pipeline.milestones.filter(m => m.status === 'COMPLETED').length
    if (pipeline.completed_steps >= pipeline.total_steps) {
      pipeline.status = 'COMPLETED'
      pipeline.completed_at = new Date().toISOString()

      taskAuditService.logToolExecution(
        pipelineId,
        'pipeline_all_milestones_completed',
        { title: pipeline.title, totalSteps: pipeline.total_steps },
        { status: 'COMPLETED' },
        'SUCCESS',
        0
      ).catch(() => {})
    }

    return milestone
  }

  /**
   * Attach preview url and deliverables
   */
  public updatePipelinePreview(
    pipelineId: string,
    previewUrl: string,
    deliverables?: Array<{ name: string; type: string; url: string; sizeBytes?: number }>
  ): AutonomousPipeline {
    const pipeline = this.pipelines.get(pipelineId)
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`)

    pipeline.preview_url = previewUrl
    if (deliverables) {
      pipeline.deliverable_artifacts.push(...deliverables)
    }

    return pipeline
  }

  /**
   * Execute the full pipeline asynchronously
   */
  public async executePipeline(pipelineId: string): Promise<AutonomousPipeline> {
    const pipeline = this.pipelines.get(pipelineId)
    if (!pipeline) throw new Error(`Pipeline ${pipelineId} not found`)

    pipeline.status = 'IN_PROGRESS'

    for (const milestone of pipeline.milestones) {
      this.startMilestone(pipelineId, milestone.step_order)
      const startTime = Date.now()

      try {
        const directive = `[Pipeline: ${pipeline.title}] Step ${milestone.step_order}/${pipeline.total_steps}: ${milestone.name}. Overall Goal: ${pipeline.goal}`
        const result = await executeAutonomousTask(directive, milestone.specialist)
        const latencyMs = Date.now() - startTime

        if (result.success) {
          this.completeMilestone(pipelineId, milestone.step_order, result.finalResponse, latencyMs)
        } else {
          milestone.status = 'FAILED'
          milestone.output_summary = result.finalResponse
          milestone.latency_ms = latencyMs
          pipeline.status = 'FAILED'
          break
        }
      } catch (err: any) {
        milestone.status = 'FAILED'
        milestone.output_summary = err?.message || String(err)
        milestone.latency_ms = Date.now() - startTime
        pipeline.status = 'FAILED'
        break
      }
    }

    // Alert Telegram on completion
    await telegramNotifier.sendSwarmUpdate(
      'jarvis',
      `Pipeline: ${pipeline.title}`,
      pipeline.status === 'COMPLETED' ? 'SUCCESS' : 'FAILED',
      pipeline.milestones.reduce((acc, m) => acc + (m.latency_ms || 0), 0),
      `Pipeline completed ${pipeline.completed_steps}/${pipeline.total_steps} stages. Preview: ${pipeline.preview_url || 'N/A'}`
    ).catch(() => {})

    return pipeline
  }
}

export const pipelineManager = PipelineManager.getInstance()


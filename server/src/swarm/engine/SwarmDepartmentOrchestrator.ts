/**
 * SwarmDepartmentOrchestrator.ts — Multi-Agent Department Swarm & Boundary Enforcement
 * Inspired by: CopilotKit/OpenBot, milind-soni/OpenMausBot, Donchitos/Claude-Code-Game-Studios
 * Target: src/swarm/engine/SwarmDepartmentOrchestrator.ts & server/src/swarm/engine/SwarmDepartmentOrchestrator.ts
 *
 * Implements strict departmental boundaries, fail-closed permission gates,
 * and structured task decomposition across autonomous specialist units.
 */

import { executeAutonomousTask, AutonomousTaskResult } from './AgentLoop'
import { taskAuditService } from '../../services/taskAuditService'
import { sessionMemoryManager } from '../../memory/SessionMemoryManager'

export type SwarmDepartment =
  | 'CHIEF_OF_STAFF'
  | 'CODE_DEPARTMENT'
  | 'SECURITY_SOC'
  | 'FINANCIAL_QUANT'
  | 'RESEARCH_INTELLIGENCE'

export interface DepartmentConfig {
  role: SwarmDepartment
  leadAgent: string
  description: string
  allowedTools: string[]
  maxPermission: 'READ_ONLY' | 'SAFE_LOCAL' | 'PROJECT_WRITE' | 'PRIVILEGED'
}

export const DEPARTMENT_REGISTRY: Record<SwarmDepartment, DepartmentConfig> = {
  CHIEF_OF_STAFF: {
    role: 'CHIEF_OF_STAFF',
    leadAgent: 'jarvis',
    description: 'Supreme executive coordination, task decomposition, and cross-department synthesis.',
    allowedTools: ['*'],
    maxPermission: 'PRIVILEGED'
  },
  CODE_DEPARTMENT: {
    role: 'CODE_DEPARTMENT',
    leadAgent: 'aegis',
    description: 'Autonomous AST refactoring, unit test execution, and Git repository management (T3Code pattern).',
    allowedTools: [
      'aegis_code_engineer',
      'github_manage_file',
      'execute_sandbox_command',
      'finish_task'
    ],
    maxPermission: 'PROJECT_WRITE'
  },
  SECURITY_SOC: {
    role: 'SECURITY_SOC',
    leadAgent: 'cerberus',
    description: 'Defensive red-teaming, boundary validation, and immutable decision audit (AiSOC pattern).',
    allowedTools: [
      'execute_sandbox_command',
      'neon_sql_query',
      'finish_task'
    ],
    maxPermission: 'SAFE_LOCAL'
  },
  FINANCIAL_QUANT: {
    role: 'FINANCIAL_QUANT',
    leadAgent: 'midas',
    description: 'Quantitative market telemetry, FX rates, cryptocurrency data, and unit economics (Kronos pattern).',
    allowedTools: [
      'query_public_service',
      'neon_sql_query',
      'finish_task'
    ],
    maxPermission: 'SAFE_LOCAL'
  },
  RESEARCH_INTELLIGENCE: {
    role: 'RESEARCH_INTELLIGENCE',
    leadAgent: 'cerebro',
    description: 'Headless web research, documentation scraping, and knowledge synthesis (Lightpanda pattern).',
    allowedTools: [
      'headless_web_research',
      'query_public_service',
      'finish_task'
    ],
    maxPermission: 'SAFE_LOCAL'
  }
}

export class SwarmDepartmentOrchestrator {
  private static instance: SwarmDepartmentOrchestrator

  public static getInstance(): SwarmDepartmentOrchestrator {
    if (!SwarmDepartmentOrchestrator.instance) {
      SwarmDepartmentOrchestrator.instance = new SwarmDepartmentOrchestrator()
    }
    return SwarmDepartmentOrchestrator.instance
  }

  /**
   * Verify if a department worker is permitted to invoke a tool (Fail-Closed Gate)
   */
  public isToolPermitted(department: SwarmDepartment, toolName: string): boolean {
    const config = DEPARTMENT_REGISTRY[department]
    if (!config) return false

    if (config.allowedTools.includes('*')) return true
    return config.allowedTools.includes(toolName)
  }

  /**
   * Enforce fail-closed permission gate; throws exception and logs violation if unauthorized
   */
  public assertToolPermitted(department: SwarmDepartment, toolName: string): void {
    if (!this.isToolPermitted(department, toolName)) {
      const msg = `Security Violation: Department "${department}" is prohibited from invoking tool "${toolName}". Permission denied by fail-closed boundary.`
      taskAuditService.logToolExecution(
        'sys_boundary_guard',
        toolName,
        { department, attemptedTool: toolName },
        { error: true, message: msg },
        'ERROR',
        1
      ).catch(() => {})
      throw new Error(msg)
    }
  }

  /**
   * Dispatch directive to designated department
   */
  public async dispatchToDepartment(
    department: SwarmDepartment,
    directive: string,
    maxSteps = 5
  ): Promise<AutonomousTaskResult> {
    const config = DEPARTMENT_REGISTRY[department]
    if (!config) {
      throw new Error(`Unknown department: ${department}`)
    }

    // Intercept and record in persistent memory
    const memoryRecord = await sessionMemoryManager.recordObservation(
      `dept_${department.toLowerCase()}`,
      directive,
      'department_dispatch',
      { department, leadAgent: config.leadAgent },
      `Dispatched directive to ${department} led by ${config.leadAgent}`
    )

    // Execute through specialized autonomous agent harness
    const result = await executeAutonomousTask(directive, config.leadAgent, maxSteps)

    // Append observation detail
    await sessionMemoryManager.recordObservation(
      `dept_${department.toLowerCase()}`,
      directive,
      'department_complete',
      { success: result.success, stepsExecuted: result.stepsExecuted },
      result.finalResponse
    )

    return result
  }
}

export const swarmDepartmentOrchestrator = SwarmDepartmentOrchestrator.getInstance()

import React from 'react'

export interface PipelineMilestone {
  id: string
  step_order: number
  name: string
  specialist: string
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

interface TaskPipelineTimelineProps {
  pipeline: AutonomousPipeline
  onSelectMilestone?: (milestone: PipelineMilestone) => void
}

export const TaskPipelineTimeline: React.FC<TaskPipelineTimelineProps> = ({
  pipeline,
  onSelectMilestone
}) => {
  const progressPercent = Math.round((pipeline.completed_steps / Math.max(pipeline.total_steps, 1)) * 100)
  const activeMilestone = pipeline.milestones.find(m => m.status === 'RUNNING') || pipeline.milestones.find(m => m.status === 'PENDING')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">COMPLETED</span>
      case 'RUNNING':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">RUNNING</span>
      case 'FAILED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">FAILED</span>
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">PENDING</span>
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xl">⚡</span>
            <h2 className="text-xl font-bold tracking-tight text-white">{pipeline.title}</h2>
            {getStatusBadge(pipeline.status)}
          </div>
          <p className="text-sm text-slate-400 mt-1">{pipeline.goal}</p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div>
            <div className="text-xs text-slate-400 font-mono">ESTIMATED DURATION</div>
            <div className="font-semibold text-slate-200">~{pipeline.estimated_duration_sec}s</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono">ACTIVE STAGE</div>
            <div className="font-semibold text-sky-400">
              {activeMilestone ? `Step ${activeMilestone.step_order}/${pipeline.total_steps}` : 'Finished'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-5 mb-8">
        <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-2">
          <span>PROGRESS</span>
          <span className="text-sky-400 font-bold">{progressPercent}% ({pipeline.completed_steps}/{pipeline.total_steps} Stages)</span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Milestone Stages Timeline */}
      <div className="space-y-4">
        {pipeline.milestones.map((milestone) => {
          const isRunning = milestone.status === 'RUNNING'
          const isDone = milestone.status === 'COMPLETED'
          const isFailed = milestone.status === 'FAILED'

          return (
            <div
              key={milestone.id}
              onClick={() => onSelectMilestone && onSelectMilestone(milestone)}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                isRunning
                  ? 'bg-sky-950/20 border-sky-500/50 shadow-lg shadow-sky-500/10'
                  : isDone
                  ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  : isFailed
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-slate-950/20 border-slate-800/60 opacity-70'
              }`}
            >
              {/* Order Number Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : isRunning
                    ? 'bg-sky-500/30 text-sky-300 border border-sky-400 animate-pulse'
                    : isFailed
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? '✓' : milestone.step_order}
              </div>

              {/* Milestone Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-sm">{milestone.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      @{milestone.specialist}
                    </span>
                  </div>
                  {getStatusBadge(milestone.status)}
                </div>

                {milestone.output_summary && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 bg-slate-950/60 p-2 rounded border border-slate-800/60 font-mono">
                    {milestone.output_summary}
                  </p>
                )}

                {milestone.latency_ms !== undefined && (
                  <div className="mt-2 text-[11px] font-mono text-slate-400">
                    Execution Latency: <span className="text-slate-300">{milestone.latency_ms}ms</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

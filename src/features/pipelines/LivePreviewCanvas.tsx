import React, { useState } from 'react'
import { AutonomousPipeline } from './TaskPipelineTimeline'
import { SwarmBuilderCanvas } from './SwarmBuilderCanvas'

interface LivePreviewCanvasProps {
  pipeline: AutonomousPipeline
}

export const LivePreviewCanvas: React.FC<LivePreviewCanvasProps> = ({ pipeline }) => {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [viewMode, setViewMode] = useState<'swarm' | 'live'>(
    pipeline.status === 'RUNNING' || !pipeline.preview_url ? 'swarm' : 'live'
  )
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[700px]">
      {/* Viewport & Mode Control Bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
            {viewMode === 'swarm' ? 'swarm://agent-canvas' : (pipeline.preview_url || '/preview/empty')}
          </span>
        </div>

        {/* View Mode Toggle: Swarm vs Live */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 rounded-lg p-0.5 border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setViewMode('swarm')}
              className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'swarm' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🐝</span>
              <span>Swarm Build</span>
            </button>
            <button
              onClick={() => setViewMode('live')}
              className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'live' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🌐</span>
              <span>Live App</span>
            </button>
          </div>

          {/* Desktop / Mobile toggle (Live mode only) */}
          {viewMode === 'live' && (
            <div className="bg-slate-900 rounded-lg p-0.5 border border-slate-800 flex items-center text-xs">
              <button
                onClick={() => setViewport('desktop')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  viewport === 'desktop' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Desktop
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  viewport === 'mobile' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mobile
              </button>
            </div>
          )}

          {viewMode === 'live' && (
            <button
              onClick={handleRefresh}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 transition-colors"
              title="Reload Preview"
            >
              ↻
            </button>
          )}

          {pipeline.preview_url && viewMode === 'live' && (
            <a
              href={pipeline.preview_url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors"
            >
              Open New Tab ↗
            </a>
          )}
        </div>
      </div>

      {/* Main Preview Sandbox */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-hidden relative">
        {viewMode === 'swarm' ? (
          <div className="w-full h-full">
            <SwarmBuilderCanvas
              siteTitle={pipeline.goal || 'J.A.R.V.I.S. AUTONOMOUS APPLICATION'}
              onGoLive={() => setViewMode('live')}
            />
          </div>
        ) : pipeline.preview_url ? (
          <div
            className={`h-full transition-all duration-300 rounded-lg overflow-hidden border border-slate-800 shadow-2xl bg-black p-4 ${
              viewport === 'desktop' ? 'w-full' : 'w-[375px]'
            }`}
          >
            <iframe
              key={refreshKey}
              src={pipeline.preview_url}
              title="Live Build Preview"
              className="w-full h-full border-0 bg-black rounded"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        ) : (
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4 text-2xl text-sky-400">
              ⚡
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">Aegis Sandbox Staging</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Live web preview will render here once Aegis reaches the frontend scaffolding milestone.
            </p>
            <button
              onClick={() => setViewMode('swarm')}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors"
            >
              Watch Swarm Cursors Build 🐝
            </button>
          </div>
        )}
      </div>

      {/* Deliverable Download Shelf */}
      {pipeline.deliverable_artifacts && pipeline.deliverable_artifacts.length > 0 && (
        <div className="bg-slate-950/80 px-4 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>📦</span> DELIVERABLE ARTIFACTS:
          </div>
          <div className="flex items-center gap-2">
            {pipeline.deliverable_artifacts.map((art, idx) => (
              <a
                key={idx}
                href={art.url}
                download
                className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition-colors"
              >
                <span>{art.type === 'pdf' ? '📄' : (art.type === 'excel' ? '📊' : '📝')}</span>
                <span>{art.name}</span>
                <span className="text-[10px] text-sky-400">⬇</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

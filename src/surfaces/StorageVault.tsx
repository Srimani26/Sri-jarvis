import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Download, HardDrive, RefreshCw, Sparkles, Plus,
  FileCheck, Shield, CheckCircle2, Clock, Eye, AlertCircle,
  Search, ExternalLink, Bot, FolderArchive, Layers, Trash2
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'

interface TaskReportSummary {
  taskNumber: string
  title: string
  completedAt?: string
  pdfFile?: string
  docFile?: string
  mdFile?: string
  hasPdf: boolean
  hasDoc: boolean
  hasMd: boolean
  pdfSizeBytes?: number
  docSizeBytes?: number
  mdSizeBytes?: number
}

interface StorageStats {
  totalTasks: number
  pdfCount: number
  docCount: number
  mdCount: number
  totalBytes: number
}

export default function StorageVault() {
  const [reports, setReports] = useState<TaskReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterFormat, setFilterFormat] = useState<'all' | 'pdf' | 'doc' | 'md'>('all')
  const [previewContent, setPreviewContent] = useState<{ title: string; content: string } | null>(null)
  
  // Custom Doc Generator Modal state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [genTitle, setGenTitle] = useState('')
  const [genFormat, setGenFormat] = useState<'pdf' | 'doc' | 'md'>('pdf')
  const [genContent, setGenContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [genSuccessMsg, setGenSuccessMsg] = useState('')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/storage/reports', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports || [])
      }
    } catch (err) {
      console.error('Failed to load storage vault reports:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const stats: StorageStats = reports.reduce(
    (acc, r) => {
      acc.totalTasks += 1
      if (r.hasPdf) acc.pdfCount += 1
      if (r.hasDoc) acc.docCount += 1
      if (r.hasMd) acc.mdCount += 1
      acc.totalBytes += (r.pdfSizeBytes || 0) + (r.docSizeBytes || 0) + (r.mdSizeBytes || 0)
      return acc
    },
    { totalTasks: 0, pdfCount: 0, docCount: 0, mdCount: 0, totalBytes: 0 }
  )

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleGenerateCustomDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!genTitle.trim() || !genContent.trim()) return

    setIsGenerating(true)
    setGenSuccessMsg('')
    try {
      const res = await fetch('/api/storage/generate', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          title: genTitle.trim(),
          content: genContent.trim(),
          format: genFormat,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGenSuccessMsg(`File generated successfully: ${data.filename}`)
        fetchReports()
        // Auto trigger download
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank')
        }
        setTimeout(() => {
          setIsGeneratorOpen(false)
          setGenTitle('')
          setGenContent('')
          setGenSuccessMsg('')
        }, 1500)
      } else {
        alert('Failed to generate document. Please check server logs.')
      }
    } catch (err: any) {
      alert(`Generation error: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const loadPreset = (presetType: 'audit' | 'architecture' | 'summary') => {
    if (presetType === 'audit') {
      setGenTitle('Comprehensive Security & Shopify Theme Audit')
      setGenContent(
`# Security & Performance Audit Report
**Target Workspace:** invi-theme (Shopify Dawn) & J.A.R.V.I.S. Core
**Auditor:** Sentinel Security Engine & Aegis Architecture
**Status:** 100% Verified Pass (Exit Code 0)

## Executive Summary
This audit evaluated the codebase against production-grade security standards, verifying secret leakage via Gitleaks rules, checking AST syntax integrity, and validating Online Store 2.0 theme guidelines.

## Key Findings
- **Secret Scanning:** 0 hardcoded secrets or API keys detected in workspace.
- **CSS Bundle Size:** Optimized \`section-main-product.css\` within 35.5KB budget.
- **Zero Critical Regressions:** Liquid templates maintain full theme-editor compatibility.`
      )
    } else if (presetType === 'architecture') {
      setGenTitle('Autonomous Multi-Agent MoA Architecture Specification')
      setGenContent(
`# Autonomous Multi-Agent MoA Architecture
**System:** J.A.R.V.I.S. Sovereign Operating System v5.0
**Lead Architect:** Daedalus & Friday Swarm

## System Overview
The architecture combines a Mixture-of-Agents (MoA) neural gateway with 20 specialist sub-agents, orchestrating tasks across code generation, deep research, and automated document compilation.

### Deliverable Pipeline
1. **Task Intake & Decomposition:** User command parsed into 4-phase execution plan.
2. **Parallel Swarm Execution:** Specialized agents execute subtasks concurrently.
3. **Physical File & AST Verification:** Artifacts validated via real execution.
4. **Storage Space Archival:** PDF, DOC, and Markdown deliverables published to Storage Vault.`
      )
    } else {
      setGenTitle('Executive Mission Milestone Report')
      setGenContent(
`# Executive Mission Milestone Report
**Generated For:** Master Sri
**Classification:** Sovereign Top Secret

## Completed Directives
- Unified ChatGPT / Claude style conversational workspace.
- Implemented real-time Headless Chrome visual automation & PDF compilation.
- Deployed persistent Storage Space for all mission reports and deliverables.

## Next Strategic Steps
- Activate automated scheduled background audits for repository health.
- Scale freelance bounty scout subroutines via Midas revenue engine.`
      )
    }
  }

  const filteredReports = reports.filter(r => {
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.taskNumber.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filterFormat === 'pdf') return r.hasPdf
    if (filterFormat === 'doc') return r.hasDoc
    if (filterFormat === 'md') return r.hasMd
    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                Persistent Storage Space & Vault
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-center gap-2">
              <HardDrive className="w-7 h-7 text-emerald-400" />
              <span>Deliverables & Mission Reports Vault</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Every completed mission and directive automatically compiles executive reports in <strong className="text-emerald-300">PDF</strong>, <strong className="text-blue-300">Word DOC</strong>, and <strong className="text-cyan-300">Markdown</strong>, uploaded and permanently archived here for instant review and download.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono font-bold text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950 font-bold" />
              <span>Generate Document</span>
            </button>
            <button
              onClick={fetchReports}
              className="p-2.5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh reports"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-emerald-400")} />
            </button>
          </div>
        </div>

        {/* Storage Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Archived Missions</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold text-white">{stats.totalTasks}</span>
              <span className="text-[10px] text-emerald-400 font-mono">vaulted</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">PDF Deliverables</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold text-rose-400">{stats.pdfCount}</span>
              <span className="text-[10px] text-slate-500 font-mono">Chrome A4</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Word Documents</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold text-blue-400">{stats.docCount}</span>
              <span className="text-[10px] text-slate-500 font-mono">.doc MIME</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Storage Used</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold text-emerald-300">{formatBytes(stats.totalBytes)}</span>
              <span className="text-[10px] text-slate-500 font-mono">in artifacts/</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report titles or task numbers..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500/50 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'pdf', 'doc', 'md'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFilterFormat(fmt)}
              className={cn(
                "flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-mono font-semibold uppercase transition-all cursor-pointer",
                filterFormat === fmt
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
              )}
            >
              {fmt === 'all' ? 'All Deliverables' : `.${fmt}`}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="p-12 text-center space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/60">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-400">Scanning Sovereign Storage Space for compiled reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center space-y-3 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
          <FolderArchive className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-mono font-bold text-slate-300">No Reports Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Reports are automatically generated whenever a task finishes. You can also create custom PDF or Word documents instantly using the button above.
          </p>
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-mono cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Document Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.taskNumber}
              className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg group hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    {report.taskNumber}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>{report.completedAt ? new Date(report.completedAt).toLocaleDateString() : 'Recent'}</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white font-mono line-clamp-2 group-hover:text-emerald-300 transition-colors">
                  {report.title}
                </h3>
              </div>

              {/* Format Badges & Download Actions */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Deliverables Available:</span>
                  <span className="text-emerald-400 font-semibold">
                    {[report.hasPdf && 'PDF', report.hasDoc && 'DOC', report.hasMd && 'MD'].filter(Boolean).join(' • ')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {report.hasPdf ? (
                    <a
                      href={`/api/storage/download/${report.taskNumber}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-mono text-[11px] font-bold transition-all text-center"
                      title={`Download PDF (${formatBytes(report.pdfSizeBytes || 0)})`}
                    >
                      <Download className="w-3 h-3 shrink-0" />
                      <span>.PDF</span>
                    </a>
                  ) : (
                    <span className="px-2 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800/50 text-slate-600 font-mono text-[11px] text-center">
                      —
                    </span>
                  )}

                  {report.hasDoc ? (
                    <a
                      href={`/api/storage/download/${report.taskNumber}/doc`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 font-mono text-[11px] font-bold transition-all text-center"
                      title={`Download Word DOC (${formatBytes(report.docSizeBytes || 0)})`}
                    >
                      <Download className="w-3 h-3 shrink-0" />
                      <span>.DOC</span>
                    </a>
                  ) : (
                    <span className="px-2 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800/50 text-slate-600 font-mono text-[11px] text-center">
                      —
                    </span>
                  )}

                  {report.hasMd ? (
                    <a
                      href={`/api/storage/download/${report.taskNumber}/md`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold transition-all text-center"
                      title={`Download Markdown (${formatBytes(report.mdSizeBytes || 0)})`}
                    >
                      <Download className="w-3 h-3 shrink-0" />
                      <span>.MD</span>
                    </a>
                  ) : (
                    <span className="px-2 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800/50 text-slate-600 font-mono text-[11px] text-center">
                      —
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* On-Demand Document Generator Modal */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-emerald-500/40 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold font-mono text-white">Generate Custom Document</h3>
              </div>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Quick Document Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadPreset('audit')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono cursor-pointer"
                >
                  🛡️ Security Audit
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('architecture')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono cursor-pointer"
                >
                  ⚡ MoA Architecture Spec
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('summary')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono cursor-pointer"
                >
                  📊 Executive Milestone
                </button>
              </div>
            </div>

            <form onSubmit={handleGenerateCustomDoc} className="space-y-3.5">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  placeholder="e.g. Master Architecture Blueprint & Verification Report"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500/50 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Target Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pdf', 'doc', 'md'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setGenFormat(fmt)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-mono font-bold transition-all border",
                        genFormat === fmt
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      )}
                    >
                      {fmt === 'pdf' ? 'PDF (Chrome Print)' : fmt === 'doc' ? 'Word Document (.doc)' : 'Markdown (.md)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Document Content (Markdown)</label>
                <textarea
                  required
                  rows={8}
                  value={genContent}
                  onChange={(e) => setGenContent(e.target.value)}
                  placeholder="Write markdown content or use one of the presets above..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500/50 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              {genSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{genSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono font-bold text-xs shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Document...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Generate & Save to Vault</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

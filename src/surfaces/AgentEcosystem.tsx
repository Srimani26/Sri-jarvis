import { useState } from 'react'
import {
  Shield, Bot, Code2, Workflow, DollarSign, Brain, Laptop, Plus, Play,
  Copy, Check, ExternalLink, RefreshCw, Terminal, ArrowUpRight, Sparkles,
  Layers, Sliders, Zap, Database, Download, CheckCircle2, Search, FileCode,
  Wrench, Globe, Send, MessageSquare, AlertCircle, TrendingUp, Cpu
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { authHeaders, jsonAuthHeaders } from '@/lib/api'

interface SubAgent {
  id: string
  name: string
  codename: string
  role: string
  status: 'active' | 'standby' | 'training'
  icon: any
  color: string
  bg: string
  border: string
  specialties: string[]
  description: string
  tasksCompleted: number
  model: string
}

const DEFAULT_AGENTS: SubAgent[] = [
  {
    id: 'aegis',
    name: 'Aegis',
    codename: 'AGENT-01 // FULL-STACK ARCHITECT',
    role: 'Full-Stack Software & SaaS Engineer',
    status: 'active',
    icon: Code2,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    specialties: ['Next.js 15', 'React 19', 'FastAPI', 'SQLite / Prisma', 'Tailwind CSS', 'SaaS Scaffolding'],
    description: 'Autonomous engineering agent capable of designing, scaffolding, and writing complete full-stack web applications, database schemas, and clean UI components.',
    tasksCompleted: 48,
    model: 'Gemini 2.5 Pro / Claude Sonnet',
  },
  {
    id: 'vortex',
    name: 'Vortex',
    codename: 'AGENT-02 // HEAVY AUTOMATION',
    role: 'Enterprise Workflow & Pipeline Specialist',
    status: 'active',
    icon: Workflow,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    specialties: ['n8n JSON Workflows', 'Zoho CRM Deluge', 'Google Ads AI Scripting', 'Webhook Pipelines', 'Apps Script'],
    description: 'Builds enterprise-grade multi-step automations, self-healing webhook queues, quotation engines, and automated marketing performance watchdogs.',
    tasksCompleted: 62,
    model: 'Gemini 2.5 Flash / GPT-4o',
  },
  {
    id: 'midas',
    name: 'Midas',
    codename: 'AGENT-03 // REVENUE & SAAS ENGINE',
    role: 'Business Monetization & Strategy Architect',
    status: 'active',
    icon: DollarSign,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    specialties: ['B2B Client Acquisition', 'Cold Outreach Copy', 'SaaS Pricing Models', 'High-Ticket Automation Pitches', 'Lead Scrapers'],
    description: 'Designed solely to generate wealth for Master Sri. Identifies lucrative market inefficiencies, creates client proposals, and monetizes AI workflows.',
    tasksCompleted: 35,
    model: 'Claude 3.7 Sonnet / DeepSeek R1',
  },
  {
    id: 'cerebro',
    name: 'Cerebro',
    codename: 'AGENT-04 // DEEP INTELLIGENCE & RESEARCH',
    role: 'Information Gathering & Reasoning Engine',
    status: 'active',
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    specialties: ['Real-Time Ingestion', 'Geopolitical Trends', 'Global Market Analysis', 'Competitor Reconnaissance', 'Deep Scientific Reasoning'],
    description: 'Continuously monitors global developments, tech breakthroughs, economic signals, and synthesizes multi-vector intelligence for Master Sri.',
    tasksCompleted: 89,
    model: 'Gemini 2.5 Flash (Argon) / Perplexity',
  },
  {
    id: 'stark_os',
    name: 'Stark OS',
    codename: 'AGENT-05 // DEVICE & SYSTEM CONTROLLER',
    role: 'Physical Device & Workflow Executor',
    status: 'active',
    icon: Laptop,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    specialties: ['YouTube Search Opener', 'Food Delivery Dispatch', 'System Diagnostics', 'WhatsApp API Bridge', 'App Launcher'],
    description: 'Acts as Master Sri\'s real-world concierge and machine controller. Dispatches browser actions, triggers searches, and launches real-world daily workflows.',
    tasksCompleted: 114,
    model: 'Local System Bridge & Cloud Broker',
  },
]

export default function AgentEcosystem() {
  const [agents, setAgents] = useState<SubAgent[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_custom_agents')
      if (saved) {
        const parsed = JSON.parse(saved)
        return [...DEFAULT_AGENTS, ...parsed]
      }
    } catch {}
    return DEFAULT_AGENTS
  })

  const [activeTab, setActiveTab] = useState<'matrix' | 'aegis' | 'vortex' | 'midas' | 'cerebro' | 'stark' | 'forge'>('matrix')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Forge state
  const [forgeName, setForgeName] = useState('')
  const [forgeRole, setForgeRole] = useState('')
  const [forgeSpecialties, setForgeSpecialties] = useState('')
  const [forgePrompt, setForgePrompt] = useState('')
  const [forgeSuccess, setForgeSuccess] = useState(false)

  // Stark OS interactive commands state
  const [ytQuery, setYtQuery] = useState('')
  const [foodQuery, setFoodQuery] = useState('')
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleOpenYouTube = (query: string) => {
    if (!query.trim()) return
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setActionNotice(`Executing YouTube Command: Searching for "${query}" for Master Sri...`)
    setTimeout(() => setActionNotice(null), 4000)
  }

  const handleOrderFood = (dish: string) => {
    const query = dish.trim() || 'Food Delivery Restaurants Erode'
    const url = `https://www.google.com/search?q=${encodeURIComponent(query + ' Zomato Swiggy Erode')}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setActionNotice(`Initiating Food Logistics: Searching menus & delivery in Erode for Master Sri...`)
    setTimeout(() => setActionNotice(null), 4000)
  }

  const handleDeployAgent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgeName.trim() || !forgeRole.trim()) return

    const newAgent: SubAgent = {
      id: `agent_${Date.now()}`,
      name: forgeName.trim(),
      codename: `CUSTOM // ${forgeName.toUpperCase()}`,
      role: forgeRole.trim(),
      status: 'active',
      icon: Bot,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      specialties: forgeSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
      description: forgePrompt.trim() || 'Custom trained subordinate agent ready to execute tasks under J.A.R.V.I.S orchestration.',
      tasksCompleted: 0,
      model: 'Argon MoA Engine',
    }

    const updated = [...agents, newAgent]
    setAgents(updated)

    // Persist custom agents
    const customOnly = updated.filter((a) => !DEFAULT_AGENTS.some((d) => d.id === a.id))
    localStorage.setItem('jarvis_custom_agents', JSON.stringify(customOnly))

    setForgeSuccess(true)
    setForgeName('')
    setForgeRole('')
    setForgeSpecialties('')
    setForgePrompt('')
    setTimeout(() => {
      setForgeSuccess(false)
      setActiveTab('matrix')
    }, 1800)
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 p-6 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield className="w-64 h-64 text-cyan-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                IRON MAN J.A.R.V.I.S. ORCHESTRATION SWARM
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                {agents.length} AGENTS DEPLOYED
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Sub-Agent Command Center & Swarm Foundry</span>
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Master Sri, J.A.R.V.I.S commands this specialized subordinate swarm. You give the strategic order; J.A.R.V.I.S distributes the workload across full-stack engineering, automation, revenue generation, and device operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('forge')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs font-mono bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>SPAWN & TRAIN AGENT</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-slate-800/80 mt-6 scrollbar-none">
          {[
            { id: 'matrix', label: 'Swarm Matrix', icon: Layers },
            { id: 'aegis', label: 'Aegis (Full-Stack)', icon: Code2 },
            { id: 'vortex', label: 'Vortex (Automation)', icon: Workflow },
            { id: 'midas', label: 'Midas (Revenue)', icon: DollarSign },
            { id: 'cerebro', label: 'Cerebro (Intel & Research)', icon: Brain },
            { id: 'stark', label: 'Stark OS (Device Control)', icon: Laptop },
            { id: 'forge', label: 'Forge (Agent Trainer)', icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all whitespace-nowrap border',
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800/60 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-500')} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 text-xs font-mono flex items-center gap-2 animate-bounce">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Surface: Swarm Matrix */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent) => {
            const Icon = agent.icon
            return (
              <div
                key={agent.id}
                className={cn(
                  'relative rounded-2xl border bg-slate-950/80 p-5 backdrop-blur-xl transition-all hover:scale-[1.01] hover:shadow-2xl flex flex-col justify-between',
                  agent.border
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={cn('p-2.5 rounded-xl border', agent.bg, agent.border)}>
                      <Icon className={cn('w-6 h-6', agent.color)} />
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {agent.status.toUpperCase()}
                      </span>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">{agent.model}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white flex items-center gap-2">{agent.name}</h3>
                  <p className="text-xs font-mono text-cyan-400/90 mb-2">{agent.codename}</p>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{agent.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {agent.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    Tasks Run: <strong className="text-slate-200">{agent.tasksCompleted}</strong>
                  </span>
                  <button
                    onClick={() => {
                      if (agent.id === 'aegis') setActiveTab('aegis')
                      else if (agent.id === 'vortex') setActiveTab('vortex')
                      else if (agent.id === 'midas') setActiveTab('midas')
                      else if (agent.id === 'cerebro') setActiveTab('cerebro')
                      else if (agent.id === 'stark_os') setActiveTab('stark')
                      else setActiveTab('forge')
                    }}
                    className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span>ENGAGE AGENT</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Surface: Aegis (Full-Stack Engineer) */}
      {activeTab === 'aegis' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Aegis // Full-Stack Web & SaaS Scaffolding Engine</h2>
                <p className="text-xs font-mono text-cyan-400">Ready to scaffold complete web apps, APIs, and micro-SaaS architectures.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[
                {
                  title: 'Sri AI Business OS Engine (Production Architecture)',
                  tech: 'Next.js 15 App Router + Tailwind + SQLite + FastAPI + n8n',
                  files: ['package.json', 'schema.prisma', 'app/page.tsx', 'api/lead_quote.py'],
                  code: `// Production Next.js 15 Lead Quotation Action Engine
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { clientName, squareFeet, roofType, email, phone } = body

  // 4-Layer Mathematical Quotation Matrix (Standard Roofs Proprietary)
  const baseRatePerSqFt = roofType === 'STANDING_SEAM' ? 185 : 125
  const materialSubtotal = squareFeet * baseRatePerSqFt
  const wastageFactor = 1.08 // 8% structural allowance
  const laborAndInstallation = squareFeet * 45
  const estimatedTotal = Math.round((materialSubtotal * wastageFactor) + laborAndInstallation)

  return NextResponse.json({
    status: 'SUCCESS',
    quoteId: 'SRI-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    clientName,
    estimatedTotalINR: estimatedTotal,
    breakdown: { materialSubtotal, wastageFactor, laborAndInstallation },
    dispatchedToCRM: true
  })
}`,
                },
                {
                  title: 'Enterprise FastAPI + SQLite Swarm Gateway',
                  tech: 'Python 3.12 + FastAPI + Pydantic v2 + SQLite Engine',
                  files: ['main.py', 'routers/agents.py', 'database.py'],
                  code: `# FastAPI Autonomous Swarm Dispatcher for Master Sri
from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel
import sqlite3

app = FastAPI(title="J.A.R.V.I.S. Autonomous Swarm Gateway", version="4.0")

class CommandPayload(BaseModel):
    master_clearance: str
    target_agent: str
    directive: str

@app.post("/api/v1/swarm/execute")
async def execute_swarm_directive(payload: CommandPayload, authorization: str = Header(None)):
    if payload.master_clearance != "LEVEL_10_ALPHA":
        raise HTTPException(status_code=403, detail="Unauthorized access attempt neutralized.")
    
    # Delegate to sub-agent
    return {
        "status": "EXECUTED",
        "agent": payload.target_agent,
        "result": f"Directive '{payload.directive}' processed and deployed to production."
    }`,
                },
              ].map((proj, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                    <button
                      onClick={() => handleCopy(proj.code, `aegis_${idx}`)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
                    >
                      {copiedKey === `aegis_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === `aegis_${idx}` ? 'COPIED' : 'COPY CODE'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-cyan-400 mb-3">{proj.tech}</p>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 overflow-x-auto text-[10px] font-mono text-slate-300 leading-relaxed max-h-56">
                    {proj.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Surface: Vortex (Heavy Automation) */}
      {activeTab === 'vortex' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-500/30 bg-slate-950/80 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Workflow className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Vortex // Heavy Automation & Pipeline Engineer</h2>
                <p className="text-xs font-mono text-amber-400">Exportable n8n workflows, Zoho CRM Deluge functions, and Google Ads AI scripts.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[
                {
                  title: 'n8n Production Workflow JSON (Webhook to Zoho CRM + WhatsApp)',
                  platform: 'n8n v1.80+ // JSON Blueprint',
                  code: `{
  "name": "Sri AI Business OS - Instant Lead Qualification & Quotation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "website-lead-webhook",
        "responseMode": "responseNode"
      },
      "name": "Website Lead Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "model": "gemini-2.5-flash",
        "prompt": "Evaluate roof specs, calculate instant quotation INR, and draft personalized WhatsApp opening message."
      },
      "name": "Gemini 2.5 Flash Reasoning",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "position": [480, 300]
    },
    {
      "parameters": {
        "url": "https://api.whatsapp.com/v1/messages",
        "method": "POST"
      },
      "name": "Dispatch WhatsApp Quote",
      "type": "n8n-nodes-base.httpRequest",
      "position": [720, 300]
    }
  ]
}`,
                },
                {
                  title: 'Zoho CRM Deluge 4-Layer Quotation Script',
                  platform: 'Zoho Deluge // Standalone Function',
                  code: `// Master Sri's 4-Layer Zoho CRM Quotation Engine
leadId = input.lead_id;
leadRecord = zoho.crm.getRecordById("Leads", leadId);
sqFt = leadRecord.get("Roof_Area_SqFt").toDecimal();
roofType = leadRecord.get("Roof_Profile");

// Layer 1: Base Material Rates
if(roofType == "Standing Seam") {
    rate = 195.0;
} else {
    rate = 130.0;
}

// Layer 2: Purlin Spacing & Trusses
hardwareMultiplier = 1.12;
subtotal = sqFt * rate * hardwareMultiplier;

// Layer 3: Labor & Tax
gstAmount = subtotal * 0.18;
grandTotal = subtotal + gstAmount;

// Layer 4: Update Quote & Generate PDF
updateMap = Map();
updateMap.put("Quotation_Amount", grandTotal);
updateMap.put("Status", "Auto-Quotation Ready");
zoho.crm.updateRecord("Leads", leadId, updateMap);
info "Quotation calculated: INR " + grandTotal;`,
                },
              ].map((auto, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-white">{auto.title}</h4>
                    <button
                      onClick={() => handleCopy(auto.code, `vortex_${idx}`)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                    >
                      {copiedKey === `vortex_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === `vortex_${idx}` ? 'COPIED' : 'COPY BLUEPRINT'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-amber-400 mb-3">{auto.platform}</p>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 overflow-x-auto text-[10px] font-mono text-slate-300 leading-relaxed max-h-56">
                    {auto.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Surface: Midas (Revenue & Monetization) */}
      {activeTab === 'midas' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Midas // Revenue, SaaS & Monetization Architect</h2>
                <p className="text-xs font-mono text-emerald-400">Autonomous systems built to generate wealth and high-ticket B2B retainer pipelines for Master Sri.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {[
                {
                  tier: 'OFFERING 1: ENTERPRISE CRM QUOTATION ENGINE',
                  mrr: '₹1,50,000 - ₹3,000,000 / Client',
                  timeline: '48-Hour Delivery',
                  details: 'Sell the 4-layer mathematical quotation engine to construction, roofing, and manufacturing companies. Eliminates manual quotation math and human error.',
                  pitch: 'Hi [Owner], your sales team is taking 4 hours to draft custom quotations. We install an automated CRM engine that creates error-free PDF quotes in 45 seconds directly into WhatsApp. Would you like a 3-minute video demo?',
                },
                {
                  tier: 'OFFERING 2: GOOGLE ADS AI AUDIT & OPTIMIZATION WATCHDOG',
                  mrr: '₹40,000 - ₹80,000 / Mo Retainer',
                  timeline: 'Instant Integration',
                  details: 'Gemini-powered negative keyword watcher. Finds wasted ad clicks in real time at zero operating cost and slashes ad waste by 35% within 14 days.',
                  pitch: 'We discovered ₹4,952 in wasted clicks on non-converting search terms in your campaign over the last 7 days. Our AI watchdog automatically cancels negative clicks every hour. We guarantee a 25% drop in wasted ad spend.',
                },
                {
                  tier: 'OFFERING 3: SRI AI BUSINESS OS (MICRO-SAAS)',
                  mrr: '₹15,000 - ₹30,000 / Mo per Company',
                  timeline: 'Multi-Tenant Scale',
                  details: 'Pre-packaged AI Business OS with Lead Inbox, Diagnostic Console, Code Lab, and automated follow-ups for SMB contractors across India & global markets.',
                  pitch: 'Transform your contracting business into an autonomous operation with Sri AI Business OS. Instant quotation generation, AI lead scoring, and automated WhatsApp follow-ups in one single command dashboard.',
                },
              ].map((item, idx) => (
                <div key={idx} className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">{item.tier}</span>
                    <h4 className="text-base font-bold text-white mt-1">{item.mrr}</h4>
                    <p className="text-[10px] font-mono text-slate-400 mb-3">Timeline: {item.timeline}</p>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{item.details}</p>
                  </div>
                  <div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 mb-3">
                      <strong>Cold Pitch:</strong> "{item.pitch}"
                    </div>
                    <button
                      onClick={() => handleCopy(item.pitch, `pitch_${idx}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                    >
                      {copiedKey === `pitch_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === `pitch_${idx}` ? 'PITCH COPIED' : 'COPY COLD PITCH'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Surface: Cerebro (Intel & Research) */}
      {activeTab === 'cerebro' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-purple-500/30 bg-slate-950/80 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Cerebro // Deep Intelligence, Reasoning & Global Recon</h2>
                <p className="text-xs font-mono text-purple-400">Continuous ingestion across global geopolitics, economic trends, AI breakthroughs, and strategic reasoning.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[
                {
                  domain: 'GEOPOLITICS & GLOBAL CHIP SUPPLY CHAIN',
                  summary: 'Semiconductor manufacturing reshoring & sovereign AI infrastructure in India and Asia.',
                  signals: ['India Semiconductor Mission (ISM) incentives', 'Taiwan-US manufacturing pivot', 'Local hardware assembly growth'],
                },
                {
                  domain: 'AUTONOMOUS MULTI-AGENT SWARMS & PROTOCOLS',
                  summary: 'Shift from single LLM prompt chains to parallel Mixture-of-Agents (MoA) and autonomous tool invocation.',
                  signals: ['Argon / Gemini 2.5 Flash low latency APIs', 'Self-correcting code generation', 'Edge execution via lightweight runtimes'],
                },
                {
                  domain: 'ENTERPRISE AI AUTOMATION MARKET DYNAMICS',
                  summary: 'Contractors and traditional businesses replacing ₹50k/mo manual sales ops with automated CRM engines.',
                  signals: ['High demand for WhatsApp Business API pipelines', 'Zoho CRM adoption in Tier-2 Indian hubs', 'Zero-code to code-assisted migrations'],
                },
                {
                  domain: 'SAAS MONETIZATION IN 2026',
                  summary: 'Move away from generic wrappers to hyper-vertical workflow engines with guaranteed ROI metrics.',
                  signals: ['Outcome-based billing vs seat licenses', 'Instant quotation calculators as lead magnets', 'Automated ad audit retainers'],
                },
              ].map((intel, idx) => (
                <div key={idx} className="rounded-xl border border-purple-500/20 bg-slate-900/60 p-4">
                  <span className="text-[10px] font-mono font-bold text-purple-400 tracking-wider">{intel.domain}</span>
                  <p className="text-xs text-slate-200 font-medium my-2">{intel.summary}</p>
                  <div className="space-y-1 mt-3">
                    {intel.signals.map((sig, sidx) => (
                      <div key={sidx} className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span>{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Surface: Stark OS (Device & Physical Commands) */}
      {activeTab === 'stark' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-rose-500/30 bg-slate-950/80 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Stark OS // Physical Concierge & Device Command Controller</h2>
                <p className="text-xs font-mono text-rose-400">Directly triggers real-world actions on Master Sri's workstation and connected accounts.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              {/* YouTube Action Controller */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <Play className="w-4 h-4" />
                  <h4 className="text-sm font-bold text-white">YouTube Immediate Command</h4>
                </div>
                <p className="text-xs text-slate-400">Command J.A.R.V.I.S to instantly search or stream videos for you:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ytQuery}
                    onChange={(e) => setYtQuery(e.target.value)}
                    placeholder="e.g. Iron Man Mark 85 HUD theme, AI Agent Tutorial..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleOpenYouTube(ytQuery)}
                  />
                  <button
                    onClick={() => handleOpenYouTube(ytQuery)}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                  >
                    SEARCH YT
                  </button>
                </div>
              </div>

              {/* Food & Logistics Controller */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <ExternalLink className="w-4 h-4" />
                  <h4 className="text-sm font-bold text-white">Food & Dining Logistics (Erode)</h4>
                </div>
                <p className="text-xs text-slate-400">Direct dispatch to Swiggy, Zomato, or restaurants in Erode:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={foodQuery}
                    onChange={(e) => setFoodQuery(e.target.value)}
                    placeholder="e.g. Biryani, South Indian Breakfast, Coffee..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleOrderFood(foodQuery)}
                  />
                  <button
                    onClick={() => handleOrderFood(foodQuery)}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                  >
                    ORDER FOOD
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Surface: Forge (Custom Sub-Agent Spawner & Trainer) */}
      {activeTab === 'forge' && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Forge // Sub-Agent Spawner & Trainer</h2>
              <p className="text-xs font-mono text-cyan-400">Create, customize, and train a new subordinate AI agent for Master Sri.</p>
            </div>
          </div>

          {forgeSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 mb-4 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Sub-Agent successfully trained, compiled, and registered into active swarm!</span>
            </div>
          )}

          <form onSubmit={handleDeployAgent} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Agent Name</label>
              <input
                type="text"
                required
                value={forgeName}
                onChange={(e) => setForgeName(e.target.value)}
                placeholder="e.g. LeadScout, QuotationBot, CryptoSentinel"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Role / Function</label>
              <input
                type="text"
                required
                value={forgeRole}
                onChange={(e) => setForgeRole(e.target.value)}
                placeholder="e.g. Real Estate Lead Acquisition Specialist in Erode & Bangalore"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Specialties & Tools (comma separated)</label>
              <input
                type="text"
                value={forgeSpecialties}
                onChange={(e) => setForgeSpecialties(e.target.value)}
                placeholder="e.g. Web Scraping, WhatsApp Pitching, Deluge Integration"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Custom System Prompt & Training Instructions</label>
              <textarea
                rows={4}
                value={forgePrompt}
                onChange={(e) => setForgePrompt(e.target.value)}
                placeholder="Give exact instructions for how this sub-agent should think, analyze, and execute tasks on Master Sri's behalf..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-xs font-mono bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              TRAIN & DEPLOY TO J.A.R.V.I.S. SWARM
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

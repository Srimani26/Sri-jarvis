import { authHeaders, jsonAuthHeaders } from '@/lib/api'
import { playJarvisChime } from '@/lib/sound'
import { useState } from 'react'
import { Code2, Copy, Check, Search, Star, Plus, FileCode, Terminal, Zap, BookOpen, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Snippet {
  id: string
  title: string
  language: string
  code: string
  category: string
  starred: boolean
  tags: string[]
}

const SNIPPETS: Snippet[] = [
  {
    id: '1',
    title: 'Gemini API — Multi-turn Chat',
    language: 'python',
    category: 'AI',
    starred: true,
    tags: ['Gemini', 'API'],
    code: `import google.generativeai as genai

genai.configure(api_key="YOUR_KEY")
model = genai.GenerativeModel("gemini-2.5-flash")

chat = model.start_chat()
response = chat.send_message("Analyze this Google Ads data...")
print(response.text)`,
  },
  {
    id: '2',
    title: 'Google Apps Script — Sheets to Email',
    language: 'javascript',
    category: 'Automation',
    starred: true,
    tags: ['Apps Script', 'Email'],
    code: `function sendDailyReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = ss.getSheetByName("DAILY_REPORT").getDataRange().getValues();
  const html = buildHtmlReport(data);
  
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: "📊 Daily Ads Report - " + new Date().toDateString(),
    htmlBody: html
  });
}`,
  },
  {
    id: '3',
    title: 'Zoho Deluge — calculateRoofAreas',
    language: 'deluge',
    category: 'CRM',
    starred: true,
    tags: ['Zoho', 'Deluge'],
    code: `void automation.calculateRoofAreas(String quoteId){
    mpMap = zoho.crm.getRecordById("Quotes", quoteId);
    
    // Four-case decision tree
    if(mpMap.get("Raw_Breadth_1") == mpMap.get("Breadth_1")){
        // No genuine edit — skip recalculation
        return;
    }
    
    // Calculate roof areas
    breadth1 = mpMap.get("Breadth_1").toDecimal();
    slope = mpMap.get("Slope").toDecimal();
    extension = mpMap.get("Extension").toDecimal();
    
    area = breadth1 * slope + extension;
    zoho.crm.updateRecord("Quotes", quoteId, {"Roof_Area": area});
}`,
  },
  {
    id: '4',
    title: 'n8n Webhook — HMAC Verification',
    language: 'javascript',
    category: 'Automation',
    starred: false,
    tags: ['n8n', 'Security'],
    code: `const crypto = require('crypto');

function verifyHMAC(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`,
  },
  {
    id: '5',
    title: 'FastAPI — JWT Auth Middleware',
    language: 'python',
    category: 'Backend',
    starred: false,
    tags: ['FastAPI', 'JWT'],
    code: `from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_token(token = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY)
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401)

@app.get("/protected")
async def protected(user = Depends(verify_token)):
    return {"user": user["sub"]}`,
  },
  {
    id: '6',
    title: 'Python — Google Ads API Data Pull',
    language: 'python',
    category: 'Ads',
    starred: true,
    tags: ['Google Ads', 'API'],
    code: `from google.ads.googleads.client import GoogleAdsClient

client = GoogleAdsClient.load_from_storage("google-ads.yaml")
ga_service = client.get_service("GoogleAdsService")

query = """
    SELECT ad_group.id, ad_group.name,
           metrics.impressions, metrics.clicks, metrics.cost_micros
    FROM ad_group
    WHERE segments.date DURING LAST_7_DAYS
"""

response = ga_service.search_stream(customer_id="1234567890", query=query)
for batch in response:
    for row in batch.results:
        print(f"{row.ad_group.name}: {row.metrics.clicks} clicks")`,
  },
]

const LANG_COLORS: Record<string, string> = {
  python: 'text-blue-400 bg-blue-500/15',
  javascript: 'text-amber-400 bg-amber-500/15',
  deluge: 'text-rose-400 bg-rose-500/15',
  typescript: 'text-blue-400 bg-blue-500/15',
}

export default function CodeLab() {
  const [ghUrl, setGhUrl] = useState('https://github.com/public-apis/public-apis');
  const [ghPrompt, setGhPrompt] = useState('Extract key tools, architecture, and integration steps for J.A.R.V.I.S.');
  const [ghAnalysis, setGhAnalysis] = useState<any>(null);
  const [ghLoading, setGhLoading] = useState(false);

  const analyzeGitHubRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghUrl.trim()) return;
    setGhLoading(true);
    setGhAnalysis(null);
    playJarvisChime('wake');

    try {
      const res = await fetch('/api/github/analyze-repo', {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ repoUrl: ghUrl.trim(), prompt: ghPrompt.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'SUCCESS') {
        setGhAnalysis(data);
        playJarvisChime('execute');
        if (typeof window !== 'undefined' && window.speechSynthesis && data.spokenSummary) {
          const utter = new SpeechSynthesisUtterance(data.spokenSummary);
          window.speechSynthesis.speak(utter);
        }
      }
    } catch (err) {
      console.error('GitHub analysis failed:', err);
    } finally {
      setGhLoading(false);
    }
  };
  const [snippets, setSnippets] = useState(SNIPPETS)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', ...Array.from(new Set(snippets.map(s => s.category)))]

  const filtered = snippets.filter(s => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchCategory = selectedCategory === 'All' || s.category === selectedCategory
    return matchSearch && matchCategory
  })

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleStar = (id: string) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, starred: !s.starred } : s))
  }

  return (
    <div className="space-y-6">
      {/* J.A.R.V.I.S. GitHub Deep Codebase Analyzer */}
      <div className="relative rounded-2xl p-6 border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                J.A.R.V.I.S. GITHUB REPOSITORY ANALYZER // GEMINI 3.8
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Deep architectural analysis, endpoint discovery, and autonomous code extraction
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            GEMINI 3.8 FLASH
          </span>
        </div>

        <form onSubmit={analyzeGitHubRepo} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                value={ghUrl}
                onChange={(e) => setGhUrl(e.target.value)}
                placeholder="https://github.com/public-apis/public-apis"
                className="w-full px-4 py-2.5 bg-slate-950/90 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs font-mono text-white outline-none"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={ghLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {ghLoading ? 'ANALYZING REPO...' : 'ANALYZE REPO'}
              </button>
            </div>
          </div>
        </form>

        {/* Analysis Results Display */}
        {ghAnalysis && (
          <div className="mt-5 p-5 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-3 animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{ghAnalysis.repository.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Stars: {ghAnalysis.repository.stars.toLocaleString()}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                    {ghAnalysis.repository.language}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{ghAnalysis.repository.description}</p>
              </div>
              <a
                href={ghAnalysis.repository.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-cyan-400 hover:underline"
              >
                Open on GitHub ↗
              </a>
            </div>

            <div className="prose prose-invert max-w-none text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
              {ghAnalysis.analysis}
            </div>
          </div>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-xl">💻</span> AI Code Lab
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Your code arsenal — {snippets.length} snippets across {categories.length - 1} categories</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snippets..."
            className="w-full bg-background/50 border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all',
                selectedCategory === cat
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Snippets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((snippet) => (
          <div key={snippet.id} className="jarvis-card p-4 space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xs font-semibold text-foreground">{snippet.title}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-mono', LANG_COLORS[snippet.language] || 'text-muted-foreground bg-muted')}>
                    {snippet.language}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{snippet.category}</span>
                </div>
              </div>
              <button onClick={() => toggleStar(snippet.id)} className="p-1">
                <Star className={cn('w-3.5 h-3.5', snippet.starred ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')} />
              </button>
            </div>

            <div className="bg-background/80 rounded-lg p-3 overflow-x-auto">
              <pre className="text-[11px] text-foreground/80 font-mono whitespace-pre leading-relaxed">{snippet.code}</pre>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {snippet.tags.map((tag, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{tag}</span>
                ))}
              </div>
              <button
                onClick={() => copyCode(snippet.id, snippet.code)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                {copiedId === snippet.id
                  ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                  : <><Copy className="w-3 h-3" /> Copy</>
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

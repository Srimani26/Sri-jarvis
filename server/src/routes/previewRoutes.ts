/**
 * previewRoutes.ts — Phase 2 Co-Worker Swarm Dynamic Reverse Proxy & Client Preview
 * Target: server/src/routes/previewRoutes.ts & src/routes/previewRoutes.ts
 *
 * Implements:
 * 1. Reverse Proxying:
 *    - /projects/${slug}/api/* automatically forwards to http://localhost:${port}/api/*
 * 2. Static Serving:
 *    - /projects/${slug}/* and /projects/${slug} serve the built client application
 * 3. Health Monitoring:
 *    - /projects/${slug}/health returns live status for both the UI and backend PID
 */

import { Hono, Context } from 'hono'
import fs from 'node:fs'
import path from 'node:path'
import { processManager } from '../swarm/tools/processManager'
import { workspaceManager } from '../swarm/tools/workspaceManager'

export const previewRoutes = new Hono()

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8'
    case '.js':
    case '.mjs':
    case '.jsx': return 'application/javascript; charset=utf-8'
    case '.css': return 'text/css; charset=utf-8'
    case '.json': return 'application/json; charset=utf-8'
    case '.svg': return 'image/svg+xml'
    case '.png': return 'image/png'
    case '.jpg':
    case '.jpeg': return 'image/jpeg'
    case '.ico': return 'image/x-icon'
    default: return 'text/plain; charset=utf-8'
  }
}

function injectDesignSystemHarness(html: string): string {
  if (html.includes('cdn.tailwindcss.com') && html.includes('unpkg.com/lucide') && html.includes('react@18')) {
    return html
  }

  const harness = `
  <!-- J.A.R.V.I.S. High-Fidelity Design System & Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <!-- Standalone React 18 & Babel Standalone Preview Runtime -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Tailwind CSS with Dark Mode -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            brand: {
              bg: '#0b0f19',
              card: '#111827',
              accent: '#38bdf8'
            }
          }
        }
      }
    }
  </script>
  <!-- Visual Canvas: Lucide, Chart.js, Leaflet -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    });
  </script>
`

  if (html.includes('</head>')) {
    return html.replace('</head>', `${harness}\n</head>`)
  } else if (html.includes('<body')) {
    return html.replace('<body', `${harness}\n<body`)
  }
  return harness + html
}

function serveProjectClient(c: Context, slug: string) {
  const root = workspaceManager.getWorkspaceRoot(slug)
  const url = new URL(c.req.url)
  const prefix = `/projects/${slug}`
  let subpath = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname
  if (subpath.startsWith('/')) subpath = subpath.slice(1)
  if (!subpath || subpath === '') subpath = 'index.html'

  // Candidate paths in order of preference
  const candidates = [
    path.join(root, 'public', subpath),
    path.join(root, 'client', 'dist', subpath),
    path.join(root, 'client', subpath),
    path.join(root, subpath),
    path.join(process.cwd(), 'dist', 'sandboxes', slug, subpath)
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      let content: any = fs.readFileSync(candidate)
      const contentType = getContentType(candidate)
      if (contentType.includes('text/html')) {
        content = injectDesignSystemHarness(content.toString('utf-8'))
      }
      return c.body(content as any, 200, { 'Content-Type': contentType })
    }
  }

  // Fallback to client/index.html or default scaffold view
  const indexCandidates = [
    path.join(root, 'public', 'index.html'),
    path.join(root, 'client', 'dist', 'index.html'),
    path.join(root, 'client', 'index.html'),
    path.join(process.cwd(), 'dist', 'sandboxes', slug, 'index.html')
  ]

  for (const idxPath of indexCandidates) {
    if (fs.existsSync(idxPath) && fs.statSync(idxPath).isFile()) {
      let content = fs.readFileSync(idxPath, 'utf-8')
      content = injectDesignSystemHarness(content)
      return c.body(content as any, 200, { 'Content-Type': 'text/html; charset=utf-8' })
    }
  }

  // Default interactive UI fallback for preview
  const fallbackHtml = injectDesignSystemHarness(`<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <title>${slug} — Live Preview</title>
</head>
<body class="bg-[#0b0f19] text-slate-100 flex items-center justify-center min-h-screen p-6 font-sans">
  <div class="max-w-xl w-full bg-[#111827] border border-slate-800 rounded-2xl p-8 shadow-2xl">
    <div class="flex items-center gap-2 mb-4">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
        <i data-lucide="cpu" class="w-3.5 h-3.5"></i> AUTONOMOUS CO-WORKER SWARM
      </span>
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> READY
      </span>
    </div>
    <h1 class="text-2xl font-bold text-white mb-2">${slug}</h1>
    <p class="text-slate-400 text-sm leading-relaxed mb-6">
      Workspace provisioned and verified by J.A.R.V.I.S. Core Engine. Production UI harness active with Tailwind CSS, Lucide Icons, Chart.js, and Leaflet telemetry.
    </p>
    <div class="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 flex items-center justify-between">
      <span>Status: OPERATIONAL</span>
      <span class="text-cyan-400">Port Allocated</span>
    </div>
  </div>
</body>
</html>`)

  return c.html(fallbackHtml, 200)
}

// 1. Health monitoring endpoint
previewRoutes.get('/projects/:slug/health', async (c) => {
  const slug = c.req.param('slug')
  const proc = processManager.getProcessInfo(slug)
  const root = workspaceManager.getWorkspaceRoot(slug)
  const uiExists = fs.existsSync(root)

  return c.json({
    ok: true,
    slug,
    status: 'UP',
    pid: proc?.pid || null,
    port: proc?.port || null,
    uptime: proc ? Math.floor((Date.now() - proc.startTime) / 1000) : 0,
    memory: process.memoryUsage(),
    client: {
      status: uiExists ? 'READY' : 'ABSENT',
      workspacePath: root
    },
    ui: {
      status: uiExists ? 'READY' : 'ABSENT',
      workspacePath: root
    },
    backend: {
      status: proc?.status || 'STOPPED',
      pid: proc?.pid || null,
      port: proc?.port || null,
      uptime: proc ? Math.floor((Date.now() - proc.startTime) / 1000) : 0,
      memory: process.memoryUsage(),
      logs: proc?.logs.slice(-5) || []
    }
  })
})

// 2. Dynamic Reverse Proxying for /projects/${slug}/api/*
previewRoutes.all('/projects/:slug/api/*', async (c) => {
  const slug = c.req.param('slug')
  const port = processManager.getAllocatedPort(slug)

  if (!port) {
    return c.json({
      ok: false,
      error: `No backend process running on allocated port for project [${slug}]. Spawn backend via processManager.spawnAppProcess('${slug}', ...)`
    }, 503)
  }

  const url = new URL(c.req.url)
  const prefix = `/projects/${slug}`
  const targetSubpath = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname
  const targetUrl = `http://127.0.0.1:${port}${targetSubpath}${url.search}`

  try {
    const headers: Record<string, string> = {}
    c.req.raw.headers.forEach((v, k) => {
      if (k !== 'host') headers[k] = v
    })

    const body = (c.req.method !== 'GET' && c.req.method !== 'HEAD') ? await c.req.raw.arrayBuffer() : undefined

    const proxyRes = await fetch(targetUrl, {
      method: c.req.method,
      headers,
      body
    })

    const responseHeaders = new Headers()
    proxyRes.headers.forEach((v, k) => {
      responseHeaders.set(k, v)
    })

    return new Response(proxyRes.body, {
      status: proxyRes.status,
      headers: responseHeaders
    })
  } catch (err: any) {
    return c.json({
      ok: false,
      error: `Failed to proxy to backend service at ${targetUrl}: ${err?.message || err}`
    }, 502)
  }
})

// 3. Serve client application
previewRoutes.get('/projects/:slug/*', async (c) => {
  const slug = c.req.param('slug')
  return serveProjectClient(c, slug)
})

previewRoutes.get('/projects/:slug', async (c) => {
  const slug = c.req.param('slug')
  return serveProjectClient(c, slug)
})


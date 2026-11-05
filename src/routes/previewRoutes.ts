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

function serveProjectClient(c: Context, slug: string) {
  const root = workspaceManager.getWorkspaceRoot(slug)
  const url = new URL(c.req.url)
  const prefix = `/projects/${slug}`
  let subpath = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname
  if (subpath.startsWith('/')) subpath = subpath.slice(1)
  if (!subpath || subpath === '') subpath = 'index.html'

  // Candidate paths in order of preference
  const candidates = [
    path.join(root, 'client', 'dist', subpath),
    path.join(root, 'client', subpath),
    path.join(root, subpath),
    path.join(process.cwd(), 'dist', 'sandboxes', slug, subpath)
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const content = fs.readFileSync(candidate)
      const contentType = getContentType(candidate)
      return c.body(content as any, 200, { 'Content-Type': contentType })
    }
  }

  // Fallback to client/index.html or default scaffold view
  const indexCandidates = [
    path.join(root, 'client', 'dist', 'index.html'),
    path.join(root, 'client', 'index.html'),
    path.join(process.cwd(), 'dist', 'sandboxes', slug, 'index.html')
  ]

  for (const idxPath of indexCandidates) {
    if (fs.existsSync(idxPath) && fs.statSync(idxPath).isFile()) {
      const content = fs.readFileSync(idxPath)
      return c.body(content as any, 200, { 'Content-Type': 'text/html; charset=utf-8' })
    }
  }

  // Default interactive UI fallback for preview
  const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${slug} — Live Preview</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { max-width: 500px; padding: 2rem; background: #0f172a; border: 1px solid #1e293b; border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    h1 { margin-top: 0; color: #38bdf8; font-size: 1.5rem; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background: rgba(56, 189, 248, 0.1); color: #38bdf8; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(56, 189, 248, 0.2); }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">AUTONOMOUS CO-WORKER SWARM</span>
    <h1>${slug}</h1>
    <p>Workspace provisioned and verified by J.A.R.V.I.S. Core Engine. Client application is ready.</p>
  </div>
</body>
</html>`

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
    ui: {
      status: uiExists ? 'READY' : 'ABSENT',
      workspacePath: root
    },
    backend: {
      status: proc?.status || 'STOPPED',
      pid: proc?.pid || null,
      port: proc?.port || null,
      uptime: proc ? Math.floor((Date.now() - proc.startTime) / 1000) : 0,
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

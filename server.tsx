// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Shogo Technologies, Inc.
/**
 * Hono Server (Node.js & Vite compatible)
 */

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import customRoutes from './custom-routes'
import { createToolsHandlers } from '@shogo-ai/sdk/tools/server'

const app = new Hono()

// CORS - manual middleware so wildcard always propagates
app.use('*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*')
  c.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (c.req.method === 'OPTIONS') return c.text('', 204)
  await next()
})

// Health check endpoint
app.get('/health', (c) => c.json({ ok: true, timestamp: new Date().toISOString() }))

// Custom API routes (always mounted under /api)
app.route('/api', customRoutes)

// Installed-integration tools proxy
const tools = createToolsHandlers({})
app.post('/api/tools/execute', (c) => tools.execute(c.req.raw))
app.get('/api/tools/schemas', (c) => tools.list(c.req.raw))

const port = Number(process.env.PORT) || 3005
console.log(`⚡ J.A.R.V.I.S. API Server running on http://localhost:${port}`)

serve({ port, fetch: app.fetch })

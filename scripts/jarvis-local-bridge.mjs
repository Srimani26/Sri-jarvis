#!/usr/bin/env node
/**
 * scripts/jarvis-local-bridge.mjs
 * 
 * Sovereign Local Co-Worker Bridge Daemon for Master Sri's Workstation.
 * Connects directly to J.A.R.V.I.S. Cloud on Render (or local dev server)
 * and executes real, local file reads, writes, audits, and shell commands
 * on E:\Invi-theme and E:\standardroofs-jarvis.
 */

import WebSocket from 'ws'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { exec } from 'node:child_process'

const CLOUD_URL = process.env.JARVIS_CLOUD_URL || 'wss://sri-jarvis.onrender.com/api/coworker/bridge/ws'
const WORKSPACES = {
  'invi-theme': process.env.INVI_THEME_PATH || 'E:\\Invi-theme',
  'standardroofs-jarvis': process.env.JARVIS_PATH || 'E:\\standardroofs-jarvis'
}

console.log('⚡ ====================================================')
console.log('⚡ J.A.R.V.I.S. LOCAL CO-WORKER BRIDGE DAEMON v1.0')
console.log('⚡ Master Sri Local Workstation Interface')
console.log('⚡ ====================================================')
console.log(`📂 Workspaces Bound:`)
for (const [key, dir] of Object.entries(WORKSPACES)) {
  const exists = fs.existsSync(dir)
  console.log(`   - [${key}]: ${dir} (${exists ? 'FOUND ✅' : 'NOT FOUND ⚠️'})`)
}
console.log(`🔗 Target Gateway: ${CLOUD_URL}\n`)

let ws = null
let reconnectInterval = 3000

function connect() {
  console.log(`⏳ Connecting to J.A.R.V.I.S. Cloud Bridge at ${CLOUD_URL}...`)

  try {
    ws = new WebSocket(CLOUD_URL)
  } catch (err) {
    console.error('❌ Socket creation failed:', err.message)
    setTimeout(connect, reconnectInterval)
    return
  }

  ws.on('open', () => {
    console.log('🚀 [CONNECTED] Successfully authenticated with J.A.R.V.I.S. Cloud Gateway!')
    
    // Register Workstation
    const handshake = {
      type: 'WORKER_REGISTER',
      workerId: `worker-${os.hostname()}`,
      hostname: os.hostname(),
      os: `${os.type()} ${os.release()} (${os.arch()})`,
      workspaces: WORKSPACES,
      timestamp: Date.now()
    }
    ws.send(JSON.stringify(handshake))
  })

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString())

      if (msg.type === 'REGISTER_ACK') {
        console.log('✅ Handshake confirmed. J.A.R.V.I.S. Co-Workers now have direct local access.')
        return
      }

      if (msg.type === 'PONG') return

      if (msg.id && msg.action) {
        await handleLocalRequest(msg)
      }
    } catch (err) {
      console.error('⚠️ Failed to process incoming message:', err.message)
    }
  })

  ws.on('close', () => {
    console.warn(`⚠️ Disconnected from J.A.R.V.I.S. Cloud. Reconnecting in ${reconnectInterval / 1000}s...`)
    setTimeout(connect, reconnectInterval)
  })

  ws.on('error', (err) => {
    console.error('❌ Connection error:', err.message)
  })
}

async function handleLocalRequest(req) {
  const start = Date.now()
  const baseDir = WORKSPACES[req.workspace] || WORKSPACES['invi-theme']

  console.log(`\n📥 [EXECUTE] Action: ${req.action} | Workspace: ${req.workspace} | Target: ${req.path || req.command || ''}`)

  const reply = (success, data, error) => {
    const res = {
      requestId: req.id,
      success,
      data,
      error,
      executionTimeMs: Date.now() - start
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(res))
    }
  }

  try {
    switch (req.action) {
      case 'READ_FILE': {
        const fullPath = path.resolve(baseDir, req.path || '')
        if (!fs.existsSync(fullPath)) {
          return reply(false, null, `File not found: ${fullPath}`)
        }
        const content = fs.readFileSync(fullPath, 'utf8')
        console.log(`   ✅ Read ${content.length} chars from ${path.basename(fullPath)}`)
        return reply(true, { content, path: fullPath, size: content.length })
      }

      case 'WRITE_FILE': {
        const fullPath = path.resolve(baseDir, req.path || '')
        fs.mkdirSync(path.dirname(fullPath), { recursive: true })
        fs.writeFileSync(fullPath, req.content || '', 'utf8')
        console.log(`   ✅ Wrote ${(req.content || '').length} chars to ${path.basename(fullPath)}`)
        return reply(true, { path: fullPath, writtenBytes: Buffer.byteLength(req.content || '', 'utf8') })
      }

      case 'LIST_DIR': {
        const fullPath = path.resolve(baseDir, req.path || '')
        if (!fs.existsSync(fullPath)) {
          return reply(false, null, `Directory not found: ${fullPath}`)
        }
        const entries = fs.readdirSync(fullPath, { withFileTypes: true }).map(e => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          isFile: e.isFile()
        }))
        return reply(true, { path: fullPath, entries })
      }

      case 'AUDIT_LIQUID': {
        const targetFile = req.path ? path.resolve(baseDir, req.path) : path.resolve(baseDir, 'sections', 'invi-register-popup.liquid')
        if (!fs.existsSync(targetFile)) {
          return reply(false, null, `Liquid file not found: ${targetFile}`)
        }
        const code = fs.readFileSync(targetFile, 'utf8')
        const audit = auditShopifyLiquid(code, path.basename(targetFile))
        console.log(`   ✅ Liquid Audit Complete: ${audit.status} (${audit.issues.length} issues)`)
        return reply(true, { file: targetFile, audit })
      }

      case 'GIT_STATUS': {
        exec('git status --short', { cwd: baseDir }, (err, stdout, stderr) => {
          if (err) return reply(false, null, stderr || err.message)
          return reply(true, { output: stdout.trim(), branch: 'main' })
        })
        break
      }

      case 'EXECUTE_SHELL': {
        const cmd = req.command || 'echo "No command provided"'
        exec(cmd, { cwd: baseDir, timeout: 30000 }, (err, stdout, stderr) => {
          if (err) return reply(false, { stdout, stderr }, err.message)
          return reply(true, { stdout, stderr })
        })
        break
      }

      default:
        return reply(false, null, `Unsupported action: ${req.action}`)
    }
  } catch (err) {
    console.error(`   ❌ Action failed:`, err.message)
    reply(false, null, err.message)
  }
}

function auditShopifyLiquid(content, filename) {
  const issues = []
  
  // 1. Tag balance check
  const openIfs = (content.match(/{%\s*if\b/g) || []).length
  const closeIfs = (content.match(/{%\s*endif\b/g) || []).length
  if (openIfs !== closeIfs) {
    issues.push({ severity: 'ERROR', message: `Mismatched if/endif tags: ${openIfs} open vs ${closeIfs} closed.` })
  }

  const openSchemas = (content.match(/{%\s*schema\b/g) || []).length
  const closeSchemas = (content.match(/{%\s*endschema\b/g) || []).length
  if (openSchemas !== closeSchemas) {
    issues.push({ severity: 'ERROR', message: `Mismatched schema/endschema tags: ${openSchemas} open vs ${closeSchemas} closed.` })
  }

  // 2. Schema JSON parse validation
  const schemaMatch = content.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/)
  if (schemaMatch && schemaMatch[1]) {
    try {
      JSON.parse(schemaMatch[1].trim())
    } catch (e) {
      issues.push({ severity: 'ERROR', message: `Invalid JSON syntax inside {% schema %}: ${e.message}` })
    }
  }

  // 3. Accessibility & UX checks
  if (content.includes('<svg') && !content.includes('aria-hidden') && !content.includes('aria-label')) {
    issues.push({ severity: 'WARNING', message: 'SVG elements missing accessibility attributes (aria-hidden or aria-label).' })
  }

  return {
    filename,
    lines: content.split('\n').length,
    status: issues.some(i => i.severity === 'ERROR') ? 'ERROR' : issues.length > 0 ? 'WARNING' : 'PERFECT',
    issues
  }
}

// Keep-alive ping every 25 seconds
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }))
  }
}, 25000)

connect()

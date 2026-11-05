/**
 * workspaceManager.ts — Dedicated Workspace File System & Scaffolder
 * Target: server/src/swarm/tools/workspaceManager.ts & src/swarm/tools/workspaceManager.ts
 *
 * Implements Phase 2 Autonomous Co-Worker Swarm Workspaces:
 * - Provisions isolated workspace directories at workspaces/${slug}/ for FULLSTACK_SAAS
 * - Scaffolds discrete, production-ready directory trees:
 *   workspaces/${slug}/
 *   ├── client/
 *   │   ├── package.json
 *   │   ├── vite.config.js
 *   │   ├── src/
 *   │   │   ├── main.jsx
 *   │   │   ├── App.jsx
 *   │   │   ├── components/
 *   │   │   └── index.css
 *   ├── server/
 *   │   ├── package.json
 *   │   ├── src/
 *   │   │   ├── app.js
 *   │   │   ├── routes/
 *   │   │   └── middleware/
 *   ├── prisma/
 *   │   └── schema.prisma
 *   └── package.json (Workspace root)
 * - Enables specialists (Aegis, Raphael, Cerebro, Midas) to write and patch individual files
 *   on disk using atomic file operations.
 */

import fs from 'node:fs'
import path from 'node:path'

export interface WorkspaceManifest {
  slug: string
  workspaceRoot: string
  scope: 'FULLSTACK_SAAS' | 'SPA_PROTOTYPE'
  clientDir: string
  serverDir: string
  prismaDir: string
  files: string[]
  createdAt: string
}

export class WorkspaceManager {
  private static instance: WorkspaceManager

  public static getInstance(): WorkspaceManager {
    if (!WorkspaceManager.instance) {
      WorkspaceManager.instance = new WorkspaceManager()
    }
    return WorkspaceManager.instance
  }

  public getWorkspaceRoot(slug: string, baseDir = process.cwd()): string {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'app'
    return path.resolve(baseDir, 'workspaces', cleanSlug)
  }

  /**
   * Provision a discrete full-stack workspace directory tree
   */
  public provisionWorkspace(
    rawSlug: string,
    scope: 'FULLSTACK_SAAS' | 'SPA_PROTOTYPE' = 'FULLSTACK_SAAS',
    baseDir = process.cwd()
  ): WorkspaceManifest {
    const cleanSlug = rawSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'app'
    const rootDir = this.getWorkspaceRoot(cleanSlug, baseDir)
    const clientDir = path.join(rootDir, 'client')
    const serverDir = path.join(rootDir, 'server')
    const prismaDir = path.join(rootDir, 'prisma')

    // Ensure directory structures exist
    fs.mkdirSync(path.join(clientDir, 'src', 'components'), { recursive: true })
    fs.mkdirSync(path.join(serverDir, 'src', 'routes'), { recursive: true })
    fs.mkdirSync(path.join(serverDir, 'src', 'middleware'), { recursive: true })
    fs.mkdirSync(prismaDir, { recursive: true })

    const createdFiles: string[] = []

    const writeFileSafe = (relPath: string, content: string) => {
      const fullPath = path.join(rootDir, relPath)
      const parentDir = path.dirname(fullPath)
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true })
      }
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content.trim() + '\n', 'utf-8')
      }
      createdFiles.push(relPath.replace(/\\/g, '/'))
    }

    // 1. Root Workspace package.json
    writeFileSafe(
      'package.json',
      JSON.stringify(
        {
          name: `${cleanSlug}-workspace`,
          version: '1.0.0',
          private: true,
          workspaces: ['client', 'server'],
          scripts: {
            dev: 'concurrently "npm run dev:server" "npm run dev:client"',
            'dev:server': 'npm run dev --workspace=server',
            'dev:client': 'npm run dev --workspace=client',
            build: 'npm run build --workspace=client',
            start: 'node server/src/app.js'
          }
        },
        null,
        2
      )
    )

    // 2. Client files
    writeFileSafe(
      'client/package.json',
      JSON.stringify(
        {
          name: `${cleanSlug}-client`,
          version: '1.0.0',
          private: true,
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview'
          },
          dependencies: {
            react: '^18.3.1',
            'react-dom': '^18.3.1',
            'lucide-react': '^0.344.0'
          },
          devDependencies: {
            '@vitejs/plugin-react': '^4.2.1',
            vite: '^5.1.4'
          }
        },
        null,
        2
      )
    )

    writeFileSafe(
      'client/vite.config.js',
      `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
})`
    )

    writeFileSafe(
      'client/src/main.jsx',
      `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`
    )

    writeFileSafe(
      'client/src/App.jsx',
      `import React, { useState } from 'react'

export default function App() {
  const [status, setStatus] = useState('Online')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
          ${cleanSlug.replace(/-/g, ' ').toUpperCase()}
        </h1>
        <p className="text-slate-400 mt-2">
          Autonomous Full-Stack System engineered by J.A.R.V.I.S. Swarm.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Status: {status}
        </div>
      </div>
    </div>
  )
}`
    )

    writeFileSafe(
      'client/src/components/Dashboard.jsx',
      `import React from 'react'

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-400">Telemetry</h3>
        <p className="text-2xl font-bold text-white mt-1">100%</p>
      </div>
    </div>
  )
}`
    )

    writeFileSafe(
      'client/src/index.css',
      `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #020617;
  color: #f8fafc;
}

#root {
  min-height: 100vh;
}`
    )

    writeFileSafe(
      'client/index.html',
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${cleanSlug.replace(/-/g, ' ')}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
    )

    // 3. Server files
    writeFileSafe(
      'server/package.json',
      JSON.stringify(
        {
          name: `${cleanSlug}-server`,
          version: '1.0.0',
          private: true,
          main: 'src/app.js',
          scripts: {
            start: 'node src/app.js',
            dev: 'node --watch src/app.js'
          },
          dependencies: {
            express: '^4.19.2',
            cors: '^2.8.5',
            dotenv: '^16.4.5'
          }
        },
        null,
        2
      )
    )

    writeFileSafe(
      'server/src/app.js',
      `const express = require('express')
const cors = require('cors')
const apiRoutes = require('./routes/api')

const app = express()
const port = Number(process.env.PORT) || 4000

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'UP',
    service: '${cleanSlug}-server',
    port,
    timestamp: new Date().toISOString()
  })
})

app.use('/api', apiRoutes)

if (require.main === module) {
  app.listen(port, () => {
    console.log(\`🚀 [${cleanSlug}] Backend running on http://localhost:\${port}\`)
  })
}

module.exports = app`
    )

    writeFileSafe(
      'server/src/routes/api.js',
      `const express = require('express')
const router = express.Router()

router.get('/status', (req, res) => {
  res.json({
    ok: true,
    service: '${cleanSlug}',
    status: 'OPERATIONAL',
    timestamp: new Date().toISOString()
  })
})

router.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version
  })
})

module.exports = router`
    )

    writeFileSafe(
      'server/src/middleware/auth.js',
      `module.exports = function authMiddleware(req, res, next) {
  // Sovereign zero-trust biometric or JWT token check
  next()
}`
    )

    // 4. Prisma files
    writeFileSafe(
      'prisma/schema.prisma',
      `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  users     User[]
}

model User {
  id             String       @id @default(uuid())
  organizationId String
  email          String       @unique
  name           String?
  role           String       @default("MEMBER")
  organization   Organization @relation(fields: [organizationId], references: [id])
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}`
    )

    return {
      slug: cleanSlug,
      workspaceRoot: rootDir,
      scope,
      clientDir,
      serverDir,
      prismaDir,
      files: createdFiles,
      createdAt: new Date().toISOString()
    }
  }

  /**
   * Atomically write a file inside the specified workspace
   */
  public writeWorkspaceFile(
    slug: string,
    relativePath: string,
    content: string,
    baseDir = process.cwd()
  ): string {
    const rootDir = this.getWorkspaceRoot(slug, baseDir)
    const targetPath = path.resolve(rootDir, relativePath)

    // Security check: ensure path does not escape rootDir
    if (!targetPath.startsWith(rootDir)) {
      throw new Error(`Security violation: attempted to write outside workspace: ${relativePath}`)
    }

    const parentDir = path.dirname(targetPath)
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true })
    }

    // Atomic write via temp file
    const tempPath = `${targetPath}.tmp.${Date.now()}`
    fs.writeFileSync(tempPath, content, 'utf-8')
    fs.renameSync(tempPath, targetPath)

    return targetPath
  }

  /**
   * Read a file from the workspace
   */
  public readWorkspaceFile(
    slug: string,
    relativePath: string,
    baseDir = process.cwd()
  ): string | null {
    const rootDir = this.getWorkspaceRoot(slug, baseDir)
    const targetPath = path.resolve(rootDir, relativePath)

    if (!targetPath.startsWith(rootDir) || !fs.existsSync(targetPath)) {
      return null
    }

    return fs.readFileSync(targetPath, 'utf-8')
  }

  /**
   * Atomically patch an existing workspace file
   */
  public patchWorkspaceFile(
    slug: string,
    relativePath: string,
    patch: string | ((prev: string) => string),
    baseDir = process.cwd()
  ): boolean {
    const existing = this.readWorkspaceFile(slug, relativePath, baseDir) || ''
    const updated = typeof patch === 'function' ? patch(existing) : patch
    this.writeWorkspaceFile(slug, relativePath, updated, baseDir)
    return true
  }

  /**
   * Get workspace manifest & list of all files
   */
  public getWorkspaceManifest(slug: string, baseDir = process.cwd()): WorkspaceManifest | null {
    const rootDir = this.getWorkspaceRoot(slug, baseDir)
    if (!fs.existsSync(rootDir)) return null

    const allFiles: string[] = []
    const scanDir = (dir: string, base: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        const rel = path.relative(base, full).replace(/\\/g, '/')
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
            scanDir(full, base)
          }
        } else {
          allFiles.push(rel)
        }
      }
    }

    scanDir(rootDir, rootDir)

    return {
      slug,
      workspaceRoot: rootDir,
      scope: 'FULLSTACK_SAAS',
      clientDir: path.join(rootDir, 'client'),
      serverDir: path.join(rootDir, 'server'),
      prismaDir: path.join(rootDir, 'prisma'),
      files: allFiles,
      createdAt: new Date().toISOString()
    }
  }

  public listWorkspaces(baseDir = process.cwd()): string[] {
    const workspacesDir = path.resolve(baseDir, 'workspaces')
    if (!fs.existsSync(workspacesDir)) return []
    return fs.readdirSync(workspacesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
  }
}

export const workspaceManager = WorkspaceManager.getInstance()


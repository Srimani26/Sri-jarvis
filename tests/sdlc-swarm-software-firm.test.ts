/**
 * sdlc-swarm-software-firm.test.ts — Autonomous Software Engineering Firm & 6-Stage SDLC Swarm Test Suite
 * Target: tests/sdlc-swarm-software-firm.test.ts
 *
 * Verifies:
 * - Stage 1: J.A.R.V.I.S. (Chief Systems Architect & Planner) -> Machine-readable ProjectBlueprint
 * - Stage 2: Cerebro (Database & Data Modeling Specialist) -> PostgreSQL / Prisma ORM & deterministic seeds
 * - Stage 3: Aegis (Backend, Systems & API Engineer) -> Express REST routes & RBAC middleware (Admin, Manager, Inspector, Client)
 * - Stage 4: Raphael (UI/UX, Frontend & Responsive Specialist) -> Glassmorphism & multi-viewport (Mobile 320-480px, Tablet 768-1024px, Desktop 1280px-4K)
 * - Stage 5: Midas (Business Engine, Computation & SaaS Monetization) -> Math calculation engine & CSV/PDF export
 * - Stage 6: Friday (QA, Integration Tester & DevOps Deployer) -> Contract audits, live preview mount & ZIP packaging
 * - Stage 7: End-to-End 6-Stage Autonomous SDLC Execution Pipeline
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { swarmOrchestrator } from '../server/src/swarm/engine/SwarmOrchestrator'
import { cerebroSpecialist } from '../server/src/swarm/specialists/CerebroSpecialist'
import { aegisSpecialist } from '../server/src/swarm/specialists/AegisSpecialist'
import { raphaelSpecialist } from '../server/src/swarm/specialists/RaphaelSpecialist'
import { midasSpecialist } from '../server/src/swarm/specialists/MidasSpecialist'
import { fridaySpecialist } from '../server/src/swarm/specialists/FridaySpecialist'

describe('Autonomous Software Engineering Firm & 6-Stage SDLC Swarm Suite', () => {
  const sampleDirective = 'Build a responsive commercial solar ROI calculator web app'

  describe('Stage 1: J.A.R.V.I.S. Chief Systems Architect & Planner', () => {
    it('should decompose directive into a machine-readable ProjectBlueprint with strict contracts', () => {
      const blueprint = swarmOrchestrator.generateBlueprint(sampleDirective)

      // Core metadata
      assert.ok(blueprint.name)
      assert.strictEqual(blueprint.slug, 'commercial-solar-commercial-roi-calculator')
      assert.strictEqual(blueprint.scope, 'SPA_PROTOTYPE')
      assert.ok(blueprint.description.includes('J.A.R.V.I.S.'))

      // Database contract
      assert.strictEqual(blueprint.database.provider, 'postgresql')
      assert.strictEqual(blueprint.database.isMultiTenant, true)
      assert.strictEqual(blueprint.database.tenantField, 'organizationId')
      assert.ok(blueprint.database.models.some(m => m.name === 'SolarProject'))

      // Backend API contract
      assert.ok(blueprint.backend.endpoints.length >= 3)
      assert.ok(blueprint.backend.endpoints.some(e => e.path === '/api/v1/tenant'))
      assert.ok(blueprint.backend.endpoints.some(e => e.path === '/api/v1/metrics'))
      assert.ok(blueprint.backend.rbacRoles.includes('Admin'))
      assert.ok(blueprint.backend.rbacRoles.includes('Manager'))
      assert.ok(blueprint.backend.rbacRoles.includes('Inspector'))
      assert.ok(blueprint.backend.rbacRoles.includes('Client'))

      // Frontend UI & Viewports contract
      assert.strictEqual(blueprint.frontend.viewports.mobile.maxWidth, 480)
      assert.strictEqual(blueprint.frontend.viewports.mobile.minTouchTarget, 48)
      assert.strictEqual(blueprint.frontend.viewports.tablet.minWidth, 768)
      assert.strictEqual(blueprint.frontend.viewports.tablet.maxWidth, 1024)
      assert.strictEqual(blueprint.frontend.viewports.desktop.minWidth, 1280)
      assert.strictEqual(blueprint.frontend.theme.glassmorphism, true)

      // Business logic & monetization contract
      assert.ok(blueprint.businessLogic.formulas.some(f => f.name === 'GrossCapex'))
      assert.ok(blueprint.businessLogic.formulas.some(f => f.name === 'FederalITC'))
      assert.ok(blueprint.businessLogic.exportFormats.includes('CSV'))
      assert.ok(blueprint.businessLogic.exportFormats.includes('PDF'))
      assert.ok(blueprint.businessLogic.saasTiers.includes('ENTERPRISE'))
    })
  })

  describe('Stage 2: Cerebro Database Architect & Data Modeling Specialist', () => {
    it('should generate production PostgreSQL Prisma schema with multi-tenancy & cascade delete', () => {
      const blueprint = swarmOrchestrator.generateBlueprint(sampleDirective)
      const schema = cerebroSpecialist.generatePrismaSchema(blueprint)

      assert.ok(schema.includes('datasource db'))
      assert.ok(schema.includes('provider = "postgresql"'))
      assert.ok(schema.includes('model Organization'))
      assert.ok(schema.includes('model User'))
      assert.ok(schema.includes('model SolarProject'))
      assert.ok(schema.includes('organizationId String'))
      assert.ok(schema.includes('onDelete: Cascade'))
      assert.ok(schema.includes('@@index([organizationId])'))
    })

    it('should generate deterministic mock seeds with Admin, Manager, Inspector, Client roles', () => {
      const blueprint = swarmOrchestrator.generateBlueprint(sampleDirective)
      const { seedTs, mockJson } = cerebroSpecialist.generateMockSeed(blueprint)

      assert.ok(seedTs.includes('prisma.organization.upsert'))
      assert.ok(seedTs.includes('prisma.user.upsert'))

      const parsedMock = JSON.parse(mockJson)
      assert.ok(parsedMock.organizations.length > 0)
      assert.ok(parsedMock.users.some((u: any) => u.role === 'ADMIN'))
      assert.ok(parsedMock.users.some((u: any) => u.role === 'MANAGER'))
      assert.ok(parsedMock.users.some((u: any) => u.role === 'INSPECTOR'))
      assert.ok(parsedMock.users.some((u: any) => u.role === 'CLIENT'))
    })
  })

  describe('Stage 3: Aegis Backend, Systems & API Engineer', () => {
    it('should generate RBAC security middleware covering Admin, Manager, Inspector, Client', () => {
      const middlewareCode = aegisSpecialist.generateRbacMiddleware()

      assert.ok(middlewareCode.includes('ROLES.ADMIN'))
      assert.ok(middlewareCode.includes('ROLES.MANAGER'))
      assert.ok(middlewareCode.includes('ROLES.INSPECTOR'))
      assert.ok(middlewareCode.includes('ROLES.CLIENT'))
      assert.ok(middlewareCode.includes('verifyToken'))
      assert.ok(middlewareCode.includes('requireRole'))
    })

    it('should generate modular Express REST routes and server entrypoint', () => {
      const blueprint = swarmOrchestrator.generateBlueprint(sampleDirective)
      const routesCode = aegisSpecialist.generateBackendRoutes(blueprint)
      const serverCode = aegisSpecialist.generateExpressServer(blueprint)

      assert.ok(routesCode.includes("router.get('/tenant'"))
      assert.ok(routesCode.includes("router.get('/metrics'"))
      assert.ok(routesCode.includes('requireRole'))
      assert.ok(routesCode.includes('module.exports = router'))

      assert.ok(serverCode.includes("app.use('/api/v1', verifyToken, apiRoutes)"))
      assert.ok(serverCode.includes("app.get('/health'"))
    })
  })

  describe('Stage 4: Raphael UI/UX, Frontend & Responsive Design Specialist', () => {
    it('should generate responsive CSS adhering to Mobile (48px touch), Tablet, and Desktop breakpoints', () => {
      const blueprint = swarmOrchestrator.generateBlueprint(sampleDirective)
      const css = raphaelSpecialist.generateResponsiveCss(blueprint)

      // Mobile viewport breakpoint (320px–480px)
      assert.ok(css.includes('@media screen and (max-width: 480px)'))
      assert.ok(css.includes('min-height: 48px')) // Strict 48px touch target

      // Tablet viewport breakpoint (768px–1024px)
      assert.ok(css.includes('@media screen and (min-width: 768px) and (max-width: 1024px)'))

      // Desktop viewport breakpoint (1280px–4K)
      assert.ok(css.includes('@media screen and (min-width: 1280px)'))

      // Dark glassmorphism
      assert.ok(css.includes('backdrop-filter: blur'))
      assert.ok(css.includes('--surface-glass'))
      assert.ok(css.includes('--bg-primary'))
    })

    it('should generate semantic HTML layout with form controls and ARIA labels', () => {
      const blueprint = swarmOrchestrator.generateBlueprint(sampleDirective)
      const html = raphaelSpecialist.generateHtmlLayout(blueprint)

      assert.ok(html.includes('id="calculator-root"'))
      assert.ok(html.includes('id="roof-sqft"'))
      assert.ok(html.includes('id="solar-kw"'))
      assert.ok(html.includes('id="electricity-rate"'))
      assert.ok(html.includes('id="export-csv-btn"'))
      assert.ok(html.includes('id="export-pdf-btn"'))
      assert.ok(html.includes('id="projection-table-body"'))
    })
  })

  describe('Stage 5: Midas Business Engine, Computation & SaaS Monetization', () => {
    it('should generate quantitative math calculation engine with CSV and PDF export triggers', () => {
      const blueprint = swarmOrchestrator.generateBlueprint(sampleDirective)
      const js = midasSpecialist.generateComputationEngine(blueprint)

      // Mathematical logic
      assert.ok(js.includes('grossCapex'))
      assert.ok(js.includes('itcCredit'))
      assert.ok(js.includes('netCapex'))
      assert.ok(js.includes('paybackYears'))

      // Dynamic event bindings
      assert.ok(js.includes("addEventListener('input', recalculate)"))
      assert.ok(js.includes("addEventListener('change', recalculate)"))

      // Multi-format client data exports
      assert.ok(js.includes('export-csv-btn'))
      assert.ok(js.includes('Blob([csv]'))
      assert.ok(js.includes('export-pdf-btn'))
      assert.ok(js.includes('window.print()'))
    })
  })

  describe('Stage 6: Friday QA Integration Audit & DevOps Deployer', () => {
    it('should audit DOM ID contracts and report missing queried elements', () => {
      const html = `<div id="container"><input id="field-1" /></div>`
      const js = `
        const f1 = document.getElementById('field-1');
        const f2 = document.getElementById('missing-field-2');
      `

      const audit = fridaySpecialist.auditContracts({
        html,
        css: 'body { color: white; }',
        js
      })

      assert.strictEqual(audit.passed, false)
      assert.ok(audit.domIdAudit.missingIds.includes('missing-field-2'))
      assert.ok(audit.domIdAudit.matchedIds.includes('field-1'))
    })

    it('should pass audit when all queried DOM IDs exist and syntax is valid', () => {
      const html = `<div id="roof-sqft"></div><div id="solar-kw"></div><button id="export-csv-btn"></button>`
      const js = `
        const r = document.getElementById('roof-sqft');
        const s = document.getElementById('solar-kw');
        const btn = document.getElementById('export-csv-btn');
      `

      const audit = fridaySpecialist.auditContracts({
        html,
        css: 'body { color: white; }',
        js
      })

      assert.strictEqual(audit.passed, true)
      assert.strictEqual(audit.syntaxValid, true)
      assert.strictEqual(audit.domIdAudit.missingIds.length, 0)
    })

    it('should package deliverable directory into a valid ZIP archive with PK header', async () => {
      const testDir = join(process.cwd(), 'artifacts', 'builds', 'test-sdlc-zip-pack')
      const { mkdirSync, writeFileSync } = await import('node:fs')
      mkdirSync(testDir, { recursive: true })
      writeFileSync(join(testDir, 'index.html'), '<h1>Test</h1>', 'utf-8')
      writeFileSync(join(testDir, 'app.js'), 'console.log("ready");', 'utf-8')

      const zipPath = await fridaySpecialist.packageDeliverableZip(testDir)
      assert.ok(existsSync(zipPath))

      const zipBuffer = readFileSync(zipPath)
      // Check standard PK zip local file header signature 0x04034b50
      assert.strictEqual(zipBuffer[0], 0x50) // 'P'
      assert.strictEqual(zipBuffer[1], 0x4b) // 'K'
      assert.strictEqual(zipBuffer[2], 0x03)
      assert.strictEqual(zipBuffer[3], 0x04)
    })
  })

  describe('Stage 7: End-to-End 6-Stage Autonomous SDLC Execution Pipeline', () => {
    it('should orchestrate full 6-stage lifecycle and deliver verified preview build with ZIP', async () => {
      const result = await swarmOrchestrator.orchestrateTask(sampleDirective, {
        specialist: 'jarvis',
        workspaceRoot: process.cwd()
      })

      assert.strictEqual('stages' in result, true)
      if ('stages' in result) {
        assert.strictEqual(result.success, true)
        assert.ok(result.previewUrl.includes('/preview/'))
        assert.ok(result.previewPath.startsWith('/preview/'))
        assert.ok(result.zipPath && existsSync(result.zipPath), 'deliverable.zip must exist on disk')

        // Blueprint verification
        assert.ok(result.blueprint)
        assert.strictEqual(result.blueprint.slug, result.slug)

        // Contract audit verification
        assert.ok(result.contractAudit)
        assert.strictEqual(result.contractAudit.passed, true)
        assert.strictEqual(result.contractAudit.syntaxValid, true)

        // Files created verification
        assert.ok(result.filesCreated.includes('index.html'))
        assert.ok(result.filesCreated.includes('styles.css'))
        assert.ok(result.filesCreated.includes('app.js'))
        assert.ok(result.filesCreated.includes('deliverable.zip'))

        // Inspect physical build files
        const buildDir = join(process.cwd(), 'artifacts', 'builds', result.slug)
        assert.ok(existsSync(join(buildDir, 'index.html')))
        assert.ok(existsSync(join(buildDir, 'styles.css')))
        assert.ok(existsSync(join(buildDir, 'app.js')))
        assert.ok(existsSync(join(buildDir, 'blueprint.json')))
        assert.ok(existsSync(join(buildDir, 'deliverable.zip')))
      }
    })
  })
})


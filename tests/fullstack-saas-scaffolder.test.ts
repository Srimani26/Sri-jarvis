import { describe, it } from 'node:test'
import assert from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { appBuilderEngine, classifyProjectScope } from '../server/src/swarm/tools/appBuilderEngine'
import { getAuthRbacBlueprint, getStripeBillingBlueprint, getMultiTenantPrismaBlueprint } from '../server/src/swarm/specialists/MidasSpecialist'
import { fridaySpecialist } from '../server/src/swarm/specialists/FridaySpecialist'

describe('Full-Stack Multi-File SaaS Scaffolder & Industrial Automation Suite', () => {
  describe('Criterion 1: Project Scope Classification', () => {
    it('should classify fullstack, saas, backend, and prisma tasks as SCOPE_FULLSTACK', () => {
      assert.strictEqual(classifyProjectScope('Scaffold a fullstack multi-tenant SaaS application with Prisma'), 'SCOPE_FULLSTACK')
      assert.strictEqual(classifyProjectScope('Create an enterprise SaaS dashboard with backend API routes'), 'SCOPE_FULLSTACK')
      assert.strictEqual(classifyProjectScope('Build full-stack customer portal with Express and PostgreSQL'), 'SCOPE_FULLSTACK')
    })

    it('should classify simple single-page widgets as SCOPE_SPA', () => {
      assert.strictEqual(classifyProjectScope('Build a simple commercial solar ROI calculator'), 'SCOPE_SPA')
      assert.strictEqual(classifyProjectScope('Create interactive crypto price ticker widget'), 'SCOPE_SPA')
    })
  })

  describe('Criterion 2: Multi-File Directory Layout Generation', () => {
    it('should scaffold complete modular directory structure with React, Express, and Prisma', () => {
      const slug = 'test-fullstack-saas-portal'
      const result = appBuilderEngine.scaffoldFullstackDeliverable({
        slug,
        title: 'Master Sri SaaS Enterprise Hub',
        description: 'Multi-tenant commercial SaaS architecture'
      }, process.cwd())

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.scope, 'SCOPE_FULLSTACK')
      assert.ok(result.previewUrl.includes('/preview/test-fullstack-saas-portal'))

      const buildDir = join(process.cwd(), 'artifacts', 'builds', slug)

      // Frontend checks
      assert.ok(existsSync(join(buildDir, 'frontend', 'index.html')))
      assert.ok(existsSync(join(buildDir, 'frontend', 'src', 'App.jsx')))
      assert.ok(existsSync(join(buildDir, 'frontend', 'src', 'components', 'Dashboard.jsx')))
      assert.ok(existsSync(join(buildDir, 'frontend', 'src', 'styles', 'globals.css')))

      // Backend checks
      assert.ok(existsSync(join(buildDir, 'backend', 'server.js')))
      assert.ok(existsSync(join(buildDir, 'backend', 'routes', 'api.js')))
      assert.ok(existsSync(join(buildDir, 'backend', 'middleware', 'auth.js')))

      // Prisma & Documentation checks
      assert.ok(existsSync(join(buildDir, 'prisma', 'schema.prisma')))
      assert.ok(existsSync(join(buildDir, 'README.md')))
      assert.ok(existsSync(join(buildDir, 'index.html')))

      // Content verification
      const serverJs = readFileSync(join(buildDir, 'backend', 'server.js'), 'utf-8')
      assert.ok(serverJs.includes('express()'))
      assert.ok(serverJs.includes('/api/v1'))

      const prismaSchema = readFileSync(join(buildDir, 'prisma', 'schema.prisma'), 'utf-8')
      assert.ok(prismaSchema.includes('model Organization'))
      assert.ok(prismaSchema.includes('model User'))

      const readme = readFileSync(join(buildDir, 'README.md'), 'utf-8')
      assert.ok(readme.includes('Architecture Overview') || readme.includes('Full-Stack Architecture'))
    })
  })

  describe('Criterion 3: Midas Multi-Tenant SaaS Blueprints', () => {
    it('should provide production Auth & RBAC blueprints with token validation', () => {
      const rbac = getAuthRbacBlueprint()
      assert.ok(rbac.includes('verifyToken'))
      assert.ok(rbac.includes('requireRole'))
      assert.ok(rbac.includes('ADMIN'))
      assert.ok(rbac.includes('CUSTOMER'))
    })

    it('should provide Stripe monetization blueprints with webhook signature check', () => {
      const billing = getStripeBillingBlueprint()
      assert.ok(billing.includes('checkout-session'))
      assert.ok(billing.includes('stripeClient.webhooks.constructEvent'))
      assert.ok(billing.includes('STARTER'))
      assert.ok(billing.includes('ENTERPRISE'))
    })

    it('should provide multi-tenant Prisma client scoping blueprint', () => {
      const prismaExt = getMultiTenantPrismaBlueprint()
      assert.ok(prismaExt.includes('scopedPrismaClient'))
      assert.ok(prismaExt.includes('organizationId'))
    })
  })

  describe('Criterion 4: Friday Heavy Inbound Webhook Ingestion Engine', () => {
    it('should ingest external Stripe payment webhooks and enqueue durable tasks', async () => {
      const payload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            amount_total: 49900,
            currency: 'usd',
            customer_email: 'enterprise@client.com'
          }
        }
      }

      const res = await fridaySpecialist.processInboundWebhook('stripe', payload)

      assert.strictEqual(res.success, true)
      assert.strictEqual(res.source, 'stripe')
      assert.strictEqual(res.actionTaken, 'REVENUE_AUDITED')
      assert.ok(res.summary.includes('Amount: USD 499.00'))
      assert.ok(res.taskNumber?.startsWith('TASK-'))
    })

    it('should ingest CRM lead qualification webhooks and schedule cron automation', async () => {
      const crmPayload = {
        leadName: 'Apex Commercial Roofs Inc',
        email: 'procurement@apexroofs.com'
      }

      const res = await fridaySpecialist.processInboundWebhook('hubspot', crmPayload)
      assert.strictEqual(res.success, true)
      assert.strictEqual(res.actionTaken, 'LEAD_REGISTERED')
      assert.ok(res.summary.includes('Apex Commercial Roofs'))

      const cron = fridaySpecialist.scheduleAutomationCron({
        title: 'Daily EOD CRM Sync',
        cronExpression: '0 21 * * *',
        directive: 'Audit CRM inbound leads and alert Master Sri'
      })
      assert.strictEqual(cron.scheduled, true)
    })
  })
})


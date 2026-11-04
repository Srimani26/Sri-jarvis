/**
 * CerebroSpecialist.ts — Database Architect & Data Modeling Specialist
 * Target: server/src/swarm/specialists/CerebroSpecialist.ts & src/swarm/specialists/CerebroSpecialist.ts
 *
 * Implements Stage 2 of the SDLC Lifecycle:
 * 1. Formulates relational schemas: PostgreSQL with Prisma ORM (prisma/schema.prisma).
 * 2. Enforces multi-tenant data isolation (organization_id, foreign keys, cascade delete policies, indexes).
 * 3. Generates deterministic mock database seed data (prisma/seed.ts and seeds/mock_data.json).
 */

import { ProjectBlueprint, BlueprintModel } from '../types/blueprint'
import { swarmModelRouter } from '../engine/ModelRouter'

export const CEREBRO_SYSTEM_PROMPT = `You are Cerebro, Chief Database Architect and Data Modeling Specialist for Master Sri.
You design high-integrity relational schemas, PostgreSQL data structures, and multi-tenant isolation boundaries using Prisma ORM.

CORE DIRECTIVES:
1. MULTI-TENANT ISOLATION: Every customer entity must reference 'organizationId' with foreign key constraints, cascade deletion ('onDelete: Cascade'), and compound or individual indexes (@@index([organizationId])).
2. DATA TYPES: Use strict types (String @id @default(uuid()), DateTime @default(now()), Float, Int, Boolean, Json).
3. SEEDING: Always generate deterministic mock seed datasets with realistic enterprise data for immediate local development.
4. ZERO PLACEHOLDERS: Output complete, valid Prisma schema definitions without truncation.`

export interface DatabaseSynthesisResult {
  prismaSchema: string
  seedTs: string
  mockJson: string
}

export class CerebroSpecialist {
  private static instance: CerebroSpecialist

  public static getInstance(): CerebroSpecialist {
    if (!CerebroSpecialist.instance) {
      CerebroSpecialist.instance = new CerebroSpecialist()
    }
    return CerebroSpecialist.instance
  }

  public getSystemPrompt(): string {
    return CEREBRO_SYSTEM_PROMPT
  }

  /**
   * Generates production-ready Prisma schema with strict PostgreSQL multi-tenancy
   */
  public generatePrismaSchema(blueprint: ProjectBlueprint): string {
    const isMultiTenant = blueprint.database.isMultiTenant !== false
    const models = blueprint.database.models || []

    let schema = `// Prisma Schema generated autonomously by Cerebro for ${blueprint.name}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// =========================================================================
// TENANCY & IDENTITY LAYER
// =========================================================================

model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  plan      String   @default("ENTERPRISE")
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]
`

    // Add relations to Organization for tenant-scoped models
    for (const model of models) {
      if (model.isTenantScoped !== false && model.name !== 'Organization' && model.name !== 'User') {
        const relationName = model.name.charAt(0).toLowerCase() + model.name.slice(1) + 's'
        schema += `  ${relationName} ${model.name}[]\n`
      }
    }

    schema += `}\n\n`

    // User Model
    schema += `model User {
  id             String       @id @default(uuid())
  email          String       @unique
  name           String?
  role           String       @default("ADMIN") // ADMIN, MANAGER, INSPECTOR, CLIENT
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([organizationId])
  @@index([email])
}
\n`

    // Domain Specific Models
    for (const model of models) {
      if (model.name === 'Organization' || model.name === 'User') continue

      schema += `model ${model.name} {\n`
      schema += `  id             String       @id @default(uuid())\n`

      if (isMultiTenant && model.isTenantScoped !== false) {
        schema += `  organizationId String\n`
        schema += `  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)\n`
      }

      for (const field of model.fields) {
        if (field.name === 'id' || field.name === 'organizationId') continue
        const attr = field.attributes ? ` ${field.attributes}` : ''
        schema += `  ${field.name.padEnd(14)} ${field.type}${attr}\n`
      }

      // Add timestamps if not already present
      if (!model.fields.some(f => f.name === 'createdAt')) {
        schema += `  createdAt      DateTime     @default(now())\n`
      }
      if (!model.fields.some(f => f.name === 'updatedAt')) {
        schema += `  updatedAt      DateTime     @updatedAt\n`
      }

      if (isMultiTenant && model.isTenantScoped !== false) {
        schema += `\n  @@index([organizationId])\n`
      }

      schema += `}\n\n`
    }

    return schema.trim()
  }

  /**
   * Generates deterministic seed script and mock dataset
   */
  public generateMockSeed(blueprint: ProjectBlueprint): { seedTs: string; mockJson: string } {
    const orgId = 'org-master-sri-001'
    const orgName = `${blueprint.name} Holdings`
    const orgSlug = blueprint.slug

    const mockData: Record<string, any> = {
      organizations: [
        {
          id: orgId,
          name: orgName,
          slug: orgSlug,
          plan: 'ENTERPRISE',
          status: 'ACTIVE'
        }
      ],
      users: [
        {
          id: 'usr-sri-admin',
          email: 'sri@standardroofs.com',
          name: 'Master Sri',
          role: 'ADMIN',
          organizationId: orgId
        },
        {
          id: 'usr-manager-001',
          email: 'operations@standardroofs.com',
          name: 'Chief Operations Lead',
          role: 'MANAGER',
          organizationId: orgId
        },
        {
          id: 'usr-inspector-001',
          email: 'inspection@standardroofs.com',
          name: 'Field Inspector Alpha',
          role: 'INSPECTOR',
          organizationId: orgId
        },
        {
          id: 'usr-client-001',
          email: 'client@megacorp.com',
          name: 'MegaCorp Executive Partner',
          role: 'CLIENT',
          organizationId: orgId
        }
      ]
    }

    // Populate mock entities for domain models
    const models = blueprint.database.models || []
    for (const model of models) {
      if (model.name === 'Organization' || model.name === 'User') continue
      const collectionKey = model.name.toLowerCase() + 's'
      mockData[collectionKey] = [
        {
          id: `${model.name.toLowerCase()}-001`,
          organizationId: orgId,
          title: `Initial ${model.name} Benchmark Alpha`,
          name: `${model.name} Sample 1`,
          status: 'ACTIVE',
          metricValue: 125000,
          notes: 'Synthesized via Cerebro Database Engineering Engine.'
        },
        {
          id: `${model.name.toLowerCase()}-002`,
          organizationId: orgId,
          title: `Secondary ${model.name} Production Beta`,
          name: `${model.name} Sample 2`,
          status: 'COMPLETED',
          metricValue: 450000,
          notes: 'Audited enterprise grade test seed.'
        }
      ]
    }

    const mockJson = JSON.stringify(mockData, null, 2)

    const seedTs = `/**
 * prisma/seed.ts — Generated autonomously by Cerebro
 * Seeds deterministic enterprise mock records for ${blueprint.name}
 */

import { PrismaClient } from '@prisma/client';
import mockData from '../seeds/mock_data.json';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 [Cerebro Seed] Initializing database seed for ${blueprint.name}...');

  // 1. Seed Organizations
  for (const org of mockData.organizations) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: {},
      create: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        status: org.status
      }
    });
  }

  // 2. Seed Users
  for (const user of mockData.users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId
      }
    });
  }

  console.log('✅ [Cerebro Seed] Multi-tenant seed deployed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ [Cerebro Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`

    return { seedTs, mockJson }
  }

  /**
   * Orchestrates Stage 2 Database synthesis
   */
  public async executeDatabaseSynthesis(blueprint: ProjectBlueprint): Promise<DatabaseSynthesisResult> {
    const isTestMode = process.env.NODE_ENV === 'test' || process.argv.some(a => a.includes('test')) || process.execArgv.includes('--test')
    if (isTestMode) {
      const prismaSchema = this.generatePrismaSchema(blueprint)
      const { seedTs, mockJson } = this.generateMockSeed(blueprint)
      return { prismaSchema, seedTs, mockJson }
    }

    try {
      const prompt = [
        {
          role: 'system',
          content: `${CEREBRO_SYSTEM_PROMPT}
Generate PostgreSQL schema definitions for: "${blueprint.directive}".
Return ONLY the Prisma schema. Do NOT wrap in markdown fences.`
        },
        {
          role: 'user',
          content: `Data Blueprint: ${JSON.stringify(blueprint.database)}`
        }
      ]

      const res = await swarmModelRouter.dispatch('cerebro', prompt, [])
      let content = res.content || ''
      if (content.includes('```')) {
        content = content.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim()
      }

      if (content.includes('model Organization') && content.includes('datasource db')) {
        const { seedTs, mockJson } = this.generateMockSeed(blueprint)
        return { prismaSchema: content, seedTs, mockJson }
      }
    } catch (err: any) {
      console.warn('⚠️ [CerebroSpecialist] Model synthesis fallback:', err?.message || err)
    }

    // High-fidelity fallback guarantee
    const prismaSchema = this.generatePrismaSchema(blueprint)
    const { seedTs, mockJson } = this.generateMockSeed(blueprint)
    return { prismaSchema, seedTs, mockJson }
  }
}

export const cerebroSpecialist = CerebroSpecialist.getInstance()

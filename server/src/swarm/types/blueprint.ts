/**
 * blueprint.ts — J.A.R.V.I.S. Software Engineering Firm Machine-Readable Project Blueprint
 * Target: server/src/swarm/types/blueprint.ts & src/swarm/types/blueprint.ts
 *
 * Defines strict architectural contracts across the 6 SDLC lifecycle stages:
 * - Stage 1: J.A.R.V.I.S. (Chief Systems Architect & Planner) -> ProjectBlueprint
 * - Stage 2: Cerebro (Database & Data Modeling Specialist) -> PostgreSQL / Prisma ORM & seeds
 * - Stage 3: Aegis (Backend, Systems & API Engineer) -> Express REST routes & RBAC
 * - Stage 4: Raphael (UI/UX, Frontend & Responsive Specialist) -> Glassmorphism & multi-viewport
 * - Stage 5: Midas (Business Engine, Computation & SaaS Monetization) -> Math & Stripe billing
 * - Stage 6: Friday (QA, Integration Tester & DevOps Deployer) -> Contract audits, previews & ZIPs
 */

export interface BlueprintModelField {
  name: string
  type: string
  isId?: boolean
  isUnique?: boolean
  isRequired?: boolean
  defaultValue?: string
  attributes?: string
}

export interface BlueprintModel {
  name: string
  description?: string
  fields: BlueprintModelField[]
  isTenantScoped?: boolean
}

export interface BlueprintEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  roles: string[]
  authRequired: boolean
  description: string
}

export interface BlueprintViewportConfig {
  mobile: {
    maxWidth: number
    minTouchTarget: number
    layout: string
  }
  tablet: {
    minWidth: number
    maxWidth: number
    layout: string
  }
  desktop: {
    minWidth: number
    layout: string
  }
}

export interface BlueprintFormula {
  name: string
  formula: string
  description: string
  inputs: string[]
  output: string
}

export interface BlueprintEntityField {
  name: string
  type: string
  example?: any
}

export interface BlueprintEntity {
  name: string
  fields: BlueprintEntityField[]
}

export interface BlueprintKPI {
  label: string
  unit: string
  baseline: number
  format: string
}

export interface ProjectBlueprint {
  title?: string
  domain?: string
  entities?: BlueprintEntity[]
  kpis?: BlueprintKPI[]
  navigationViews?: string[]
  visualCanvasType?: 'map' | 'chart' | 'grid' | 'network'
  name: string
  slug: string
  directive: string
  description: string
  scope: 'SPA_PROTOTYPE' | 'FULLSTACK_SAAS' | 'AUTOMATION_HUB'
  database: {
    provider: 'postgresql'
    isMultiTenant: boolean
    tenantField: string
    models: BlueprintModel[]
  }
  backend: {
    endpoints: BlueprintEndpoint[]
    middleware: string[]
    rbacRoles: string[]
  }
  frontend: {
    pages: string[]
    components: string[]
    viewports: BlueprintViewportConfig
    theme: {
      mode: 'dark' | 'light'
      glassmorphism: boolean
      accentColor: string
      fontFamily: string
    }
  }
  businessLogic: {
    formulas: BlueprintFormula[]
    exportFormats: ('CSV' | 'PDF' | 'JSON')[]
    saasTiers: ('FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE')[]
    stripeEnabled: boolean
  }
}

export interface ContractAuditResult {
  passed: boolean
  domIdAudit: {
    requiredIds: string[]
    matchedIds: string[]
    missingIds: string[]
  }
  routeAudit: {
    frontendRoutes: string[]
    backendRoutes: string[]
    verifiedRoutes: string[]
    unmappedRoutes: string[]
  }
  syntaxValid: boolean
  issues: string[]
}


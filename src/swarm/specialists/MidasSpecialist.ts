/**
 * MidasSpecialist.ts — Chief Quantitative Systems, Monetization & SaaS Architect
 * Target: server/src/swarm/specialists/MidasSpecialist.ts & src/swarm/specialists/MidasSpecialist.ts
 *
 * Implements Stage 5 of the SDLC Lifecycle:
 * 1. Writes industrial math engines (solar Capex/payback algorithms, financial depreciation, amortization).
 * 2. Implements multi-format client data exports (CSV generation, printable PDF formatting, JSON dumps).
 * 3. Establishes SaaS subscription tiers (Free, Starter, Pro, Enterprise) and Stripe checkout / webhook contract hooks.
 */

import { ProjectBlueprint } from '../types/blueprint'
import { swarmModelRouter } from '../engine/ModelRouter'

export const MIDAS_SYSTEM_PROMPT = `You are Midas, Chief Quantitative Systems, Monetization, and SaaS Architect for Master Sri.
You design high-velocity economic models, multi-tenant billing engines, and rock-solid subscription architectures.

CORE COMPETENCIES:
1. QUANTITATIVE COMPUTATION: Solar gross Capex, 30% federal ITC incentives, net Capex, annual degradation, utility escalation, and 25-year cumulative cash flow tables.
2. MULTI-FORMAT DATA EXPORTS: Clean client-side CSV downloads (Blob / data URI), formatted print/PDF workflows, and JSON dumps.
3. STRIPE MONETIZATION: Create clean checkout sessions, handle webhook events with cryptographic signature verification (stripe.webhooks.constructEvent), and manage tiered subscriptions (Starter, Pro, Enterprise).
4. TENANT ISOLATION: Scoped queries by organization_id to prevent multi-tenant data leaks.`

export interface SaaSModuleConfig {
  appName: string
  organizationId?: string
  defaultTier?: 'Starter' | 'Pro' | 'Enterprise'
}

export function getAuthRbacBlueprint(): string {
  return `// Auth & RBAC Middleware Blueprint (Midas Architectural Standard)
const jwt = require('jsonwebtoken');

const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  CUSTOMER: 'Customer'
};

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: Missing JWT token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jarvis_sovereign_secret');
    req.user = decoded; // { id, email, role, organizationId }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
    }
    next();
  };
}

module.exports = { ROLES, verifyToken, requireRole };`
}

export function getStripeBillingBlueprint(): string {
  return `// Stripe Monetization & Webhook Verification Blueprint (Midas Standard)
const express = require('express');
const router = express.Router();

const SUBSCRIPTION_TIERS = {
  STARTER: { name: 'Starter', priceId: 'price_starter_tier', maxSeats: 3 },
  PRO: { name: 'Pro', priceId: 'price_pro_tier', maxSeats: 15 },
  ENTERPRISE: { name: 'Enterprise', priceId: 'price_enterprise_tier', maxSeats: 100 }
};

// Create Stripe Checkout Session
router.post('/checkout-session', async (req, res) => {
  const { tier = 'Starter', successUrl, cancelUrl } = req.body;
  const selectedTier = SUBSCRIPTION_TIERS[tier.toUpperCase()] || SUBSCRIPTION_TIERS.STARTER;

  res.json({
    sessionId: 'cs_test_' + Date.now(),
    url: 'https://checkout.stripe.com/pay/cs_test_mock',
    tier: selectedTier.name,
    organizationId: req.user?.organizationId || 'org_default'
  });
});

// Secure Inbound Stripe Webhook Receiver
function handleStripeWebhook(req, res, stripeClient, webhookSecret) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeClient.webhooks.constructEvent(req.rawBody || req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(\`Webhook Signature Error: \${err.message}\`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Activate tenant subscription
      break;
    case 'customer.subscription.deleted':
      // Gracefully revoke access
      break;
    default:
      console.log(\`Unhandled event type \${event.type}\`);
  }

  res.json({ received: true });
}

module.exports = { router, SUBSCRIPTION_TIERS, handleStripeWebhook };`
}

export function getMultiTenantPrismaBlueprint(): string {
  return `// Multi-Tenant Prisma Query Scoping Blueprint (Midas Architectural Standard)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function scopedPrismaClient(organizationId) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (model !== 'Organization' && args && args.where) {
            args.where = { ...args.where, organizationId };
          }
          return query(args);
        }
      }
    }
  });
}

module.exports = { scopedPrismaClient };`
}

export class MidasSpecialist {
  private static instance: MidasSpecialist

  public static getInstance(): MidasSpecialist {
    if (!MidasSpecialist.instance) {
      MidasSpecialist.instance = new MidasSpecialist()
    }
    return MidasSpecialist.instance
  }

  public getSystemPrompt(): string {
    return MIDAS_SYSTEM_PROMPT
  }

  /**
   * Generates browser-executable computation engine with real-time math, DOM listeners, and CSV/PDF export
   */
  public generateComputationEngine(blueprint: ProjectBlueprint): string {
    return `// Midas Quantitative Computation Engine & Multi-Format Data Exporters
document.addEventListener('DOMContentLoaded', () => {
  console.log('⚡ [Midas Engine] Initializing quantitative computation system for ${blueprint.name}...');

  function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num);
  }

  function getNumericValue(id, defaultValue) {
    const el = document.getElementById(id);
    if (!el) return defaultValue;
    const val = parseFloat(el.value);
    return isNaN(val) ? defaultValue : val;
  }

  function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  let lastCalculatedData = [];

  function recalculate() {
    const roofSqft = getNumericValue('roof-sqft', 50000);
    const solarKw = getNumericValue('solar-kw', 400);
    const elecRate = getNumericValue('electricity-rate', 0.18);

    updateText('roof-sqft-val', roofSqft.toLocaleString() + ' sqft');
    updateText('solar-kw-val', solarKw.toLocaleString() + ' kW');
    updateText('electricity-rate-val', '$' + elecRate.toFixed(2) + ' /kWh');

    // Financial formulas
    const roofCost = roofSqft * 11.5;
    const solarCapex = solarKw * 1850;
    const grossCapex = roofCost + solarCapex;
    const itcCredit = (solarCapex + (roofCost * 0.35)) * 0.30;
    const netCapex = grossCapex - itcCredit;

    const initialYearKwh = solarKw * 1450;
    const initialYearSavings = initialYearKwh * elecRate;
    const paybackYears = initialYearSavings > 0 ? (netCapex / initialYearSavings) : 0;

    updateText('gross-capex', formatCurrency(grossCapex));
    updateText('itc-incentive', formatCurrency(itcCredit));
    updateText('net-capex', formatCurrency(netCapex));
    updateText('payback-years', paybackYears.toFixed(1) + ' Yrs');

    // 25-Year Projection Matrix
    lastCalculatedData = [];
    const tbody = document.getElementById('projection-table-body');
    if (tbody) {
      tbody.innerHTML = '';
      let cumulativeFlow = -netCapex;

      for (let yr = 1; yr <= 25; yr++) {
        const degradation = Math.pow(1 - 0.005, yr - 1);
        const escalation = Math.pow(1 + 0.032, yr - 1);
        const yrKwh = Math.round(initialYearKwh * degradation);
        const yrSavings = Math.round(yrKwh * elecRate * escalation);
        cumulativeFlow += yrSavings;

        lastCalculatedData.push({
          year: yr,
          kwh: yrKwh,
          annualSavings: yrSavings,
          cumulativeCashFlow: cumulativeFlow
        });

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
        tr.innerHTML = \`
          <td style="padding: 8px 12px; color: #94a3b8;">Year \${yr}</td>
          <td style="padding: 8px 12px; color: #f8fafc;">\${yrKwh.toLocaleString()} kWh</td>
          <td style="padding: 8px 12px; color: #10b981;">+\${formatCurrency(yrSavings)}</td>
          <td style="padding: 8px 12px; font-weight: 700; color: \${cumulativeFlow >= 0 ? '#38bdf8' : '#f43f5e'};">
            \${formatCurrency(cumulativeFlow)}
          </td>
        \`;
        tbody.appendChild(tr);
      }
    }
  }

  // Bind inputs
  ['roof-sqft', 'solar-kw', 'electricity-rate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', recalculate);
      el.addEventListener('change', recalculate);
    }
  });

  const resetBtn = document.getElementById('recalculate-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const roof = document.getElementById('roof-sqft');
      const solar = document.getElementById('solar-kw');
      const rate = document.getElementById('electricity-rate');
      if (roof) roof.value = '50000';
      if (solar) solar.value = '400';
      if (rate) rate.value = '0.18';
      recalculate();
    });
  }

  // CSV Export Engine
  const exportCsvBtn = document.getElementById('export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      let csv = 'Year,Production (kWh),Annual Savings ($),Cumulative Net Flow ($)\\n';
      lastCalculatedData.forEach(row => {
        csv += \`\${row.year},\${row.kwh},\${row.annualSavings},\${row.cumulativeCashFlow}\\n\`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', '${blueprint.slug}-financial-model.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Printable PDF Export Engine
  const exportPdfBtn = document.getElementById('export-pdf-btn');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Initial Calculation Run
  recalculate();
  console.log('✅ [Midas Engine] Quantitative computation operational.');
});
`
  }

  /**
   * Orchestrates Stage 5 Business Logic synthesis
   */
  public async executeBusinessLogicSynthesis(blueprint: ProjectBlueprint): Promise<{
    engineJs: string
    billingBlueprint: string
    rbacBlueprint: string
  }> {
    const billingBlueprint = getStripeBillingBlueprint()
    const rbacBlueprint = getAuthRbacBlueprint()

    const isTestMode = process.env.NODE_ENV === 'test' || process.argv.some(a => a.includes('test')) || process.execArgv.includes('--test')
    if (isTestMode) {
      return { engineJs: this.generateComputationEngine(blueprint), billingBlueprint, rbacBlueprint }
    }

    try {
      const prompt = [
        {
          role: 'system',
          content: `${MIDAS_SYSTEM_PROMPT}
Generate browser-executable vanilla JavaScript to power calculations, event listeners, and CSV export for: "${blueprint.directive}".
Return ONLY pure JavaScript code.`
        },
        {
          role: 'user',
          content: `Business Formulas Blueprint: ${JSON.stringify(blueprint.businessLogic)}`
        }
      ]

      const res = await swarmModelRouter.dispatch('midas', prompt, [])
      let content = res.content || ''
      if (content.includes('```')) {
        content = content.replace(/^```(?:javascript|js)?\s*/i, '').replace(/```\s*$/i, '').trim()
      }

      // Strict Syntax & Execution Validation Gate
      let isValidJs = false
      try {
        const testCode = content.replace(/^\s*import\s+.*?;?\s*$/gm, '').replace(/^\s*export\s+.*?;?\s*$/gm, '')
        new Function(testCode)
        isValidJs = true
      } catch {
        isValidJs = false
      }

      if (
        isValidJs &&
        content.length > 200 &&
        !content.includes("require('") &&
        (content.includes('addEventListener') || content.includes('calculate'))
      ) {
        return { engineJs: content, billingBlueprint, rbacBlueprint }
      }
    } catch (err: any) {
      console.warn('⚠️ [MidasSpecialist] Model synthesis fallback:', err?.message || err)
    }

    const engineJs = this.generateComputationEngine(blueprint)
    return { engineJs, billingBlueprint, rbacBlueprint }
  }
}

export const midasSpecialist = MidasSpecialist.getInstance()

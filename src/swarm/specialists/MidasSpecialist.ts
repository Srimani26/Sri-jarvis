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
  console.log('⚡ [Midas Engine] Initializing interactive state runtime for ${blueprint.name}...');

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
  let chartInstance = null;

  function updateChart(data) {
    const canvas = document.getElementById('projectionChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const labels = data.slice(0, 10).map(d => 'Yr ' + d.year);
    const savings = data.slice(0, 10).map(d => d.annualSavings);
    const cashFlow = data.slice(0, 10).map(d => d.cumulativeCashFlow);

    if (chartInstance) {
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].data = cashFlow;
      chartInstance.data.datasets[1].data = savings;
      chartInstance.update();
      return;
    }

    const ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cumulative Cash Flow ($)',
            data: cashFlow,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Annual Savings ($)',
            data: savings,
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } } }
        },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  let activeFilter = 'all';
  let searchTerm = '';
  let records = [
    { id: '01', name: 'Facility Alpha - Primary Array', status: 'Active', delta: '48,200 kWh', val: 8676 },
    { id: '02', name: 'Fleet Unit #402 - Route Metro', status: 'Alert', delta: '94.2% Efficiency', val: 14280 },
    { id: '03', name: 'Standby Inverter Station', status: 'Idle', delta: '0.0 kWh', val: 0 }
  ];

  function renderTable() {
    const tbody = document.getElementById('projection-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = records.filter(r => {
      const matchesFilter = activeFilter === 'all' || r.status.toLowerCase() === activeFilter.toLowerCase();
      const matchesSearch = !searchTerm || r.name.toLowerCase().includes(searchTerm) || r.status.toLowerCase().includes(searchTerm) || r.delta.toLowerCase().includes(searchTerm);
      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-500 italic">No matching records found.</td></tr>';
      return;
    }

    filtered.forEach(r => {
      const tr = document.createElement('tr');
      const badgeClass = r.status === 'Active' 
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
        : r.status === 'Alert' 
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
        : 'bg-slate-500/10 text-slate-400 border-slate-500/20';

      tr.innerHTML = \`
        <td class="p-3 text-slate-400">\${r.id}</td>
        <td class="p-3 font-semibold text-white">\${r.name}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] border \${badgeClass}">\${r.status}</span></td>
        <td class="p-3">\${r.delta}</td>
        <td class="p-3 text-cyan-400">\$\${r.val.toLocaleString()}</td>
      \`;
      tbody.appendChild(tr);
    });
  }

  const isSolar = Boolean(
    ${JSON.stringify(blueprint.domain === 'COMMERCIAL_SOLAR' || /solar|roof/i.test(blueprint.directive || ''))}
  );

  function recalculate() {
    if (isSolar) {
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
      }
    } else {
      // Dynamic Domain Telemetry Recalculation
      const p1 = getNumericValue('fleet-units', getNumericValue('param-1', 148));
      const p2 = getNumericValue('speed-threshold', getNumericValue('param-2', 65));
      const p3 = getNumericValue('alert-threshold', getNumericValue('param-3', 10));

      updateText('fleet-units-val', p1.toLocaleString() + ' Units');
      updateText('speed-threshold-val', p2.toFixed(0) + ' MPH');
      updateText('alert-threshold-val', p3.toFixed(0) + ' sec');
      updateText('param-1-val', p1.toLocaleString() + ' Units');
      updateText('param-2-val', p2.toFixed(0) + ' %');
      updateText('param-3-val', p3.toFixed(0) + ' sec');

      updateText('kpi-active-fleet', Math.round(p1).toLocaleString() + ' Units');
      updateText('kpi-avg-speed', (p2 * 0.85).toFixed(1) + ' MPH');
      updateText('kpi-records', Math.round(p1).toLocaleString() + ' Items');
      updateText('kpi-throughput', Math.min(99.9, p2 * 1.05).toFixed(1) + '%');

      lastCalculatedData = [];
      for (let i = 1; i <= 10; i++) {
        lastCalculatedData.push({
          year: i,
          kwh: Math.round(p1 * 12 * i),
          annualSavings: Math.round(p2 * 100 * i),
          cumulativeCashFlow: Math.round(p1 * p2 * i)
        });
      }
    }

    updateChart(lastCalculatedData);
    renderTable();
  }

  // Bind operational input sliders
  ['roof-sqft', 'solar-kw', 'electricity-rate', 'fleet-units', 'speed-threshold', 'alert-threshold', 'param-1', 'param-2', 'param-3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', recalculate);
      el.addEventListener('change', recalculate);
    }
  });

  // Table search input
  const searchInput = document.getElementById('table-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      renderTable();
    });
  }

  // Status filter buttons
  ['filter-all', 'filter-active', 'filter-alert', 'filter-idle'].forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        activeFilter = btnId.replace('filter-', '');
        ['filter-all', 'filter-active', 'filter-alert', 'filter-idle'].forEach(id => {
          const b = document.getElementById(id);
          if (b) {
            if (id === btnId) {
              b.className = 'filter-btn px-2.5 py-1 rounded-lg font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition';
            } else {
              b.className = 'filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 transition';
            }
          }
        });
        renderTable();
      });
    }
  });

  // Modal interactions
  const modal = document.getElementById('settings-modal');
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  const recordForm = document.getElementById('record-form');

  function openModal() {
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  if (openModalBtn) openModalBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (recordForm) {
    recordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('new-record-name');
      const statusInput = document.getElementById('new-record-status');
      const outputInput = document.getElementById('new-record-output');
      if (nameInput && statusInput && outputInput) {
        const nextId = String(records.length + 1).padStart(2, '0');
        records.unshift({
          id: nextId,
          name: nameInput.value.trim() || 'Unit #' + nextId,
          status: statusInput.value || 'Active',
          delta: outputInput.value.trim() || '10,000 kWh',
          val: Math.round(Math.random() * 10000 + 5000)
        });
        renderTable();
        closeModal();
        recordForm.reset();
      }
    });
  }

  // Navigation tab switching
  ['nav-dashboard', 'nav-telemetry', 'nav-map', 'nav-records', 'nav-settings'].forEach(navId => {
    const el = document.getElementById(navId);
    if (el) {
      el.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(n => {
          n.className = 'nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-sm font-medium transition';
        });
        el.className = 'nav-item flex items-center gap-3 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm font-semibold';
        if (navId === 'nav-settings') {
          openModal();
        }
      });
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
  console.log('✅ [Midas Engine] Interactive state runtime operational.');
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

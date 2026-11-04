/**
 * MidasSpecialist.ts — Chief Quantitative Systems, Monetization & SaaS Architect
 * Target: server/src/swarm/specialists/MidasSpecialist.ts & src/swarm/specialists/MidasSpecialist.ts
 *
 * Implements:
 * 1. Auth & RBAC Architecture: JWT token verification and Role-Based Access Control (Admin, Manager, Customer).
 * 2. Stripe Billing Blueprints: Checkout session routing, subscription tiers (Starter, Pro, Enterprise), and webhook signature verification.
 * 3. Tenant Isolation Blueprints: Multi-tenant database query scoping by organization_id.
 */

export const MIDAS_SYSTEM_PROMPT = `You are Midas, Chief Quantitative Systems, Monetization, and SaaS Architect for Master Sri.
You design high-velocity economic models, multi-tenant billing engines, and rock-solid subscription architectures.

CORE COMPETENCIES:
1. AUTH & RBAC: Enforce granular access policies across roles (Admin, Manager, Customer).
2. STRIPE MONETIZATION: Create clean checkout sessions, handle webhook events with cryptographic signature verification (stripe.webhooks.constructEvent), and manage tiered subscriptions (Starter, Pro, Enterprise).
3. TENANT ISOLATION: Ensure every database read, write, and mutation is scoped by organization_id to prevent multi-tenant data leaks.`

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
      // Downgrade tenant to free tier
      break;
    default:
      console.log(\`Unhandled event type \${event.type}\`);
  }

  res.json({ received: true });
}

module.exports = { SUBSCRIPTION_TIERS, router, handleStripeWebhook };`
}

export function getMultiTenantPrismaBlueprint(): string {
  return `// Multi-Tenant Isolation Middleware (Prisma ORM Scoping Blueprint)
function scopedPrismaClient(prisma, organizationId) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, organizationId };
          return query(args);
        }
      }
    }
  });
}

module.exports = { scopedPrismaClient };`
}

export function generateSaaSTemplate(config: SaaSModuleConfig) {
  return {
    authRbac: getAuthRbacBlueprint(),
    billing: getStripeBillingBlueprint(),
    tenantPrisma: getMultiTenantPrismaBlueprint(),
    config
  }
}

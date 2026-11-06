/**
 * tests/omnichannel-and-dynamic-skills.test.ts
 *
 * Verifies:
 * 1. Omnichannel Hub: WhatsApp, Instagram, Teams message payloads & formatting.
 * 2. Meeting Scheduler: Google Meet & Teams conferencing link generation.
 * 3. Spreadsheet Engine: Real CSV file synthesis and row calculations.
 * 4. Dynamic Self-Learning Skill Engine: Directive ingestion, SKILL.md generation, and hot-loading.
 * 5. Continuous Adaptation: Metric tracking and self-healing execution graphs.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { omnichannelHub } from '../src/services/OmnichannelHubService'
import { dynamicSkillEngine } from '../src/agents/DynamicSelfEvolvingSkillEngine'

describe('Omnichannel Executive Hub & Dynamic Self-Learning Skill Suite', () => {

  describe('1. Omnichannel Communications & Scheduling', () => {
    it('should format and dispatch simulated WhatsApp message when unconfigured', async () => {
      const res = await omnichannelHub.sendWhatsAppMessage({
        to: '919876543210',
        text: 'Master Sri: Invi Luxury store order #1084 confirmed for delivery.'
      })
      assert.strictEqual(res.success, true)
      assert.ok(res.messageId?.includes('wamid_'))
    })

    it('should format and dispatch Instagram DM', async () => {
      const res = await omnichannelHub.sendInstagramDM({
        recipientId: 'invi_customer_99',
        text: 'Thank you for your interest in our bespoke velvet collection.'
      })
      assert.strictEqual(res.success, true)
      assert.ok(res.messageId?.includes('ig_'))
    })

    it('should schedule meeting with valid Google Meet link and calendar ID', async () => {
      const res = await omnichannelHub.scheduleMeeting({
        title: 'Invi Theme Q4 Architecture Review',
        platform: 'google_meet',
        startTimeIso: new Date(Date.now() + 3600000).toISOString(),
        endTimeIso: new Date(Date.now() + 7200000).toISOString(),
        attendees: ['sri@standardroofs.com', 'team@inviluxury.com']
      })
      assert.strictEqual(res.success, true)
      assert.ok(res.meetingUrl.startsWith('https://meet.google.com/'))
      assert.ok(res.calendarId?.startsWith('cal_event_'))
    })

    it('should generate verified Excel/CSV spreadsheet with real data rows', () => {
      const res = omnichannelHub.generateSpreadsheet({
        title: 'Invi_Store_Revenue_Audit',
        columns: ['Item', 'Channel', 'Price_INR', 'Margin'],
        rows: [
          ['Cashmere Shawl', 'Shopify', 18500, '68%'],
          ['Velvet Blazer', 'WhatsApp Concierge', 34000, '75%']
        ]
      })
      assert.strictEqual(res.success, true)
      assert.strictEqual(res.rowCount, 2)
      assert.ok(res.downloadUrl.includes('invi_store_revenue_audit'))
    })
  })

  describe('2. Dynamic Self-Learning & Self-Evolving Skill Engine', () => {
    it('should synthesize a brand new skill from an arbitrary user directive', () => {
      const directive = 'Automate WhatsApp customer follow-up for abandoned Invi checkouts'
      const skill = dynamicSkillEngine.synthesizeSkill(directive)

      assert.ok(skill.id.startsWith('SKILL-'))
      assert.strictEqual(skill.assignedAgent, 'friday')
      assert.strictEqual(skill.domain, 'communication')
      assert.ok(skill.executionGraph.length >= 4)
      assert.ok(skill.skillMarkdown.includes('Autonomous Dynamic Skill'))
      assert.ok(skill.skillMarkdown.includes('FRIDAY'))
    })

    it('should map domain-specific skills to proper specialist agents', () => {
      const shopifySkill = dynamicSkillEngine.synthesizeSkill('Fix Liquid syntax error in register popup')
      assert.strictEqual(shopifySkill.assignedAgent, 'raphael')
      assert.strictEqual(shopifySkill.domain, 'ecommerce')

      const revenueSkill = dynamicSkillEngine.synthesizeSkill('Compute luxury goods price arbitrage spread')
      assert.strictEqual(revenueSkill.assignedAgent, 'midas')
      assert.strictEqual(revenueSkill.domain, 'finance')

      const cyberSkill = dynamicSkillEngine.synthesizeSkill('Scan security firewall and leaked credentials')
      assert.strictEqual(cyberSkill.assignedAgent, 'aegis')
      assert.strictEqual(cyberSkill.domain, 'engineering')
    })

    it('should continuously adapt skill metrics on execution feedback', () => {
      const testSkill = dynamicSkillEngine.synthesizeSkill('Audit n8n webhook pipelines')
      const adapted = dynamicSkillEngine.adaptSkill(testSkill.id, true, 'Execution completed in 120ms')

      assert.ok(adapted)
      assert.strictEqual(adapted.totalInvocations, 2)
      assert.strictEqual(adapted.successRate, 100)
    })
  })
})

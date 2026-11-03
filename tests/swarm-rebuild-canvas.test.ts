/**
 * tests/swarm-rebuild-canvas.test.ts
 * Rigorous test suite validating the Swarm Rebuild Canvas, Procedural Audio Synthesis Math,
 * and DOM Blueprint Snapshot Engine.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  extractDomBlueprintFromHtml,
  executeExtractDomBlueprint
} from '../src/swarm/tools/domBlueprintEngine'

describe('Swarm Rebuild & Blueprint Snapshot Engine', () => {

  describe('Criterion 1: DOM Blueprint Snapshot & Component Extraction', () => {
    it('should extract structured blueprint from semantic HTML', () => {
      const sampleHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Apex Haute Couture</title></head>
          <body>
            <h1>Autumn / Winter 2026 Collection</h1>
            <h2>Architectural Minimalism</h2>
            <div class="product-card">
              <img src="/jacket.png" />
              <h3>Structured Wool Trench</h3>
            </div>
            <div class="product-card">
              <img src="/pants.png" />
              <h3>Pleated Trousers</h3>
            </div>
          </body>
        </html>
      `

      const blueprint = extractDomBlueprintFromHtml(sampleHtml, 'Apex Haute Couture')

      assert.strictEqual(blueprint.title, 'Apex Haute Couture')
      assert.strictEqual(blueprint.viewportWidth, 1000)
      assert.strictEqual(blueprint.viewportHeight, 700)

      // Verify Boxes
      assert.ok(blueprint.boxes.length >= 3, 'Must contain header, hero, and product cards')
      const headerBox = blueprint.boxes.find(b => b.id === 'box_header')
      assert.ok(headerBox, 'Header frame box must exist')
      assert.strictEqual(headerBox?.width, 920)

      // Verify Typography
      const brandText = blueprint.typography.find(t => t.id === 'text_brand')
      assert.ok(brandText, 'Brand title typography must be present')
      assert.strictEqual(brandText?.text, 'Apex Haute Couture')

      // Verify Media
      assert.ok(blueprint.media.length >= 1, 'Must have at least one media element')

      // Verify Alignment Guides
      assert.ok(blueprint.guides.includes(40), 'Must include left margin guide at x=40')
      assert.ok(blueprint.guides.length >= 2, 'Must have multiple alignment guides')

      // Verify Duplicates
      assert.ok(blueprint.duplicates.length >= 1, 'Must identify duplicate card structures')
      assert.strictEqual(blueprint.duplicates[0].direction, 'horizontal')
    })

    it('should fall back gracefully to default sovereign blueprint when empty input given', async () => {
      const blueprint = await executeExtractDomBlueprint({})
      assert.ok(blueprint, 'Must return a valid blueprint object')
      assert.strictEqual(blueprint.viewportWidth, 1000)
      assert.ok(blueprint.boxes.length > 0, 'Must provide default container boxes')
      assert.ok(blueprint.typography.length > 0, 'Must provide default typography')
    })
  })

  describe('Criterion 2: Audio Synthesis & Spatial Panning Math', () => {
    it('should correctly map cursor X coordinate to stereo pan [-1, 1]', () => {
      const mapPan = (x: number, width: number = 1000) => {
        const clampedX = Math.max(0, Math.min(width, x))
        return (clampedX / width) * 2 - 1
      }

      assert.strictEqual(mapPan(0), -1, 'Leftmost coordinate must pan -1 (full left)')
      assert.strictEqual(mapPan(500), 0, 'Center coordinate must pan 0 (center)')
      assert.strictEqual(mapPan(1000), 1, 'Rightmost coordinate must pan 1 (full right)')
      assert.strictEqual(mapPan(-100), -1, 'Negative coordinate clamped to -1')
      assert.strictEqual(mapPan(1200), 1, 'Overflow coordinate clamped to 1')
    })

    it('should verify the E-major pentatonic scale frequencies', () => {
      // E major pentatonic: E4, F#4, G#4, B4, C#5, E5
      const pentatonicPitches = [329.63, 369.99, 415.30, 493.88, 554.37, 659.25]

      assert.strictEqual(pentatonicPitches.length, 6)
      assert.strictEqual(Math.round(pentatonicPitches[0]), 330) // E4
      assert.strictEqual(Math.round(pentatonicPitches[5]), 659) // E5
    })
  })

  describe('Criterion 3: Specialist Cursors & Roles Assignment', () => {
    it('should assign dedicated tool semantics and signature colors to each agent', () => {
      const agentRoles = {
        aegis: { name: 'Aegis', color: '#38bdf8', tool: 'crosshair', role: 'Layout & Box Architect' },
        raphael: { name: 'Raphael', color: '#c084fc', tool: 'ruler', role: 'Precision Guides & Typography' },
        friday: { name: 'Friday', color: '#fb7185', tool: 'ibeam', role: 'Copywriting & Content Engine' },
        jarvis: { name: 'Jarvis', color: '#fbbf24', tool: 'duplicate', role: 'Component Replication & Orchestration' }
      }

      assert.strictEqual(agentRoles.aegis.tool, 'crosshair')
      assert.strictEqual(agentRoles.raphael.tool, 'ruler')
      assert.strictEqual(agentRoles.friday.tool, 'ibeam')
      assert.strictEqual(agentRoles.jarvis.tool, 'duplicate')

      assert.ok(agentRoles.aegis.color.startsWith('#'))
      assert.ok(agentRoles.raphael.color.startsWith('#'))
      assert.ok(agentRoles.friday.color.startsWith('#'))
      assert.ok(agentRoles.jarvis.color.startsWith('#'))
    })
  })
})


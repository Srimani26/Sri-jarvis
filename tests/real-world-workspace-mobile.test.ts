import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { existsSync, unlinkSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { generatePresentation } from '../server/src/swarm/tools/presentationGenerator'
import { googleWorkspaceService, GoogleWorkspaceService } from '../server/src/services/googleWorkspaceService'
import { androidBridgeService, AndroidBridgeService, PACKAGE_ALIASES } from '../server/src/services/androidBridgeService'
import { dispatchToolCall, SWARM_TOOL_SCHEMAS } from '../server/src/swarm/tools/toolRegistry'
import { parseVoiceIntent } from '../server/src/services/voiceGateway'
import { EventEmitter } from 'node:events'

describe('Real-World Autonomous Workspace & Mobile Bridge Suite', () => {
  const testPptxFile = 'test_executive_briefing.pptx'
  const testPptxPath = join(process.cwd(), 'artifacts', 'documents', testPptxFile)

  after(() => {
    if (existsSync(testPptxPath)) {
      try {
        unlinkSync(testPptxPath)
      } catch {}
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 1: PPTX Presentation Generation
  // ──────────────────────────────────────────────────────────────────────────
  describe('Criterion 1: Automated PPTX Presentation Generator', () => {
    it('should generate a valid executive PPTX file > 5KB with dark slate theme and structured slides', async () => {
      const result = await generatePresentation({
        fileName: testPptxFile,
        title: 'Autonomous Swarm Intelligence 2026',
        subtitle: 'Executive Briefing for Master Sri',
        author: 'J.A.R.V.I.S. High Command',
        slides: [
          {
            title: 'Strategic Architecture',
            subtitle: 'Real-Time Voice, Workspace, & Mobile Integration',
            bulletPoints: [
              'Sub-350ms streaming voice pipeline with Web Audio API',
              'Google Workspace OAuth execution for Gmail and Calendar',
              'Multi-agent ReAct reasoning engine with self-healing tools'
            ],
            visualLayout: 'standard',
            speakerNotes: 'Highlight the speed advantage of monotonic scheduling and token streaming.'
          },
          {
            title: 'Key Operational Benchmarks',
            visualLayout: 'metric-cards',
            metrics: [
              { label: 'Speech Turnaround', value: '<250ms' },
              { label: 'Test Pass Rate', value: '100%' },
              { label: 'Active Specialists', value: '4 Agents' },
              { label: 'Uptime Reliability', value: '99.99%' }
            ]
          },
          {
            title: 'Full-Stack Agent Workstream',
            visualLayout: 'two-column',
            columns: [
              {
                heading: 'Raphael & Aegis',
                points: ['Mathematical verification', 'Full-stack web scaffolding', 'Database DDL migrations']
              },
              {
                heading: 'Friday & Jarvis',
                points: ['Google Workspace automation', 'Android mobile OS bridge', 'Executive voice dispatch']
              }
            ]
          }
        ]
      })

      assert.strictEqual(result.success, true)
      assert.strictEqual(existsSync(result.filePath), true)
      assert.strictEqual(result.fileName, testPptxFile)
      assert.strictEqual(result.slidesCount, 4) // Cover + 3 slides

      const stats = statSync(result.filePath)
      assert.ok(stats.size > 5000, `Expected PPTX size > 5000 bytes, got ${stats.size}`)
      assert.ok(result.downloadUrl.includes('test_executive_briefing.pptx'))
      assert.ok(result.theme.includes('0F172A'))
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 2: Google Workspace OAuth Engine & Calendar Google Meet Schema
  // ──────────────────────────────────────────────────────────────────────────
  describe('Criterion 2: Google Workspace OAuth Engine & Google Meet Schema', () => {
    it('should construct valid Google Meet conference schema with 15-minute reminders', () => {
      const startIso = '2026-11-04T14:00:00Z'
      const endIso = '2026-11-04T15:00:00Z'
      const title = 'Executive Board Strategy Session'

      const schema = googleWorkspaceService.buildMeetingEventSchema({
        title,
        startIso,
        endIso,
        attendees: ['director@example.com', 'partner@example.com'],
        description: 'Review Q4 Autonomy Roadmap'
      })

      assert.strictEqual(schema.summary, title)
      assert.strictEqual(schema.conferenceData.createRequest.conferenceSolutionKey.type, 'hangoutsMeet')
      assert.ok(schema.conferenceData.createRequest.requestId.startsWith('meet_'))
      assert.strictEqual(schema.reminders.useDefault, false)
      assert.deepStrictEqual(schema.reminders.overrides, [
        { method: 'popup', minutes: 15 },
        { method: 'email', minutes: 15 }
      ])
      assert.strictEqual(schema.attendees.length, 2)
      assert.strictEqual(schema.attendees[0].email, 'director@example.com')
    })

    it('should format RFC 2822 base64 message correctly for Gmail API', () => {
      const encoded = googleWorkspaceService.craftRfc2822Message(
        'recipient@example.com',
        'Executive Status Update',
        '<h1>All Systems Nominal</h1><p>Workforce active.</p>',
        'cc@example.com'
      )

      assert.ok(typeof encoded === 'string')
      assert.ok(encoded.length > 50)
      // Decode base64url to verify structure
      const base64Standard = encoded.replace(/-/g, '+').replace(/_/g, '/')
      const decoded = Buffer.from(base64Standard, 'base64').toString('utf-8')

      assert.ok(decoded.includes('To: recipient@example.com'))
      assert.ok(decoded.includes('Cc: cc@example.com'))
      assert.ok(decoded.includes('Subject: =?utf-8?B?'))
      assert.ok(decoded.includes('Content-Type: text/html; charset=utf-8'))
    })

    it('should return clear, actionable setup guide when credentials are not configured', async () => {
      const freshService = new GoogleWorkspaceService({})
      const emailResult = await freshService.send_email({
        to: 'test@example.com',
        subject: 'Test Subject',
        bodyHtml: '<p>Test</p>'
      })

      assert.strictEqual(emailResult.configured, false)
      assert.strictEqual(emailResult.error, 'GOOGLE_WORKSPACE_CREDENTIALS_MISSING')
      assert.ok(emailResult.setupGuide.includes('Google Cloud Console'))
      assert.ok(emailResult.setupGuide.includes('GOOGLE_CLIENT_ID'))
      assert.ok(emailResult.setupUrl.includes('console.cloud.google.com'))

      const meetingResult = await freshService.schedule_meeting({
        title: 'Strategy Sync',
        startIso: '2026-11-04T10:00:00Z',
        endIso: '2026-11-04T11:00:00Z'
      })

      assert.strictEqual(meetingResult.configured, false)
      assert.ok(meetingResult.simulatedEvent.meetLink.includes('meet.google.com'))
      assert.strictEqual(meetingResult.simulatedEvent.conferenceSchema.createRequest.conferenceSolutionKey.type, 'hangoutsMeet')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 3: Android Device Bridge (Mobile OS Controller)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Criterion 3: Android Device Bridge (Mobile OS Controller)', () => {
    before(() => {
      androidBridgeService.clearOfflineQueue()
    })

    it('should buffer commands into offline queue when no Android phone is connected', () => {
      const result = androidBridgeService.launchApp('whatsapp')

      assert.strictEqual(result.success, false)
      assert.strictEqual(result.status, 'OFFLINE_QUEUED')
      assert.strictEqual(result.queued, true)
      assert.strictEqual(result.payload.packageName, 'com.whatsapp')
      assert.ok(result.message.includes('Termux/Bridge daemon'))

      // Make a call offline
      const callResult = androidBridgeService.makeCall('+1 (555) 019-2834')
      assert.strictEqual(callResult.queued, true)
      assert.strictEqual(callResult.payload.phoneNumber, '+15550192834')

      const queue = androidBridgeService.getOfflineQueue()
      assert.strictEqual(queue.length, 2)
      assert.strictEqual(queue[0].action, 'launch_app')
      assert.strictEqual(queue[1].action, 'make_call')
    })

    it('should map friendly package aliases accurately', () => {
      assert.strictEqual(androidBridgeService.resolvePackageName('whatsapp'), 'com.whatsapp')
      assert.strictEqual(androidBridgeService.resolvePackageName('youtube'), 'com.google.android.youtube')
      assert.strictEqual(androidBridgeService.resolvePackageName('settings'), 'com.android.settings')
      assert.strictEqual(androidBridgeService.resolvePackageName('chrome'), 'com.android.chrome')
      assert.strictEqual(androidBridgeService.resolvePackageName('com.custom.app'), 'com.custom.app')
    })

    it('should establish connection, send handshake ACK, and flush offline command queue', () => {
      const messagesSent: any[] = []

      // Create a mock WebSocket client
      class MockWebSocket extends EventEmitter {
        public readyState = 1 // OPEN
        public send(data: string) {
          messagesSent.push(JSON.parse(data))
        }
      }

      const mockWs = new MockWebSocket() as any
      const device = androidBridgeService.registerDevice('device_pixel_9', 'Pixel 9 Pro', mockWs)

      assert.strictEqual(device.id, 'device_pixel_9')
      assert.strictEqual(device.model, 'Pixel 9 Pro')

      // 1. Handshake ACK should be first message sent
      assert.ok(messagesSent.length >= 3, `Expected at least 3 messages (handshake + 2 flushed), got ${messagesSent.length}`)
      assert.strictEqual(messagesSent[0].type, 'BRIDGE_HANDSHAKE_ACK')
      assert.strictEqual(messagesSent[0].status, 'CONNECTED')

      // 2. Offline queued commands should be flushed
      const flushed1 = messagesSent[1]
      assert.strictEqual(flushed1.type, 'LAUNCH_APP')
      assert.strictEqual(flushed1.payload.packageName, 'com.whatsapp')
      assert.strictEqual(flushed1.flushedFromQueue, true)

      const flushed2 = messagesSent[2]
      assert.strictEqual(flushed2.type, 'MAKE_CALL')
      assert.strictEqual(flushed2.payload.phoneNumber, '+15550192834')
      assert.strictEqual(flushed2.flushedFromQueue, true)

      // 3. Queue should now be empty
      assert.strictEqual(androidBridgeService.getOfflineQueue().length, 0)
    })

    it('should dispatch live command directly over WebSocket when device is online', () => {
      const active = androidBridgeService.getFirstActiveDevice()
      assert.ok(active, 'Expected an active device')

      const dispatchResult = androidBridgeService.launchApp('youtube')
      assert.strictEqual(dispatchResult.success, true)
      assert.strictEqual(dispatchResult.status, 'DISPATCHED')
      assert.strictEqual(dispatchResult.queued, false)
      assert.strictEqual(dispatchResult.payload.packageName, 'com.google.android.youtube')
      assert.strictEqual(dispatchResult.deviceId, active.id)

      const status = androidBridgeService.getDeviceStatus()
      assert.strictEqual(status.online, true)
      assert.strictEqual(status.activeDevicesCount, 1)
      assert.strictEqual(status.primaryDevice?.model, 'Pixel 9 Pro')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 4: Swarm Tool Dispatch & Voice Intent Integration
  // ──────────────────────────────────────────────────────────────────────────
  describe('Criterion 4: Swarm Tool Dispatch & Voice Intent Recognition', () => {
    it('should register all new workspace and mobile tools in SWARM_TOOL_SCHEMAS', () => {
      const toolNames = SWARM_TOOL_SCHEMAS.map(s => s.function.name)
      assert.ok(toolNames.includes('send_email'))
      assert.ok(toolNames.includes('draft_email'))
      assert.ok(toolNames.includes('schedule_meeting'))
      assert.ok(toolNames.includes('list_upcoming_meetings'))
      assert.ok(toolNames.includes('generate_presentation'))
      assert.ok(toolNames.includes('android_device_control'))
    })

    it('should dispatch android_device_control tool call cleanly', async () => {
      const result = await dispatchToolCall('android_device_control', {
        action: 'launch_app',
        target: 'settings'
      })

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.payload.packageName, 'com.android.settings')
    })

    it('should recognize voice intents for mobile control, meeting scheduling, and presentations', () => {
      // 1. Mobile app launch voice intent
      const appIntent = parseVoiceIntent('Open WhatsApp on my phone', 'jarvis')
      assert.strictEqual(appIntent.type, 'DEVICE_CONTROL')
      assert.strictEqual(appIntent.action, 'launch_app')
      assert.strictEqual(appIntent.target, 'whatsapp')

      // 2. Mobile call voice intent
      const callIntent = parseVoiceIntent('Call +14155552671 on my phone', 'jarvis')
      assert.strictEqual(callIntent.type, 'DEVICE_CONTROL')
      assert.strictEqual(callIntent.action, 'make_call')
      assert.strictEqual(callIntent.target, '+14155552671')

      // 3. Meeting schedule voice intent
      const meetingIntent = parseVoiceIntent('Schedule a meeting with Dr. Aris tomorrow at 3 PM', 'jarvis')
      assert.strictEqual(meetingIntent.type, 'SCHEDULE_MEETING')
      assert.ok(meetingIntent.target?.includes('Dr. Aris'))

      // 4. Presentation generation voice intent
      const pptIntent = parseVoiceIntent('Write a PPT presentation about Sovereign Autonomous Multi-Agent Swarms', 'jarvis')
      assert.strictEqual(pptIntent.type, 'GENERATE_PRESENTATION')
      assert.ok(pptIntent.target?.includes('Sovereign Autonomous Multi-Agent Swarms'))
    })
  })
})


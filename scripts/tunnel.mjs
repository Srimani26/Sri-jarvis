// SPDX-License-Identifier: MIT
// J.A.R.V.I.S. Self-Healing Global Satellite Uplink
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import qrcode from 'qrcode'

const CF_PATH = 'C:\\\\Program Files (x86)\\\\cloudflared\\\\cloudflared.exe'
const TARGET_PORT = 3000
const URL_FILE = path.resolve('.jarvis-tunnel-url.txt')
const GATEWAY_FILE = path.resolve('public/gateway.json')

let retryCount = 0

function launchTunnel() {
  console.log('\n' + '='.repeat(68))
  console.log(`   J.A.R.V.I.S. MARK-V // SATELLITE UPLINK ENGINE (Attempt #${++retryCount})`)
  console.log('   Target: http://localhost:' + TARGET_PORT)
  console.log('='.repeat(68) + '\n')

  const child = spawn(CF_PATH, ['tunnel', '--url', `http://localhost:${TARGET_PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let urlDetected = false

  const handleOutput = (data) => {
    const text = data.toString()
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/)
    if (match && !urlDetected) {
      urlDetected = true
      const liveUrl = match[0]

      // Save to files for gateway discovery
      try {
        fs.writeFileSync(URL_FILE, liveUrl, 'utf-8')
        fs.writeFileSync(GATEWAY_FILE, JSON.stringify({
          url: liveUrl,
          timestamp: Date.now(),
          status: 'ACTIVE_ONLINE',
          localIp: 'http://192.168.222.57:3000'
        }, null, 2), 'utf-8')
      } catch {}

      console.log('\n' + '*'.repeat(68))
      console.log("   SRI'S J.A.R.V.I.S. MARK-V LIVE CLOUDFLARE UPLINK ACTIVE")
      console.log('   GLOBAL URL: ' + liveUrl)
      console.log('   LOCAL WI-FI: http://192.168.222.57:3000')
      console.log('*'.repeat(68) + '\n')

      qrcode.toString(liveUrl, { type: 'terminal', small: true }, (err, qr) => {
        if (!err && qr) {
          console.log('SCAN WITH MOBILE CAMERA TO OPEN IMMEDIATELY:\n')
          console.log(qr)
          console.log('\nFull voice transceiver & biometric security enabled over HTTPS.')
        }
      })
    }
  }

  child.stdout.on('data', handleOutput)
  child.stderr.on('data', handleOutput)

  child.on('close', (code) => {
    console.warn(`\n[Satellite Watchdog] Tunnel process exited with code ${code}. Reconnecting in 2 seconds...`)
    urlDetected = false
    setTimeout(launchTunnel, 2000)
  })

  child.on('error', (err) => {
    console.error('[Satellite Watchdog] Tunnel spawn error:', err.message)
    setTimeout(launchTunnel, 3000)
  })

  // Resilient Periodic Keepalive Health-Check every 45 seconds
  let consecutiveFailures = 0
  const keepalive = setInterval(async () => {
    if (urlDetected) {
      try {
        const currentUrl = fs.readFileSync(URL_FILE, 'utf-8').trim()
        const res = await fetch(`${currentUrl}/api/system/version`, { signal: AbortSignal.timeout(10000) })
        if (res.ok) {
          consecutiveFailures = 0
        } else {
          consecutiveFailures++
          console.warn(`[Keepalive] Gateway ping returned status ${res.status} (${consecutiveFailures}/5)`)
          if (consecutiveFailures >= 5) {
            console.warn('[Keepalive] Consecutive failures exceeded. Cycling tunnel...')
            clearInterval(keepalive)
            try { child.kill() } catch {}
          }
        }
      } catch (e) {
        consecutiveFailures++
        console.warn(`[Keepalive] Gateway ping failed: ${e.message} (${consecutiveFailures}/5)`)
        if (consecutiveFailures >= 5) {
          console.warn('[Keepalive] Consecutive failures exceeded. Cycling tunnel for fresh connection...')
          clearInterval(keepalive)
          try { child.kill() } catch {}
        }
      }
    }
  }, 45000)
}

launchTunnel()

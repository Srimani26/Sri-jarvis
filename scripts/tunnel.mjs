// SPDX-License-Identifier: MIT
// J.A.R.V.I.S. Global Satellite Uplink (Cloudflare Quick Tunnel)
import { startTunnel } from 'untun'
import qrcode from 'qrcode'

async function run() {
  console.log('\n' + '='.repeat(68))
  console.log('  👑 J.A.R.V.I.S. MARK-IV // INITIATING GLOBAL SATELLITE UPLINK...')
  console.log('='.repeat(68) + '\n')

  try {
    const tunnel = await startTunnel({ port: 3000 })
    const url = await tunnel.getURL()

    console.log('\n' + '╔'.padEnd(68, '═') + '╗')
    console.log('║  🚀 J.A.R.V.I.S. GLOBAL SECURE ACCESS LINK (HTTPS)'.padEnd(68) + '║')
    console.log('║  Sovereign Commander: Master Sri (Srimanikandan K)'.padEnd(68) + '║')
    console.log('║  Encrypted Cloudflare Tunnel Active Everywhere on Earth'.padEnd(68) + '║')
    console.log('╚'.padEnd(68, '═') + '╝\n')

    console.log('🔗 DIRECT PUBLIC URL: ' + url + '\n')

    qrcode.toString(url, { type: 'terminal', small: true }, (err, qr) => {
      if (!err && qr) {
        console.log('📱 SCAN WITH IPHONE / ANDROID CAMERA TO CONNECT ANYWHERE:\n')
        console.log(qr)
        console.log('\n✅ Full mobile microphone & biometric voice permissions active over HTTPS.')
        console.log('👑 2nd-in-Command J.A.R.V.I.S. standing by.\n')
      }
    })
  } catch (err) {
    console.error('Failed to establish satellite tunnel:', err)
  }
}

run()

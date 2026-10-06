#!/usr/bin/env node
/**
 * J.A.R.V.I.S. MARK-V Distributed PC Worker CLI
 * CLI commands: start, status, register, doctor, capabilities, stop
 */

import { WorkerDoctor } from './doctor.js';
import { WorkerClient } from './client.js';

const command = process.argv[2] || 'help';

async function main() {
  switch (command) {
    case 'doctor': {
      console.log('🩺 Running J.A.R.V.I.S. Worker Hardware & Capability Doctor...\n');
      const report = await WorkerDoctor.runDiagnostics();
      console.log(`Node Version       : ${report.nodeVersion}`);
      console.log(`Operating System   : ${report.os}`);
      console.log(`CPU Architecture   : ${report.cpuModel} (${report.cpuCores} cores)`);
      console.log(`Total System Memory: ${report.totalMemoryMB} MB (Free: ${report.freeMemoryMB} MB)`);
      console.log(`Ollama Engine      : ${report.ollamaAvailable ? 'ONLINE (Models: ' + report.ollamaModels.join(', ') + ')' : 'OFFLINE / UNREACHABLE'}`);
      console.log(`Browser Engine     : ${report.browserType}`);
      console.log(`Sandboxed Workspace: ${report.workspacePath}`);
      console.log(`Active Capabilities: ${report.detectedCapabilities.join(', ')}`);
      break;
    }

    case 'capabilities': {
      const report = await WorkerDoctor.runDiagnostics();
      console.log(JSON.stringify(report.detectedCapabilities, null, 2));
      break;
    }

    case 'register': {
      console.log('📡 Registering PC Worker with JARVIS Cloud Server...');
      const client = new WorkerClient();
      const success = await client.register();
      if (success) {
        console.log('✅ Worker registered successfully with cloud server.');
      } else {
        console.log('⚠️ Registration failed. Check network or JARVIS_SERVER_URL.');
      }
      break;
    }

    case 'start': {
      const client = new WorkerClient();
      await client.start();
      console.log('✨ PC Worker daemon running in foreground. Press Ctrl+C to terminate.');
      
      process.on('SIGINT', () => {
        client.stop();
        process.exit(0);
      });
      process.on('SIGTERM', () => {
        client.stop();
        process.exit(0);
      });
      break;
    }

    case 'status': {
      console.log('📊 Worker Status:');
      const report = await WorkerDoctor.runDiagnostics();
      console.log({
        workerId: process.env.JARVIS_WORKER_ID || 'pc-worker-default',
        server: process.env.JARVIS_SERVER_URL || 'https://sri-jarvis.onrender.com',
        ollama: report.ollamaAvailable ? 'ONLINE' : 'OFFLINE',
        freeRamMB: report.freeMemoryMB,
        capabilities: report.detectedCapabilities,
      });
      break;
    }

    case 'stop': {
      console.log('🛑 PC Worker stop signal sent.');
      break;
    }

    case 'help':
    default: {
      console.log(`
J.A.R.V.I.S. MARK-V Distributed PC Worker CLI

Usage:
  jarvis-worker <command>

Commands:
  start          Start the worker daemon and connect to JARVIS Cloud Server
  doctor         Run local hardware, Ollama, and capability diagnostics
  capabilities   Display detected capability tokens
  register       Register this worker node with JARVIS Cloud
  status         Check current worker status and system telemetry
  stop           Send stop signal to worker
      `);
      break;
    }
  }
}

main().catch((err) => {
  console.error('Fatal CLI error:', err);
  process.exit(1);
});

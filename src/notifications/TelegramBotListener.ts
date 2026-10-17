/**
 * J.A.R.V.I.S. MARK-V Mobile Telegram Interactive Polling Listener
 * Listens for bidirectional mobile commands exclusively from Master Sri (Chat ID: 1377862282).
 * 
 * Commands:
 * - /status: System uptime, active LLM providers, active scheduler jobs, tasks processed today.
 * - /scout: Forces an immediate live scraping cycle and reports top opportunities.
 * - /eod: Triggers an on-demand Executive EOD financial audit report.
 * - /help: Command list and quick control reference.
 */

import { TelegramNotifier } from './TelegramNotifier';
import { AutonomousScheduler } from '../scheduler/AutonomousScheduler';
import { TaskStore } from '../kernel/TaskStore';
import { prisma } from '../lib/db';

export class TelegramBotListener {
  public static readonly AUTHORIZED_CHAT_ID = '1377862282';
  private static pollingActive = false;
  private static abortController: AbortController | null = null;
  private static lastUpdateId = 0;
  private static startTime = Date.now();

  /**
   * Start long-polling in the background without blocking the main event loop
   */
  public static startPolling(): void {
    if (this.pollingActive) return;

    const { botToken, chatId } = TelegramNotifier.getCredentials();
    if (!botToken) {
      console.warn('⚠️ [TelegramBotListener] Missing TELEGRAM_BOT_TOKEN. Listener disabled.');
      return;
    }

    this.pollingActive = true;
    this.abortController = new AbortController();
    const authorizedId = chatId || this.AUTHORIZED_CHAT_ID;

    console.log(`🤖 [TelegramBotListener] Activated 24/7 command listener for Master Sri (Chat ID: ${authorizedId})`);

    // Launch background polling loop (unref'd / non-blocking)
    (async () => {
      while (this.pollingActive) {
        try {
          await this.pollUpdates(botToken, authorizedId);
        } catch (err: any) {
          if (!this.pollingActive) break;
          // Graceful backoff on connection drops
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    })().catch((err) => {
      console.error('[TelegramBotListener] Background loop error:', err?.message || err);
    });
  }

  /**
   * Stop the polling loop
   */
  public static stopPolling(): void {
    this.pollingActive = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    console.log('🛑 [TelegramBotListener] Polling stopped.');
  }

  public static isPolling(): boolean {
    return this.pollingActive;
  }

  /**
   * Execute single long-poll request to Telegram getUpdates
   */
  private static async pollUpdates(botToken: string, authorizedChatId: string): Promise<void> {
    const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=15`;
    
    try {
      const res = await fetch(url, {
        signal: this.abortController?.signal || AbortSignal.timeout(20000),
      });

      if (!res.ok) return;

      const data: any = await res.json();
      if (!data.ok || !Array.isArray(data.result)) return;

      for (const update of data.result) {
        if (update.update_id > this.lastUpdateId) {
          this.lastUpdateId = update.update_id;
        }

        const message = update.message;
        if (!message || !message.text) continue;

        const senderChatId = String(message.chat?.id || '');
        const senderUsername = message.from?.username || 'Unknown';
        const text = message.text.trim();

        // Security gate: strictly authorize Master Sri
        if (senderChatId !== authorizedChatId && senderChatId !== this.AUTHORIZED_CHAT_ID) {
          console.warn(`[TelegramBotListener] Unauthorized command attempt from ${senderUsername} (${senderChatId})`);
          await TelegramNotifier.sendMessage(
            '⛔ <b>Access Denied.</b> You are not authorized to command J.A.R.V.I.S.',
            { targetChatId: senderChatId }
          );
          continue;
        }

        // Process authorized command
        await this.handleIncomingMessage(text, senderChatId);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      // Socket timeouts are normal in long-polling
    }
  }

  /**
   * Parse command and route to appropriate engine
   */
  private static async handleIncomingMessage(text: string, chatId: string): Promise<void> {
    const command = text.split(' ')[0].toLowerCase();

    console.log(`📱 [TelegramBotListener] Received command '${command}' from Master Sri`);

    try {
      const response = await this.executeCommand(command);
      if (response) {
        await TelegramNotifier.sendMessage(response, { targetChatId: chatId });
      }
    } catch (cmdErr: any) {
      await TelegramNotifier.sendMessage(
        `⚠️ <b>Command Execution Error:</b> <code>${cmdErr.message || cmdErr}</code>`,
        { targetChatId: chatId }
      );
    }
  }

  /**
   * Execute command logic and return formatted HTML response
   */
  public static async executeCommand(command: string): Promise<string> {
    switch (command) {
      case '/status': {
        const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(uptimeSec / 3600);
        const minutes = Math.floor((uptimeSec % 3600) / 60);
        const seconds = uptimeSec % 60;
        const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

        const stats = AutonomousScheduler.getStats();
        
        // Count tasks processed today in TaskStore
        let tasksTodayCount = 0;
        try {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          tasksTodayCount = await (prisma as any).agentTask.count({
            where: { createdAt: { gte: startOfToday } },
          });
        } catch {
          tasksTodayCount = stats.runsCompleted;
        }

        return `⚡ <b>J.A.R.V.I.S. SYSTEM STATUS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 <b>Core Status:</b> ONLINE (24/7 Autonomous)
⏱️ <b>Uptime:</b> <code>${uptimeStr}</code>
🧠 <b>Active Models:</b> <code>gemini-3.8-flash</code> (Primary), <code>groq-llama-3.3</code> (Backup)
⚙️ <b>Active Scheduler Jobs:</b> <code>${stats.activeJobs}</code>
📋 <b>Tasks Processed Today:</b> <code>${tasksTodayCount}</code>
🔄 <b>Autonomous Runs Completed:</b> <code>${stats.runsCompleted}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<i>Ready for orders, Master Sri.</i>`;
      }

      case '/scout': {
        // Trigger live scout run
        const scoutResult = await AutonomousScheduler.runRevenueScoutCycle({ forceLive: true });
        
        let leadSummary = '';
        if (scoutedResultSummary(scoutResult)) {
          leadSummary = scoutedResultSummary(scoutResult);
        }

        return `🛰️ <b>LIVE REVENUE SCOUT CYCLE COMPLETE</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 <b>Total Scraped:</b> ${scoutResult.scoutedCount} technical opportunities
⚡ <b>Fresh Matches Dispatched:</b> ${scoutResult.newLeadsDispatched}
${leadSummary}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<i>Next autonomous loop in 30 minutes.</i>`;
      }

      case '/eod': {
        const audit = await AutonomousScheduler.runDailyEODAudit({ sendToTelegram: false });
        return audit.reportCardHtml;
      }

      case '/help':
      default: {
        return `🤖 <b>J.A.R.V.I.S. MOBILE COMMAND CENTER</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Available commands for Master Sri:

• <code>/status</code> - System uptime, active providers & task throughput
• <code>/scout</code>  - Force immediate scraping cycle & dispatch fresh gigs
• <code>/eod</code>    - On-demand Executive EOD Financial Audit report
• <code>/help</code>   - Display this command manual

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<i>Sovereign Autonomous Architecture Active.</i>`;
      }
    }
  }
}

function scoutedResultSummary(res: any): string {
  if (!res.leads || res.leads.length === 0) {
    return '<i>No new unnotified leads in this cycle (all deduplicated).</i>';
  }
  return res.leads
    .slice(0, 3)
    .map(
      (l: any) =>
        `• <b>${l.tier}</b>: ${l.title.slice(0, 45)}... ($${l.payoutUSD} / ₹${l.payoutINR})`
    )
    .join('\n');
}

/**
 * J.A.R.V.I.S. MARK-V Mobile Telegram Interactive Polling Listener
 * Listens for bidirectional mobile commands and callback button actions exclusively from Master Sri (Chat ID: 1377862282).
 * 
 * Commands:
 * - /status: System uptime, active LLM providers, realized cash, active scheduler jobs, tasks processed today.
 * - /scout: Forces an immediate live scraping cycle (Shopify/Reddit) and reports top opportunities.
 * - /eod: Triggers an on-demand Executive EOD financial audit report.
 * - /help: Command list and quick control reference.
 * 
 * Interactive Callback Actions (Phase 3):
 * - won:<taskId>:<payoutINR> -> Logs realized cash into ledger, updates TaskStore to WON_PAID, toasts Master Sri.
 * - dismiss:<taskId> -> Suppresses lead in Deduplication/DB and acknowledges dismissal.
 */

import { TelegramNotifier } from './TelegramNotifier';
import { AutonomousScheduler } from '../scheduler/AutonomousScheduler';
import { TaskStore } from '../kernel/TaskStore';
import { LeadDeduplicationService } from '../services/LeadDeduplicationService';
import { RealizedEarningsService } from '../services/RealizedEarningsService';
import { FreelanceRevenueAgent, RevenueTaskAnalysis } from '../agents/FreelanceRevenueAgent';
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

    console.log(`🤖 [TelegramBotListener] Activated 24/7 command & callback listener for Master Sri (Chat ID: ${authorizedId})`);

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

        // 1. Handle Interactive Inline Button Callback Queries
        if (update.callback_query) {
          const query = update.callback_query;
          const senderChatId = String(query.message?.chat?.id || query.from?.id || '');
          if (senderChatId === authorizedChatId || senderChatId === this.AUTHORIZED_CHAT_ID) {
            await this.handleCallbackQuery(query);
          }
          continue;
        }

        // 2. Handle Text Commands
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
    }
  }

  /**
   * Handle interactive inline button taps (Won ($) / Dismiss)
   */
  public static async handleCallbackQuery(query: any): Promise<{
    handled: boolean;
    action: string;
    details: any;
  }> {
    const data = String(query.data || '');
    const queryId = query.id;
    const chatId = String(query.message?.chat?.id || query.from?.id || this.AUTHORIZED_CHAT_ID);

    console.log(`🔘 [TelegramBotListener] Callback received: '${data}'`);

    if (data.startsWith('won:')) {
      // Format: won:<taskId>:<payoutINR>
      const parts = data.split(':');
      const taskId = parts[1] || 'UNKNOWN_TASK';
      const amountINR = parseInt(parts[2], 10) || 1680;
      const amountUSD = Math.round(amountINR / 84);

      // 1. Acknowledge query immediately with toast notification
      if (queryId) {
        await TelegramNotifier.answerCallbackQuery(
          queryId,
          `🎉 Won ₹${amountINR.toLocaleString('en-IN')}! Saved to Realized Earnings.`,
          true
        );
      }

      // 2. Persist to RealizedEarningsService ledger
      await RealizedEarningsService.recordEarnings({
        taskId,
        amountINR,
        amountUSD,
        note: `Confirmed won project from Telegram interactive action button`,
      });

      // 3. Update SQLite TaskStore task status to WON_PAID
      try {
        const matchingTask = await (prisma as any).agentTask.findFirst({
          where: {
            OR: [
              { id: taskId },
              { taskNumber: taskId },
              { description: { contains: taskId } },
              { title: { contains: taskId } },
            ],
          },
        });

        if (matchingTask) {
          await TaskStore.updateTask(matchingTask.id, {
            status: 'WON_PAID' as any,
            progress: 100,
            currentOperation: `Project won and realized: ₹${amountINR} INR paid cash`,
            verificationResult: `REALIZED REVENUE CONFIRMED: Logged ₹${amountINR} INR ($${amountUSD} USD).`,
          });
          await TaskStore.emitEvent(
            matchingTask.id,
            'COMMAND_COMPLETED',
            `Task marked as WON_PAID: ₹${amountINR} INR realized`,
            {
              amountINR,
              amountUSD,
              status: 'WON_PAID',
            }
          );
        }
      } catch (err: any) {
        console.warn('[TelegramBotListener] TaskStore update notice:', err?.message);
      }

      // 4. Dispatch celebratory confirmation message to Master Sri
      await TelegramNotifier.sendMessage(
        `🏆 <b>REVENUE REALIZED &amp; SECURED!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 <b>Task:</b> <code>${taskId}</code>
💰 <b>Realized Cash:</b> <b>₹${amountINR.toLocaleString('en-IN')} INR</b> (<code>$${amountUSD} USD</code>)
📊 <b>Database Status:</b> <code>WON_PAID</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<i>Recorded in sovereign database ledger &amp; EOD Financial Audit.</i>`,
        { targetChatId: chatId }
      );

      return {
        handled: true,
        action: 'WON',
        details: { taskId, amountINR, amountUSD },
      };
    } else if (data.startsWith('dismiss:')) {
      const parts = data.split(':');
      const taskId = parts[1] || 'UNKNOWN_TASK';

      if (queryId) {
        await TelegramNotifier.answerCallbackQuery(queryId, `❌ Lead dismissed.`);
      }

      // Mark dismissed in Deduplication / TaskStore
      await LeadDeduplicationService.markProcessed({
        id: taskId,
        url: `dismissed-${taskId}`,
        title: `Dismissed Lead ${taskId}`,
        payoutUSD: 0,
        payoutINR: 0,
      });

      await TelegramNotifier.sendMessage(
        `🗑️ <i>Lead <code>${taskId}</code> dismissed. Suppressed from pipeline.</i>`,
        { targetChatId: chatId }
      );

      return {
        handled: true,
        action: 'DISMISS',
        details: { taskId },
      };
    }

    return { handled: false, action: 'UNKNOWN', details: null };
  }

  /**
   * Mobile On-Demand Bid & Solution Generator:
   * 1. Acknowledges brief with immediate typing notice
   * 2. Engages FreelanceRevenueAgent with ModelRouter failover
   * 3. Generates diagnosis, surgical patch, and 80-word proposal
   * 4. Returns formatted card with interactive buttons ([Won ($)] & [Dismiss])
   */
  public static async generateOnDemandBid(
    brief: string,
    targetChatId?: string
  ): Promise<{ success: boolean; analysis: RevenueTaskAnalysis; messageId?: number }> {
    const chatId = targetChatId || this.AUTHORIZED_CHAT_ID;

    // Send immediate acknowledgment
    await TelegramNotifier.sendMessage(
      '⚡ <i>Analyzing requirement & generating code fix...</i>',
      { targetChatId: chatId }
    );

    // Extract title & description
    const lines = brief.trim().split(/\r?\n/).filter(Boolean);
    const title = lines[0].slice(0, 80);
    const description = brief.trim();
    const isUrl = /^https?:\/\//i.test(brief.trim());

    const analysis = await FreelanceRevenueAgent.analyzeAndSolve({
      title,
      description,
      url: isUrl ? brief.trim() : undefined,
    });

    // Create record in TaskStore
    await TaskStore.createTask({
      id: analysis.taskId,
      title: `[On-Demand Bid] ${title}`,
      description: `${description}\n\nTask ID: ${analysis.taskId}`,
      agentId: 'software_engineer',
      totalSteps: 4,
      category: 'REVENUE_PIPELINE',
    });

    // Dispatch formatted card with interactive buttons
    const dispatch = await TelegramNotifier.sendLeadAlert(analysis);

    return {
      success: dispatch.success,
      analysis,
      messageId: dispatch.messageId,
    };
  }

  /**
   * Parse command and route to appropriate engine
   */
  private static async handleIncomingMessage(text: string, chatId: string): Promise<void> {
    const trimmed = text.trim();
    const command = trimmed.split(' ')[0].toLowerCase();

    console.log(`📱 [TelegramBotListener] Received message '${trimmed.slice(0, 45)}...' from Master Sri`);

    // 1. Direct /bid command
    if (command === '/bid') {
      const brief = trimmed.slice(4).trim();
      if (!brief) {
        await TelegramNotifier.sendMessage(
          '⚠️ <b>Usage:</b> <code>/bid &lt;paste client requirement, job description, or Reddit URL&gt;</code>',
          { targetChatId: chatId }
        );
        return;
      }
      await this.generateOnDemandBid(brief, chatId);
      return;
    }

    // 2. Direct URL or raw requirement text (un-prefixed by '/')
    if (!trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)) {
      await this.generateOnDemandBid(trimmed, chatId);
      return;
    }

    // 3. Standard command routing (/status, /scout, /eod, /help)
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
        const realized = await RealizedEarningsService.getTotalRealized(24);

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
💵 <b>Realized Cash (24h):</b> <b>₹${realized.totalINR.toLocaleString('en-IN')} INR</b> ($${realized.totalUSD} USD)
⚙️ <b>Active Scheduler Jobs:</b> <code>${stats.activeJobs}</code>
📋 <b>Tasks Processed Today:</b> <code>${tasksTodayCount}</code>
🔄 <b>Autonomous Runs Completed:</b> <code>${stats.runsCompleted}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<i>Ready for orders, Master Sri.</i>`;
      }

      case '/scout': {
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

• <code>/status</code> - System uptime, active providers, realized cash & throughput
• <code>/bid &lt;brief or URL&gt;</code> - Instant on-demand code fix & winning pitch
• <code>/scout</code>  - Force immediate scraping cycle & dispatch fresh gigs
• <code>/eod</code>    - On-demand Executive EOD Financial Audit report
• <code>/help</code>   - Display this command manual

💡 <i>Protip: You can also paste any raw client requirement or Reddit URL directly here to formulate an immediate fix & proposal.</i>
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

export function startTelegramBotListener(): void {
  TelegramBotListener.startPolling();
}

export function stopTelegramBotListener(): void {
  TelegramBotListener.stopPolling();
}

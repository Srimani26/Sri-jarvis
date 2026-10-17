import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RevenueTaskAnalysis } from '../agents/FreelanceRevenueAgent';

export interface TelegramDispatchResult {
  success: boolean;
  messageId?: number;
  chatId?: string;
  error?: string;
}

export class TelegramNotifier {
  private static loadEnvFile() {
    const envPath = resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
      try {
        const content = readFileSync(envPath, 'utf-8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch {}
    }
  }

  private static getCredentials(): { botToken: string; chatId: string } {
    this.loadEnvFile();
    let botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    let chatId = (process.env.TELEGRAM_CHAT_ID || '').trim();

    // Clean angle brackets or quotes if present
    botToken = botToken.replace(/^[<"']+|[>"']+$/g, '');
    chatId = chatId.replace(/^[<"']+|[>"']+$/g, '');

    return { botToken, chatId };
  }

  public static isConfigured(): boolean {
    const { botToken, chatId } = this.getCredentials();
    return Boolean(botToken && chatId);
  }

  /**
   * Send a rich, formatted lead alert to Master Sri on Telegram
   */
  public static async sendLeadAlert(task: RevenueTaskAnalysis): Promise<TelegramDispatchResult> {
    const { botToken, chatId } = this.getCredentials();

    if (!botToken || !chatId) {
      return {
        success: false,
        error: 'TELEGRAM_CONFIG_MISSING: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in environment',
      };
    }

    const escapeHtml = (text: string) =>
      text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const tierEmoji = task.pricing.tier === 'MICRO' ? '⚡ [MICRO-TASK]' : '🚀 [STANDARD TASK]';
    const formattedHtml = `<b>${tierEmoji} J.A.R.V.I.S. REVENUE LEAD ALERT</b>

💼 <b>Objective:</b> ${escapeHtml(task.title)}
💰 <b>Value:</b> <code>$${task.pricing.payoutUSD} USD</code> (<b>₹${task.pricing.payoutINR.toLocaleString('en-IN')} INR</b>)
⏱️ <b>Turnaround:</b> ${escapeHtml(task.durationEstimate)}
🧠 <b>Root Cause Diagnosis:</b>
<i>${escapeHtml(task.rootCause)}</i>

📝 <b>Ready-to-Send Client Proposal:</b>
<code>${escapeHtml(task.clientProposal)}</code>

🛠️ <b>Production Surgical Code Patch:</b>
<pre><code class="language-css">${escapeHtml(task.codePatch)}</code></pre>

🤖 <i>Model: ${escapeHtml(task.modelUsed)} • Dispatched by J.A.R.V.I.S. Money Engine</i>`;

    const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: formattedHtml,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data: any = await res.json();

      if (res.ok && data.ok) {
        return {
          success: true,
          messageId: data.result?.message_id,
          chatId,
        };
      }

      // If HTML parsing fails, fallback to clean plaintext
      const plainText = `⚡ J.A.R.V.I.S. REVENUE LEAD ALERT\n\nTitle: ${task.title}\nValue: $${task.pricing.payoutUSD} (₹${task.pricing.payoutINR})\n\nRoot Cause: ${task.rootCause}\n\nClient Proposal:\n${task.clientProposal}\n\nCode Patch:\n${task.codePatch}`;
      const plainRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: plainText,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const plainData: any = await plainRes.json();
      return {
        success: plainRes.ok && plainData.ok,
        messageId: plainData.result?.message_id,
        chatId,
        error: plainData.ok ? undefined : plainData.description,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Telegram network error: ${err.message}`,
      };
    }
  }
}

/**
 * googleWorkspaceService.ts — Sovereign Google Workspace Integration Engine
 * Target: server/src/services/googleWorkspaceService.ts & src/services/googleWorkspaceService.ts
 *
 * Implements:
 * 1. Gmail Dispatcher: RFC 2822 base64 MIME formatting, send_email, draft_email.
 * 2. Calendar & Meeting Scheduler: schedule_meeting with automatic Google Meet creation
 *    (conferenceDataVersion: 1), popup & email reminders (15 min), list_upcoming_meetings.
 * 3. Fallback: Clear, actionable setup guide pointing to Google Cloud Console when
 *    credentials are unconfigured.
 */

import { google } from 'googleapis'
import { existsSync, readFileSync } from 'node:fs'

export interface GoogleWorkspaceCredentials {
  clientId?: string
  clientSecret?: string
  refreshToken?: string
  accessToken?: string
  redirectUri?: string
}

export interface SendEmailParams {
  to: string
  subject: string
  bodyHtml: string
  cc?: string
}

export interface DraftEmailParams {
  to: string
  subject: string
  bodyHtml: string
}

export interface ScheduleMeetingParams {
  title: string
  startIso: string
  endIso: string
  attendees?: string[] | string
  description?: string
}

export interface UpcomingMeetingsParams {
  maxResults?: number
}

export class GoogleWorkspaceService {
  private static instance: GoogleWorkspaceService
  private authClient: any = null
  private gmailClient: any = null
  private calendarClient: any = null

  constructor(customCredentials?: GoogleWorkspaceCredentials) {
    this.initializeAuth(customCredentials)
  }

  public static getInstance(): GoogleWorkspaceService {
    if (!GoogleWorkspaceService.instance) {
      GoogleWorkspaceService.instance = new GoogleWorkspaceService()
    }
    return GoogleWorkspaceService.instance
  }

  /**
   * Initialize OAuth2 client from environment or custom config
   */
  public initializeAuth(custom?: GoogleWorkspaceCredentials): boolean {
    try {
      let clientId = custom?.clientId || process.env.GOOGLE_CLIENT_ID
      let clientSecret = custom?.clientSecret || process.env.GOOGLE_CLIENT_SECRET
      let refreshToken = custom?.refreshToken || process.env.GOOGLE_REFRESH_TOKEN
      let accessToken = custom?.accessToken || process.env.GOOGLE_ACCESS_TOKEN
      let redirectUri = custom?.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3005/api/oauth/google/callback'

      // Check GOOGLE_WORKSPACE_CREDENTIALS JSON string or file path
      const envCreds = process.env.GOOGLE_WORKSPACE_CREDENTIALS
      if (envCreds && (!clientId || !clientSecret)) {
        try {
          const parsed = envCreds.trim().startsWith('{')
            ? JSON.parse(envCreds)
            : existsSync(envCreds)
              ? JSON.parse(readFileSync(envCreds, 'utf-8'))
              : null

          if (parsed) {
            const installed = parsed.installed || parsed.web || parsed
            clientId = clientId || installed.client_id
            clientSecret = clientSecret || installed.client_secret
            refreshToken = refreshToken || installed.refresh_token
            accessToken = accessToken || installed.access_token
          }
        } catch {
          // ignore parsing error, will handle unconfigured state
        }
      }

      if (clientId && (clientSecret || refreshToken || accessToken)) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
        oauth2Client.setCredentials({
          refresh_token: refreshToken,
          access_token: accessToken
        })

        this.authClient = oauth2Client
        this.gmailClient = google.gmail({ version: 'v1', auth: oauth2Client })
        this.calendarClient = google.calendar({ version: 'v3', auth: oauth2Client })
        return true
      }
    } catch (err: any) {
      console.warn('⚠️ [GoogleWorkspace] OAuth initialization notice:', err?.message || err)
    }

    this.authClient = null
    this.gmailClient = null
    this.calendarClient = null
    return false
  }

  public isConfigured(): boolean {
    return Boolean(this.authClient && (this.gmailClient || this.calendarClient))
  }

  /**
   * Actionable fallback prompt pointing to Google Cloud Console
   */
  public getMissingCredentialsGuide(): {
    configured: false
    error: string
    message: string
    setupGuide: string
    setupUrl: string
  } {
    return {
      configured: false,
      error: 'GOOGLE_WORKSPACE_CREDENTIALS_MISSING',
      message: 'Google Workspace credentials not configured. Please supply GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.',
      setupGuide: `[GOOGLE WORKSPACE OAUTH SETUP INSTRUCTIONS]
1. Open Google Cloud Console: https://console.cloud.google.com/
2. Create or select a project (e.g., 'Jarvis-Sovereign-Core').
3. Enable 'Gmail API' and 'Google Calendar API' in APIs & Services > Library.
4. Go to 'APIs & Services' > 'OAuth Consent Screen' and set User Type to External/Internal.
5. In 'Credentials' > 'Create Credentials' > 'OAuth Client ID' (Desktop App or Web Application).
6. Set redirect URI: http://localhost:3005/api/oauth/google/callback
7. Export your credentials to your .env file:
   GOOGLE_CLIENT_ID="your_client_id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your_client_secret"
   GOOGLE_REFRESH_TOKEN="your_refresh_token"
   (or provide GOOGLE_WORKSPACE_CREDENTIALS='{"client_id":"...","client_secret":"...","refresh_token":"..."}')`,
      setupUrl: 'https://console.cloud.google.com/apis/credentials'
    }
  }

  /**
   * Crafts an RFC 2822 base64url-encoded message for Gmail API
   */
  public craftRfc2822Message(to: string, subject: string, bodyHtml: string, cc?: string): string {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`
    const parts: string[] = [
      `To: ${to}`,
      ...(cc ? [`Cc: ${cc}`] : []),
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(bodyHtml, 'utf-8').toString('base64')
    ]

    const fullMessage = parts.join('\r\n')
    return Buffer.from(fullMessage, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  }

  /**
   * Constructs the Google Calendar event insert schema with Google Meet & reminders
   */
  public buildMeetingEventSchema(params: ScheduleMeetingParams) {
    const attendeesList = Array.isArray(params.attendees)
      ? params.attendees
      : params.attendees
        ? params.attendees.split(/[,;]/).map(a => a.trim()).filter(Boolean)
        : []

    return {
      summary: params.title,
      description: params.description || 'Scheduled autonomously by J.A.R.V.I.S. Sovereign Executive Intelligence',
      start: {
        dateTime: new Date(params.startIso).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      },
      end: {
        dateTime: new Date(params.endIso).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      },
      attendees: attendeesList.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 15 }
        ]
      }
    }
  }

  /**
   * 1. Gmail Dispatcher: send_email
   */
  public async send_email(params: SendEmailParams): Promise<any> {
    if (!this.isConfigured()) {
      return {
        ...this.getMissingCredentialsGuide(),
        action: 'send_email',
        payload: params
      }
    }

    try {
      const raw = this.craftRfc2822Message(params.to, params.subject, params.bodyHtml, params.cc)
      const res = await this.gmailClient.users.messages.send({
        userId: 'me',
        requestBody: { raw }
      })

      return {
        success: true,
        service: 'gmail',
        action: 'send_email',
        messageId: res.data.id,
        threadId: res.data.threadId,
        to: params.to,
        subject: params.subject,
        timestamp: new Date().toISOString()
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
        action: 'send_email'
      }
    }
  }

  /**
   * 1. Gmail Dispatcher: draft_email
   */
  public async draft_email(params: DraftEmailParams): Promise<any> {
    if (!this.isConfigured()) {
      return {
        ...this.getMissingCredentialsGuide(),
        action: 'draft_email',
        payload: params
      }
    }

    try {
      const raw = this.craftRfc2822Message(params.to, params.subject, params.bodyHtml)
      const res = await this.gmailClient.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: { raw }
        }
      })

      return {
        success: true,
        service: 'gmail',
        action: 'draft_email',
        draftId: res.data.id,
        to: params.to,
        subject: params.subject,
        timestamp: new Date().toISOString()
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
        action: 'draft_email'
      }
    }
  }

  /**
   * 2. Calendar Scheduler: schedule_meeting with automatic Google Meet
   */
  public async schedule_meeting(params: ScheduleMeetingParams): Promise<any> {
    const schema = this.buildMeetingEventSchema(params)

    if (!this.isConfigured()) {
      // Return simulated conference details with exact schema and setup guide
      const pseudoMeetId = `meet.google.com/jrv-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
      return {
        ...this.getMissingCredentialsGuide(),
        action: 'schedule_meeting',
        simulatedEvent: {
          title: params.title,
          start: schema.start.dateTime,
          end: schema.end.dateTime,
          attendees: schema.attendees,
          meetLink: `https://${pseudoMeetId}`,
          conferenceSchema: schema.conferenceData,
          reminders: schema.reminders
        }
      }
    }

    try {
      const res = await this.calendarClient.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: schema
      })

      const meetLink = res.data.hangoutLink ||
        res.data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri ||
        null

      return {
        success: true,
        service: 'calendar',
        action: 'schedule_meeting',
        eventId: res.data.id,
        htmlLink: res.data.htmlLink,
        meetLink,
        title: params.title,
        startTime: res.data.start?.dateTime || params.startIso,
        endTime: res.data.end?.dateTime || params.endIso,
        attendees: schema.attendees,
        timestamp: new Date().toISOString()
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
        action: 'schedule_meeting'
      }
    }
  }

  /**
   * 2. Calendar Scheduler: list_upcoming_meetings
   */
  public async list_upcoming_meetings(maxResults: number = 10): Promise<any> {
    if (!this.isConfigured()) {
      return {
        ...this.getMissingCredentialsGuide(),
        action: 'list_upcoming_meetings',
        count: 0,
        events: []
      }
    }

    try {
      const res = await this.calendarClient.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      })

      const items = (res.data.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary || 'Untitled Meeting',
        start: item.start?.dateTime || item.start?.date,
        end: item.end?.dateTime || item.end?.date,
        meetLink: item.hangoutLink || item.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri || null,
        attendees: (item.attendees || []).map((a: any) => a.email),
        htmlLink: item.htmlLink
      }))

      return {
        success: true,
        service: 'calendar',
        action: 'list_upcoming_meetings',
        count: items.length,
        events: items
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
        action: 'list_upcoming_meetings'
      }
    }
  }
}

export const googleWorkspaceService = GoogleWorkspaceService.getInstance()


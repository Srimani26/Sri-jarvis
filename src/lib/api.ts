const TOKEN_KEY = 'jarvis_token'
const REFRESH_KEY = 'jarvis_refresh_token'

export function getToken(): string {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string) {
  if (typeof localStorage === 'undefined') return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getRefreshToken(): string {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(REFRESH_KEY) || ''
}

export function setRefreshToken(refreshToken: string) {
  if (typeof localStorage === 'undefined') return
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
  else localStorage.removeItem(REFRESH_KEY)
}

/**
 * Auth transport.
 * Supports Bearer header, x-jarvis-token, and ?token= fallback for proxies.
 */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken()
  if (!token) return { ...(extra || {}) }
  return {
    'x-jarvis-token': token,
    Authorization: `Bearer ${token}`,
    ...(extra || {}),
  }
}

/** Append the session token to a URL — channel for reverse proxies. */
export function authUrl(url: string, explicitToken?: string): string {
  const token = explicitToken || getToken()
  if (!token || !url.startsWith('/api/')) return url
  // Replace existing token param if present, or append
  if (url.includes('token=')) {
    return url.replace(/([?&])token=[^&]*/, `$1token=${encodeURIComponent(token)}`)
  }
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
}

let activeRefreshPromise: Promise<string | null> | null = null

/**
 * Attempts a transparent token refresh.
 * Coalesces concurrent calls to prevent thundering herd.
 */
export async function attemptTokenRefresh(): Promise<string | null> {
  if (activeRefreshPromise) return activeRefreshPromise

  activeRefreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    const currentToken = getToken()
    if (!refreshToken && !currentToken) return null

    try {
      const res = await nativeFetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { 'x-jarvis-token': currentToken, Authorization: `Bearer ${currentToken}` } : {}),
          ...(refreshToken ? { 'x-refresh-token': refreshToken } : {})
        },
        body: JSON.stringify({ refreshToken, token: currentToken })
      })

      if (!res.ok) {
        return null
      }

      const data = await res.json().catch(() => ({}))
      if (data?.token) {
        setToken(data.token)
        if (data.refreshToken) setRefreshToken(data.refreshToken)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('jarvis:token-refreshed', { detail: { token: data.token } }))
        }
        return data.token as string
      }
      return null
    } catch {
      return null
    } finally {
      activeRefreshPromise = null
    }
  })()

  return activeRefreshPromise
}

const RETRY_STATUSES = new Set([404, 502, 503, 504])
const RETRY_ATTEMPTS = 4

function isOurJson(text: string): boolean {
  const t = text.trim()
  if (!t.startsWith('{') && !t.startsWith('[')) return false
  try {
    JSON.parse(t)
    return true
  } catch {
    return false
  }
}

function bodyIsResendable(body: unknown): boolean {
  return (
    body == null ||
    typeof body === 'string' ||
    (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) ||
    (typeof FormData !== 'undefined' && body instanceof FormData) ||
    (typeof Blob !== 'undefined' && body instanceof Blob)
  )
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const nativeFetch: typeof fetch =
  typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : (globalThis.fetch as typeof fetch)

async function retryingFetch(input: any, init?: RequestInit): Promise<Response> {
  const isApiCall = typeof input === 'string' && input.startsWith('/api/')
  if (!isApiCall || !bodyIsResendable(init?.body)) return nativeFetch(input, init)

  for (let attempt = 1; ; attempt++) {
    try {
      let res = await nativeFetch(input, init)

      // Handle 401 Unauthorized via transparent token refresh with exponential retry
      if (res.status === 401 && !input.includes('/api/auth/login') && !input.includes('/api/auth/refresh')) {
        for (let retry = 1; retry <= 2; retry++) {
          await delay(150 * Math.pow(2, retry - 1))
          const refreshedToken = await attemptTokenRefresh()
          if (refreshedToken) {
            const refreshedInput = typeof input === 'string' ? authUrl(input, refreshedToken) : input
            const refreshedHeaders = new Headers(init?.headers || {})
            refreshedHeaders.set('Authorization', `Bearer ${refreshedToken}`)
            refreshedHeaders.set('x-jarvis-token', refreshedToken)
            const retriedRes = await nativeFetch(refreshedInput, { ...init, headers: refreshedHeaders })
            if (retriedRes.status !== 401) {
              return retriedRes
            }
          }
        }
      }

      if (attempt >= RETRY_ATTEMPTS || !RETRY_STATUSES.has(res.status)) return res
      const text = await res.clone().text().catch(() => '')
      if (isOurJson(text)) return res
      await delay(120 * attempt)
    } catch (err) {
      if (attempt >= RETRY_ATTEMPTS) throw err
      await delay(120 * attempt)
    }
  }
}

// 15-Minute Automated Silent Refresh Loop for Active Sessions
if (typeof window !== 'undefined' && !(window as any).__jarvisSilentRefreshInitialized) {
  ;(window as any).__jarvisSilentRefreshInitialized = true
  setInterval(() => {
    if (getToken() && getRefreshToken()) {
      attemptTokenRefresh().catch(() => {})
    }
  }, 15 * 60 * 1000)
}

if (typeof globalThis.fetch === 'function' && !(globalThis as any).__jarvisFetchPatched) {
  globalThis.fetch = ((input: any, init?: RequestInit) => {
    try {
      if (typeof input === 'string') input = authUrl(input)
    } catch {
      // Fall through safely
    }
    return retryingFetch(input, init)
  }) as typeof fetch
  ;(globalThis as any).__jarvisFetchPatched = true
}

export function jsonAuthHeaders(): Record<string, string> {
  return authHeaders({ 'Content-Type': 'application/json' })
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<any> {
  const headers = authHeaders((init.headers as Record<string, string>) || {})
  let res = await fetch(path, { ...init, headers })

  // If 401 occurs, retry twice with exponential backoff before surfacing error
  if (res.status === 401 && !path.includes('/api/auth/login') && !path.includes('/api/auth/refresh')) {
    for (let retry = 1; retry <= 2; retry++) {
      await delay(200 * Math.pow(2, retry - 1))
      const refreshed = await attemptTokenRefresh().catch(() => null)
      const retryHeaders = authHeaders({
        ...((init.headers as Record<string, string>) || {}),
        ...(refreshed ? { Authorization: `Bearer ${refreshed}`, 'x-jarvis-token': refreshed } : {})
      })
      res = await fetch(path, { ...init, headers: retryHeaders })
      if (res.ok) break
    }
  }

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body?.error || `Request failed (${res.status})`) as Error & { status?: number; code?: string }
    err.status = res.status
    err.code = body?.code
    throw err
  }
  return body
}

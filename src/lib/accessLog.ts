import { UAParser } from 'ua-parser-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { DeviceType } from '@/types'

/** Normalize any UA string into a stable identity used for dedup. */
export interface AccessIdentity {
  device_type: DeviceType
  browser: string
  os: string
  user_agent: string
}

const DEVICE_TYPES: DeviceType[] = ['mobile', 'tablet', 'desktop']

export function parseUserAgent(ua: string): AccessIdentity {
  const result = new UAParser(ua).getResult()

  // UA-Parser returns 'mobile' | 'tablet' | 'console' | 'smarttv' | 'wearable' | 'embedded' | undefined
  const rawDevice = result.device.type
  const deviceType: DeviceType =
    rawDevice && (DEVICE_TYPES as string[]).includes(rawDevice) ? (rawDevice as DeviceType) : 'desktop'

  const browserName = result.browser.name || 'Unknown browser'
  const browserMajor = result.browser.version?.split('.')[0]
  const browser = browserMajor ? `${browserName} ${browserMajor}` : browserName

  const osName = result.os.name || 'Unknown OS'
  const osMajor = result.os.version?.split('.')[0]
  const os = osMajor ? `${osName} ${osMajor}` : osName

  return {
    device_type: deviceType,
    browser,
    os,
    user_agent: ua.slice(0, 500),
  }
}

/** Client IP info (cached per page load). Falls back to 'unknown' silently. */
let cachedIp: { ip: string; country: string | null } | null = null

export async function getClientInfo(): Promise<{ ip: string; country: string | null }> {
  if (cachedIp) return cachedIp
  if (!isSupabaseConfigured()) {
    cachedIp = { ip: 'unknown', country: null }
    return cachedIp
  }
  try {
    const { data } = await supabase.functions.invoke('whoami')
    cachedIp = { ip: data?.ip || 'unknown', country: data?.country || null }
  } catch {
    cachedIp = { ip: 'unknown', country: null }
  }
  return cachedIp
}

const LAST_LOG_KEY = 'access-log-last-ts'
const CURRENT_ID_KEY = 'current-access-id'
/** Log at most once per 10 minutes — matches server-side login_count threshold. */
const THROTTLE_MS = 10 * 60 * 1000

function safeSessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSessionSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* private mode — ignore */
  }
}

/** Id of the access log row for the device currently in use (for "current device" badge). */
export function getCurrentAccessId(): string | null {
  try {
    return localStorage.getItem(CURRENT_ID_KEY)
  } catch {
    return null
  }
}

/**
 * Record this device/browser/IP once (throttled). Server upserts by
 * (user_id, device_type, browser, os, ip_address) so re-visits never create
 * duplicate rows — they only bump last_seen_at / login_count.
 */
export async function logAccessOnce(): Promise<void> {
  if (!isSupabaseConfigured()) return

  const last = Number(safeSessionGet(LAST_LOG_KEY) || 0)
  if (Date.now() - last < THROTTLE_MS) return

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  safeSessionSet(LAST_LOG_KEY, String(Date.now()))

  try {
    const identity = parseUserAgent(navigator.userAgent)
    const { ip, country } = await getClientInfo()
    const { data, error } = await supabase.rpc('log_access', {
      p_device_type: identity.device_type,
      p_browser: identity.browser,
      p_os: identity.os,
      p_ip: ip,
      p_country: country,
      p_user_agent: identity.user_agent,
    })
    if (error) throw error
    if (data) {
      try {
        localStorage.setItem(CURRENT_ID_KEY, String(data))
      } catch { /* ignore */ }
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('Failed to log access', err)
  }
}

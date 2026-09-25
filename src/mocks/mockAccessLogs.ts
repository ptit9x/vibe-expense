import type { AccessLog } from '@/types'

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

export const MOCK_ACCESS_LOGS: AccessLog[] = [
  {
    id: 'mock-access-1',
    user_id: 'dev-user',
    device_type: 'mobile',
    browser: 'Mobile Safari 17',
    os: 'iOS 17',
    ip_address: '118.70.1.1',
    country: 'VN',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15',
    first_seen_at: hoursAgo(240),
    last_seen_at: hoursAgo(0.2),
    login_count: 42,
  },
  {
    id: 'mock-access-2',
    user_id: 'dev-user',
    device_type: 'desktop',
    browser: 'Chrome 126',
    os: 'Windows 11',
    ip_address: '118.70.1.1',
    country: 'VN',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126',
    first_seen_at: hoursAgo(720),
    last_seen_at: hoursAgo(48),
    login_count: 15,
  },
]

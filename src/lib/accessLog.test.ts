import { describe, it, expect } from 'vitest'
import { parseUserAgent } from '@/lib/accessLog'
import type { AccessIdentity } from '@/lib/accessLog'

describe('parseUserAgent', () => {
  it('parses iPhone Safari correctly', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
    const result: AccessIdentity = parseUserAgent(ua)
    expect(result.device_type).toBe('mobile')
    expect(result.browser).toBe('Mobile Safari 17')
    expect(result.os).toBe('iOS 17')
    expect(result.user_agent).toBe(ua)
  })

  it('parses Windows Chrome correctly', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    const result = parseUserAgent(ua)
    expect(result.device_type).toBe('desktop')
    expect(result.browser).toBe('Chrome 126')
    expect(result.os).toContain('Windows')
  })

  it('parses Android Chrome correctly', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
    const result = parseUserAgent(ua)
    expect(result.device_type).toBe('mobile')
    expect(result.browser).toBe('Mobile Chrome 126')
    expect(result.os).toBe('Android 14')
  })

  it('parses iPad as tablet', () => {
    const ua = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
    const result = parseUserAgent(ua)
    expect(result.device_type).toBe('tablet')
    expect(result.os).toBe('iOS 17')
  })

  it('falls back gracefully for unknown UA', () => {
    const result = parseUserAgent('curl/8.5.0')
    expect(['desktop', 'unknown']).toContain(result.device_type)
    expect(result.browser).toBeTruthy()
    expect(result.os).toBeTruthy()
  })

  it('truncates very long user agents', () => {
    const ua = 'x'.repeat(1000)
    const result = parseUserAgent(ua)
    expect(result.user_agent.length).toBeLessThanOrEqual(500)
  })
})

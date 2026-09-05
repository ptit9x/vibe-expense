import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme-provider'
import Snowfall from './Snowfall'

const matchMediaMock = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})
vi.stubGlobal('matchMedia', matchMediaMock)

function renderWithTheme(theme: string) {
  return render(
    <ThemeProvider defaultTheme={theme as never}>
      <Snowfall />
    </ThemeProvider>
  )
}

describe('Snowfall', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders snow layers when christmas theme is active', () => {
    renderWithTheme('christmas')
    const layers = document.querySelectorAll('.snow-layer')
    expect(layers.length).toBe(2)
    const flakes = document.querySelectorAll('.snowflake')
    expect(flakes.length).toBe(38) // 24 back + 14 front
    // flakes carry inline animation styles
    const first = flakes[0] as HTMLElement
    expect(first.style.animationDuration).toMatch(/s, .+s/)
    expect(first.textContent).toMatch(/[❄❅❆•]/)
  })

  it('renders nothing for non-christmas themes', () => {
    renderWithTheme('zinc')
    expect(document.querySelectorAll('.snow-layer').length).toBe(0)
    expect(document.querySelectorAll('.snowflake').length).toBe(0)
  })

  it('marks layers as aria-hidden decorative', () => {
    renderWithTheme('christmas')
    document.querySelectorAll('.snow-layer').forEach((layer) => {
      expect(layer.getAttribute('aria-hidden')).toBe('true')
    })
  })

  it('generates deterministic flakes (stable across renders)', () => {
    const { unmount } = renderWithTheme('christmas')
    const firstRun = [...document.querySelectorAll('.snowflake')].map(
      (f) => (f as HTMLElement).style.left
    )
    unmount()
    renderWithTheme('christmas')
    const secondRun = [...document.querySelectorAll('.snowflake')].map(
      (f) => (f as HTMLElement).style.left
    )
    expect(firstRun).toEqual(secondRun)
  })
})

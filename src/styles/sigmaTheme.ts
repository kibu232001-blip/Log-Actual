/**
 * LOG ACTUAL — Sigma Reactive Theme
 * Injects CSS variables based on sigma level.
 * Lower sigma = warmer/redder atmosphere across the entire UI.
 */

export function applySigmaTheme(sigma: number) {
  const root = document.documentElement

  if (sigma >= 3.0) {
    // Green — theater stable
    root.style.setProperty('--accent',        '#00ff88')
    root.style.setProperty('--accent-dim',    '#1a5a3a')
    root.style.setProperty('--bg-base',       '#030a0e')
    root.style.setProperty('--bg-panel',      '#07100a')
    root.style.setProperty('--border',        '#1a3a20')
    root.style.setProperty('--sigma-glow',    '0 0 0 transparent')
    root.style.setProperty('--scan-opacity',  '0.02')
  } else if (sigma >= 2.0) {
    // Amber — theater under pressure
    root.style.setProperty('--accent',        '#ffaa00')
    root.style.setProperty('--accent-dim',    '#4a3500')
    root.style.setProperty('--bg-base',       '#0e0a03')
    root.style.setProperty('--bg-panel',      '#120e04')
    root.style.setProperty('--border',        '#3a2a10')
    root.style.setProperty('--sigma-glow',    '0 0 30px rgba(255,170,0,0.08)')
    root.style.setProperty('--scan-opacity',  '0.04')
  } else if (sigma >= 1.5) {
    // Orange — theater critical
    root.style.setProperty('--accent',        '#ff6600')
    root.style.setProperty('--accent-dim',    '#4a2000')
    root.style.setProperty('--bg-base',       '#0e0603')
    root.style.setProperty('--bg-panel',      '#140804')
    root.style.setProperty('--border',        '#4a2010')
    root.style.setProperty('--sigma-glow',    '0 0 40px rgba(255,100,0,0.12)')
    root.style.setProperty('--scan-opacity',  '0.06')
  } else {
    // Red — theater collapsing
    root.style.setProperty('--accent',        '#ff2200')
    root.style.setProperty('--accent-dim',    '#4a0a00')
    root.style.setProperty('--bg-base',       '#0e0303')
    root.style.setProperty('--bg-panel',      '#140404')
    root.style.setProperty('--border',        '#4a1010')
    root.style.setProperty('--sigma-glow',    '0 0 60px rgba(255,34,0,0.15)')
    root.style.setProperty('--scan-opacity',  '0.08')
  }
}

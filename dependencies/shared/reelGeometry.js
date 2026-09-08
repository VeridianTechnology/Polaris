export function mediaShape(width, height) {
  if (!(width > 0 && height > 0)) return 'unknown'
  const ratio = height / width
  return ratio > 1.2 ? 'portrait' : ratio < 0.8 ? 'landscape' : 'square'
}

export function seekTime(current, delta, duration) {
  return Math.max(0, Math.min(Number.isFinite(duration) ? duration : 0, current + delta))
}

export function formatTime(seconds) {
  const time = Math.max(0, Math.floor(seconds || 0))
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`
}

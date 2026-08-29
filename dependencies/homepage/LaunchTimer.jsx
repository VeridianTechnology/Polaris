import { useEffect, useState } from 'react'

const LAUNCH_TIMESTAMP_SECONDS = 1_787_978_365
const LAUNCH_TIME = LAUNCH_TIMESTAMP_SECONDS * 1000
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const YEAR = 365 * DAY

const pad = (value, length = 2) => String(value).padStart(length, '0')

function getElapsedTime(now) {
  let remaining = Math.max(0, now - LAUNCH_TIME)
  const years = Math.floor(remaining / YEAR)
  remaining %= YEAR
  const days = Math.floor(remaining / DAY)
  remaining %= DAY
  const hours = Math.floor(remaining / HOUR)
  remaining %= HOUR
  const minutes = Math.floor(remaining / MINUTE)

  return { years, days, hours, minutes }
}

function LaunchTimer() {
  const [now, setNow] = useState(Date.now)
  const elapsed = getElapsedTime(now)

  useEffect(() => {
    const update = () => setNow(Date.now())
    const timer = window.setInterval(update, 30_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <aside className="launch-timer" aria-label="Time since Polaris launched">
      <p>Polaris launched</p>
      <time dateTime="2026-08-29T04:39:25Z">
        <span><strong>{pad(elapsed.years)}</strong><small>Years</small></span>
        <span><strong>{pad(elapsed.days, 3)}</strong><small>Days</small></span>
        <span><strong>{pad(elapsed.hours)}</strong><small>Hours</small></span>
        <span><strong>{pad(elapsed.minutes)}</strong><small>Minutes</small></span>
      </time>
    </aside>
  )
}

export default LaunchTimer

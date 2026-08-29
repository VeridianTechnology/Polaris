import { useEffect, useState } from 'react'

const formatCoordinate = (value, positiveDirection, negativeDirection) => {
  const direction = value >= 0 ? positiveDirection : negativeDirection
  return `${Math.abs(value).toFixed(2)}° ${direction}`
}

function VisitorCoordinates() {
  const [coords, setCoords] = useState(null)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (!navigator.permissions?.query) return undefined

    let permissionStatus
    const handlePermissionChange = () => {
      if (permissionStatus.state === 'granted') setStatus('idle')
      if (permissionStatus.state === 'denied') setStatus('blocked')
    }

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      permissionStatus = result
      handlePermissionChange()
      result.addEventListener('change', handlePermissionChange)
    }).catch(() => {})

    return () => permissionStatus?.removeEventListener('change', handlePermissionChange)
  }, [])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      return
    }

    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(position.coords)
        setStatus('ready')
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? 'blocked' : 'error')
      },
      {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: 10_000,
      },
    )
  }

  if (coords) {
    const latitude = formatCoordinate(coords.latitude, 'N', 'S')
    const longitude = formatCoordinate(coords.longitude, 'E', 'W')

    return (
      <p className="coordinates" aria-live="polite">
        {`${latitude}\u00a0\u00a0${longitude}`}
      </p>
    )
  }

  const labels = {
    idle: 'Share location',
    locating: 'Locating…',
    blocked: 'Enable location in browser',
    error: 'Request location',
    unavailable: 'Location unavailable',
  }

  return (
    <button
      className="coordinates coordinates--button"
      type="button"
      onClick={requestLocation}
      disabled={status === 'unavailable' || status === 'locating'}
      aria-live="polite"
      title={status === 'blocked' ? 'Enable location permission for this site, then try again.' : undefined}
    >
      {labels[status] || labels.idle}
    </button>
  )
}

export default VisitorCoordinates

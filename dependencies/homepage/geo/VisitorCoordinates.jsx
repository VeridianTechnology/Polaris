import { useState } from 'react'
import { useGeolocated } from 'react-geolocated'

const formatCoordinate = (value, positiveDirection, negativeDirection) => {
  const direction = value >= 0 ? positiveDirection : negativeDirection
  return `${Math.abs(value).toFixed(2)}° ${direction}`
}

function VisitorCoordinates() {
  const [hasRequested, setHasRequested] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const {
    coords,
    isGeolocationAvailable,
    isGeolocationEnabled,
    positionError,
    getPosition,
  } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: false,
      maximumAge: 300_000,
      timeout: 10_000,
    },
    userDecisionTimeout: 12_000,
    suppressLocationOnMount: true,
    watchLocationPermissionChange: true,
    onSuccess: () => setIsLocating(false),
    onError: () => setIsLocating(false),
  })

  if (coords) {
    const latitude = formatCoordinate(coords.latitude, 'N', 'S')
    const longitude = formatCoordinate(coords.longitude, 'E', 'W')

    return (
      <p className="coordinates" aria-live="polite">
        {`${latitude}\u00a0\u00a0${longitude}`}
      </p>
    )
  }

  const requestLocation = () => {
    setHasRequested(true)
    setIsLocating(true)
    getPosition()
  }

  let label = 'Share location'

  if (!isGeolocationAvailable) label = 'Location unavailable'
  else if (isLocating) label = 'Locating…'
  else if (hasRequested && (!isGeolocationEnabled || positionError)) label = 'Request location'

  return (
    <button
      className="coordinates coordinates--button"
      type="button"
      onClick={requestLocation}
      disabled={!isGeolocationAvailable || isLocating}
      aria-live="polite"
    >
      {label}
    </button>
  )
}

export default VisitorCoordinates

import { useCallback, useEffect, useState } from 'react'
import { matchRoute } from './routes.js'

const readRoute = () => matchRoute(window.location.pathname)

export default function useAppRouter() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const handlePopState = () => setRoute(readRoute())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (window.location.pathname === route.path) return
    window.history.replaceState({}, '', route.path)
  }, [route])

  const navigate = useCallback((path, options = {}) => {
    const nextRoute = matchRoute(path)
    const historyMethod = options.replace ? 'replaceState' : 'pushState'
    window.history[historyMethod]({}, '', nextRoute.path)
    setRoute(nextRoute)
  }, [])

  return { route, navigate }
}

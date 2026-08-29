export const ACADEMY_VISITOR_ID_KEY = 'polaris-academy-visitor-id'

export function getAcademyVisitorId() {
  const storedId = localStorage.getItem(ACADEMY_VISITOR_ID_KEY)
  if (storedId) return storedId

  const visitorId = crypto.randomUUID()
  localStorage.setItem(ACADEMY_VISITOR_ID_KEY, visitorId)
  return visitorId
}

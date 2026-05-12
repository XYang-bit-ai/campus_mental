const GUEST_PATHS = new Set(['/login', '/register', '/admin/login'])

export function safeInternalPath(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  const pathOnly = raw.split('?')[0]
  if (GUEST_PATHS.has(pathOnly)) return null
  return raw
}

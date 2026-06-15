/**
 * API base-URL validation for the KynticAI Scout n8n node.
 *
 * Rejects embedded credentials, query strings, fragments,
 * and unsupported protocols before any network call is made.
 */

const ALLOWED_PROTOCOLS = new Set(['https:', 'http:'])

export interface UrlValidationResult {
  valid: boolean
  sanitised?: string
  error?: string
}

export function validateBaseUrl(raw: string): UrlValidationResult {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: 'Base URL must not be empty.' }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { valid: false, error: 'Base URL is not a valid URL.' }
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      valid: false,
      error: `Unsupported protocol "${parsed.protocol}" — only https and http are permitted.`,
    }
  }

  if (parsed.username !== '' || parsed.password !== '') {
    return {
      valid: false,
      error: 'Base URL must not contain embedded credentials (user:pass@host).',
    }
  }

  if (parsed.search !== '') {
    return {
      valid: false,
      error: 'Base URL must not contain a query string.',
    }
  }

  if (parsed.hash !== '') {
    return {
      valid: false,
      error: 'Base URL must not contain a fragment.',
    }
  }

  const sanitised = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`
  return { valid: true, sanitised }
}

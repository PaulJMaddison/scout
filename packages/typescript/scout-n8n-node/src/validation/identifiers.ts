/**
 * Tenant slug / workspace identifier validation.
 *
 * Identifiers must be short, URL-safe, lower-case alphanumerics with
 * optional hyphens — matching the Scout API slug format.
 */

const SLUG_RE = /^[a-z][a-z0-9-]{0,62}[a-z0-9]$/

export interface IdentifierValidationResult {
  valid: boolean
  error?: string
}

export function validateTenantSlug(value: string): IdentifierValidationResult {
  if (value.length === 0) {
    return { valid: false, error: 'Tenant slug must not be empty.' }
  }
  if (!SLUG_RE.test(value)) {
    return {
      valid: false,
      error:
        'Tenant slug must be 2–64 lower-case alphanumeric characters or hyphens, starting with a letter.',
    }
  }
  return { valid: true }
}

export function validateWorkspaceSlug(value: string): IdentifierValidationResult {
  if (value.length === 0) {
    return { valid: true }
  }
  if (!SLUG_RE.test(value)) {
    return {
      valid: false,
      error:
        'Workspace slug must be 2–64 lower-case alphanumeric characters or hyphens, starting with a letter.',
    }
  }
  return { valid: true }
}

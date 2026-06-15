/**
 * Mapping-field validation for source-event payloads.
 *
 * Rejects target field names that look like credentials or secrets
 * to prevent accidental leakage of sensitive material into the
 * semantic layer.
 */

const SECRET_FIELD_PATTERNS: RegExp[] = [
  /^api[_-]?key$/i,
  /^api[_-]?secret$/i,
  /^access[_-]?key$/i,
  /^access[_-]?token$/i,
  /^auth[_-]?token$/i,
  /^bearer[_-]?token$/i,
  /^client[_-]?secret$/i,
  /^private[_-]?key$/i,
  /^secret[_-]?key$/i,
  /^session[_-]?token$/i,
  /^refresh[_-]?token$/i,
  /^password$/i,
  /^passwd$/i,
  /^credential$/i,
  /^credentials$/i,
  /^token$/i,
  /^secret$/i,
  /^cookie$/i,
  /^authorization$/i,
  /^x[_-]api[_-]?key$/i,
  /^x[_-]auth[_-]?token$/i,
  /^connection[_-]?string$/i,
  /^database[_-]?password$/i,
  /^db[_-]?password$/i,
  /^encryption[_-]?key$/i,
  /^signing[_-]?key$/i,
  /^ssh[_-]?key$/i,
  /^ssl[_-]?cert$/i,
  /^ssl[_-]?key$/i,
]

const VALID_FIELD_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_.]{0,127}$/

export interface FieldValidationResult {
  valid: boolean
  error?: string
}

export function validateMappingField(fieldName: string): FieldValidationResult {
  if (fieldName.length === 0) {
    return { valid: false, error: 'Field name must not be empty.' }
  }

  if (!VALID_FIELD_NAME_RE.test(fieldName)) {
    return {
      valid: false,
      error:
        'Field name must start with a letter or underscore and contain only alphanumerics, underscores, or dots (max 128 chars).',
    }
  }

  for (const pattern of SECRET_FIELD_PATTERNS) {
    if (pattern.test(fieldName)) {
      return {
        valid: false,
        error: `Field name "${fieldName}" appears to be a credential or secret and must not be used as a mapping target.`,
      }
    }
  }

  return { valid: true }
}

export function validateMappingFields(fieldNames: readonly string[]): FieldValidationResult {
  for (const name of fieldNames) {
    const result = validateMappingField(name)
    if (!result.valid) {
      return result
    }
  }
  return { valid: true }
}

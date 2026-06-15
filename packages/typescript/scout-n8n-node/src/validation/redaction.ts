/**
 * Recursive sensitive-key redaction for log-safe output.
 *
 * Walks arbitrary nested objects/arrays and replaces values whose keys
 * match well-known credential patterns with a redacted placeholder.
 * The original object is not mutated — a deep-cloned, redacted copy is
 * returned.
 */

const REDACTED = '[REDACTED]'

const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /api[_-]?key/i,
  /api[_-]?secret/i,
  /access[_-]?key/i,
  /access[_-]?token/i,
  /auth[_-]?token/i,
  /authorization/i,
  /bearer/i,
  /client[_-]?secret/i,
  /connection[_-]?string/i,
  /cookie/i,
  /credential/i,
  /database[_-]?password/i,
  /db[_-]?password/i,
  /encryption[_-]?key/i,
  /passphrase/i,
  /password/i,
  /passwd/i,
  /private[_-]?key/i,
  /refresh[_-]?token/i,
  /secret/i,
  /session[_-]?token/i,
  /signing[_-]?key/i,
  /ssh[_-]?key/i,
  /ssl[_-]?cert/i,
  /ssl[_-]?key/i,
  /token/i,
  /x[_-]api[_-]?key/i,
  /x[_-]auth[_-]?token/i,
]

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((re) => re.test(key))
}

export function redactSensitiveKeys(input: unknown, maxDepth: number = 20): unknown {
  return walk(input, 0, maxDepth)
}

function walk(value: unknown, depth: number, maxDepth: number): unknown {
  if (depth > maxDepth) {
    return REDACTED
  }

  if (value === null || value === undefined) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => walk(item, depth + 1, maxDepth))
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        result[key] = REDACTED
      } else {
        result[key] = walk(val, depth + 1, maxDepth)
      }
    }
    return result
  }

  return value
}

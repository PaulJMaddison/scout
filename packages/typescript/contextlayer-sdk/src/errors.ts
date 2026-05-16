import type { ContextLayerErrorDetail } from './types.js'

/**
 * Error thrown by the SDK when an API request fails or returns an error response.
 *
 * Includes structured metadata from the server's problem-details envelope
 * (status code, correlation ID, machine-readable code, and validation details).
 */
export class ContextLayerError extends Error {
  /** HTTP status code, if the error originated from an HTTP response. */
  status: number | undefined
  /** Server-assigned correlation identifier for request tracing. */
  correlationId: string | undefined
  /** Machine-readable error code (e.g. `"VALIDATION_FAILED"`). */
  code: string | undefined
  /** Whether the request can be retried. */
  retryable: boolean
  /** Granular validation or field-level error details. */
  details: ContextLayerErrorDetail[]

  constructor(
    message: string,
    options?: {
      status?: number | undefined
      correlationId?: string | undefined
      code?: string | undefined
      retryable?: boolean | undefined
      details?: ContextLayerErrorDetail[] | undefined
      cause?: unknown
    },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined)
    this.name = 'ContextLayerError'
    this.status = options?.status
    this.correlationId = options?.correlationId
    this.code = options?.code
    this.retryable = options?.retryable ?? false
    this.details = options?.details ?? []
  }
}

import type { ContextLayerErrorDetail } from './types.js'

export class ContextLayerError extends Error {
  status: number | undefined
  correlationId: string | undefined
  code: string | undefined
  retryable: boolean
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

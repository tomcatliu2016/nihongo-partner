export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMIT_EXCEEDED'

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }

  static validation(message: string, details?: Record<string, unknown>) {
    return new AppError('VALIDATION_ERROR', message, 400, details)
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError('UNAUTHORIZED', message, 401)
  }

  static forbidden(message = 'Forbidden') {
    return new AppError('FORBIDDEN', message, 403)
  }

  static notFound(message = 'Resource not found') {
    return new AppError('NOT_FOUND', message, 404)
  }

  static internal(message = 'Internal server error') {
    return new AppError('INTERNAL_ERROR', message, 500)
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new AppError('SERVICE_UNAVAILABLE', message, 503)
  }

  static rateLimitExceeded(message = 'Rate limit exceeded') {
    return new AppError('RATE_LIMIT_EXCEEDED', message, 429)
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    }
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: ErrorCode
    message: string
    details?: Record<string, unknown>
  }
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  }
}

export function errorResponse(error: AppError | Error): ApiResponse {
  if (error instanceof AppError) {
    return error.toJSON()
  }

  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
    },
  }
}

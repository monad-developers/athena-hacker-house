// Custom error classes for the application
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409)
  }
}

export class Web3Error extends AppError {
  constructor(message: string) {
    super(`Web3 Error: ${message}`, 500)
  }
}

export class TokenTransferError extends AppError {
  constructor(message: string) {
    super(`Token Transfer Error: ${message}`, 500)
  }
}

// Error handler for API routes
export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return {
      error: error.message,
      statusCode: error.statusCode
    }
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    switch (error.code) {
      case 'P2002':
        return {
          error: 'A record with this information already exists',
          statusCode: 409
        }
      case 'P2025':
        return {
          error: 'Record not found',
          statusCode: 404
        }
      default:
        return {
          error: 'Database error occurred',
          statusCode: 500
        }
    }
  }

  return {
    error: 'Internal server error',
    statusCode: 500
  }
}

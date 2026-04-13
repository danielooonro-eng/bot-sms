import { ApiResponse } from './types'

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  }
}

export function errorResponse<T>(error: string, message?: string): ApiResponse<T> {
  return {
    success: false,
    error,
    message
  }
}

export function unauthorized(message = 'Unauthorized'): ApiResponse<null> {
  return {
    success: false,
    error: message
  }
}

export function notFound(message = 'Not found'): ApiResponse<null> {
  return {
    success: false,
    error: message
  }
}

export function badRequest(message = 'Bad request'): ApiResponse<null> {
  return {
    success: false,
    error: message
  }
}

export function serverError(message = 'Internal server error'): ApiResponse<null> {
  return {
    success: false,
    error: message
  }
}

/**
 * API Security Utilities
 * Input validation, sanitization, and security helpers
 */

import { z } from 'zod'

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailSchema = z.string().email()
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}

/**
 * Validate and sanitize text input
 */
export function validateTextInput(
  input: string,
  minLength = 1,
  maxLength = 10000
): { valid: boolean; sanitized: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, sanitized: '', error: 'Input is required' }
  }

  const sanitized = sanitizeInput(input)

  if (sanitized.length < minLength) {
    return {
      valid: false,
      sanitized,
      error: `Input must be at least ${minLength} characters`,
    }
  }

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      sanitized,
      error: `Input must not exceed ${maxLength} characters`,
    }
  }

  return { valid: true, sanitized }
}

/**
 * Check if API key format is valid (without exposing the key)
 */
export function isValidApiKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false
  
  // Check common API key patterns
  const patterns = [
    /^sk-[a-zA-Z0-9]{32,}$/, // OpenAI
    /^gsk_[a-zA-Z0-9]{32,}$/, // Groq
    /^sb-[a-zA-Z0-9-_]+$/, // Supabase
  ]

  return patterns.some(pattern => pattern.test(key))
}

/**
 * Rate limiting checker (client-side helper)
 */
export class RateLimiter {
  private requests: number[] = []
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs = 60000, maxRequests = 10) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    )

    if (this.requests.length >= this.maxRequests) {
      return false
    }

    this.requests.push(now)
    return true
  }

  getRemainingRequests(): number {
    const now = Date.now()
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    )
    return Math.max(0, this.maxRequests - this.requests.length)
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0
    return this.requests[0] + this.windowMs
  }
}

/**
 * Validate user role
 */
export function isValidRole(role: string): boolean {
  const validRoles = ['USER', 'ADMIN', 'LAWYER', 'JUDGE', 'STUDENT']
  return validRoles.includes(role.toUpperCase())
}

/**
 * Prevent SQL injection by validating query parameters
 */
export function validateQueryParam(param: string): boolean {
  // Check for common SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
    /('|(\\')|(--)|(-)|(\))|(\()|(\;)|(@@)|(char)|(nchar)|(varchar)|(nvarchar)|(alter)|(begin)|(cast)|(create)|(cursor)|(declare)|(delete)|(drop)|(end)|(exec)|(execute)|(fetch)|(insert)|(kill)|(open)|(select)|(sys)|(sysobjects)|(syscolumns)|(table)|(update))/gi,
  ]

  return !sqlInjectionPatterns.some(pattern => pattern.test(param))
}

/**
 * CSRF Token generation and validation
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Secure random string generator
 */
export function generateSecureRandom(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  
  return Array.from(array, byte => chars[byte % chars.length]).join('')
}

/**
 * Password strength validator
 */
export function validatePassword(password: string): boolean {
  const result = validatePasswordStrength(password)
  return result.valid
}

/**
 * Password strength validator with detailed feedback
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Password must be at least 8 characters')
  }

  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Add lowercase letters')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Add uppercase letters')

  if (/[0-9]/.test(password)) score += 1
  else feedback.push('Add numbers')

  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  else feedback.push('Add special characters')

  return {
    valid: score >= 4,
    score,
    feedback,
  }
}

/**
 * Check if request comes from allowed origin
 */
export function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://jurisai.uz',
    'https://www.jurisai.uz',
    'https://jurisai.vercel.app',
  ]

  return allowedOrigins.includes(origin)
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string): string {
  if (!data || data.length < 8) return '***'
  
  const visibleStart = 4
  const visibleEnd = 4
  const masked = '*'.repeat(data.length - visibleStart - visibleEnd)
  
  return data.slice(0, visibleStart) + masked + data.slice(-visibleEnd)
}

/**
 * API Error Response Generator
 */
export interface APIError {
  error: string
  message: string
  code?: string
  statusCode: number
}

export function createAPIError(
  message: string,
  statusCode = 500,
  code?: string
): APIError {
  return {
    error: getErrorType(statusCode),
    message,
    code,
    statusCode,
  }
}

function getErrorType(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad Request'
    case 401:
      return 'Unauthorized'
    case 403:
      return 'Forbidden'
    case 404:
      return 'Not Found'
    case 429:
      return 'Too Many Requests'
    case 500:
      return 'Internal Server Error'
    default:
      return 'Error'
  }
}

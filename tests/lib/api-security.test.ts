import { describe, it, expect } from 'vitest'
import { 
  sanitizeInput, 
  validateEmail, 
  validatePasswordStrength,
  RateLimiter,
  validateQueryParam,
  generateCSRFToken
} from '@/lib/api-security'

describe('API Security', () => {
  describe('sanitizeInput', () => {
    it('removes XSS attempts', () => {
      expect(sanitizeInput('<script>alert("xss")</script>Hello')).not.toContain('<script>')
      expect(sanitizeInput('javascript:alert(1)')).not.toContain('javascript:')
    })

    it('handles empty input', () => {
      expect(sanitizeInput('')).toBe('')
    })
  })

  describe('validateEmail', () => {
    it('accepts valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true)
    })

    it('rejects invalid emails', () => {
      expect(validateEmail('notanemail')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })
  })

  describe('validatePasswordStrength', () => {
    it('accepts strong passwords', () => {
      const result = validatePasswordStrength('Password123!')
      expect(result.valid).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(4)
    })

    it('rejects weak passwords', () => {
      const result = validatePasswordStrength('12345678')
      expect(result.valid).toBe(false)
      expect(result.feedback.length).toBeGreaterThan(0)
    })
  })

  describe('RateLimiter', () => {
    it('limits requests', () => {
      const limiter = new RateLimiter(1000, 3)
      
      expect(limiter.canMakeRequest()).toBe(true)
      expect(limiter.canMakeRequest()).toBe(true)
      expect(limiter.canMakeRequest()).toBe(true)
      expect(limiter.canMakeRequest()).toBe(false)
    })
  })

  describe('validateQueryParam', () => {
    it('detects SQL injection', () => {
      expect(validateQueryParam('SELECT * FROM users')).toBe(false)
      expect(validateQueryParam('DROP TABLE users')).toBe(false)
      expect(validateQueryParam('normal text')).toBe(true)
    })
  })

  describe('generateCSRFToken', () => {
    it('generates unique tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      
      expect(token1).not.toBe(token2)
      expect(token1.length).toBe(64)
    })
  })
})

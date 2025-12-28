import { z } from 'zod';

// Enhanced validation schemas with stricter rules
export const validateCardInput = {
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  idNumber: z.string()
    .min(3, 'ID Number must be at least 3 characters')
    .max(20, 'ID Number must not exceed 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'ID Number can only contain uppercase letters, numbers, and hyphens'),
  
  dob: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in DD/MM/YYYY format'),
  
  country: z.string()
    .length(2, 'Country code must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'Country code must be 2 uppercase letters'),
  
  sex: z.enum(['M', 'F', 'X']).optional(),
  
  address: z.string()
    .max(200, 'Address must not exceed 200 characters')
    .optional(),
  
  issueDate: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in DD/MM/YYYY format')
    .optional(),
  
  expiryDate: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in DD/MM/YYYY format')
    .optional(),
  
  theme: z.enum(['blue', 'green', 'gold']),
} as const;

// Sanitize string input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

// Validate and sanitize request body
export function validateAndSanitize<T>(data: unknown, schema: z.ZodSchema): T {
  // Sanitize strings first
  const sanitized: Record<string, unknown> = {};
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  // Then validate with schema
  return schema.parse(sanitized) as T;
}

// Check for SQL injection patterns
export function containsSuspiciousPatterns(input: string): boolean {
  const patterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(-{2}|\/\*|\*\/|;)/,
    /(['"`\\])/
  ];
  
  return patterns.some(pattern => pattern.test(input));
}

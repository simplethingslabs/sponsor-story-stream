import { v4 as uuidv4 } from 'uuid';
import { PaginationParams, FilterParams } from '../types';

// Generate UUID
export function generateId(): string {
  return uuidv4();
}

// Generate secure token
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Parse pagination from query params
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  const sortBy = (query.sortBy as string) || 'created_at';
  const sortOrder = ((query.sortOrder as string) || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  
  return { page, limit, sortBy, sortOrder };
}

// Parse filters from query params
export function parseFilters(query: Record<string, unknown>, allowedFields: string[]): FilterParams {
  const filters: FilterParams = {};
  
  if (query.search && typeof query.search === 'string') {
    filters.search = query.search.trim();
  }
  
  for (const field of allowedFields) {
    if (query[field] && typeof query[field] === 'string') {
      filters[field] = query[field] as string;
    }
  }
  
  return filters;
}

// Build WHERE clause from filters
export function buildWhereClause(
  filters: FilterParams,
  searchFields: string[],
  paramOffset: number = 0
): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = paramOffset + 1;
  
  // Search across multiple fields
  if (filters.search && searchFields.length > 0) {
    const searchConditions = searchFields.map((field) => {
      return `${field} ILIKE $${paramIndex}`;
    });
    conditions.push(`(${searchConditions.join(' OR ')})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }
  
  // Status filter
  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }
  
  // Date range filters
  if (filters.startDate) {
    conditions.push(`created_at >= $${paramIndex}`);
    params.push(filters.startDate);
    paramIndex++;
  }
  
  if (filters.endDate) {
    conditions.push(`created_at <= $${paramIndex}`);
    params.push(filters.endDate);
    paramIndex++;
  }
  
  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

// Sanitize string for SQL LIKE
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[%_\\]/g, '\\$&');
}

// Format date for SQL
export function formatDateForSQL(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

// Calculate offset for pagination
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

// Check if date is expired
export function isExpired(expiresAt: Date | string): boolean {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiry < new Date();
}

// Remove sensitive fields from user object
export function sanitizeUser<T extends Record<string, unknown>>(user: T): Omit<T, 'password_hash'> {
  const { password_hash, ...sanitized } = user;
  return sanitized as Omit<T, 'password_hash'>;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Generate quarter from date
export function getQuarter(date: Date = new Date()): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const month = date.getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
}

// Calculate age from date of birth
export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

// Delay helper for rate limiting
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Chunk array for batch processing
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Sanitize string to prevent XSS
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Format paginated response
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Build paginated query helper
export function buildPaginatedQuery(
  baseQuery: string,
  page: number,
  limit: number
) {
  const offset = (page - 1) * limit;
  return {
    query: `${baseQuery} LIMIT ${limit} OFFSET ${offset}`,
    offset,
  };
}

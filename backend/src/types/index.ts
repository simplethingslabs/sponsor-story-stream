import { Request } from 'express';

// User Roles
export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'sponsor';

// User Types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  roles: UserRole[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface UserPublic {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  roles: UserRole[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Child Types
export interface Child {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  grade: string;
  photo_url?: string;
  enrollment_date: Date;
  status: 'active' | 'graduated' | 'withdrawn';
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// Sponsorship Types
export interface Sponsorship {
  id: string;
  sponsor_id: string;
  child_id: string;
  start_date: Date;
  end_date?: Date;
  status: 'active' | 'paused' | 'ended';
  created_at: Date;
  deleted_at?: Date;
}

// Progress Report Types
export interface ProgressReport {
  id: string;
  child_id: string;
  teacher_id: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  growth_narrative: string;
  activities: string;
  teacher_observations: string;
  status: 'draft' | 'pending_review' | 'needs_revision' | 'approved' | 'published';
  published_at?: Date;
  submitted_at?: Date;
  reviewed_by?: string;
  reviewed_at?: Date;
  feedback?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ReportMedia {
  id: string;
  report_id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  public_id?: string;
  caption?: string;
  order: number;
  created_at: Date;
}

// Newsletter Types
export interface Newsletter {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  public_id?: string;
  published_date: Date;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// Event Types
export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  event_date: Date;
  location?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface EventMedia {
  id: string;
  event_id: string;
  type: 'image' | 'video';
  url: string;
  public_id?: string;
  caption?: string;
  order: number;
  created_at: Date;
}

// Pending Registration Types
export interface PendingRegistration {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
}

// Sponsor Invitation Types
export interface SponsorInvitation {
  id: string;
  email: string;
  token: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: Date;
  expires_at: Date;
  accepted_at?: Date;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: 'report_published' | 'event_created' | 'newsletter_published' | 'sponsorship_assigned' | 'invitation_accepted' | 'registration_approved' | 'system';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: Date;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  user_id?: string;
  action: 'create' | 'update' | 'delete' | 'restore';
  table_name: string;
  record_id: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// Token Types
export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  revoked_at?: Date;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  used_at?: Date;
}

// Request Extensions
export interface AuthenticatedRequest extends Request {
  user?: UserPublic;
  userId?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Pagination & Filter Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: string | undefined;
}

// Batch Operation Types
export type BatchAction = 'create' | 'update' | 'delete' | 'restore';

export interface BatchOperation<T> {
  action: BatchAction;
  id?: string;
  data?: Partial<T>;
}

export interface BatchResult {
  success: boolean;
  id?: string;
  error?: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}

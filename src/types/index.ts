// User & Authentication Types
export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'sponsor';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithRoles extends User {
  roles: UserRole[];
}

// Child Types
export interface Child {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  grade: string;
  photo_url?: string;
  enrollment_date: string;
  status: 'active' | 'graduated' | 'withdrawn';
  created_at: string;
  updated_at: string;
}

// Sponsorship Types
export interface Sponsorship {
  id: string;
  sponsor_id: string;
  child_id: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'paused' | 'ended';
  created_at: string;
}

// Progress Report Types
export type ReportStatus = 'draft' | 'pending_review' | 'needs_revision' | 'approved' | 'published';

export interface ProgressReport {
  id: string;
  child_id: string;
  teacher_id: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  growth_narrative: string;
  activities: string;
  teacher_observations: string;
  status: ReportStatus;
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Phase 3: Quality control fields
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  feedback?: string;
  word_count?: number;
  media_count?: number;
}

export interface ReportMedia {
  id: string;
  report_id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  caption?: string;
  order: number;
  created_at: string;
}

// Newsletter Types
export interface Newsletter {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  published_date: string;
  created_at: string;
}

// Event Types
export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  created_by: string;
  created_at: string;
}

export interface EventMedia {
  id: string;
  event_id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
  order: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Pending Registration Types
export interface PendingRegistration {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

// Sponsor Invitation Types
export interface SponsorInvitation {
  id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  accepted_at?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface AuthState {
  user: UserWithRoles | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

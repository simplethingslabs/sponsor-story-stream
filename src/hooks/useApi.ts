import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Child,
  User,
  Sponsorship,
  ProgressReport,
  Newsletter,
  SchoolEvent,
  PendingRegistration,
  SponsorInvitation,
  PaginatedResponse,
} from '@/types';

// Query Keys
export const queryKeys = {
  children: ['children'] as const,
  child: (id: string) => ['children', id] as const,
  myChildren: ['my-children'] as const,
  sponsors: ['sponsors'] as const,
  sponsor: (id: string) => ['sponsors', id] as const,
  sponsorStats: ['sponsor-stats'] as const,
  sponsorships: ['sponsorships'] as const,
  reports: ['reports'] as const,
  report: (id: string) => ['reports', id] as const,
  myReports: ['my-reports'] as const,
  newsletters: ['newsletters'] as const,
  newsletter: (id: string) => ['newsletters', id] as const,
  events: ['events'] as const,
  event: (id: string) => ['events', id] as const,
  upcomingEvents: ['events', 'upcoming'] as const,
  invitations: ['invitations'] as const,
  pendingRegistrations: ['pending-registrations'] as const,
  notifications: ['notifications'] as const,
  auditLogs: ['audit-logs'] as const,
  trash: ['trash'] as const,
  payments: ['payments'] as const,
  payment: (id: string) => ['payments', id] as const,
  paymentStats: ['payment-stats'] as const,
  attendance: (date: string) => ['attendance', date] as const,
};

// ============ Children Hooks ============
export function useChildren(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.children, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<Child>>(`/children${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useChild(id: string) {
  return useQuery({
    queryKey: queryKeys.child(id),
    queryFn: async () => {
      const response = await api.get<Child>(`/children/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: !!id,
  });
}

export function useMyChildren(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.myChildren, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<Child>>(`/children/my-children${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useCreateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Child>) => {
      const response = await api.post<Child>('/children', data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.children });
    },
  });
}

export function useUpdateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Child> }) => {
      const response = await api.put<Child>(`/children/${id}`, data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.children });
      queryClient.invalidateQueries({ queryKey: queryKeys.child(id) });
    },
  });
}

export function useDeleteChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/children/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.children });
      queryClient.invalidateQueries({ queryKey: queryKeys.trash });
    },
  });
}

export function useRestoreChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Child>(`/children/${id}/restore`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.children });
      queryClient.invalidateQueries({ queryKey: queryKeys.trash });
    },
  });
}

// ============ Sponsors Hooks ============
export function useSponsors(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.sponsors, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<User>>(`/sponsors${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useSponsor(id: string) {
  return useQuery({
    queryKey: queryKeys.sponsor(id),
    queryFn: async () => {
      const response = await api.get<User>(`/sponsors/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: !!id,
  });
}

export function useSponsorStats() {
  return useQuery({
    queryKey: queryKeys.sponsorStats,
    queryFn: async () => {
      const response = await api.get<any>('/sponsors/stats');
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

// ============ Sponsorships Hooks ============
export function useSponsorships(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.sponsorships, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<Sponsorship>>(`/sponsorships${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useAssignSponsorship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { sponsor_id: string; child_id: string; start_date?: string }) => {
      const response = await api.post<Sponsorship>('/sponsorships/assign', data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sponsorships });
      queryClient.invalidateQueries({ queryKey: queryKeys.children });
      queryClient.invalidateQueries({ queryKey: queryKeys.sponsors });
    },
  });
}

export function useRemoveSponsorship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, end_date }: { id: string; end_date?: string }) => {
      const response = await api.delete(`/sponsorships/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sponsorships });
      queryClient.invalidateQueries({ queryKey: queryKeys.children });
      queryClient.invalidateQueries({ queryKey: queryKeys.sponsors });
    },
  });
}

// ============ Reports Hooks ============
export function useReports(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.reports, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<ProgressReport>>(`/reports${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: queryKeys.report(id),
    queryFn: async () => {
      const response = await api.get<ProgressReport>(`/reports/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: !!id,
  });
}

export function useMyReports(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.myReports, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<ProgressReport>>(`/reports/my-reports${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProgressReport> & { media?: any[] }) => {
      const response = await api.post<ProgressReport>('/reports', data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProgressReport> & { media?: any[] } }) => {
      const response = await api.put<ProgressReport>(`/reports/${id}`, data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.report(id) });
    },
  });
}

export function usePublishReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notify_sponsors = true }: { id: string; notify_sponsors?: boolean }) => {
      const response = await api.post<ProgressReport>(`/reports/${id}/publish`, { notify_sponsors });
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.report(id) });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/reports/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.trash });
    },
  });
}

// ============ Newsletters Hooks ============
export function useNewsletters(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.newsletters, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<Newsletter>>(`/newsletters${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useNewsletter(id: string) {
  return useQuery({
    queryKey: queryKeys.newsletter(id),
    queryFn: async () => {
      const response = await api.get<Newsletter>(`/newsletters/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: !!id,
  });
}

export function useCreateNewsletter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Newsletter>) => {
      const response = await api.post<Newsletter>('/newsletters', data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.newsletters });
    },
  });
}

export function useDeleteNewsletter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/newsletters/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.newsletters });
      queryClient.invalidateQueries({ queryKey: queryKeys.trash });
    },
  });
}

// ============ Events Hooks ============
export function useEvents(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.events, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<SchoolEvent>>(`/events${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: async () => {
      const response = await api.get<SchoolEvent>(`/events/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: !!id,
  });
}

export function useUpcomingEvents(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.upcomingEvents, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<SchoolEvent>>(`/events/upcoming${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SchoolEvent> & { media?: any[] }) => {
      const response = await api.post<SchoolEvent>('/events', data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SchoolEvent> & { media?: any[] } }) => {
      const response = await api.put<SchoolEvent>(`/events/${id}`, data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(id) });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/events/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.trash });
    },
  });
}

// ============ Invitations Hooks ============
export function useInvitations(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.invitations, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<SponsorInvitation>>(`/invitations${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useSendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; personal_message?: string }) => {
      const response = await api.post<{ invitation: SponsorInvitation }>('/invitations/send', data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations });
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/invitations/${id}/resend`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/invitations/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations });
    },
  });
}

// ============ Registrations Hooks ============
export function usePendingRegistrations(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.pendingRegistrations, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<PendingRegistration>>(`/registrations${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useApproveRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/registrations/${id}/approve`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingRegistrations });
      queryClient.invalidateQueries({ queryKey: queryKeys.sponsors });
    },
  });
}

export function useRejectRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await api.post(`/registrations/${id}/reject`, { reason });
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingRegistrations });
    },
  });
}

// ============ Notifications Hooks ============
import type { Notification } from '@/types';

export function useNotificationsQuery(params?: Record<string, any>, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: [...queryKeys.notifications, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<Notification> & { unread_count: number }>(`/notifications${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    refetchInterval: options?.refetchInterval,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/notifications/${id}/read`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/mark-all-read');
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/notifications/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

// ============ Audit Logs Hooks ============
export function useAuditLogs(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.auditLogs, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<any>>(`/audit${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useAuditStats(days: number = 30) {
  return useQuery({
    queryKey: ['audit-stats', days],
    queryFn: async () => {
      const response = await api.get<any>(`/audit/stats?days=${days}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

// ============ Trash Hooks ============
export function useTrash(entityType?: string) {
  return useQuery({
    queryKey: [...queryKeys.trash, entityType],
    queryFn: async () => {
      const queryString = entityType ? `?entity_type=${entityType}` : '';
      const response = await api.get<any>(`/trash${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useRestoreItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entityType, id }: { entityType: string; id: string }) => {
      const response = await api.post(`/trash/${entityType}/${id}/restore`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trash });
      queryClient.invalidateQueries({ queryKey: queryKeys.children });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.newsletters });
    },
  });
}

export function usePermanentlyDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entityType, id }: { entityType: string; id: string }) => {
      const response = await api.delete(`/trash/${entityType}/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trash });
    },
  });
}

// ============ Upload Hook ============
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, type = 'image', folder }: { file: File; type?: 'image' | 'document' | 'video'; folder?: string }) => {
      const response = await api.uploadFile(`/upload/${type}`, file, folder ? { folder } : undefined);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

// ============ Payments Hooks ============
import type { Payment } from '@/types';

export interface PaymentStats {
  totalCollected: number;
  thisMonthCollected: number;
  pendingAmount: number;
  pendingCount: number;
  overdueAmount: number;
  overdueCount: number;
  collectionTrend: { month: string; amount: number }[];
  statusBreakdown: { status: string; count: number }[];
}

export function usePayments(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...queryKeys.payments, params],
    queryFn: async () => {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await api.get<PaginatedResponse<Payment & { sponsor_name: string; child_name: string }>>(`/payments${queryString}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: queryKeys.payment(id),
    queryFn: async () => {
      const response = await api.get<Payment>(`/payments/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: !!id,
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: queryKeys.paymentStats,
    queryFn: async () => {
      const response = await api.get<PaymentStats>('/payments/stats');
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Payment>) => {
      const response = await api.post<Payment>('/payments', data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentStats });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Payment> }) => {
      const response = await api.put<Payment>(`/payments/${id}`, data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.payment(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentStats });
    },
  });
}

export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { payment_method: string; payment_date?: string; reference_number?: string; notes?: string } }) => {
      const response = await api.put<Payment>(`/payments/${id}/mark-paid`, data);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.payment(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentStats });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/payments/${id}`);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentStats });
    },
  });
}

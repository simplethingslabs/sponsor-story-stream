// Toggle a feature to `true` once it's debugged and ready to launch.
export const FEATURE_FLAGS = {
  // Launched — retained as reference, not wired to any gating check.
  childrenManagement: true,
  progressReports: true,
  sponsorsManagement: true,
  teachersManagement: true,
  sponsorPortal: true,
  teacherPortal: true,

  // Deferred — gated in routes/nav until debugged.
  financialDashboard: false,
  paymentManagement: false,
  sponsorPayments: false,
  auditLogs: false,
  trash: false,
  notificationCenter: false,
  newsletters: false,
  events: false,
  inviteFriend: false,
  classroomMoments: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { FEATURE_FLAGS, type FeatureFlag } from "@/config/featureFlags";

// Public Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RegistrationPending from "./pages/RegistrationPending";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ChildrenList from "./pages/admin/ChildrenList";
import AddChild from "./pages/admin/AddChild";
import EditChild from "./pages/admin/EditChild";
import ChildDetail from "./pages/admin/ChildDetail";
import ReportsList from "./pages/admin/ReportsList";
import CreateReport from "./pages/admin/CreateReport";
import EditReport from "./pages/admin/EditReport";
import NewslettersList from "./pages/admin/NewslettersList";
import AddNewsletter from "./pages/admin/AddNewsletter";
import EventsList from "./pages/admin/EventsList";
import AddEvent from "./pages/admin/AddEvent";
import SponsorsList from "./pages/admin/SponsorsList";
import SponsorDetail from "./pages/admin/SponsorDetail";
import ManageSponsorships from "./pages/admin/ManageSponsorships";
import PendingApprovals from "./pages/admin/PendingApprovals";
import InviteSponsor from "./pages/admin/InviteSponsor";
import AuditLogs from "./pages/admin/AuditLogs";
import TeachersList from "./pages/admin/TeachersList";
import AddTeacher from "./pages/admin/AddTeacher";
import AddSponsor from "./pages/admin/AddSponsor";
import Trash from "./pages/admin/Trash";
import ReportReview from "./pages/admin/ReportReview";
import FinancialDashboard from "./pages/admin/FinancialDashboard";
import PaymentManagement from "./pages/admin/PaymentManagement";
import NotificationCenter from "./pages/admin/NotificationCenter";

// Settings Pages
import NotificationSettings from "./pages/settings/NotificationSettings";

// Sponsor Pages
import SponsorHome from "./pages/sponsor/SponsorHome";
import SponsorChildrenList from "./pages/sponsor/SponsorChildrenList";
import ChildProgress from "./pages/sponsor/ChildProgress";
import ReportDetail from "./pages/sponsor/ReportDetail";
import SponsorNewsletters from "./pages/sponsor/SponsorNewsletters";
import SponsorEvents from "./pages/sponsor/SponsorEvents";
import InviteFriend from "./pages/sponsor/InviteFriend";
import SponsorPayments from "./pages/sponsor/Payments";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import AttendanceMarking from "./pages/teacher/AttendanceMarking";
import ClassroomMoments from "./pages/teacher/ClassroomMoments";
import TeacherReports from "./pages/teacher/TeacherReports";

const queryClient = new QueryClient();

function FeatureRoute({ flag, children }: { flag: FeatureFlag; children: React.ReactNode }) {
  if (!FEATURE_FLAGS[flag]) {
    return <NotFound />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <NotificationProvider>
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/registration-pending" element={<RegistrationPending />} />
              </Route>

              {/* Admin/Teacher routes */}
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/children" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><ChildrenList /></ProtectedRoute>} />
              <Route path="/dashboard/children/new" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><AddChild /></ProtectedRoute>} />
              <Route path="/dashboard/children/:id" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><ChildDetail /></ProtectedRoute>} />
              <Route path="/dashboard/children/:id/edit" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><EditChild /></ProtectedRoute>} />
              <Route path="/dashboard/reports" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><ReportsList /></ProtectedRoute>} />
              <Route path="/dashboard/reports/review" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><ReportReview /></ProtectedRoute>} />
              <Route path="/dashboard/reports/new" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><CreateReport /></ProtectedRoute>} />
              <Route path="/dashboard/reports/:id" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><ReportDetail /></ProtectedRoute>} />
              <Route path="/dashboard/reports/:id/edit" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><EditReport /></ProtectedRoute>} />
              <Route path="/dashboard/newsletters" element={<FeatureRoute flag="newsletters"><ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><NewslettersList /></ProtectedRoute></FeatureRoute>} />
              <Route path="/dashboard/newsletters/new" element={<FeatureRoute flag="newsletters"><ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><AddNewsletter /></ProtectedRoute></FeatureRoute>} />
              <Route path="/dashboard/events" element={<FeatureRoute flag="events"><ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><EventsList /></ProtectedRoute></FeatureRoute>} />
              <Route path="/dashboard/events/new" element={<FeatureRoute flag="events"><ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><AddEvent /></ProtectedRoute></FeatureRoute>} />
              <Route path="/dashboard/sponsors" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><SponsorsList /></ProtectedRoute>} />
              <Route path="/dashboard/sponsors/new" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><AddSponsor /></ProtectedRoute>} />
              <Route path="/dashboard/sponsors/invite" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><InviteSponsor /></ProtectedRoute>} />
              <Route path="/dashboard/sponsors/pending" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><PendingApprovals /></ProtectedRoute>} />
              <Route path="/dashboard/sponsors/:id" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><SponsorDetail /></ProtectedRoute>} />
              <Route path="/dashboard/sponsors/:id/manage" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><ManageSponsorships /></ProtectedRoute>} />
              <Route path="/dashboard/teachers" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><TeachersList /></ProtectedRoute>} />
              <Route path="/dashboard/teachers/new" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><AddTeacher /></ProtectedRoute>} />
              <Route path="/dashboard/audit-logs" element={<FeatureRoute flag="auditLogs"><ProtectedRoute allowedRoles={['super_admin', 'admin']}><AuditLogs /></ProtectedRoute></FeatureRoute>} />
              <Route path="/dashboard/trash" element={<FeatureRoute flag="trash"><ProtectedRoute allowedRoles={['super_admin', 'admin']}><Trash /></ProtectedRoute></FeatureRoute>} />
              <Route path="/dashboard/financials" element={<FeatureRoute flag="financialDashboard"><ProtectedRoute allowedRoles={['super_admin', 'admin']}><FinancialDashboard /></ProtectedRoute></FeatureRoute>} />
              <Route path="/dashboard/payments" element={<FeatureRoute flag="paymentManagement"><ProtectedRoute allowedRoles={['super_admin', 'admin']}><PaymentManagement /></ProtectedRoute></FeatureRoute>} />
              <Route path="/dashboard/notifications" element={<FeatureRoute flag="notificationCenter"><ProtectedRoute allowedRoles={['super_admin', 'admin']}><NotificationCenter /></ProtectedRoute></FeatureRoute>} />

              {/* Settings routes (all authenticated users) */}
              <Route path="/settings/notifications" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'sponsor']}><NotificationSettings /></ProtectedRoute>} />

              {/* Sponsor routes */}
              <Route path="/sponsor" element={<ProtectedRoute allowedRoles={['sponsor']}><SponsorHome /></ProtectedRoute>} />
              <Route path="/sponsor/children" element={<ProtectedRoute allowedRoles={['sponsor']}><SponsorChildrenList /></ProtectedRoute>} />
              <Route path="/sponsor/children/:childId" element={<ProtectedRoute allowedRoles={['sponsor']}><ChildProgress /></ProtectedRoute>} />
              <Route path="/sponsor/reports/:reportId" element={<ProtectedRoute allowedRoles={['sponsor']}><ReportDetail /></ProtectedRoute>} />
              <Route path="/sponsor/newsletters" element={<FeatureRoute flag="newsletters"><ProtectedRoute allowedRoles={['sponsor']}><SponsorNewsletters /></ProtectedRoute></FeatureRoute>} />
              <Route path="/sponsor/events" element={<FeatureRoute flag="events"><ProtectedRoute allowedRoles={['sponsor']}><SponsorEvents /></ProtectedRoute></FeatureRoute>} />
              <Route path="/sponsor/invite" element={<FeatureRoute flag="inviteFriend"><ProtectedRoute allowedRoles={['sponsor']}><InviteFriend /></ProtectedRoute></FeatureRoute>} />
              <Route path="/sponsor/payments" element={<FeatureRoute flag="sponsorPayments"><ProtectedRoute allowedRoles={['sponsor']}><SponsorPayments /></ProtectedRoute></FeatureRoute>} />

              {/* Teacher routes */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><TeacherStudents /></ProtectedRoute>} />
              <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><AttendanceMarking /></ProtectedRoute>} />
              <Route path="/teacher/moments" element={<FeatureRoute flag="classroomMoments"><ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><ClassroomMoments /></ProtectedRoute></FeatureRoute>} />
              <Route path="/teacher/reports" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><TeacherReports /></ProtectedRoute>} />
              <Route path="/teacher/reports/new" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><CreateReport /></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationProvider>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

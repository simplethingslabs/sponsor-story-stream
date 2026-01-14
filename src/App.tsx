import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthLayout } from "@/components/layouts/AuthLayout";

// Public Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import RegistrationPending from "./pages/RegistrationPending";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ChildrenList from "./pages/admin/ChildrenList";
import AddChild from "./pages/admin/AddChild";
import EditChild from "./pages/admin/EditChild";
import ReportsList from "./pages/admin/ReportsList";
import CreateReport from "./pages/admin/CreateReport";
import EditReport from "./pages/admin/EditReport";
import NewslettersList from "./pages/admin/NewslettersList";
import AddNewsletter from "./pages/admin/AddNewsletter";
import EventsList from "./pages/admin/EventsList";
import AddEvent from "./pages/admin/AddEvent";
import SponsorsList from "./pages/admin/SponsorsList";

// Sponsor Pages
import SponsorHome from "./pages/sponsor/SponsorHome";
import SponsorChildrenList from "./pages/sponsor/SponsorChildrenList";
import ChildProgress from "./pages/sponsor/ChildProgress";
import ReportDetail from "./pages/sponsor/ReportDetail";
import SponsorNewsletters from "./pages/sponsor/SponsorNewsletters";
import SponsorEvents from "./pages/sponsor/SponsorEvents";
import InviteFriend from "./pages/sponsor/InviteFriend";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/registration-pending" element={<RegistrationPending />} />
              </Route>

              {/* Admin/Teacher routes */}
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/children" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><ChildrenList /></ProtectedRoute>} />
              <Route path="/dashboard/children/new" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><AddChild /></ProtectedRoute>} />
              <Route path="/dashboard/children/:id/edit" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><EditChild /></ProtectedRoute>} />
              <Route path="/dashboard/reports" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><ReportsList /></ProtectedRoute>} />
              <Route path="/dashboard/reports/new" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><CreateReport /></ProtectedRoute>} />
              <Route path="/dashboard/reports/:id/edit" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><EditReport /></ProtectedRoute>} />
              <Route path="/dashboard/newsletters" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><NewslettersList /></ProtectedRoute>} />
              <Route path="/dashboard/newsletters/new" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><AddNewsletter /></ProtectedRoute>} />
              <Route path="/dashboard/events" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><EventsList /></ProtectedRoute>} />
              <Route path="/dashboard/events/new" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}><AddEvent /></ProtectedRoute>} />
              <Route path="/dashboard/sponsors" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><SponsorsList /></ProtectedRoute>} />

              {/* Sponsor routes */}
              <Route path="/sponsor" element={<ProtectedRoute allowedRoles={['sponsor']}><SponsorHome /></ProtectedRoute>} />
              <Route path="/sponsor/children" element={<ProtectedRoute allowedRoles={['sponsor']}><SponsorChildrenList /></ProtectedRoute>} />
              <Route path="/sponsor/children/:childId" element={<ProtectedRoute allowedRoles={['sponsor']}><ChildProgress /></ProtectedRoute>} />
              <Route path="/sponsor/reports/:reportId" element={<ProtectedRoute allowedRoles={['sponsor']}><ReportDetail /></ProtectedRoute>} />
              <Route path="/sponsor/newsletters" element={<ProtectedRoute allowedRoles={['sponsor']}><SponsorNewsletters /></ProtectedRoute>} />
              <Route path="/sponsor/events" element={<ProtectedRoute allowedRoles={['sponsor']}><SponsorEvents /></ProtectedRoute>} />
              <Route path="/sponsor/invite" element={<ProtectedRoute allowedRoles={['sponsor']}><InviteFriend /></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loader } from "./components/Loader";
import { ScrollToTop } from "./components/ScrollToTop";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SignupPage = lazy(() => import("./pages/auth/SignupPage"));
const VerifyAccountPage = lazy(() => import("./pages/auth/VerifyAccountPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const UserDashboard = lazy(() => import("./pages/dashboard/UserDashboard"));
const DashboardRouter = lazy(() => import("./pages/dashboard/DashboardRouter"));
const InsurerDashboard = lazy(() => import("./pages/dashboard/InsurerDashboard"));
const PlatformOpsDashboard = lazy(() => import("./pages/dashboard/PlatformOpsDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const HowToUsePage = lazy(() => import("./pages/HowToUsePage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminUserDetailPage = lazy(() => import("./pages/admin/AdminUserDetailPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const AdminModerationPage = lazy(() => import("./pages/admin/AdminModerationPage"));
const PoliciesPage = lazy(() => import("./pages/dashboard/PoliciesPage"));
const WithdrawalPage = lazy(() => import("./pages/dashboard/WithdrawalPage"));
const AdminWithdrawalsPage = lazy(() => import("./pages/dashboard/AdminWithdrawalsPage"));

export default function App() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-ink"><Loader label="Loading TrustShield AI..." /></div>}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-account" element={<VerifyAccountPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/how-to-use" element={<HowToUsePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/docs" element={<HowToUsePage />} />
        <Route path="/help-center" element={<HelpCenterPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/worker"
          element={
            <ProtectedRoute accountTypes={["WORKER"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/insurer"
          element={
            <ProtectedRoute accountTypes={["INSURER"]}>
              <InsurerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/platform"
          element={
            <ProtectedRoute accountTypes={["PLATFORM"]}>
              <PlatformOpsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/policies"
          element={
            <ProtectedRoute accountTypes={["WORKER"]}>
              <PoliciesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/withdrawal"
          element={
            <ProtectedRoute accountTypes={["WORKER"]}>
              <WithdrawalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <ProtectedRoute adminOnly>
              <AdminWithdrawalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/moderation"
          element={
            <ProtectedRoute adminOnly>
              <AdminModerationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:userId"
          element={
            <ProtectedRoute adminOnly>
              <AdminUserDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

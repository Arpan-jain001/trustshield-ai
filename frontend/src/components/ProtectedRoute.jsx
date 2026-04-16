import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const accountTypeHome = {
  WORKER: "/dashboard/worker",
  INSURER: "/dashboard/insurer",
  PLATFORM: "/dashboard/platform"
};

export function ProtectedRoute({ children, adminOnly = false, accountTypes = [] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  if (!adminOnly && accountTypes.length && !accountTypes.includes(user.accountType)) {
    return <Navigate to={accountTypeHome[user.accountType] || "/dashboard"} replace />;
  }
  return children;
}

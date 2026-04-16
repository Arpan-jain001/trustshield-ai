import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  if (user.accountType === "INSURER") {
    return <Navigate to="/dashboard/insurer" replace />;
  }

  if (user.accountType === "PLATFORM") {
    return <Navigate to="/dashboard/platform" replace />;
  }

  return <Navigate to="/dashboard/worker" replace />;
}

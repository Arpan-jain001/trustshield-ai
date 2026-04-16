import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, BookOpenText, LifeBuoy, Home, LogOut, Menu, MessageSquareHeart, Settings, Shield, ShieldCheck, Sparkles, Users, Workflow, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { frontendEnv } from "../config/env";
import { api } from "../api/client";

export function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const copy = {
    home: "Home",
    dashboard: "Dashboard",
    notifications: "Notifications",
    docs: "Docs",
    howItWorks: "How It Works",
    help: "Help Center",
    feedback: "Feedback",
    settings: "Settings",
    demo: "Demo",
    login: "Login",
    signup: "Get Protected",
    logout: "Logout",
    support: "Contact support",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    platformTagline: "Trust-aware insurance operations"
  };

  const isProtectedSurface =
    Boolean(user) &&
    (location.pathname.startsWith("/dashboard") ||
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/notifications") ||
      location.pathname.startsWith("/settings") ||
      location.pathname.startsWith("/profile"));

  const dashboardTarget = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  const protectedSurfaceLabel =
    user?.role === "ADMIN"
      ? "Protected Admin Surface"
      : user?.accountType === "INSURER"
        ? "Protected Provider Surface"
        : user?.accountType === "PLATFORM"
          ? "Protected Ops Surface"
          : "Protected Worker Surface";

  const guestLinks = [
    { label: copy.demo, to: "/demo", icon: Workflow },
    { label: copy.howItWorks, to: "/how-it-works", icon: Workflow },
    { label: copy.docs, to: "/docs", icon: BookOpenText },
    { label: copy.help, to: "/help-center", icon: LifeBuoy },
    { label: copy.feedback, to: "/feedback", icon: MessageSquareHeart }
  ];

  const protectedLinks = [
    { label: copy.dashboard, to: dashboardTarget, icon: Users },
    { label: copy.notifications, to: "/notifications", icon: Bell, count: notificationCount },
    { label: copy.feedback, to: "/feedback", icon: MessageSquareHeart },
    { label: copy.settings, to: "/settings", icon: Settings }
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;

    async function loadNotificationCount() {
      if (!user || !token) {
        if (active) setNotificationCount(0);
        return;
      }

      try {
        if (user.role === "ADMIN") {
          const data = await api("/admin/users", { token });
          if (!active) return;
          setNotificationCount(data.notifications?.length || 0);
          return;
        }

        if (user.status !== "ACTIVE") {
          if (active) setNotificationCount(0);
          return;
        }

        const data = await api("/user/notifications", { token });
        if (!active) return;
        setNotificationCount(data.notifications?.length || 0);
      } catch {
        if (active) setNotificationCount(0);
      }
    }

    loadNotificationCount();
    return () => {
      active = false;
    };
  }, [user, token, location.pathname]);

  const avatarContent = useMemo(() => {
    if (user?.avatarUrl) {
      return <img src={user.avatarUrl} alt="profile avatar" className="h-full w-full object-cover" />;
    }
    return <span className="text-sm font-bold text-cyan">{(user?.name || "U").slice(0, 1).toUpperCase()}</span>;
  }, [user?.avatarUrl, user?.name]);

  const mobileLinks = user
    ? protectedLinks
    : [
        ...guestLinks,
        { label: copy.login, to: "/login", icon: ShieldCheck },
        { label: copy.signup, to: "/signup", icon: Sparkles, emphasis: true }
      ];

  return (
    <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      {user ? (
        <div className="ui-panel flex flex-col gap-3 rounded-[28px] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3 text-sm text-white/65">
            <LifeBuoy size={16} className="text-cyan" />
            {copy.support}: {frontendEnv.supportEmail}
          </div>
          <div className="w-fit rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/65">
            {protectedSurfaceLabel}
          </div>
        </div>
      ) : null}

      <div className="ui-panel flex items-center justify-between gap-4 rounded-[28px] px-4 py-4 sm:px-5">
        <Link to="/" className="flex min-w-0 items-center gap-3 text-white">
          <div className="rounded-2xl bg-cyan/20 p-3">
            <Shield className="text-cyan" size={20} />
          </div>
          <div className="min-w-0">
            <div className="truncate font-space text-base font-bold sm:text-lg">TrustShield AI</div>
            <div className="truncate text-[11px] text-white/60 sm:text-xs">{copy.platformTagline}</div>
          </div>
        </Link>

        <button
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/6 p-3 text-white transition hover:border-cyan/20 lg:hidden"
          type="button"
          aria-label={mobileMenuOpen ? copy.closeMenu : copy.openMenu}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((value) => !value)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="hidden items-center gap-2 text-sm xl:flex">
          {user ? (
            isProtectedSurface ? (
              <>
                {protectedLinks.map((item) => (
                  <Link
                    key={item.to}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${
                      location.pathname === item.to ? "border-cyan/30 bg-cyan/10 text-cyan" : "border-white/10 text-white/80 hover:border-cyan/20"
                    }`}
                    to={item.to}
                  >
                    <item.icon size={16} />
                    {item.label}
                    {typeof item.count === "number" ? (
                      <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-xs font-semibold text-cyan">{item.count}</span>
                    ) : null}
                  </Link>
                ))}
                <Link
                  className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border transition ${
                    location.pathname === "/profile" || location.pathname === "/settings" ? "border-cyan/30 bg-cyan/10" : "border-white/10 bg-white/5 hover:border-cyan/20"
                  }`}
                  to="/profile"
                  aria-label="Open profile"
                  title="Open profile"
                >
                  {avatarContent}
                </Link>
                <button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-ink" onClick={() => setShowLogoutConfirm(true)}>
                  <LogOut size={16} />
                  {copy.logout}
                </button>
              </>
            ) : (
              <>
                <Link className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${location.pathname === dashboardTarget ? "border-cyan/30 bg-cyan/10 text-cyan" : "border-white/10 text-white/80 hover:border-cyan/20"}`} to={dashboardTarget}>
                  <Users size={16} />
                  Dashboard
                </Link>
                <Link className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${location.pathname === "/notifications" ? "border-cyan/30 bg-cyan/10 text-cyan" : "border-white/10 text-white/80 hover:border-cyan/20"}`} to="/notifications">
                  <Bell size={16} />
                  Notifications
                  <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-xs font-semibold text-cyan">{notificationCount}</span>
                </Link>
                <Link className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${location.pathname === "/feedback" ? "border-cyan/30 bg-cyan/10 text-cyan" : "border-white/10 text-white/80 hover:border-cyan/20"}`} to="/feedback">
                  <MessageSquareHeart size={16} />
                  Feedback
                </Link>
                <Link className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition ${location.pathname === "/settings" ? "border-cyan/30 bg-cyan/10 text-cyan" : "border-white/10 text-white/80 hover:border-cyan/20"}`} to="/settings">
                  <Settings size={16} />
                  Settings
                </Link>
                <Link className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition hover:border-cyan/20" to="/profile" aria-label="Open profile" title="Open profile">
                  {avatarContent}
                </Link>
                <button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-ink" onClick={() => setShowLogoutConfirm(true)}>
                  <LogOut size={16} />
                  {copy.logout}
                </button>
              </>
            )
          ) : (
            <>
              {guestLinks.map((item) => (
                <Link key={item.to} className="rounded-full border border-white/10 px-4 py-2 text-white/80 transition hover:border-cyan/20" to={item.to}>
                  {item.label}
                </Link>
              ))}
              <Link className="rounded-full border border-white/10 px-4 py-2 text-white/80" to="/login">
                {copy.login}
              </Link>
              <Link className="flex items-center gap-2 rounded-full bg-cyan px-4 py-2 font-semibold text-ink" to="/signup">
                <Sparkles size={16} />
                {copy.signup}
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="ui-panel rounded-[28px] p-4 lg:hidden">
          {user && isProtectedSurface ? (
            <Link className="mb-3 flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white/85 transition hover:border-cyan/20" to="/profile">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">{avatarContent}</div>
              <div>
                <p className="font-semibold">{user?.name || "Profile"}</p>
                <p className="text-xs text-white/55">Open profile</p>
              </div>
            </Link>
          ) : null}
          <div className="grid gap-2">
            {mobileLinks.map((item) => (
              <Link
                key={item.to}
                className={`inline-flex items-center justify-between rounded-[20px] border px-4 py-3 text-sm font-medium transition ${
                  item.emphasis
                    ? "border-cyan/30 bg-cyan text-ink"
                    : location.pathname === item.to
                      ? "border-cyan/30 bg-cyan/10 text-cyan"
                      : "border-white/10 bg-white/5 text-white/80 hover:border-cyan/20"
                }`}
                to={item.to}
              >
                <span className="inline-flex items-center gap-3">
                  <item.icon size={17} />
                  {item.label}
                </span>
                {typeof item.count === "number" ? <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-xs font-semibold text-cyan">{item.count}</span> : null}
              </Link>
            ))}
            {user ? (
              <button
                className="inline-flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-white/80 transition hover:border-cyan/20"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
              >
                <LogOut size={17} />
                {copy.logout}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Are you sure you want to logout?"
        description="Your protected session will be closed and you will return to the public TrustShield AI surface."
        confirmLabel="Yes, logout"
        cancelLabel="Stay here"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          navigate("/");
        }}
      />
    </nav>
  );
}

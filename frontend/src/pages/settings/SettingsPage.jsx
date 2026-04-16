import { useEffect, useState } from "react";
import { Eye, EyeOff, RefreshCcw } from "lucide-react";
import { AppShell } from "../../layouts/AppShell";
import { GlassCard } from "../../components/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Loader } from "../../components/Loader";
import { frontendEnv } from "../../config/env";

export default function SettingsPage() {
  const { token, user, setUser } = useAuth();
  const [settings, setSettings] = useState({
    notifications: { email: true, sms: false },
    theme: "SYSTEM"
  });
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    location: "",
    address: "",
    mobileNumber: "",
    avatarUrl: "",
    workType: "OTHER",
    customWorkType: "",
    hourlyRate: 120,
    secondaryEmail: ""
  });
  const [secondaryOtp, setSecondaryOtp] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [showPassword, setShowPassword] = useState({ current: false, next: false });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const themeOptions = [
    { value: "SYSTEM", label: "Default", description: "Original TrustShield theme", preview: "from-[#143250] via-[#0d2135] to-[#112f49]" },
    { value: "LIGHT", label: "Light", description: "Clean bright control surface", preview: "from-[#f8fcff] via-[#e9f4ff] to-[#f4faff]" },
    { value: "DARK", label: "Dark", description: "Deep navy command mode", preview: "from-[#071521] via-[#10253b] to-[#173652]" },
    { value: "NIGHT", label: "Night", description: "Midnight sky with shooting stars", preview: "from-[#020611] via-[#071225] to-[#0a1830]" }
  ];

  async function loadSettings() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api("/user/settings", { token });
      setSettings(data.settings);
      setProfileForm({
        name: data.profile?.name || "",
        email: data.profile?.email || "",
        location: data.profile?.location || "",
        address: data.profile?.address || "",
        mobileNumber: data.profile?.mobileNumber || "",
        avatarUrl: data.profile?.avatarUrl || "",
        workType: data.profile?.workType || "OTHER",
        customWorkType: data.profile?.customWorkType || "",
        hourlyRate: data.profile?.hourlyRate || 120,
        secondaryEmail: data.profile?.secondaryEmail?.email || ""
      });
      setUser((current) => (current ? { ...current, ...data.profile, settings: data.settings } : current));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, [token]);

  async function saveSettings() {
    setError("");
    setMessage("");
    try {
      const data = await api("/user/settings", {
        method: "PUT",
        token,
        body: settings
      });
      setSettings(data.settings);
      setUser((current) => (current ? { ...current, settings: data.settings } : current));
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveProfile() {
    setError("");
    setMessage("");
    if (profileForm.workType === "OTHER" && !profileForm.customWorkType.trim()) {
      setError("Enter your work category");
      return;
    }
    try {
      const data = await api("/user/profile", {
        method: "PUT",
        token,
        body: profileForm
      });
      setUser((current) => (current ? { ...current, ...data.user } : current));
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestSecondaryOtp() {
    setError("");
    setMessage("");
    try {
      const data = await api("/user/secondary-email/request-otp", {
        method: "POST",
        token,
        body: { secondaryEmail: profileForm.secondaryEmail }
      });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  async function verifySecondaryOtp() {
    setError("");
    setMessage("");
    try {
      const data = await api("/user/secondary-email/verify-otp", {
        method: "POST",
        token,
        body: { otp: secondaryOtp }
      });
      setUser((current) => (current ? { ...current, secondaryEmail: data.secondaryEmail } : current));
      setMessage(data.message);
      setSecondaryOtp("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function changePassword() {
    setError("");
    setMessage("");
    try {
      const data = await api("/user/change-password", {
        method: "POST",
        token,
        body: passwordForm
      });
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan">Protected Settings</p>
            <h1 className="mt-3 font-space text-4xl font-bold">{user?.role === "ADMIN" ? "Admin settings hub" : "User settings hub"}</h1>
            <p className="mt-3 max-w-3xl text-white/68">
              View full profile details, update editable fields, verify a secondary email, manage notifications, and control password security.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30" onClick={loadSettings}>
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Refresh settings
          </button>
        </div>

        {(message || error) && (
          <div className={`mb-6 rounded-3xl border px-5 py-4 ${message ? "border-mint/30 bg-mint/10 text-mint" : "border-coral/30 bg-coral/10 text-coral"}`}>
            {message || error}
          </div>
        )}

        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <GlassCard>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-white/10">
                  {profileForm.avatarUrl ? (
                    <img src={profileForm.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-cyan">
                      {(profileForm.name || "U").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Profile overview</h2>
                  <p className="mt-1 text-white/60">Status: {user?.status || "-"} {user?.statusReason ? `| Reason: ${user.statusReason}` : ""}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input className="field" placeholder="Full name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                <input className="field opacity-70" placeholder="Primary email" value={profileForm.email} disabled />
                <input className="field" placeholder="City / location" value={profileForm.location} onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })} />
                <input className="field" placeholder="Mobile number" value={profileForm.mobileNumber} onChange={(e) => setProfileForm({ ...profileForm, mobileNumber: e.target.value })} />
                <input className="field md:col-span-2" placeholder="Address" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                <input className="field md:col-span-2" placeholder="Avatar image URL" value={profileForm.avatarUrl} onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })} />
                <select
                  className="field"
                  value={profileForm.workType}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, workType: e.target.value, customWorkType: e.target.value === "OTHER" ? profileForm.customWorkType : "" })
                  }
                >
                  <option value="ZOMATO">Zomato</option>
                  <option value="SWIGGY">Swiggy</option>
                  <option value="ZEPTO">Zepto</option>
                  <option value="AMAZON">Amazon</option>
                  <option value="OTHER">Other</option>
                </select>
                {profileForm.workType === "OTHER" ? (
                  <input
                    className="field"
                    placeholder="Custom work category"
                    value={profileForm.customWorkType}
                    onChange={(e) => setProfileForm({ ...profileForm, customWorkType: e.target.value })}
                  />
                ) : null}
                <input className="field" type="number" placeholder="Hourly rate" value={profileForm.hourlyRate} onChange={(e) => setProfileForm({ ...profileForm, hourlyRate: e.target.value })} />
              </div>

              <button className="mt-6 rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.02]" onClick={saveProfile}>
                Save profile
              </button>
            </GlassCard>

            <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
              <h2 className="text-2xl font-bold">Secondary email verification</h2>
              <p className="mt-2 text-white/60">Add a secondary email and verify it with an OTP before it becomes active.</p>
              <div className="mt-6 space-y-4">
                <input className="field" placeholder="Secondary email" value={profileForm.secondaryEmail} onChange={(e) => setProfileForm({ ...profileForm, secondaryEmail: e.target.value })} />
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30" onClick={requestSecondaryOtp}>
                    Send OTP
                  </button>
                  <div className="rounded-full bg-white/10 px-4 py-3 text-sm text-white/70">
                    {user?.secondaryEmail?.verified ? "Verified" : "Not verified"}
                  </div>
                </div>
                <input className="field" placeholder="Enter OTP" value={secondaryOtp} onChange={(e) => setSecondaryOtp(e.target.value)} />
                <button className="rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.02]" onClick={verifySecondaryOtp}>
                  Verify OTP
                </button>
              </div>
            </GlassCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <GlassCard className="bg-[linear-gradient(145deg,rgba(118,228,247,0.08),rgba(255,255,255,0.04))]">
              <h2 className="text-2xl font-bold">Notification preferences</h2>
              <div className="mt-6 space-y-4">
                <label className="flex items-center justify-between rounded-3xl bg-white/5 p-4">
                  <div>
                    <p className="font-semibold">Email notifications</p>
                    <p className="text-sm text-white/60">Claim status, policy updates, and admin messages.</p>
                  </div>
                  <input type="checkbox" checked={settings.notifications.email} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, email: e.target.checked } })} />
                </label>
                <label className="flex items-center justify-between rounded-3xl bg-white/5 p-4">
                  <div>
                    <p className="font-semibold">SMS notifications</p>
                    <p className="text-sm text-white/60">Mobile alerts for disruptions and important events.</p>
                  </div>
                  <input type="checkbox" checked={settings.notifications.sms} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, sms: e.target.checked } })} />
                </label>
              </div>

              <h2 className="mt-8 text-2xl font-bold">Theme mode</h2>
              <p className="mt-2 text-sm text-white/60">Default keeps the original classic theme that was already on the website.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {themeOptions.map((theme) => (
                  <button
                    key={theme.value}
                    className={`rounded-[26px] border p-4 text-left transition ${
                      settings.theme === theme.value ? "border-cyan/35 bg-cyan/10 text-cyan shadow-[0_0_0_1px_rgba(118,228,247,0.15)]" : "border-white/10 bg-white/5 text-white/75 hover:border-cyan/20"
                    }`}
                    onClick={() => setSettings({ ...settings, theme: theme.value })}
                  >
                    <div className={`h-20 rounded-[18px] bg-gradient-to-br ${theme.preview}`} />
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-bold">{theme.label}</p>
                        <p className="mt-1 text-sm text-white/60">{theme.description}</p>
                      </div>
                      {settings.theme === theme.value ? <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan">Active</span> : null}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8">
                {loading ? <Loader label="Syncing settings..." /> : <button className="rounded-full bg-cyan px-5 py-3 font-semibold text-ink transition hover:scale-[1.02]" onClick={saveSettings}>Save settings</button>}
              </div>
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-bold">Change password</h2>
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <input className="field pr-14" placeholder="Current password" type={showPassword.current ? "text" : "password"} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60" type="button" onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}>
                    {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <input className="field pr-14" placeholder="New password" type={showPassword.next ? "text" : "password"} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60" type="button" onClick={() => setShowPassword({ ...showPassword, next: !showPassword.next })}>
                    {showPassword.next ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-sm text-white/60">Use at least 8 characters. This action is protected and updates your account in the database.</p>
                <button className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-cyan/30" onClick={changePassword}>
                  Update password
                </button>
              </div>
              <div className="mt-8 rounded-3xl bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan">Support</p>
                <p className="mt-3 text-white/75">For protected account issues, verification concerns, or operational support contact {frontendEnv.supportEmail}.</p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

import { ShieldAlert } from "lucide-react";
import { GlassCard } from "./GlassCard";

const statusContent = {
  PENDING_VERIFICATION: {
    title: "Admin review is still pending",
    tone: "text-sand",
    detail: "Your email is verified, but full dashboard access will unlock only after admin approval."
  },
  SUSPENDED: {
    title: "Account suspended by admin",
    tone: "text-coral",
    detail: "Your account has been suspended. Core product actions are disabled until the status changes."
  },
  BANNED: {
    title: "Account banned by admin",
    tone: "text-coral",
    detail: "Your account has been banned. Dashboard actions remain locked."
  },
  REJECTED: {
    title: "Account rejected by admin",
    tone: "text-coral",
    detail: "Your account was not approved during admin review."
  },
  ACTIVE: {
    title: "Account approved",
    tone: "text-mint",
    detail: "Full dashboard access is unlocked."
  }
};

export function AccountStatusGate({ user, label = "Account status", supportText }) {
  const currentStatus = user?.status || "PENDING_VERIFICATION";
  const content = statusContent[currentStatus] || statusContent.PENDING_VERIFICATION;
  const detail = user?.statusReason || content.detail;

  if (currentStatus === "ACTIVE") {
    return null;
  }

  return (
    <GlassCard className="mb-6 bg-[linear-gradient(145deg,rgba(255,215,168,0.08),rgba(255,148,120,0.08),rgba(255,255,255,0.04))]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <ShieldAlert size={18} className={content.tone} />
            <span className="text-sm uppercase tracking-[0.24em] text-white/70">{label}</span>
          </div>
          <h2 className="mt-5 text-3xl font-bold">{content.title}</h2>
          <p className="mt-4 text-lg leading-8 text-white/72">{detail}</p>
          <p className="mt-4 text-sm text-white/55">
            {supportText || "Dashboard status cards remain visible, but advanced workflows stay locked until your account becomes active."}
          </p>
        </div>
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-black/20 p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan">Verification tracker</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="font-semibold">Email verification</p>
              <p className="mt-2 text-sm text-mint">{user?.emailVerificationVerified ? "Completed" : "Pending"}</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="font-semibold">Admin review</p>
              <p className={`mt-2 text-sm ${content.tone}`}>{currentStatus}</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="font-semibold">Update path</p>
              <p className="mt-2 text-sm text-white/65">You will receive an email whenever admin approves, suspends, rejects, or bans the account.</p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

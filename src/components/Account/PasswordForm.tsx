"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function PasswordForm() {
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch("/api/auth/password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update password");
      toast.success("Password updated successfully");
      event.currentTarget.reset();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update password"); } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="mt-6 grid gap-4"><input name="currentPassword" type="password" autoComplete="current-password" placeholder="Current password" required className="rounded-lg border border-slate-300 px-4 py-3" /><input name="newPassword" type="password" autoComplete="new-password" minLength={8} placeholder="New password" required className="rounded-lg border border-slate-300 px-4 py-3" /><button disabled={saving} className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Updating..." : "Update password"}</button></form>;
}

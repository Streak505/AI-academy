"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";

type UserRow = { _id: string; name: string; email: string; role: string; status: string; forcePasswordChange: boolean; createdAt: string };
type NewAccount = { name: string; email: string; role: "ADMIN" | "INSTRUCTOR" };

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<NewAccount>({ name: "", email: "", role: "INSTRUCTOR" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search.trim()) query.set("search", search.trim());
    if (role) query.set("role", role);
    if (status) query.set("status", status);
    try {
      const response = await fetch(`/api/admin/users?${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to load accounts.");
      setUsers(payload.data.users);
      setPages(payload.data.pagination.pages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load accounts.");
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => { void load(); }, [load]);

  async function updateUser(id: string, endpoint: "role" | "status", body: Record<string, string>) {
    setNotice("");
    const response = await fetch(`/api/admin/users/${id}/${endpoint}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      setError(payload.message || "Unable to update account.");
      return;
    }
    setNotice("Account updated.");
    await load();
  }

  async function resetPassword(user: UserRow) {
    const response = await fetch(`/api/admin/users/${user._id}/reset-password`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      setError(payload.message || "Unable to reset password.");
      return;
    }
    setNotice(`Temporary password for ${user.email}: ${payload.data.temporaryPassword}. Share it securely; the account must change it on next sign-in.`);
  }

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to create account.");
      setNotice(`Account created for ${payload.data.email}. Temporary password: ${payload.data.temporaryPassword}`);
      setForm({ name: "", email: "", role: "INSTRUCTOR" });
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create account.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="p-4 sm:p-6"><div className="mx-auto max-w-7xl">
      <header className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Access management</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Staff & user accounts</h1><p className="mt-1 text-sm text-slate-600">Create staff accounts, change roles, disable access, or force a password reset.</p></header>
      {notice ? <p className="mb-4 break-all rounded-lg bg-teal-50 p-3 text-sm text-teal-900" role="status">{notice}</p> : null}
      <form onSubmit={createAccount} className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium">Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
        <label className="text-sm font-medium">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
        <label className="text-sm font-medium">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as NewAccount["role"] })} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="INSTRUCTOR">Instructor</option><option value="ADMIN">Admin</option></select></label>
        <button disabled={creating} className="self-end rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{creating ? "Creating..." : "Create staff account"}</button>
      </form>
      <section className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <label className="text-sm font-medium">Search<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Name or email" className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
        <label className="text-sm font-medium">Role<select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">All roles</option>{["ADMIN", "INSTRUCTOR", "STUDENT", "PARENT"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-medium">Status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">All statuses</option>{["ACTIVE", "SUSPENDED", "DISABLED", "PENDING_VERIFICATION"].map((item) => <option key={item}>{item}</option>)}</select></label>
      </section>
      {loading ? <LoadingState label="Loading user accounts" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : users.length === 0 ? <EmptyState title="No accounts found" message="Try another search or create a staff account." /> : <>
        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="min-w-[850px] w-full text-left text-sm"><thead className="bg-slate-50"><tr>{["Name", "Email", "Role", "Status", "Password", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user._id}><td className="px-4 py-3 font-semibold">{user.name}</td><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3"><select aria-label={`Role for ${user.email}`} value={user.role} onChange={(event) => void updateUser(user._id, "role", { role: event.target.value })} className="rounded border px-2 py-1">{["ADMIN", "INSTRUCTOR", "STUDENT", "PARENT"].map((item) => <option key={item}>{item}</option>)}</select></td><td className="px-4 py-3">{user.status}</td><td className="px-4 py-3">{user.forcePasswordChange ? "Reset required" : "Current"}</td><td className="px-4 py-3"><div className="flex gap-3"><button type="button" onClick={() => void updateUser(user._id, "status", { status: user.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })} className="font-semibold text-rose-700 underline">{user.status === "ACTIVE" ? "Disable" : "Enable"}</button><button type="button" onClick={() => void resetPassword(user)} className="font-semibold text-teal-800 underline">Force reset</button></div></td></tr>)}</tbody></table></section>
        <div className="mt-4 flex items-center justify-between text-sm"><span>Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Previous</button><button disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Next</button></div></div>
      </>}
    </div></main>
  );
}

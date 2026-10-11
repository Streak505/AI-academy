"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/Common/DataState";

type Message = { _id: string; name: string; email: string; subject: string; message: string; status: string; createdAt: string };

export default function ContactInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) query.set("status", status);
    try {
      const response = await fetch(`/api/admin/contact?${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to load messages.");
      setMessages(payload.data.messages);
      setPages(payload.data.pagination.pages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  }, [page, status]);
  useEffect(() => { void load(); }, [load]);

  async function toggleStatus(item: Message) {
    const response = await fetch("/api/admin/contact", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item._id, status: item.status === "Unread" ? "Read" : "Unread" }) });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      setError(payload.message || "Unable to update inbox status.");
      return;
    }
    await load();
  }

  return <main className="p-4 sm:p-6"><div className="mx-auto max-w-7xl">
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Contact</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Messages inbox</h1></div><label className="text-sm font-medium">Status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="mt-1 block rounded-lg border px-3 py-2"><option value="">All messages</option><option>Unread</option><option>Read</option><option>Resolved</option></select></label></header>
    {loading ? <LoadingState label="Loading contact messages" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : messages.length === 0 ? <EmptyState title="Inbox is empty" message="Contact form messages will appear here." /> : <>
      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-50"><tr>{["Name", "Email", "Subject", "Status", "Received", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{messages.map((message) => <tr key={message._id}><td className="px-4 py-3"><Link href={`/admin/contact/${message._id}`} className="font-semibold text-teal-800 underline">{message.name}</Link><p className="max-w-xs truncate text-xs text-slate-500">{message.message}</p></td><td className="px-4 py-3">{message.email}</td><td className="px-4 py-3">{message.subject}</td><td className="px-4 py-3">{message.status}</td><td className="px-4 py-3">{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" }).format(new Date(message.createdAt))}</td><td className="px-4 py-3"><div className="flex gap-3"><a className="font-semibold text-teal-800 underline" href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}>Reply</a><button type="button" onClick={() => void toggleStatus(message)} className="font-semibold text-slate-700 underline">{message.status === "Unread" ? "Mark read" : "Mark unread"}</button></div></td></tr>)}</tbody></table></section>
      <div className="mt-4 flex items-center justify-between text-sm"><span>Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Previous</button><button disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40">Next</button></div></div>
    </>}
  </div></main>;
}

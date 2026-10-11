"use client";

import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/Common/DataState";

type Settings = {
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  mapsEmbedUrl: string;
  mapsLink: string;
  timing: { days: string; from: string; to: string };
  socials: { facebook: string; instagram: string; youtube: string };
};

export default function AcademySettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/academy-settings", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to load academy settings.");
      setSettings(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load academy settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/academy-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to save academy settings.");
      setSettings(payload.data);
      setMessage("Settings saved. Public contact details refresh within seconds.");
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="p-4 sm:p-6"><LoadingState label="Loading academy settings" /></main>;
  if (error) return <main className="p-4 sm:p-6"><ErrorState message={error} onRetry={() => void load()} /></main>;
  if (!settings) return null;

  const update = (field: keyof Settings, value: string) => setSettings({ ...settings, [field]: value });
  return <main className="p-4 sm:p-6"><div className="mx-auto max-w-4xl">
    <header className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Website content</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Academy settings</h1><p className="mt-1 text-sm text-slate-600">Saved settings override the fallback values in src/config/academy.ts.</p></header>
    {message ? <p className="mb-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900" role="status">{message}</p> : null}
    <form onSubmit={save} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      <label className="text-sm font-medium">Phone<input value={settings.phone} onChange={(event) => update("phone", event.target.value)} maxLength={60} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-medium">WhatsApp number (international digits)<input required value={settings.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} placeholder="923001234567" className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-medium">Email<input required type="email" value={settings.email} onChange={(event) => update("email", event.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-medium sm:col-span-2">Address<textarea value={settings.address} onChange={(event) => update("address", event.target.value)} maxLength={500} rows={2} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-medium">Academy days<input value={settings.timing.days} onChange={(event) => setSettings({ ...settings, timing: { ...settings.timing, days: event.target.value } })} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">From<input value={settings.timing.from} onChange={(event) => setSettings({ ...settings, timing: { ...settings.timing, from: event.target.value } })} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label><label className="text-sm font-medium">To<input value={settings.timing.to} onChange={(event) => setSettings({ ...settings, timing: { ...settings.timing, to: event.target.value } })} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label></div>
      <label className="text-sm font-medium">Map embed URL<input type="url" value={settings.mapsEmbedUrl} onChange={(event) => update("mapsEmbedUrl", event.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <label className="text-sm font-medium">Map link<input type="url" value={settings.mapsLink} onChange={(event) => update("mapsLink", event.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      {(["facebook", "instagram", "youtube"] as const).map((network) => <label key={network} className="text-sm font-medium capitalize">{network} URL<input type="url" value={settings.socials[network]} onChange={(event) => setSettings({ ...settings, socials: { ...settings.socials, [network]: event.target.value } })} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>)}
      <div className="flex justify-end sm:col-span-2"><button disabled={saving} className="rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save settings"}</button></div>
    </form>
  </div></main>;
}

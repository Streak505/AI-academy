import { academy } from "@/config/academy";

export function AcademyMap() {
  const embedConfigured = academy.mapsEmbedUrl.startsWith("https://");
  const linkConfigured = academy.mapsLink.startsWith("https://");
  return (
    <div>
      {embedConfigured ? <iframe title={`Map to ${academy.name}`} src={academy.mapsEmbedUrl} width="100%" height="320" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="rounded-2xl border-0" /> : <div className="flex h-80 items-center justify-center rounded-2xl bg-slate-100 text-center text-sm text-slate-600">Map details will be available soon.</div>}
      {linkConfigured ? <a href={academy.mapsLink} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-primary underline">Open in Google Maps</a> : null}
    </div>
  );
}

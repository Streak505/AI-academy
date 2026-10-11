import type { AcademySettingsValue } from "@/lib/academy-settings";

export function AcademyMap({ settings }: { settings: Pick<AcademySettingsValue, "name" | "mapsEmbedUrl" | "mapsLink"> }) {
  const embedConfigured = settings.mapsEmbedUrl.startsWith("https://");
  const linkConfigured = settings.mapsLink.startsWith("https://");
  return (
    <div>
      {embedConfigured ? <iframe title={`Map to ${settings.name}`} src={settings.mapsEmbedUrl} width="100%" height="320" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="rounded-2xl border-0" /> : null}
      {linkConfigured ? <a href={settings.mapsLink} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-primary underline">Open in Google Maps</a> : null}
    </div>
  );
}

import type { AcademySettingsValue } from "@/lib/academy-settings";

export function AcademyMap({ settings }: { settings: Pick<AcademySettingsValue, "name" | "mapsEmbedUrl" | "mapsLink"> & Partial<Pick<AcademySettingsValue, "address">> }) {
  const embedConfigured = settings.mapsEmbedUrl.startsWith("https://");
  const directionsUrl = settings.mapsLink.startsWith("https://")
    ? settings.mapsLink
    : settings.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
      : "";
  return (
    <div>
      {embedConfigured ? <iframe title={`Map to ${settings.name}`} src={settings.mapsEmbedUrl} width="100%" height="320" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="rounded-2xl border-0" /> : null}
      {directionsUrl ? <a href={directionsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-primary underline">Get directions</a> : null}
    </div>
  );
}

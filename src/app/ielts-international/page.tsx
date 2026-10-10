import { permanentRedirect } from "next/navigation";

// DEPRECATED: legacy route retained as a redirect to the canonical international page.
export default function LegacyInternationalRoute() {
  permanentRedirect("/international");
}

import { ImageResponse } from "next/og";
import { academy } from "@/config/academy";

export const alt = `${academy.name} — ${academy.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "linear-gradient(135deg, #0f172a, #134e4a)", color: "white" }}>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#fbbf24" }}>SHAHZAIB ROYAL ACADEMY</div>
      <div style={{ display: "flex", marginTop: 36, fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>{academy.name}</div>
      <div style={{ display: "flex", marginTop: 28, fontSize: 34, color: "#d1d5db" }}>{academy.tagline}</div>
      {academy.locality && !academy.locality.startsWith("TODO_REPLACE") ? <div style={{ display: "flex", marginTop: 26, fontSize: 24, color: "#fbbf24" }}>{academy.locality}</div> : null}
    </div>,
    size,
  );
}

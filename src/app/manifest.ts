import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Academy",
    short_name: "AI Academy",
    description: "Practical AI and technology education for ambitious learners.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    icons: [{ src: "/images/logo/AI-logo.png", sizes: "192x192", type: "image/png" }, { src: "/images/logo/AI-logo.png", sizes: "512x512", type: "image/png" }],
  };
}

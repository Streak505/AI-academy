import type { MetadataRoute } from "next";
import { academy } from "@/config/academy";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: academy.name,
    short_name: academy.shortName,
    description: academy.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0B1F4B",
    icons: [{ src: "/images/logo/logo-placeholder.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

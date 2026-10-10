import AboutPage from "@/components/About/AboutPage";
import { academy } from "@/config/academy";
import { publicMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = publicMetadata(`About ${academy.name}`, academy.vision, "/about");

export default function AboutRoute() {
  return <AboutPage />;
}

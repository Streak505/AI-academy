import AboutPage from "@/components/About/AboutPage";
import { getAcademySettings } from "@/lib/academy-settings";
import { publicMetadata } from "@/lib/seo";

export const revalidate = 300;
export async function generateMetadata() {
  const academy = await getAcademySettings();
  return publicMetadata(`About ${academy.name}`, academy.vision, "/about");
}

export default function AboutRoute() {
  return <AboutPage />;
}

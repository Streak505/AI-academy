import ContactPage from "@/components/Contact/ContactPage";
import { publicMetadata } from "@/lib/seo";
import { getAcademySettings } from "@/lib/academy-settings";

export const revalidate = 300;
export async function generateMetadata() {
  const academy = await getAcademySettings();
  return publicMetadata(`Contact ${academy.name}`, `Contact ${academy.name} for program guidance, admissions questions, and learner support.`, "/contact");
}

export default async function ContactRoute() {
  const settings = await getAcademySettings();
  return <ContactPage settings={settings} />;
}

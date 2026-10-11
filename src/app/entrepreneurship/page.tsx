import { ProgramGroupContent } from "@/components/Academy/ProgramsPageContent";
import { getPublicPrograms } from "@/lib/public-data";
import { publicMetadata } from "@/lib/seo";
import { getAcademySettings } from "@/lib/academy-settings";

export const revalidate = 300;
export async function generateMetadata() {
  const academy = await getAcademySettings();
  return publicMetadata("Entrepreneurship", `Build business, leadership, and financial skills${academy.locality ? ` in ${academy.locality}` : ""} with ${academy.name}.`, "/entrepreneurship");
}
export default async function EntrepreneurshipPage() {
  const result = await getPublicPrograms("entrepreneurship");
  return <ProgramGroupContent result={result} title="Entrepreneurship Training" intro="Build practical business, digital, financial, and leadership skills through guided modules and real-world projects." />;
}

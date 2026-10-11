import { ProgramGroupContent } from "@/components/Academy/ProgramsPageContent";
import { getPublicPrograms } from "@/lib/public-data";
import { publicMetadata } from "@/lib/seo";
import { getAcademySettings } from "@/lib/academy-settings";

export const revalidate = 300;
export async function generateMetadata() {
  const academy = await getAcademySettings();
  return publicMetadata("Professional Courses", `Explore professional development programs${academy.locality ? ` in ${academy.locality}` : ""} at ${academy.name}.`, "/professional-courses");
}
export default async function ProfessionalProgramsPage() {
  const result = await getPublicPrograms("professional");
  return <ProgramGroupContent result={result} title="Professional Courses" intro="Develop communication, design, computing, and modern workplace skills for your next opportunity." />;
}

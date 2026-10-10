import { ProgramGroupContent } from "@/components/Academy/ProgramsPageContent";
import { getPublicPrograms } from "@/lib/public-data";
import { publicMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = publicMetadata("Professional Courses", "Explore professional development programs at Shahzaib Royal Academy.", "/professional-courses");
export default async function ProfessionalProgramsPage() {
  const result = await getPublicPrograms("professional");
  return <ProgramGroupContent result={result} title="Professional Courses" intro="Develop communication, design, computing, and modern workplace skills for your next opportunity." />;
}

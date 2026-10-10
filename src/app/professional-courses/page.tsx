import { ProgramDirectory } from "@/components/Academy/PublicCollections";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Professional Courses", "Explore professional development programs at Shahzaib Royal Academy.", "/professional-courses");
export default function ProfessionalProgramsPage() {
  return <ProgramDirectory group="professional" />;
}

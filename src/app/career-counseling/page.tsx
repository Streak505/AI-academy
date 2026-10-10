import { ProgramDirectory } from "@/components/Academy/PublicCollections";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Career Counseling", "Career assessment and education guidance for students and families.", "/career-counseling");
export default function CareerCounselingPage() {
  return <ProgramDirectory group="career" />;
}

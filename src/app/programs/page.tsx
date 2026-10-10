import { ProgramDirectory } from "@/components/Academy/PublicCollections";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Programs", "Explore academic coaching, career counseling, entrepreneurship, international test preparation, and professional development.", "/programs");

export default function ProgramsRoute() {
  return <ProgramDirectory />;
}

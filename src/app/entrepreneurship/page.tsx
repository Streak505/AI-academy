import { ProgramDirectory } from "@/components/Academy/PublicCollections";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Entrepreneurship", "Build business, leadership, and financial skills at Shahzaib Royal Academy.", "/entrepreneurship");
export default function EntrepreneurshipPage() {
  return <ProgramDirectory group="entrepreneurship" />;
}

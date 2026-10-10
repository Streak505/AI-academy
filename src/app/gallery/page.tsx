import { GalleryDirectory } from "@/components/Academy/PublicCollections";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Gallery", "See events, workshops, achievements, and community initiatives at Shahzaib Royal Academy.", "/gallery");
export default function GalleryPage() {
  return <GalleryDirectory />;
}

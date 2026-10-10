import { DataReadError } from "@/components/Academy/PublicCollections";
import GalleryExplorer from "@/components/Academy/GalleryExplorer";
import { getPublicGallery } from "@/lib/public-data";
import { publicMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = publicMetadata("Gallery", "See events, workshops, achievements, and community initiatives at Shahzaib Royal Academy.", "/gallery");

export default async function GalleryPage() {
  const result = await getPublicGallery();
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 text-slate-900"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Life at SRA</p><h1 className="mt-3 text-4xl font-bold sm:text-5xl">Gallery</h1><p className="mt-4 text-slate-600">Events, workshops, student achievements, and community initiatives.</p><div className="mt-8">{result.success ? <GalleryExplorer items={result.data} /> : <DataReadError label="gallery items" />}</div></div></main>;
}

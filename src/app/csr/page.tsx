import { CsrDirectory } from "@/components/Academy/PublicCollections";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("CSR & Scholarships", "Explore community education initiatives, discounts, and scholarships.", "/csr");
export default function CsrPage() {
  return <CsrDirectory />;
}

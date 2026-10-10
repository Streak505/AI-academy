import ContactPage from "@/components/Contact/ContactPage";
import { publicMetadata } from "@/lib/seo";
import { academy } from "@/config/academy";

export const revalidate = 300;
export const metadata = publicMetadata(`Contact ${academy.name}`, `Contact ${academy.name} for program guidance, admissions questions, and learner support.`, "/contact");

export default function ContactRoute() {
  return <ContactPage />;
}

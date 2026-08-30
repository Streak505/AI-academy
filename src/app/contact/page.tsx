import ContactPage from "@/components/Contact/ContactPage";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Contact AI Academy", "Contact AI Academy for program guidance, admissions questions, and learner support.", "/contact");

export default function ContactRoute() {
  return <ContactPage />;
}

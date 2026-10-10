import AboutPage from "@/components/About/AboutPage";
import { academy } from "@/config/academy";

export const metadata = {
  title: `About Us | ${academy.name}`,
};

export default function AboutRoute() {
  return <AboutPage />;
}

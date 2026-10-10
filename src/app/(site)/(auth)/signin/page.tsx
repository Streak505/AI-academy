import Signin from "@/components/Auth/SignIn";
import { Metadata } from "next";
import { academy } from "@/config/academy";

export const metadata: Metadata = {
  title: `Login | ${academy.name}`,
};

const SigninPage = () => {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[linear-gradient(135deg,#f7fbff_0%,#eef5f2_52%,#fffaf1_100%)] px-4 py-16 sm:px-6 lg:py-24">
      <Signin />
    </main>
  );
};

export default SigninPage;

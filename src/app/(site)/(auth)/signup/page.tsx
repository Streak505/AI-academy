import SignUp from "@/components/Auth/SignUp";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata("Create a Student Account", "Create an AI Academy student account to enroll in practical technology programs.", "/signup");

const SignupPage = () => {
  return (
    <>
      <Breadcrumb pageName="Sign Up Page" />

      <SignUp />
    </>
  );
};

export default SignupPage;

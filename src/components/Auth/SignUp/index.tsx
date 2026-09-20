"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SocialSignUp from "../SocialSignUp";
import Logo from "@/components/Layout/Header/Logo";
import { useState } from "react";
import Loader from "@/components/Common/Loader";
const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    const data = new FormData(e.currentTarget);
    const value = Object.fromEntries(data.entries());
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Registration failed");
      toast.success("Successfully registered");
      router.push("/signin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <Logo />
      </div>

      <SocialSignUp />

      <div className="relative my-8 flex items-center justify-center">
        <span className="h-px w-full bg-slate-200" />
        <span className="absolute bg-white px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Or
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input
            type="text"
            placeholder="Name"
            name="name"
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            name="email"
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            name="password"
            required
            minLength={8}
            pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
            title="Use at least 8 characters, including at least one letter and one number."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-base font-semibold text-white transition duration-300 ease-in-out hover:bg-secondary"
        >
          Sign Up {loading && <Loader />}
        </button>
      </form>

      <p className="mt-6 text-sm leading-6 text-slate-600">
        By creating an account you agree to use AI Academy for learning and educational communication.
      </p>

      <p className="mt-4 text-base text-slate-600">
        Already have an account?
        <Link href="/signin" className="pl-2 font-medium text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default SignUp;

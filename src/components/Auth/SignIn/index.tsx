"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import SocialSignIn from "../SocialSignIn";
import Loader from "@/components/Common/Loader";
import { academy } from "@/config/academy";

const Signin = () => {
  const router = useRouter();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    website: "",
    checkboxToggle: false,
  });
  const [loading, setLoading] = useState(false);

  const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Login failed");
      toast.success("Login successful");
      router.push(data.redirect || "/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[430px] rounded-2xl border border-slate-200/80 bg-white px-6 py-8 shadow-xl shadow-slate-900/5 sm:px-10 sm:py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{academy.name}</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to continue your learning journey.</p>
      </div>

      <SocialSignIn />

      <span className="relative my-8 block text-center before:content-[''] before:absolute before:h-px before:w-[40%] before:bg-slate-300 before:left-0 before:top-3 after:content-[''] after:absolute after:h-px after:w-[40%] after:bg-slate-300 after:top-3 after:right-0">
        <span className="relative z-10 inline-block px-3 text-base text-slate-700 bg-white">
          OR
        </span>
      </span>

      <form onSubmit={loginUser} className="text-left">
        <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="signin-website">Leave this field empty</label>
          <input
            id="signin-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={loginData.website}
            onChange={(e) => setLoginData({ ...loginData, website: e.target.value })}
          />
        </div>
        <div className="mb-[22px]">
          <label htmlFor="signin-email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
          <input
            id="signin-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
            className="w-full rounded-md border border-slate-300 bg-white px-5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="mb-[22px]">
          <label htmlFor="signin-password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
          <input
            id="signin-password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
            className="w-full rounded-md border border-slate-300 bg-white px-5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="mb-7">
          <button
            type="submit"
            className="w-full rounded-lg border border-primary bg-primary py-3 text-sm font-semibold text-white transition duration-300 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            Sign In {loading && <Loader />}
          </button>
        </div>
      </form>

      <p className="text-slate-600 text-base">
        Not a member yet?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
};

export default Signin;
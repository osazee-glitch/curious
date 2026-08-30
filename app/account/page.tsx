"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function AccountPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (!email || !password || !confirmPassword) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      const { data, error } = response;

      if (error) {
        const details = [error.code, error.status].filter(Boolean).join("; ");
        const message = error.message || "Supabase Auth rejected the signup request.";
        setErrorMessage(
          `${message}${details ? ` (${details})` : ""}`,
        );
        setIsSubmitting(false);
        return;
      }

      if (!data.user) {
        setErrorMessage("Supabase Auth returned no user for this signup request.");
        setIsSubmitting(false);
        return;
      }

      if (data.session) {
        router.push("/profile");
        return;
      }

      router.push(`/confirm-email?email=${encodeURIComponent(email)}`);
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      setErrorMessage(details || "The signup request failed before Supabase returned a response.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6">
        <header className="flex h-20 items-center justify-start">
          <a href="/" className="flex items-center" aria-label="Go to home">
            <img
              src="/ithinklylogo.jpeg"
              alt="ithinkly"
              className="h-24 w-auto object-contain sm:h-40"
            />
          </a>
        </header>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
                Account
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Create account
              </h1>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm text-zinc-600">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm text-zinc-600">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm text-zinc-600">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 block w-full rounded-full bg-zinc-900 px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-zinc-700"
              >
                Create account
              </button>
              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500">
              Already have an account? <a href="/signin" className="font-medium text-zinc-900 underline-offset-4 hover:underline">Sign in</a>
            </div>

            <div className="mt-5 text-center">
              <a href="/account" className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline">
                Forgot password?
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { loadCreatorProfile, loadUserProfile, saveUserProfile } from "../lib/supabase-data";

const ACCOUNT_KEY = "ithinkly_account";

const defaultAccount = {
  username: "",
  age: 0,
  country: "United Kingdom",
  email: "",
  deliveryAddress: "",
  postcode: "",
  isCreator: false,
  creatorProfile: null,
};

export default function SignInPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      setErrorMessage(error?.message || "Unable to sign in.");
      setIsSubmitting(false);
      return;
    }

    if (typeof window !== "undefined") {
      // Supabase is the source of truth for profile and shop status — never
      // trust localStorage to decide whether this account owns a shop.
      const dbProfile = await loadUserProfile(data.user.id);
      const shop = await loadCreatorProfile(data.user.id);
      const isCreator = Boolean(dbProfile?.isCreator) || Boolean(shop);

      const accountKey = `${ACCOUNT_KEY}_${data.user.id}`;
      const nextAccount = {
        ...defaultAccount,
        ...(dbProfile || {}),
        accountId: data.user.id,
        isCreator,
        email: data.user.email || dbProfile?.email || "",
      };

      window.localStorage.setItem(accountKey, JSON.stringify(nextAccount));

      // Keep is_creator in sync in case it drifted from the shop's existence.
      await saveUserProfile(data.user.id, { ...nextAccount, isCreator });

      router.push(isCreator ? "/creator-profile" : "/profile");
      return;
    }

    router.push("/profile");
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
                Sign in
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 block w-full rounded-full bg-zinc-900 px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-zinc-700"
              >
                Sign in
              </button>
              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500">
              Don&apos;t have an account? <a href="/account" className="font-medium text-zinc-900 underline-offset-4 hover:underline">Create account</a>
            </div>

            <div className="mt-5 text-center">
              <a href="/forgot-password" className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline">
                Forgot password?
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

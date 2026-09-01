"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ACCOUNT_KEY = "ithinkly_account";
import { supabase } from "../lib/supabase";
import { getOrCreateUserProfile, loadUserProfile } from "../lib/supabase-data";

const defaultAccount = {
  profilePicture: "",
  username: "",
  age: 0,
  country: "United Kingdom",
  email: "",
  deliveryAddress: "",
  postcode: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState(defaultAccount);

  useEffect(() => {
    if (typeof window === "undefined") return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/market");
        return;
      }

      const userId = data.session.user.id;
      const accountKey = `${ACCOUNT_KEY}_${userId}`;
      
      // Try loading from Supabase first (source of truth)
      const supabaseProfile = await loadUserProfile(userId);
      
      if (supabaseProfile) {
        // Use Supabase data
        const accountForUser = {
          ...defaultAccount,
          ...supabaseProfile,
          accountId: userId,
        };
        window.localStorage.setItem(accountKey, JSON.stringify(accountForUser));
        setAccount(accountForUser);
        setReady(true);
        return;
      }

      // Fall back to localStorage if Supabase doesn't have the profile yet
      const accountKey2 = `${ACCOUNT_KEY}_${userId}`;
      const storedAccount = window.localStorage.getItem(accountKey2);
      const legacyAccount = window.localStorage.getItem(ACCOUNT_KEY);
      const parsedLegacyAccount = legacyAccount ? JSON.parse(legacyAccount) : null;
      const nextAccount = storedAccount
        ? { ...defaultAccount, ...JSON.parse(storedAccount) }
        : parsedLegacyAccount?.accountId === userId
          ? { ...defaultAccount, ...parsedLegacyAccount }
          : { ...defaultAccount, accountId: userId };

      const accountForUser = { ...nextAccount, accountId: userId };
      window.localStorage.setItem(accountKey, JSON.stringify(accountForUser));
      setAccount(accountForUser);
      setReady(true);
    }).catch(() => {
      router.replace("/market");
    });
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/market");
  };

  if (!ready) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6">
        <header className="flex h-20 items-center justify-between">
          <a href="/" className="flex items-center" aria-label="Go to home">
            <img
              src="/ithinklylogo.jpeg"
              alt="ithinkly"
              className="h-24 w-auto object-contain sm:h-40"
            />
          </a>

          <a
            href="/market"
            aria-label="Go to Creator Market"
            title="Creator Market"
            className="inline-flex items-center justify-center rounded-full border border-zinc-200 p-2.5 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              💡
            </span>
          </a>
        </header>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-2xl rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Profile
              </h1>
            </div>

            <div className="mb-8 flex justify-center">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-2xl font-medium text-zinc-500">
                {account.profilePicture ? (
                  <img src={account.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-100">P</div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-zinc-600">Username</label>
                <div className="w-full py-1 text-base text-zinc-900">
                  {account.username}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600">Age</label>
                <div className="w-full py-1 text-base text-zinc-900">
                  {account.age}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600">Country</label>
                <div className="w-full py-1 text-base text-zinc-900">
                  {account.country}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600">Delivery address</label>
                <div className="w-full py-1 text-base text-zinc-900">
                  {account.deliveryAddress}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600">Postcode</label>
                <div className="w-full py-1 text-base text-zinc-900">
                  {account.postcode}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600">Purchases</label>
                <div className="w-full py-1 text-base text-zinc-900">
                  0
                </div>
              </div>
            </div>

            <div className="mt-8">
              <a
                href="/profile/edit"
                className="block w-full rounded-full bg-zinc-900 px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-zinc-700"
              >
                Edit Profile
              </a>
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline"
              >
                Sign out
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

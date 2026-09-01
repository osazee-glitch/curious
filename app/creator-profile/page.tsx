"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const ACCOUNT_KEY = "ithinkly_account";
const SELLER_PROFILE_KEY = "ithinkly_seller_profile";

const defaultAccount = {
  profilePicture: "",
  username: "",
  age: 0,
  country: "",
  email: "",
  isCreator: false,
};

const defaultSellerSelections = {
  selling: [],
  productType: [],
  powered: [],
  delivery: [],
};

export default function CreatorProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState(defaultAccount);
  const [sellerSelections, setSellerSelections] = useState(defaultSellerSelections);

  useEffect(() => {
    if (typeof window === "undefined") return;

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/market");
        return;
      }

      const accountKey = `${ACCOUNT_KEY}_${data.session.user.id}`;
      const storedAccount = window.localStorage.getItem(accountKey);
      const legacyAccount = window.localStorage.getItem(ACCOUNT_KEY);
      const parsedLegacyAccount = legacyAccount ? JSON.parse(legacyAccount) : null;
      const parsedAccount = storedAccount
        ? { ...defaultAccount, ...JSON.parse(storedAccount) }
        : parsedLegacyAccount?.accountId === data.session.user.id
          ? { ...defaultAccount, ...parsedLegacyAccount }
          : { ...defaultAccount, accountId: data.session.user.id };
      const storedSellerProfile = window.localStorage.getItem(`${SELLER_PROFILE_KEY}_${data.session.user.id}`);
      const parsedSellerProfile = storedSellerProfile
        ? JSON.parse(storedSellerProfile)
        : parsedAccount.creatorProfile || defaultSellerSelections;

      const nextAccount = { ...parsedAccount, accountId: data.session.user.id, isCreator: true };
      window.localStorage.setItem(accountKey, JSON.stringify(nextAccount));
      setAccount(nextAccount);
      setSellerSelections({
        ...defaultSellerSelections,
        ...parsedSellerProfile,
      });
    });
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/market");
  };

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
          <div className="w-full max-w-3xl rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
                Creator profile
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Creator Profile
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
                <div className="w-full py-1 text-base text-zinc-900">{account.username}</div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600">Age</label>
                <div className="w-full py-1 text-base text-zinc-900">{account.age}</div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600">Country</label>
                <div className="w-full py-1 text-base text-zinc-900">{account.country}</div>
              </div>
            </div>

            <div className="my-8 h-px bg-zinc-200" />

            <div className="space-y-8">
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.24em] text-zinc-400">
                  Creator information
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm text-zinc-600">
                      What are you selling?
                    </label>
                    <div className="space-y-2 text-base text-zinc-900">
                      {sellerSelections.selling.map((item) => (
                        <div key={item} className="py-1">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-600">
                      What type of product are you selling?
                    </label>
                    <div className="space-y-2 text-base text-zinc-900">
                      {sellerSelections.productType.map((item) => (
                        <div key={item} className="py-1">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-600">
                      How is your product powered?
                    </label>
                    <div className="space-y-2 text-base text-zinc-900">
                      {sellerSelections.powered.map((item) => (
                        <div key={item} className="py-1">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-600">
                      How will you deliver orders to customers?
                    </label>
                    <div className="space-y-2 text-base text-zinc-900">
                      {sellerSelections.delivery.map((item) => (
                        <div key={item} className="py-1">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.24em] text-zinc-400">
                  Seller information
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block text-sm text-zinc-600">Products</label>
                    <div className="w-full py-1 text-base text-zinc-500">No products listed yet.</div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-zinc-600">Earnings</label>
                      <div className="w-full py-1 text-base text-zinc-900">£0.00</div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-zinc-600">Pending earnings</label>
                      <div className="w-full py-1 text-base text-zinc-900">£0.00</div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-zinc-600">Completed sales</label>
                      <div className="w-full py-1 text-base text-zinc-900">0</div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-zinc-600">Orders</label>
                      <div className="w-full py-1 text-base text-zinc-900">0</div>
                    </div>
                  </div>
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

            <div className="mt-4">
              <a
                href="/listings/new"
                className="block w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.16em] text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                ADD A LISTING
              </a>
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline"
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

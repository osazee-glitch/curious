"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { loadUserProfile, saveUserProfile } from "../../lib/supabase-data";

const ACCOUNT_KEY = "ithinkly_account";

export default function EditProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState({
    accountId: "",
    profilePicture: "",
    username: "",
    age: 0,
    country: "United Kingdom",
    deliveryAddress: "",
    postcode: "",
    email: "",
    isCreator: false,
  });
  const [confirmed, setConfirmed] = useState(false);

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAccount((current) => ({ ...current, profilePicture: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/market");
        return;
      }

      const userId = data.session.user.id;
      const accountKey = `${ACCOUNT_KEY}_${userId}`;
      
      // Try loading from Supabase first
      const supabaseProfile = await loadUserProfile(userId);
      
      if (supabaseProfile) {
        setAccount({ 
          ...supabaseProfile, 
          accountId: userId,
          email: data.session.user.email || supabaseProfile.email 
        });
        setConfirmed(false);
        return;
      }

      // Fall back to localStorage if Supabase doesn't have it yet
      const storedAccount = window.localStorage.getItem(accountKey);
      const legacyAccount = window.localStorage.getItem(ACCOUNT_KEY);
      const parsedLegacyAccount = legacyAccount ? JSON.parse(legacyAccount) : null;
      const nextAccount = storedAccount
        ? {
            username: "",
            age: 0,
            country: "United Kingdom",
            deliveryAddress: "",
            postcode: "",
            email: "",
            isCreator: false,
            ...JSON.parse(storedAccount),
            accountId: userId,
          }
        : parsedLegacyAccount?.accountId === userId
          ? {
            ...parsedLegacyAccount,
            accountId: userId,
          }
          : {
            username: "",
            age: 0,
            country: "United Kingdom",
            deliveryAddress: "",
            postcode: "",
            email: "",
            isCreator: false,
            accountId: userId,
          };

        setAccount({ ...nextAccount, email: data.session.user.email || nextAccount.email });
      setConfirmed(false);
    });
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (typeof window === "undefined") return;

    const form = new FormData(event.currentTarget);
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      router.replace("/market");
      return;
    }

    const email = String(form.get("email") || account.email).trim();
    if (email && email !== (currentUser.email || "")) {
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: "https://ithinkly.com/auth/callback?from=edit" },
      );

      if (error) {
        setConfirmed(false);
        return;
      }

      router.push(`/confirm-email?from=edit&email=${encodeURIComponent(email)}`);
      return;
    }

    const nextAccount = {
      ...account,
      accountId: currentUser.id,
      username: String(form.get("username") || account.username),
      age: Number(form.get("age") || account.age),
      country: String(form.get("country") || account.country || "United Kingdom"),
      deliveryAddress: String(form.get("deliveryAddress") || account.deliveryAddress),
      postcode: String(form.get("postcode") || account.postcode),
      email: currentUser.email || account.email,
      isCreator: Boolean(account.isCreator),
    };

    // Save to both localStorage and Supabase
    window.localStorage.setItem(
      `${ACCOUNT_KEY}_${nextAccount.accountId}`,
      JSON.stringify(nextAccount),
    );
    
    // Also save to Supabase
    await saveUserProfile(nextAccount.accountId, nextAccount);
    
    setAccount(nextAccount);
    router.push(nextAccount.isCreator ? "/creator-profile" : "/profile");
  };

  const handleCancel = () => {
    router.push(account.isCreator ? "/creator-profile" : "/profile");
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
          <div className="w-full max-w-2xl rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
                Profile
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Edit Profile
              </h1>
            </div>

            <div className="mb-8 flex justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-2xl font-medium text-zinc-500">
                {account.profilePicture ? (
                  <img src={account.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  "P"
                )}
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <input type="hidden" name="from" value="edit" />

              <div>
                <label htmlFor="profile-picture" className="mb-2 block text-sm text-zinc-600">
                  Profile picture
                </label>
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-700"
                />
              </div>

              <div>
                <label htmlFor="username" className="mb-2 block text-sm text-zinc-600">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  defaultValue={account.username}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div>
                <label htmlFor="age" className="mb-2 block text-sm text-zinc-600">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  defaultValue={account.age}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div>
                <label htmlFor="country" className="mb-2 block text-sm text-zinc-600">
                  Country
                </label>
                <div className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-3 text-base text-zinc-600">
                  {account.country || "United Kingdom"}
                </div>
                <input type="hidden" name="country" value={account.country || "United Kingdom"} />
              </div>

              <div>
                <label htmlFor="delivery-address" className="mb-2 block text-sm text-zinc-600">
                  Delivery address
                </label>
                <input
                  id="delivery-address"
                  name="deliveryAddress"
                  type="text"
                  defaultValue={account.deliveryAddress}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div>
                <label htmlFor="postcode" className="mb-2 block text-sm text-zinc-600">
                  Postcode
                </label>
                <input
                  id="postcode"
                  name="postcode"
                  type="text"
                  defaultValue={account.postcode}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm text-zinc-600">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={account.email}
                  onChange={(event) => setAccount((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
                {confirmed ? (
                  <p className="mt-2 text-sm text-zinc-600">Email confirmed</p>
                ) : null}
                <div className="mt-3 text-right">
                  <button
                    type="submit"
                    className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline"
                  >
                    Confirm email
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.16em] text-zinc-900 transition hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-zinc-900 px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-zinc-700"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

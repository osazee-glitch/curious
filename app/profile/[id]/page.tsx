"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PublicAccount = {
  accountId: string;
  username: string;
  age: number;
  country: string;
  profilePicture?: string;
};

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState<PublicAccount | null>(null);

  useEffect(() => {
    if (!params.id) return;

    const currentRaw = window.localStorage.getItem("ithinkly_account");
    const current = currentRaw ? JSON.parse(currentRaw) : null;
    if (current?.accountId === params.id) {
      router.replace("/profile");
      return;
    }

    const publicRaw = window.sessionStorage.getItem(`ithinkly_public_account_${params.id}`);
    if (publicRaw) setAccount(JSON.parse(publicRaw));
  }, [params.id, router]);

  if (!account) return null;

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6">
        <header className="flex h-20 items-center justify-between">
          <a href="/" className="flex items-center" aria-label="Go to home">
            <img src="/ithinklylogo.jpeg" alt="ithinkly" className="h-24 w-auto object-contain sm:h-40" />
          </a>
          <a href="/market" className="text-sm text-zinc-500 hover:text-zinc-900">Creator Market</a>
        </header>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-2xl rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Profile</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{account.username}</h1>

            <div className="my-8 flex justify-center">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-2xl font-medium text-zinc-500">
                {account.profilePicture ? <img src={account.profilePicture} alt="Profile" className="h-full w-full object-cover" /> : "P"}
              </div>
            </div>

            <div className="space-y-5">
              <div><label className="mb-2 block text-sm text-zinc-600">Username</label><div className="py-1">{account.username}</div></div>
              <div><label className="mb-2 block text-sm text-zinc-600">Age</label><div className="py-1">{account.age}</div></div>
              <div><label className="mb-2 block text-sm text-zinc-600">Country</label><div className="py-1">{account.country}</div></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

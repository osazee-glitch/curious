"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Account = {
  accountId: string;
  username: string;
  age: number;
  country: string;
  profilePicture?: string;
  creatorProfile?: Record<string, unknown>;
};

type Listing = {
  id: number | string;
  productName?: string;
  productDescription?: string;
  price?: number;
  creatorAccountId?: string;
};

const defaultSelections = {
  selling: [],
  productType: [],
  powered: [],
  delivery: [],
};

export default function PublicCreatorProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [selections, setSelections] = useState(defaultSelections);
  const [products, setProducts] = useState<Listing[]>([]);

  useEffect(() => {
    if (!params.id) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id === params.id) {
        router.replace("/creator-profile");
        return;
      }

      const publicRaw = window.sessionStorage.getItem(`ithinkly_public_account_${params.id}`);
      const publicAccount = publicRaw ? JSON.parse(publicRaw) : null;
      if (!publicAccount) return;

      setAccount(publicAccount);
      setSelections({
        ...defaultSelections,
        ...(publicAccount.creatorProfile || {}),
      });

      const listingsRaw = window.localStorage.getItem("ithinkly_listings");
      const listings = listingsRaw ? JSON.parse(listingsRaw) : [];
      setProducts(
        listings.filter((listing: Listing) => listing.creatorAccountId === params.id),
      );
    });
  }, [params.id, router]);

  if (!account) return null;

  const selectionGroups = [
    ["What are you selling?", selections.selling],
    ["What type of product are you selling?", selections.productType],
    ["How is your product powered?", selections.powered],
    ["How will you deliver orders to customers?", selections.delivery],
  ] as const;

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
          <div className="w-full max-w-3xl rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Creator profile</p>
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

            <div className="my-8 h-px bg-zinc-200" />
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-zinc-400">Creator information</p>
            <div className="space-y-5">
              {selectionGroups.map(([label, values]) => (
                <div key={label}>
                  <label className="mb-2 block text-sm text-zinc-600">{label}</label>
                  <div className="space-y-2">{values.map((value) => <div key={value} className="py-1">{value}</div>)}</div>
                </div>
              ))}
            </div>

            <div className="my-8 h-px bg-zinc-200" />
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-zinc-400">Products</p>
            {products.length === 0 ? <p className="text-sm text-zinc-500">No products listed yet.</p> : (
              <div className="space-y-3">
                {products.map((product) => <a key={product.id} href={`/market/${product.id}`} className="block border-b border-zinc-100 py-3 hover:text-zinc-600"><span>{product.productName || "Untitled product"}</span><span className="float-right">£{product.price || 0}</span></a>)}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

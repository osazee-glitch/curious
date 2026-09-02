"use client";

import { useEffect, useMemo, useState } from "react";
import { loadAllListings, loadCreatorProfile, loadUserProfile, mergeListingsByIdentity } from "../lib/supabase-data";
import { supabase } from "../lib/supabase";

const categories = ["All", "Electronics", "3D Printed", "Inventions"] as const;

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock?: number;
  creator: string;
  creatorProfilePicture?: string;
  category: (typeof categories)[number];
  accent: string;
  code: string;
  media?: Array<{ url: string; type: string; name: string; size: number }>;
  creatorAccountId?: string;
  creatorAccount?: Record<string, unknown>;
};

const products: Product[] = [];

export default function CreatorMarketPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [basket, setBasket] = useState<Record<number, number>>({});
  const [signedIn, setSignedIn] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [postedListings, setPostedListings] = useState<Product[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      supabase.auth.getSession().then(async ({ data }) => {
        setSignedIn(Boolean(data.session));
        // Shop status must come from Supabase, not cached localStorage, so it
        // survives clearing browser data and stays consistent per account.
        if (data.session) {
          const profile = await loadUserProfile(data.session.user.id);
          const shop = await loadCreatorProfile(data.session.user.id);
          setIsCreator(Boolean(profile?.isCreator) || Boolean(shop));
        } else {
          setIsCreator(false);
        }
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));

      const loadCreatorInfo = async (creatorAccountId: string) => {
        if (!creatorAccountId) return null;
        const fromSupabase = await loadUserProfile(creatorAccountId);
        if (fromSupabase) return fromSupabase;
        const creatorRaw = window.localStorage.getItem(`ithinkly_account_${creatorAccountId}`);
        return creatorRaw ? JSON.parse(creatorRaw) : null;
      };

      const loadListings = async () => {
        const listingsRaw = window.localStorage.getItem("ithinkly_listings");
        const legacyListings = listingsRaw ? JSON.parse(listingsRaw) : [];
        const supabaseListings = await loadAllListings();

        const convertedSupabaseListings = await Promise.all(supabaseListings.map(async (listing) => {
          const creatorAccountId = listing.creatorUserId || "";
          const creatorAccount = await loadCreatorInfo(creatorAccountId);

          return {
            id: Number(listing.id) || Date.now(),
            name: listing.productName || "Untitled product",
            description: listing.productDescription || "",
            price: Number(listing.price) || 0,
            stock: Number.isInteger(Number(listing.stock)) && Number(listing.stock) >= 0 ? Number(listing.stock) : undefined,
            creator: creatorAccount?.username || "Unknown creator",
            category: listing.productCategory || "Inventions",
            accent: "bg-zinc-200",
            code: "NEW",
            media: Array.isArray(listing.media) ? listing.media : [],
            creatorAccountId,
            creatorAccount: creatorAccount || undefined,
            creatorProfilePicture: creatorAccount?.profilePicture || "",
          };
        }));

        const convertedLegacyListings = await Promise.all(legacyListings.map(async (listing: any) => {
          const creatorAccountId = listing.creatorAccountId || listing.creatorAccount?.accountId || "";
          const creatorAccount = (await loadCreatorInfo(creatorAccountId)) || listing.creatorAccount;

          return {
            id: Number(listing.id) || Date.now(),
            name: listing.productName || "Untitled product",
            description: listing.productDescription || "",
            price: Number(listing.price) || 0,
            stock: Number.isInteger(Number(listing.stock)) && Number(listing.stock) >= 0 ? Number(listing.stock) : undefined,
            creator: creatorAccount?.username || listing.creatorUsername || "Unknown creator",
            category: listing.productCategory || "Inventions",
            accent: "bg-zinc-200",
            code: "NEW",
            media: Array.isArray(listing.media) ? listing.media : [],
            creatorAccountId,
            creatorAccount: creatorAccount || undefined,
            creatorProfilePicture: creatorAccount?.profilePicture || "",
          };
        }));

        const mergedListings = mergeListingsByIdentity(convertedLegacyListings, convertedSupabaseListings);
        window.localStorage.setItem("ithinkly_listings", JSON.stringify(mergedListings));
        setPostedListings(mergedListings);
      };

      loadListings();
      return () => subscription.unsubscribe();
    }
  }, []);

  const marketProducts = useMemo(() => [...postedListings, ...products], [postedListings]);

  const filteredProducts = useMemo(() => {
    return marketProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesQuery =
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.creator.toLowerCase().includes(query.toLowerCase());

      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory, marketProducts]);

  const basketItems = useMemo(
    () =>
      marketProducts
        .filter((product) => basket[product.id])
        .map((product) => ({ ...product, quantity: basket[product.id] })),
    [basket, marketProducts],
  );

  const itemCount = basketItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = basketItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const addToBasket = (product: Product) => {
    setBasket((current) => ({
      ...current,
      [product.id]: (current[product.id] ?? 0) + 1,
    }));
    setBasketOpen(true);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setBasket((current) => {
      const nextQuantity = (current[productId] ?? 0) + delta;

      if (nextQuantity <= 0) {
        const { [productId]: _removed, ...rest } = current;
        return rest;
      }

      return {
        ...current,
        [productId]: nextQuantity,
      };
    });
  };

  const removeFromBasket = (productId: number) => {
    setBasket((current) => {
      const { [productId]: _removed, ...rest } = current;
      return rest;
    });
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6">
        <header className="flex h-20 items-center justify-between">
          <a href="/" className="flex items-center" aria-label="Go to home">
            <img
              src="/ithinklylogo.jpeg"
              alt="ithinkly"
              className="h-24 w-auto object-contain sm:h-40"
            />
          </a>

          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <button
              type="button"
              aria-label="Open basket"
              title="Basket"
              onClick={() => setBasketOpen((current) => !current)}
              className={[
                "relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                itemCount > 0
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900",
              ].join(" ")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="9" cy="19" r="1.5" />
                <circle cx="17" cy="19" r="1.5" />
                <path d="M3 4h2l2.2 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L19 7H7" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-medium text-white">
                  {itemCount}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </header>

        {menuOpen && (
          <aside className="fixed right-0 top-0 z-20 flex h-full w-72 flex-col border-l border-zinc-200 bg-white p-6 shadow-[0_0_30px_rgba(0,0,0,0.06)]">
            <div className="mb-8 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.24em] text-zinc-400">
                Menu
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="text-xl text-zinc-500 hover:text-zinc-900"
              >
                ×
              </button>
            </div>

            <nav className="flex flex-col gap-2 text-base text-zinc-700">
              <a
                href={signedIn ? (isCreator ? "/creator-profile" : "/profile") : "/account"}
                className="w-full rounded-md px-3 py-2 text-left hover:bg-zinc-100"
              >
                Account
              </a>
              <a href={isCreator ? "/creator-profile" : "/sell"} className="w-full rounded-md px-3 py-2 text-left hover:bg-zinc-100">
                Sell
              </a>
              <button type="button" className="w-full rounded-md px-3 py-2 text-left hover:bg-zinc-100">
                Legal
              </button>
              <button type="button" className="w-full rounded-md px-3 py-2 text-left hover:bg-zinc-100">
                Customer Service
              </button>
            </nav>
          </aside>
        )}

        {basketOpen && (
          <aside className="fixed right-0 top-0 z-30 flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white p-6 shadow-[0_0_30px_rgba(0,0,0,0.08)]">
            <div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Basket</p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Your basket</h2>
              </div>
              <button
                type="button"
                aria-label="Close basket"
                onClick={() => setBasketOpen(false)}
                className="text-xl text-zinc-500 hover:text-zinc-900"
              >
                ×
              </button>
            </div>

            {basketItems.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-zinc-500">
                <p className="text-base">Your basket is empty.</p>
                <p className="mt-2 text-sm text-zinc-400">Add a product to begin.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {basketItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-zinc-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-medium text-zinc-900">{item.name}</p>
                          <p className="mt-1 text-sm text-zinc-500">£{item.price}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromBasket(item.id)}
                          className="text-xs uppercase tracking-[0.14em] text-zinc-400 hover:text-zinc-900"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="flex h-7 w-7 items-center justify-center text-lg text-zinc-600"
                            aria-label={`Decrease quantity for ${item.name}`}
                          >
                            −
                          </button>
                          <span className="min-w-6 text-center text-sm font-medium text-zinc-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="flex h-7 w-7 items-center justify-center text-lg text-zinc-600"
                            aria-label={`Increase quantity for ${item.name}`}
                          >
                            +
                          </button>
                        </div>

                        <span className="text-sm font-medium text-zinc-900">
                          £{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-zinc-200 pt-4">
                  <div className="flex items-center justify-between text-sm text-zinc-500">
                    <span>Subtotal</span>
                    <span className="text-lg font-medium text-zinc-900">£{subtotal}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!signedIn) {
                        window.location.href = "/signin";
                        return;
                      }

                      window.sessionStorage.setItem(
                        "ithinkly_checkout_basket",
                        JSON.stringify(basketItems),
                      );
                      window.location.href = "/checkout";
                    }}
                    className="mt-4 w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
                  >
                    Checkout
                  </button>
                </div>
              </>
            )}
          </aside>
        )}

        <section className="flex flex-1 flex-col pb-16 pt-8">
          <div className="max-w-3xl pb-8">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
              Shop
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              iThinkly Creator Market
            </h1>
            <p className="mt-5 max-w-xl text-base text-zinc-500 sm:text-lg">
              A marketplace for creators and makers.
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-2 border-y border-zinc-200 py-5 sm:flex-row sm:items-center">
            <div className="flex w-full items-center rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500 sm:max-w-[calc(100%-110px)]">
              <span className="mr-3 text-base text-zinc-400">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-zinc-700 outline-none placeholder:text-zinc-400"
                aria-label="Search market products"
              />
            </div>

            <button
              type="button"
              onClick={() => setQuery((current) => current.trim())}
              className="rounded-full bg-zinc-900 px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-white transition hover:bg-zinc-700"
            >
              Search
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center text-zinc-500">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                No products found
              </p>
              <p className="mt-3 text-base">
                Nothing matches this search just yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("a, button, video")) return;
                    window.sessionStorage.setItem(
                      `ithinkly_market_product_${product.id}`,
                      JSON.stringify(product),
                    );
                    if (product.creatorAccountId && product.creatorAccount) {
                      window.sessionStorage.setItem(
                        `ithinkly_public_account_${product.creatorAccountId}`,
                        JSON.stringify(product.creatorAccount),
                      );
                    }
                    window.location.href = `/market/${product.id}`;
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    window.sessionStorage.setItem(
                      `ithinkly_market_product_${product.id}`,
                      JSON.stringify(product),
                    );
                    if (product.creatorAccountId && product.creatorAccount) {
                      window.sessionStorage.setItem(
                        `ithinkly_public_account_${product.creatorAccountId}`,
                        JSON.stringify(product.creatorAccount),
                      );
                    }
                    window.location.href = `/market/${product.id}`;
                  }}
                  role="link"
                  tabIndex={0}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                >
                  <div className={`${product.accent} flex h-56 items-center justify-center overflow-hidden`}>
                    {product.media && product.media.length > 0 ? (
                      product.media[0].type.startsWith("video/") ? (
                        <video
                          src={product.media[0].url}
                          className="h-full w-full object-cover"
                          controls
                          playsInline
                          muted
                        />
                      ) : (
                        <img
                          src={product.media[0].url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      )
                    ) : (
                      <span className="text-3xl font-medium tracking-[0.2em] text-zinc-700">
                        {product.code}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-medium text-zinc-900">{product.name}</h2>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-400">
                          {product.category}
                        </p>
                      </div>
                      <span className="text-base font-medium text-zinc-900">£{product.price}</span>
                    </div>

                    <p className="text-sm leading-6 text-zinc-600">{product.description}</p>

                    {product.stock !== undefined && (
                      <p className="text-sm text-zinc-500">In stock: {product.stock}</p>
                    )}

                    <div className="flex items-center justify-between border-t border-zinc-200 pt-4 text-sm text-zinc-500">
                      <a
                        href={product.creatorAccountId ? `/creator-profile/${product.creatorAccountId}` : "/creator-profile"}
                        onClick={(event) => event.stopPropagation()}
                        className="flex items-center gap-2 hover:text-zinc-900 hover:underline"
                      >
                          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-xs text-zinc-500">
                            {product.creatorProfilePicture ? (
                              <img src={product.creatorProfilePicture} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                              "P"
                            )}
                          </span>
                        by {product.creator}
                      </a>
                      <button
                        type="button"
                        onClick={() => addToBasket(product)}
                        className="rounded-full border border-zinc-900 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-zinc-900 hover:bg-zinc-900 hover:text-white"
                      >
                        Add to basket
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

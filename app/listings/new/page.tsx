"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const ACCOUNT_KEY = "ithinkly_account";

const categoryOptions = [
  "Assistive devices for elderly people",
  "Assistive devices for children",
  "Learning devices for kids",
  "Homeware devices (non-AC powered)",
  "Remote-controlled toy devices",
  "Hardware devices",
  "Home sensors & security devices",
  "Robotics & moving devices",
  "Educational & STEM devices",
  "Desk & workspace devices",
  "Accessibility devices",
  "Personal-use devices",
];

export default function NewListingPage() {
  const [productCategory, setProductCategory] = useState(categoryOptions[0]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("0.00");
  const [productDescription, setProductDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read media file."));
      reader.readAsDataURL(file);
    });

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || []);
    setMediaFiles(nextFiles);
  };

  const handlePostListing = async () => {
    if (typeof window === "undefined") return;

    const storedAccount = window.localStorage.getItem(ACCOUNT_KEY);
    const parsedAccount = storedAccount ? JSON.parse(storedAccount) : null;
    const { data } = await supabase.auth.getUser();
    const accountId = data.user?.id || "";
    const creatorUsername = parsedAccount?.username || "username";

    const media = await Promise.all(
      mediaFiles.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: await fileToDataUrl(file),
      })),
    );

    const listing = {
      id: Date.now(),
      creatorAccountId: accountId,
      creatorUsername,
      creatorAccount: parsedAccount || null,
      productName,
      productCategory,
      price: Number(productPrice) || 0,
      productDescription,
      media,
      createdAt: new Date().toISOString(),
    };

    const storedListings = window.localStorage.getItem("ithinkly_listings");
    const listings = storedListings ? JSON.parse(storedListings) : [];
    listings.push(listing);

    window.localStorage.setItem("ithinkly_listings", JSON.stringify(listings));
    window.location.href = "/market";
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/signin";
    });

    const storedAccount = window.localStorage.getItem(ACCOUNT_KEY);
    if (!storedAccount) return;

    try {
      const parsedAccount = JSON.parse(storedAccount);
      if (!parsedAccount.username) {
        const fallback = { ...parsedAccount, username: "username" };
        window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(fallback));
      }
    } catch {
      // ignore malformed local storage state
    }
  }, []);

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
          <div className="w-full max-w-3xl rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
                Create listing
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                New listing
              </h1>
            </div>

            <form className="space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
              <div>
                <label className="mb-2 block text-sm text-zinc-600">
                  Product photos &amp; videos
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaChange}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-700"
                />
              </div>

              <div>
                <label htmlFor="product-name" className="mb-2 block text-sm text-zinc-600">
                  Product name
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Enter product name"
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600">Product category</label>
                <div className="space-y-2">
                  {categoryOptions.map((option) => {
                    const checked = productCategory === option;

                    return (
                      <label
                        key={option}
                        className={[
                          "flex cursor-pointer items-center gap-3 rounded-full border px-4 py-3 text-sm transition",
                          checked
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name="product-category"
                          checked={checked}
                          onChange={() => setProductCategory(option)}
                          className="sr-only"
                        />
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">
                          {checked ? "•" : ""}
                        </span>
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="product-price" className="mb-2 block text-sm text-zinc-600">
                  Product price
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-zinc-500">
                    £
                  </span>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productPrice}
                    onChange={(event) => setProductPrice(event.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-full border border-zinc-200 bg-white py-3 pl-8 pr-4 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="product-description" className="mb-2 block text-sm text-zinc-600">
                  Product description
                </label>
                <textarea
                  id="product-description"
                  value={productDescription}
                  onChange={(event) => setProductDescription(event.target.value)}
                  rows={6}
                  placeholder="Describe how the product works, what it is for, and any key details"
                  className="w-full rounded-[24px] border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <button
                type="button"
                onClick={handlePostListing}
                className="mt-2 block w-full rounded-full bg-zinc-900 px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-zinc-700"
              >
                POST LISTING
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

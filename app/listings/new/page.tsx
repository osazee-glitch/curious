"use client";

import { useEffect, useState } from "react";
import { mergeListingsByIdentity, saveListing, uploadListingMedia } from "../../lib/supabase-data";
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
  const [productStock, setProductStock] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [validationMessage, setValidationMessage] = useState("");

  const getVideoDuration = (file: File): Promise<number> =>
    new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const objectUrl = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not load video"));
      };
      video.src = objectUrl;
    });

  const handleMediaChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setValidationMessage("");

    const photos: File[] = [];
    const videos: File[] = [];

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        photos.push(file);
      } else if (file.type.startsWith("video/")) {
        videos.push(file);
      }
    }

    if (photos.length > 5) {
      setValidationMessage("Maximum 5 photos allowed. Please remove some photos.");
      return;
    }

    if (videos.length > 1) {
      setValidationMessage("Maximum 1 video allowed. Please remove the extra video.");
      return;
    }

    if (videos.length > 0) {
      try {
        const duration = await getVideoDuration(videos[0]);
        if (duration > 90) {
          setValidationMessage("Video duration must be 90 seconds or less.");
          return;
        }
      } catch (error) {
        setValidationMessage("Could not validate video. Please try another file.");
        return;
      }
    }

    setMediaFiles([...photos, ...videos]);
  };

  const handlePostListing = async () => {
    if (typeof window === "undefined") return;

    const stock = Number(productStock);
    if (!/^\d+$/.test(productStock) || !Number.isSafeInteger(stock) || stock < 0) {
      setValidationMessage("Please enter a whole number of products in stock.");
      return;
    }

    const { data } = await supabase.auth.getUser();
    const accountId = data.user?.id || "";
    const storedAccount = accountId
      ? window.localStorage.getItem(`${ACCOUNT_KEY}_${accountId}`)
      : null;
    const parsedAccount = storedAccount ? JSON.parse(storedAccount) : null;
    const creatorUsername = parsedAccount?.username || "";

    if (mediaFiles.length === 0) {
      setValidationMessage("Please add at least one photo or video before posting your listing.");
      return;
    }

    const uploadedMedia = await uploadListingMedia(accountId, mediaFiles);

    const listing = {
      id: crypto.randomUUID(),
      creatorUserId: accountId,
      productName,
      productCategory,
      price: Number(productPrice) || 0,
      stock,
      productDescription,
      media: uploadedMedia.map((item) => ({
        id: item.id,
        type: item.type,
        url: item.url,
        position: item.position,
        originalName: mediaFiles[item.position]?.name || "",
        fileSize: mediaFiles[item.position]?.size || 0,
      })),
      createdAt: new Date().toISOString(),
    };

    const saved = await saveListing({
      id: listing.id,
      creatorUserId: accountId,
      productName: listing.productName,
      productCategory: listing.productCategory,
      price: listing.price,
      stock: listing.stock,
      productDescription: listing.productDescription,
      media: listing.media.map((item) => ({
        id: item.id,
        type: item.type,
        url: item.url,
        position: item.position,
        originalName: item.originalName,
        fileSize: item.fileSize,
      })),
      createdAt: listing.createdAt,
    });

    const storedListings = window.localStorage.getItem("ithinkly_listings");
    const listings = storedListings ? JSON.parse(storedListings) : [];
    const legacyListing = {
      id: listing.id,
      creatorAccountId: accountId,
      creatorUsername,
      creatorAccount: parsedAccount || null,
      productName,
      productCategory,
      price: Number(productPrice) || 0,
      stock,
      productDescription,
      media: uploadedMedia.map((item) => ({ ...item, name: mediaFiles[item.position]?.name || "", size: mediaFiles[item.position]?.size || 0 })),
      reviews: [],
      createdAt: new Date().toISOString(),
    };

    const mergedListings = mergeListingsByIdentity(listings, [legacyListing, saved ? {
      ...saved,
      creatorAccountId: accountId,
      creatorUsername,
      creatorAccount: parsedAccount || null,
      media: saved.media.map((m) => ({
        url: m.url,
        type: m.type,
        name: m.id,
        size: 0,
      })),
      reviews: [],
      productName: saved.productName,
      productCategory: saved.productCategory,
      productDescription: saved.productDescription,
      price: saved.price,
      stock: saved.stock,
      createdAt: saved.createdAt,
    } : null]);
    window.localStorage.setItem("ithinkly_listings", JSON.stringify(mergedListings));
    window.location.href = "/market";
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = "/signin";
        return;
      }

      const storedAccount = window.localStorage.getItem(`${ACCOUNT_KEY}_${data.session.user.id}`);
      if (!storedAccount) return;

      try {
        const parsedAccount = JSON.parse(storedAccount);
        if (!parsedAccount.username) {
          const fallback = { ...parsedAccount, username: "" };
          window.localStorage.setItem(
            `${ACCOUNT_KEY}_${data.session.user.id}`,
            JSON.stringify(fallback),
          );
        }
      } catch {
        // ignore malformed local storage state
      }
    });
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
                <p className="mb-3 text-xs text-zinc-500">
                  Maximum: 5 photos and 1 video (90 seconds max)
                </p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaChange}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-700"
                />
                {mediaFiles.length > 0 && (
                  <p className="mt-2 text-xs text-zinc-600">
                    Selected: {mediaFiles.filter((f) => f.type.startsWith("image/")).length} photo{mediaFiles.filter((f) => f.type.startsWith("image/")).length !== 1 ? "s" : ""}{mediaFiles.some((f) => f.type.startsWith("video/")) && ", 1 video"}
                  </p>
                )}
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

              <div>
                <label htmlFor="product-stock" className="mb-2 block text-sm text-zinc-600">
                  In stock
                </label>
                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={productStock}
                  onChange={(event) => {
                    setProductStock(event.target.value);
                    setValidationMessage("");
                  }}
                  placeholder="0"
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              {validationMessage && <p className="text-sm text-red-600">{validationMessage}</p>}

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

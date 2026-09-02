"use client";

import { useEffect, useState } from "react";
import { loadCreatorProfile, mergeListingsByIdentity, saveListing, uploadListingMedia } from "../../lib/supabase-data";
import { supabase } from "../../lib/supabase";

const ACCOUNT_KEY = "ithinkly_account";
const MIN_VIDEO_SECONDS = 10;
const MAX_VIDEO_SECONDS = 90;

export default function NewListingPage() {
  const [productCategory, setProductCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("0.00");
  const [productStock, setProductStock] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [validationMessage, setValidationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (duration < MIN_VIDEO_SECONDS) {
          setValidationMessage(`Video must be at least ${MIN_VIDEO_SECONDS} seconds long.`);
          return;
        }
        if (duration > MAX_VIDEO_SECONDS) {
          setValidationMessage(`Video duration must be ${MAX_VIDEO_SECONDS} seconds or less.`);
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

    if (!productCategory.trim()) {
      setValidationMessage("Please enter a product category.");
      return;
    }

    if (mediaFiles.length === 0 || mediaFiles.filter((f) => f.type.startsWith("image/")).length === 0) {
      setValidationMessage("Please add at least one photo before posting your listing.");
      return;
    }

    const { data } = await supabase.auth.getUser();
    const accountId = data.user?.id || "";
    if (!accountId) {
      setValidationMessage("You must be signed in to post a listing.");
      return;
    }

    const creatorProfile = await loadCreatorProfile(accountId);
    if (!creatorProfile) {
      setValidationMessage("You need to set up your creator shop before posting a listing.");
      window.location.href = "/sell";
      return;
    }

    const storedAccount = window.localStorage.getItem(`${ACCOUNT_KEY}_${accountId}`);
    const parsedAccount = storedAccount ? JSON.parse(storedAccount) : null;
    const creatorUsername = parsedAccount?.username || "";

    setValidationMessage("");
    setIsSubmitting(true);

    try {
      const uploadedMedia = await uploadListingMedia(accountId, mediaFiles);

      const listingId = crypto.randomUUID();
      const media = uploadedMedia.map((item) => ({
        id: item.id,
        type: item.type,
        url: item.url,
        position: item.position,
        originalName: mediaFiles[item.position]?.name || "",
        fileSize: mediaFiles[item.position]?.size || 0,
      }));

      const saved = await saveListing({
        id: listingId,
        creatorUserId: accountId,
        productName,
        productCategory: productCategory.trim(),
        price: Number(productPrice) || 0,
        stock,
        productDescription,
        media,
        createdAt: new Date().toISOString(),
      });

      const storedListings = window.localStorage.getItem("ithinkly_listings");
      const listings = storedListings ? JSON.parse(storedListings) : [];
      const legacyListing = {
        ...saved,
        creatorAccountId: accountId,
        creatorUsername,
        creatorAccount: parsedAccount || null,
        media: saved.media.map((m) => ({ url: m.url, type: m.type, name: m.id, size: 0 })),
        reviews: [],
      };

      const mergedListings = mergeListingsByIdentity(listings, [legacyListing]);
      window.localStorage.setItem("ithinkly_listings", JSON.stringify(mergedListings));
      window.location.href = "/market";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not post your listing. Please try again.";
      setValidationMessage(message);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = "/signin";
        return;
      }

      // Only accounts that have completed creator/shop setup may post listings.
      const creatorProfile = await loadCreatorProfile(data.session.user.id);
      if (!creatorProfile) {
        window.location.href = "/sell";
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
                  1–5 photos required. Optional video: max 1, 10–90 seconds.
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
                <label htmlFor="product-category" className="mb-2 block text-sm text-zinc-600">
                  Product category
                </label>
                <input
                  id="product-category"
                  type="text"
                  value={productCategory}
                  onChange={(event) => setProductCategory(event.target.value)}
                  placeholder="Enter product category"
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
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
                disabled={isSubmitting}
                className="mt-2 block w-full rounded-full bg-zinc-900 px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {isSubmitting ? "POSTING..." : "POST LISTING"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

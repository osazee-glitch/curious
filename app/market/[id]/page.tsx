"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadListingById, loadUserProfile, saveReview } from "../../lib/supabase-data";
import { supabase } from "../../lib/supabase";

type MediaItem = {
  url: string;
  type: string;
  name: string;
  size: number;
};

type Review = {
  id?: string | number;
  reviewerAccountId?: string;
  buyerUsername?: string;
  reviewerProfilePicture?: string;
  reviewerIsCreator?: boolean;
  rating?: number;
  text?: string;
  comment?: string;
};

type Listing = {
  id: number;
  name: string;
  price: number;
  stock?: number;
  category: string;
  creator: string;
  creatorProfilePicture?: string;
  description: string;
  media: MediaItem[];
  reviews: Review[];
  creatorAccountId: string;
};

const getListing = (id: string): Listing | null => {
  const savedListings = window.localStorage.getItem("ithinkly_listings");
  const listings = savedListings ? JSON.parse(savedListings) : [];
  const savedListing = listings.find((listing: { id: number | string }) => String(listing.id) === id);

  if (savedListing) {
    return {
      id: Number(savedListing.id),
      name: savedListing.productName || "Untitled product",
      price: Number(savedListing.price) || 0,
      stock: Number.isInteger(Number(savedListing.stock)) && Number(savedListing.stock) >= 0 ? Number(savedListing.stock) : undefined,
      category: savedListing.productCategory || "Inventions",
      creator: (() => {
        const creatorId = savedListing.creatorAccountId || savedListing.creatorAccount?.accountId || "";
        const creatorRaw = creatorId ? window.localStorage.getItem(`ithinkly_account_${creatorId}`) : null;
        const creatorAccount = creatorRaw ? JSON.parse(creatorRaw) : savedListing.creatorAccount;
        return creatorAccount?.username || savedListing.creatorUsername || "Unknown creator";
      })(),
      creatorProfilePicture: (() => {
        const creatorId = savedListing.creatorAccountId || savedListing.creatorAccount?.accountId || "";
        const creatorRaw = creatorId ? window.localStorage.getItem(`ithinkly_account_${creatorId}`) : null;
        const creatorAccount = creatorRaw ? JSON.parse(creatorRaw) : savedListing.creatorAccount;
        return creatorAccount?.profilePicture || "";
      })(),
      description: savedListing.productDescription || "",
      media: Array.isArray(savedListing.media) ? savedListing.media : [],
      reviews: Array.isArray(savedListing.reviews) ? savedListing.reviews : [],
      creatorAccountId: savedListing.creatorAccountId || savedListing.creatorAccount?.accountId || "",
    };
  }

  const sessionProduct = window.sessionStorage.getItem(`ithinkly_market_product_${id}`);
  if (!sessionProduct) return null;

  const product = JSON.parse(sessionProduct);
  return {
    id: Number(product.id),
    name: product.name || "Untitled product",
    price: Number(product.price) || 0,
    stock: Number.isInteger(Number(product.stock)) && Number(product.stock) >= 0 ? Number(product.stock) : undefined,
    category: product.category || "Inventions",
    creator: product.creator || "Unknown creator",
    description: product.description || "",
    media: Array.isArray(product.media) ? product.media : [],
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
    creatorAccountId: product.creatorAccountId || "",
  };
};

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [addedToBasket, setAddedToBasket] = useState(false);
  const [currentAccountId, setCurrentAccountId] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    const loadCurrentListing = async () => {
      const fromStorage = getListing(params.id);
      if (fromStorage) {
        setListing(fromStorage);
      }

      const fromSupabase = await loadListingById(params.id);
      if (fromSupabase) {
        const creatorAccountId = fromSupabase.creatorUserId;
        // Creator info must come from Supabase so it's correct even if this
        // browser has never cached that creator's account locally.
        const creatorAccount = creatorAccountId ? await loadUserProfile(creatorAccountId) : null;
        const listingForDisplay: Listing = {
          id: Number(fromSupabase.id),
          name: fromSupabase.productName || "Untitled product",
          price: Number(fromSupabase.price) || 0,
          stock: Number.isInteger(Number(fromSupabase.stock)) && Number(fromSupabase.stock) >= 0 ? Number(fromSupabase.stock) : undefined,
          category: fromSupabase.productCategory || "Inventions",
          creator: creatorAccount?.username || "Unknown creator",
          creatorProfilePicture: creatorAccount?.profilePicture || "",
          description: fromSupabase.productDescription || "",
          media: (fromSupabase.media || []).map((item) => ({
            url: item.url,
            type: item.type === "video" ? "video/mp4" : "image/jpeg",
            name: item.id,
            size: 0,
          })),
          reviews: (fromSupabase.reviews || []).map((review) => ({
            id: review.id,
            reviewerAccountId: review.reviewerUserId,
            buyerUsername: review.buyerUsername || "Buyer",
            reviewerProfilePicture: review.reviewerProfilePicture || "",
            reviewerIsCreator: false,
            text: review.text,
            createdAt: review.createdAt,
          })),
          creatorAccountId: creatorAccountId,
        };
        setListing(listingForDisplay);
      }
    };

    loadCurrentListing();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentAccountId(data.user?.id || "");
    });
  }, [params.id]);

  if (!listing) {
    return (
      <main className="min-h-screen bg-white px-6 py-16 text-center text-zinc-900">
        <p className="text-sm text-zinc-500">Listing not found.</p>
        <a href="/market" className="mt-4 inline-block text-sm underline">
          Back to market
        </a>
      </main>
    );
  }

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const currentMedia = listing.media[mediaIndex];

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null || listing.media.length <= 1) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      setMediaIndex((index) => (diff > 0 ? (index + 1) % listing.media.length : (index - 1 + listing.media.length) % listing.media.length));
    }
    setTouchStartX(null);
  };

  const addToBasket = () => {
    setAddedToBasket(true);
  };

  const submitReview = async () => {
    const text = reviewText.trim();
    if (!text || !currentAccountId || currentAccountId === listing.creatorAccountId) return;

    const accountRaw = window.localStorage.getItem(`ithinkly_account_${currentAccountId}`);
    const account = accountRaw ? JSON.parse(accountRaw) : {};
    const savedReview = await saveReview({
      listingId: String(listing.id),
      reviewerUserId: currentAccountId,
      reviewText: text,
      rating: 0,
    });

    const review = {
      id: savedReview?.id || crypto.randomUUID(),
      reviewerAccountId: currentAccountId,
      buyerUsername: account.username || "Buyer",
      reviewerProfilePicture: account.profilePicture || "",
      reviewerIsCreator: account.isCreator === true,
      text,
      createdAt: savedReview?.createdAt || new Date().toISOString(),
    };
    const storedListings = window.localStorage.getItem("ithinkly_listings");
    const listings = storedListings ? JSON.parse(storedListings) : [];
    const listingIndex = listings.findIndex(
      (storedListing: { id: number | string }) => String(storedListing.id) === String(listing.id),
    );

    if (listingIndex !== -1) {
      const updatedListing = {
        ...listings[listingIndex],
        reviews: [...(Array.isArray(listings[listingIndex].reviews) ? listings[listingIndex].reviews : []), review],
      };
      listings[listingIndex] = updatedListing;
      window.localStorage.setItem("ithinkly_listings", JSON.stringify(listings));
    }
    setListing({ ...listing, reviews: [...listing.reviews, review] });
    setReviewText("");
    setReviewOpen(false);
  };

  const reviewerProfileHref = (review: Review) =>
    review.reviewerAccountId
      ? `/${review.reviewerIsCreator ? "creator-profile" : "profile"}/${review.reviewerAccountId}`
      : "/profile";

  const stageReviewerProfile = (review: Review) => {
    if (!review.reviewerAccountId) return;
    const accountRaw = window.localStorage.getItem(`ithinkly_account_${review.reviewerAccountId}`);
    if (accountRaw) {
      window.sessionStorage.setItem(
        `ithinkly_public_account_${review.reviewerAccountId}`,
        accountRaw,
      );
    }
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:py-12">
        <a href="/market" className="text-sm text-zinc-500 hover:text-zinc-900">
          Back to market
        </a>

        <section className="mt-8">
          <div
            className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl bg-zinc-100 sm:min-h-[560px]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {currentMedia ? (
              currentMedia.type.startsWith("video/") ? (
                <video
                  key={currentMedia.url}
                  src={currentMedia.url}
                  className="max-h-[560px] w-full object-contain"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={currentMedia.url}
                  alt={listing.name}
                  className="max-h-[560px] w-full object-contain"
                />
              )
            ) : (
              <span className="text-5xl font-medium tracking-[0.2em] text-zinc-500">NEW</span>
            )}
          </div>

          {listing.media.length > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMediaIndex((index) => (index - 1 + listing.media.length) % listing.media.length)}
                className="rounded-full border border-zinc-900 px-4 py-2 text-sm hover:bg-zinc-900 hover:text-white"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-500">
                {mediaIndex + 1} / {listing.media.length}
              </span>
              <button
                type="button"
                onClick={() => setMediaIndex((index) => (index + 1) % listing.media.length)}
                className="rounded-full border border-zinc-900 px-4 py-2 text-sm hover:bg-zinc-900 hover:text-white"
              >
                Next
              </button>
            </div>
          )}
        </section>

        <section className="mt-10 border-t border-zinc-200 pt-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{listing.name}</h1>
              <p className="mt-2 text-sm uppercase tracking-[0.16em] text-zinc-400">{listing.category}</p>
              <a
                href={listing.creatorAccountId ? `/creator-profile/${listing.creatorAccountId}` : "/creator-profile"}
                className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-600 underline hover:text-zinc-900"
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-xs text-zinc-500">
                  {listing.creatorProfilePicture ? <img src={listing.creatorProfilePicture} alt="Profile" className="h-full w-full object-cover" /> : "P"}
                </span>
                by {listing.creator}
              </a>
            </div>
            <p className="text-2xl font-medium">£{listing.price}</p>
          </div>

          <p className="mt-8 whitespace-pre-wrap text-base leading-7 text-zinc-700">{listing.description}</p>

          {listing.stock !== undefined && (
            <p className="mt-4 text-sm text-zinc-500">In stock: {listing.stock}</p>
          )}

          <button
            type="button"
            onClick={addToBasket}
            className="mt-8 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium uppercase tracking-[0.14em] text-white hover:bg-zinc-700"
          >
            {addedToBasket ? "ADDED TO BASKET" : "ADD TO BASKET"}
          </button>
        </section>

        <section className="mt-12 border-t border-zinc-200 pt-8">
          <h2 className="text-2xl font-semibold">Reviews</h2>
          {listing.reviews.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No reviews yet.</p>
          ) : (
            <div className="mt-5 space-y-5">
              {listing.reviews.map((review, index) => (
                <article key={review.id ?? index} className="border-b border-zinc-100 pb-5">
                  <a
                    href={reviewerProfileHref(review)}
                    onClick={() => stageReviewerProfile(review)}
                    className="flex items-center gap-3 text-sm font-medium hover:underline"
                  >
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
                      {review.reviewerProfilePicture ? (
                        <img src={review.reviewerProfilePicture} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        "P"
                      )}
                    </span>
                    {review.buyerUsername || "Buyer"}
                  </a>
                  {review.rating !== undefined && <p className="mt-1 text-sm text-zinc-500">{review.rating}/5</p>}
                  <p className="mt-2 text-sm leading-6 text-zinc-700">{review.text || review.comment || ""}</p>
                </article>
              ))}
            </div>
          )}
          {currentAccountId && currentAccountId !== listing.creatorAccountId && (
            reviewOpen ? (
              <div className="mt-6 space-y-3">
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="Write your review"
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={!reviewText.trim()}
                    className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium uppercase tracking-[0.14em] text-white hover:bg-zinc-700 disabled:bg-zinc-300"
                  >
                    SUBMIT REVIEW
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewOpen(false)}
                    className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium uppercase tracking-[0.14em] text-zinc-900"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setReviewOpen(true)}
                className="mt-6 rounded-full border border-zinc-900 px-5 py-2.5 text-sm font-medium uppercase tracking-[0.14em] text-zinc-900 hover:bg-zinc-900 hover:text-white"
              >
                ADD REVIEW
              </button>
            )
          )}
        </section>
      </div>
    </main>
  );
}

"use client";

import { supabase } from "./supabase";

export type UserProfile = {
  id: string;
  username: string;
  age: number;
  country: string;
  deliveryAddress: string;
  postcode: string;
  profilePicture: string;
  isCreator: boolean;
  email: string;
};

export type CreatorProfile = {
  userId: string;
  sellingOptions: string[];
  productTypes: string[];
  powerOptions: string[];
  deliveryOptions: string[];
  bankDetails: {
    fullName: string;
    bankName: string;
    sortCode: string;
    accountNumber: string;
  } | null;
};

export type Listing = {
  id: string;
  creatorUserId: string;
  productName: string;
  productCategory: string;
  price: number;
  stock: number;
  productDescription: string;
  media: Array<{
    id: string;
    type: "photo" | "video";
    url: string;
    position: number;
  }>;
  reviews: Array<{
    id: string;
    reviewerUserId: string;
    buyerUsername: string;
    reviewerProfilePicture: string;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
};

const buildUserProfileFromRecord = (row: any): UserProfile => ({
  id: row.id,
  username: row.username || "",
  age: Number(row.age || 0),
  country: row.country || "United Kingdom",
  deliveryAddress: row.delivery_address || "",
  postcode: row.postcode || "",
  profilePicture: row.profile_picture || "",
  isCreator: Boolean(row.is_creator),
  email: row.email || "",
});

const buildCreatorProfileFromRecord = (row: any): CreatorProfile => ({
  userId: row.user_id,
  sellingOptions: row.selling_options || [],
  productTypes: row.product_types || [],
  powerOptions: row.power_options || [],
  deliveryOptions: row.delivery_options || [],
  bankDetails: row.bank_details || null,
});

const buildListingFromRecord = (listing: any): Listing => ({
  id: listing.id,
  creatorUserId: listing.creator_user_id || listing.creatorUserId || "",
  productName: listing.product_name || listing.productName || "Untitled product",
  productCategory: listing.product_category || listing.productCategory || "Inventions",
  price: Number(listing.price || 0),
  stock: Number(listing.stock || 0),
  productDescription: listing.product_description || listing.productDescription || "",
  media: (listing.listing_media || listing.media || []).map((item: any) => ({
    id: item.id,
    type: (item.media_type || item.type || "photo") as "photo" | "video",
    url: item.url,
    position: Number(item.position || 0),
  })),
  reviews: (listing.reviews || []).map((item: any) => ({
    id: item.id,
    reviewerUserId: item.reviewer_user_id || item.reviewerUserId || "",
    buyerUsername: item.buyer_username || item.buyerUsername || "Buyer",
    reviewerProfilePicture: item.reviewer_profile_picture || item.reviewerProfilePicture || "",
    text: item.review_text || item.text || "",
    createdAt: item.created_at || item.createdAt || new Date().toISOString(),
  })),
  createdAt: listing.created_at || listing.createdAt || new Date().toISOString(),
});

export async function uploadListingMedia(userId: string, files: File[]): Promise<Array<{ id: string; type: "photo" | "video"; url: string; position: number }>> {
  const uploaded: Array<{ id: string; type: "photo" | "video"; url: string; position: number }> = [];
  const bucketNames = ["listing-media", "user-uploads", "listings", "creator-market"];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const fileName = `${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const objectPath = `${userId}/${fileName}`;
    let publicUrl = "";

    for (const bucketName of bucketNames) {
      const { error } = await supabase.storage.from(bucketName).upload(objectPath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

      if (!error) {
        const { data } = supabase.storage.from(bucketName).getPublicUrl(objectPath);
        publicUrl = data.publicUrl || "";
        break;
      }
    }

    if (!publicUrl) {
      throw new Error(`Could not upload media file: ${file.name}`);
    }

    uploaded.push({
      id: crypto.randomUUID(),
      type: file.type.startsWith("video/") ? "video" : "photo",
      url: publicUrl,
      position: index,
    });
  }

  return uploaded;
}

/**
 * Load user profile from Supabase. Falls back to localStorage if Supabase fails.
 */
export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return buildUserProfileFromRecord(data);
  } catch (error) {
    console.error("Error loading user profile from Supabase:", error);
    return null;
  }
}

/**
 * Save user profile to Supabase. Creates or updates the profile.
 */
export async function saveUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        username: profile.username ?? "",
        age: profile.age ?? 0,
        country: profile.country || "United Kingdom",
        delivery_address: profile.deliveryAddress ?? "",
        postcode: profile.postcode ?? "",
        profile_picture: profile.profilePicture ?? "",
        is_creator: Boolean(profile.isCreator),
        email: profile.email ?? "",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select()
      .single();

    if (error || !data) {
      console.error("Error saving user profile to Supabase:", error);
      return null;
    }

    return buildUserProfileFromRecord(data);
  } catch (error) {
    console.error("Error saving user profile to Supabase:", error);
    return null;
  }
}

/**
 * Load creator profile from Supabase.
 */
export async function loadCreatorProfile(userId: string): Promise<CreatorProfile | null> {
  try {
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return buildCreatorProfileFromRecord(data);
  } catch (error) {
    console.error("Error loading creator profile from Supabase:", error);
    return null;
  }
}

/**
 * Save creator profile to Supabase. Creates or updates the profile.
 */
export async function saveCreatorProfile(userId: string, profile: Partial<CreatorProfile>): Promise<CreatorProfile | null> {
  try {
    const { data, error } = await supabase
      .from("creator_profiles")
      .upsert({
        user_id: userId,
        selling_options: profile.sellingOptions || [],
        product_types: profile.productTypes || [],
        power_options: profile.powerOptions || [],
        delivery_options: profile.deliveryOptions || [],
        bank_details: profile.bankDetails || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (error || !data) {
      console.error("Error saving creator profile to Supabase:", error);
      return null;
    }

    return buildCreatorProfileFromRecord(data);
  } catch (error) {
    console.error("Error saving creator profile to Supabase:", error);
    return null;
  }
}

export async function loadAllListings(): Promise<Listing[]> {
  try {
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        id,
        creator_user_id,
        product_name,
        product_category,
        price,
        stock,
        product_description,
        created_at,
        listing_media(id, media_type, url, position),
        reviews(id, reviewer_user_id, review_text, created_at)
        `,
      )
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return (data || []).map(buildListingFromRecord);
  } catch (error) {
    console.error("Error loading listings from Supabase:", error);
    return [];
  }
}

export async function loadListingById(listingId: string | number): Promise<Listing | null> {
  try {
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        id,
        creator_user_id,
        product_name,
        product_category,
        price,
        stock,
        product_description,
        created_at,
        listing_media(id, media_type, url, position),
        reviews(id, reviewer_user_id, review_text, created_at)
        `,
      )
      .eq("id", String(listingId))
      .single();

    if (error || !data) {
      return null;
    }

    return buildListingFromRecord(data);
  } catch (error) {
    console.error("Error loading listing by id from Supabase:", error);
    return null;
  }
}

export async function loadUserListings(userId: string): Promise<Listing[]> {
  try {
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        id,
        creator_user_id,
        product_name,
        product_category,
        price,
        stock,
        product_description,
        created_at,
        listing_media(id, media_type, url, position),
        reviews(id, reviewer_user_id, review_text, created_at)
        `,
      )
      .eq("creator_user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return (data || []).map(buildListingFromRecord);
  } catch (error) {
    console.error("Error loading user listings from Supabase:", error);
    return [];
  }
}

export async function saveListing(input: {
  id?: string;
  creatorUserId: string;
  productName: string;
  productCategory: string;
  price: number;
  stock: number;
  productDescription: string;
  media: Array<{ id?: string; type: "photo" | "video"; url: string; position: number; originalName?: string; fileSize?: number }>;
  createdAt?: string;
  legacyId?: string | number;
}): Promise<Listing | null> {
  const listingId = input.id || crypto.randomUUID();

  try {
    const { data, error } = await supabase
      .from("listings")
      .upsert({
        id: listingId,
        creator_user_id: input.creatorUserId,
        product_name: input.productName,
        product_category: input.productCategory,
        price: input.price,
        stock: input.stock,
        product_description: input.productDescription,
        created_at: input.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select()
      .single();

    if (error || !data) {
      console.error("Error saving listing to Supabase:", error);
      return null;
    }

    const rows = input.media.map((item, index) => ({
      id: item.id || crypto.randomUUID(),
      listing_id: listingId,
      media_type: item.type,
      url: item.url,
      position: item.position ?? index,
      original_name: item.originalName || "",
      file_size: item.fileSize || 0,
    }));

    if (rows.length > 0) {
      await supabase.from("listing_media").delete().eq("listing_id", listingId);
      const { error: mediaError } = await supabase.from("listing_media").upsert(rows, { onConflict: "id" });
      if (mediaError) {
        console.error("Error saving listing media to Supabase:", mediaError);
      }
    }

    return buildListingFromRecord({
      ...data,
      listing_media: rows.map((row) => ({
        id: row.id,
        media_type: row.media_type,
        url: row.url,
        position: row.position,
      })),
      reviews: [],
    });
  } catch (error) {
    console.error("Error saving listing to Supabase:", error);
    return null;
  }
}

export function mergeListingsByIdentity(...lists: any[][]): any[] {
  const seen = new Set<string>();
  const merged: any[] = [];

  for (const list of lists) {
    for (const item of list || []) {
      const identity = String(
        item.id ||
          `${item.creatorUserId || item.creator_user_id || "unknown"}:${item.productName || item.product_name || "untitled"}:${item.createdAt || item.created_at || ""}`,
      );

      if (seen.has(identity)) continue;
      seen.add(identity);
      merged.push(item);
    }
  }

  return merged;
}

export async function saveReview(input: {
  listingId: string;
  reviewerUserId: string;
  reviewText: string;
  rating?: number;
}): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        listing_id: input.listingId,
        reviewer_user_id: input.reviewerUserId,
        review_text: input.reviewText,
        rating: input.rating ?? 0,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error saving review to Supabase:", error);
      return null;
    }

    return {
      id: data.id,
      reviewerUserId: data.reviewer_user_id,
      buyerUsername: "",
      reviewerProfilePicture: "",
      text: data.review_text,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error("Error saving review to Supabase:", error);
    return null;
  }
}

/**
 * Get or create a user profile. If the user doesn't exist in Supabase,
 * create a default profile.
 */
export async function getOrCreateUserProfile(userId: string, email: string): Promise<UserProfile | null> {
  const existing = await loadUserProfile(userId);
  if (existing) {
    return existing;
  }

  const newProfile: Partial<UserProfile> = {
    username: "",
    age: 0,
    country: "United Kingdom",
    deliveryAddress: "",
    postcode: "",
    profilePicture: "",
    isCreator: false,
    email,
  };

  return saveUserProfile(userId, newProfile);
}

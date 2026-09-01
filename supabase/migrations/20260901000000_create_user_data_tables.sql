-- Create user_profiles table extending Supabase auth.users
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  age integer default 0,
  country text default 'United Kingdom' not null,
  delivery_address text default '',
  postcode text default '',
  profile_picture text default '',
  is_creator boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create creator_profiles table for shop information
create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  selling_options text[] default array[]::text[],
  product_types text[] default array[]::text[],
  power_options text[] default array[]::text[],
  delivery_options text[] default array[]::text[],
  bank_details jsonb default null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create listings table
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null,
  product_category text not null,
  price numeric(10, 2) not null default 0,
  stock integer default 0,
  product_description text default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create listing_media table
create table if not exists public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  media_type text not null check (media_type in ('photo', 'video')),
  url text not null,
  position integer not null default 0,
  original_name text default '',
  file_size integer default 0,
  created_at timestamp with time zone default now()
);

-- Create reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete cascade,
  rating integer default 0 check (rating >= 0 and rating <= 5),
  review_text text default '',
  created_at timestamp with time zone default now()
);

-- Enable RLS policies
alter table public.user_profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_media enable row level security;
alter table public.reviews enable row level security;

-- RLS Policies for user_profiles
create policy "Users can view their own profile" on public.user_profiles
  for select using (auth.uid() = id or true);
create policy "Users can update their own profile" on public.user_profiles
  for update using (auth.uid() = id);
create policy "Users can insert their own profile on signup" on public.user_profiles
  for insert with check (auth.uid() = id);

-- RLS Policies for creator_profiles
create policy "Users can view creator profiles" on public.creator_profiles
  for select using (true);
create policy "Creators can update their own profile" on public.creator_profiles
  for update using (auth.uid() = user_id);
create policy "Creators can insert their own profile" on public.creator_profiles
  for insert with check (auth.uid() = user_id);

-- RLS Policies for listings
create policy "Anyone can view published listings" on public.listings
  for select using (true);
create policy "Creators can create listings" on public.listings
  for insert with check (auth.uid() = creator_user_id);
create policy "Creators can update their own listings" on public.listings
  for update using (auth.uid() = creator_user_id);
create policy "Creators can delete their own listings" on public.listings
  for delete using (auth.uid() = creator_user_id);

-- RLS Policies for listing_media
create policy "Anyone can view listing media" on public.listing_media
  for select using (true);
create policy "Creators can manage their listing media" on public.listing_media
  for insert with check (
    auth.uid() = (select creator_user_id from public.listings where id = listing_id)
  );
create policy "Creators can delete their listing media" on public.listing_media
  for delete using (
    auth.uid() = (select creator_user_id from public.listings where id = listing_id)
  );

-- RLS Policies for reviews
create policy "Anyone can view reviews" on public.reviews
  for select using (true);
create policy "Users can create reviews" on public.reviews
  for insert with check (auth.uid() = reviewer_user_id);

-- Create indexes for performance
create index idx_user_profiles_username on public.user_profiles(username);
create index idx_creator_profiles_user_id on public.creator_profiles(user_id);
create index idx_listings_creator_user_id on public.listings(creator_user_id);
create index idx_listing_media_listing_id on public.listing_media(listing_id);
create index idx_reviews_listing_id on public.reviews(listing_id);
create index idx_reviews_reviewer_user_id on public.reviews(reviewer_user_id);

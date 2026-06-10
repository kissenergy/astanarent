create extension if not exists "pgcrypto";

do $$ begin
  create type user_role as enum ('client', 'realtor');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type listing_status as enum ('active', 'rented', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type media_type as enum ('photo', 'video');
exception when duplicate_object then null;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  role user_role not null default 'client',
  is_admin boolean not null default false,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  realtor_id uuid not null references users(id) on delete cascade,
  title text not null,
  price_month integer not null check (price_month > 0),
  address_text text not null,
  description text not null default '',
  realtor_phone text not null,
  listing_phone text not null,
  status listing_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  url text not null,
  type media_type not null default 'photo',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 3 and 1000),
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

create table if not exists favorites (
  user_id uuid not null references users(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists idx_listings_created_at on listings (created_at desc);
create index if not exists idx_listings_realtor_id on listings (realtor_id);
create index if not exists idx_listing_media_listing_id on listing_media (listing_id);
create index if not exists idx_reviews_listing_id on reviews (listing_id);

create table if not exists public.restaurants (
  id text primary key,
  slug text not null unique,
  name text not null,
  prefecture text not null,
  official_city text not null,
  address text not null default '',
  google_maps_url text not null default '',
  place_id text not null default '',
  raw_place_type text not null default '',
  grouped_cuisine_type text not null,
  rating numeric,
  review_count integer,
  price_level text not null default '',
  has_google_photo boolean not null default false,
  review_needed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists restaurants_prefecture_idx on public.restaurants (prefecture);
create index if not exists restaurants_city_idx on public.restaurants (official_city);
create index if not exists restaurants_cuisine_idx on public.restaurants (grouped_cuisine_type);
create index if not exists restaurants_slug_idx on public.restaurants (slug);

alter table public.restaurants enable row level security;

drop policy if exists "Public can read restaurants" on public.restaurants;
create policy "Public can read restaurants"
on public.restaurants
for select
to anon, authenticated
using (true);

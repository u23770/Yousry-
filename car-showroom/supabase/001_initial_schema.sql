create extension if not exists pgcrypto;

create table public.dealerships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  phone text,
  whatsapp text,
  address text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dealership_members (
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'manager' check (role in ('owner','manager','sales')),
  created_at timestamptz not null default now(),
  primary key (dealership_id, user_id)
);

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  brand text not null,
  model text not null,
  year integer not null check (year between 1950 and 2100),
  price numeric(14,2) not null check (price >= 0),
  mileage integer not null default 0 check (mileage >= 0),
  body_type text,
  fuel_type text,
  transmission text,
  color text,
  engine text,
  description text,
  status text not null default 'available' check (status in ('available','reserved','sold')),
  is_published boolean not null default true,
  featured boolean not null default false,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, slug)
);

create table public.car_images (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  car_id uuid references public.cars(id) on delete set null,
  name text not null,
  phone text,
  email text,
  lead_type text not null default 'viewing' check (lead_type in ('viewing','whatsapp','call','contact')),
  message text,
  status text not null default 'new' check (status in ('new','contacted','qualified','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cars_dealership_id_idx on public.cars(dealership_id);
create index cars_search_idx on public.cars(brand, model, year, price);
create index car_images_car_id_idx on public.car_images(car_id, sort_order);
create index leads_dealership_id_idx on public.leads(dealership_id, created_at desc);

alter table public.dealerships enable row level security;
alter table public.dealership_members enable row level security;
alter table public.cars enable row level security;
alter table public.car_images enable row level security;
alter table public.leads enable row level security;

create policy "public can read published cars"
on public.cars for select to anon, authenticated
using (is_published = true);

create policy "public can read images for published cars"
on public.car_images for select to anon, authenticated
using (
  exists (
    select 1 from public.cars c
    where c.id = car_images.car_id and c.is_published = true
  )
);

create policy "public can create leads"
on public.leads for insert to anon, authenticated
with check (
  exists (
    select 1 from public.dealerships d
    where d.id = leads.dealership_id
  )
);

create policy "members can read their dealerships"
on public.dealerships for select to authenticated
using (
  exists (
    select 1 from public.dealership_members m
    where m.dealership_id = dealerships.id
      and m.user_id = (select auth.uid())
  )
);

create policy "members can read membership rows"
on public.dealership_members for select to authenticated
using (user_id = (select auth.uid()));

create policy "members can manage cars"
on public.cars for all to authenticated
using (
  exists (
    select 1 from public.dealership_members m
    where m.dealership_id = cars.dealership_id
      and m.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.dealership_members m
    where m.dealership_id = cars.dealership_id
      and m.user_id = (select auth.uid())
  )
);

create policy "members can manage car images"
on public.car_images for all to authenticated
using (
  exists (
    select 1
    from public.cars c
    join public.dealership_members m on m.dealership_id = c.dealership_id
    where c.id = car_images.car_id
      and m.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.cars c
    join public.dealership_members m on m.dealership_id = c.dealership_id
    where c.id = car_images.car_id
      and m.user_id = (select auth.uid())
  )
);

create policy "members can read leads"
on public.leads for select to authenticated
using (
  exists (
    select 1 from public.dealership_members m
    where m.dealership_id = leads.dealership_id
      and m.user_id = (select auth.uid())
  )
);

create policy "members can update leads"
on public.leads for update to authenticated
using (
  exists (
    select 1 from public.dealership_members m
    where m.dealership_id = leads.dealership_id
      and m.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.dealership_members m
    where m.dealership_id = leads.dealership_id
      and m.user_id = (select auth.uid())
  )
);

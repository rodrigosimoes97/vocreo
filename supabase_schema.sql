-- Projeto Supabase: jmrhgqccquttipuivjto
create extension if not exists "pgcrypto";

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  model text,
  description text,
  cost numeric(10,2) not null default 0,
  price numeric(10,2) not null default 0,
  stock integer not null default 0,
  min_stock integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text,
  created_at timestamptz default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  instagram text,
  city text,
  state text,
  notes text,
  created_at timestamptz default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_id uuid references public.customers(id) on delete set null,
  order_date date not null default current_date,
  status text not null default 'Aguardando',
  payment_method text,
  shipping numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  subtotal numeric(10,2) default 0,
  total numeric(10,2) default 0,
  created_at timestamptz default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  size text,
  color text,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null default 0,
  unit_cost numeric(10,2) not null default 0,
  total numeric(10,2) generated always as (quantity * unit_price) stored
);

create table public.production_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0
);

insert into public.production_stages(name,sort_order) values
('Impressão',1),('Prensagem',2),('Embalagem',3),('Expedição',4)
on conflict(name) do nothing;

create table public.production_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  stage_id uuid not null references public.production_stages(id),
  started_at timestamptz,
  finished_at timestamptz,
  responsible text,
  notes text,
  created_at timestamptz default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('entrada','saida','ajuste')),
  quantity integer not null,
  reason text,
  created_at timestamptz default now()
);

create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type in ('receita','despesa')),
  category text not null,
  description text not null,
  amount numeric(10,2) not null,
  payment_method text,
  transaction_date date not null default current_date,
  created_at timestamptz default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  month integer not null check (month between 1 and 12),
  year integer not null,
  revenue_goal numeric(10,2) default 0,
  profit_goal numeric(10,2) default 0,
  sales_goal integer default 0,
  created_at timestamptz default now(),
  unique(month,year)
);

insert into public.categories(name) values
('Camiseta'),('Ecobag'),('Moletom'),('Boné')
on conflict(name) do nothing;

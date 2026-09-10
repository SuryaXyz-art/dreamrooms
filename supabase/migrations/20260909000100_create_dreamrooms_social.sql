begin;

create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]{16,64}$'),
  host_wallet text not null check (host_wallet ~ '^0x[a-f0-9]{40}$'),
  market_id text not null check (market_id ~ '^0x[a-f0-9]{64}$'),
  asset text not null check (asset in ('BTC', 'ETH')),
  title text not null check (char_length(title) between 1 and 120),
  thesis text not null default '' check (char_length(thesis) <= 500),
  language text not null default 'en' check (language in ('en', 'hi')),
  suggested_max_spend numeric(20,6) check (suggested_max_spend is null or suggested_max_spend >= 0 and suggested_max_spend <= 1),
  market_expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'finalized', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (market_expires_at > created_at)
);

create table if not exists public.room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  wallet_address text not null check (wallet_address ~ '^0x[a-f0-9]{40}$'),
  joined_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  unique (room_id, wallet_address)
);

create table if not exists public.room_sentiments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  wallet_address text not null check (wallet_address ~ '^0x[a-f0-9]{40}$'),
  side text not null check (side in ('UP', 'DOWN')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (room_id, wallet_address)
);

create table if not exists public.verified_trades (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  transaction_hash text not null unique check (transaction_hash ~ '^0x[a-f0-9]{64}$'),
  wallet_address text not null check (wallet_address ~ '^0x[a-f0-9]{40}$'),
  chain_id bigint not null check (chain_id = 50312),
  market_id text not null check (market_id ~ '^0x[a-f0-9]{64}$'),
  side text not null check (side in ('UP', 'DOWN')),
  requested_quantity numeric(30,18) not null check (requested_quantity > 0),
  filled_quantity numeric(30,18) not null check (filled_quantity >= 0),
  execution_price numeric(30,18) check (execution_price is null or execution_price >= 0 and execution_price <= 1),
  block_number bigint not null check (block_number > 0),
  receipt_status text not null check (receipt_status = 'SUCCESS'),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.room_reactions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  wallet_address text not null check (wallet_address ~ '^0x[a-f0-9]{40}$'),
  reaction text not null check (reaction in ('🔥', '👀', '💡', '👏')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wallet_nonces (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null check (wallet_address ~ '^0x[a-f0-9]{40}$'),
  nonce_hash text not null unique check (nonce_hash ~ '^[a-f0-9]{64}$'),
  message text not null check (char_length(message) between 80 and 1000),
  action text not null check (action ~ '^[a-z_]{3,40}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists rooms_market_id_idx on public.rooms (market_id);
create index if not exists rooms_activity_idx on public.rooms (status, market_expires_at);
create index if not exists room_participants_activity_idx on public.room_participants (room_id, last_seen_at);
create index if not exists room_sentiments_room_idx on public.room_sentiments (room_id, side);
create index if not exists verified_trades_room_idx on public.verified_trades (room_id, verification_status, created_at desc);
create index if not exists verified_trades_market_idx on public.verified_trades (market_id);
create index if not exists room_reactions_room_idx on public.room_reactions (room_id, created_at desc);
create index if not exists wallet_nonces_expiry_idx on public.wallet_nonces (expires_at);

create or replace function public.set_dreamrooms_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger rooms_set_updated_at before update on public.rooms for each row execute function public.set_dreamrooms_updated_at();
create trigger room_sentiments_set_updated_at before update on public.room_sentiments for each row execute function public.set_dreamrooms_updated_at();

alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.room_sentiments enable row level security;
alter table public.verified_trades enable row level security;
alter table public.room_reactions enable row level security;
alter table public.wallet_nonces enable row level security;

create policy rooms_public_read on public.rooms for select using (status = 'active' and market_expires_at > timezone('utc', now()));
create policy participants_public_read on public.room_participants for select using (exists (select 1 from public.rooms r where r.id = room_id and r.status = 'active'));
create policy sentiments_public_read on public.room_sentiments for select using (exists (select 1 from public.rooms r where r.id = room_id and r.status = 'active'));
create policy verified_trades_public_read on public.verified_trades for select using (verification_status = 'verified');
create policy reactions_public_read on public.room_reactions for select using (exists (select 1 from public.rooms r where r.id = room_id and r.status = 'active'));

revoke all on public.wallet_nonces from anon, authenticated;
revoke insert, update, delete on public.rooms, public.room_participants, public.room_sentiments, public.verified_trades, public.room_reactions from anon, authenticated;

commit;

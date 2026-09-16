create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null,
 phone text,
 preferred_language text not null default 'en' check (preferred_language in ('en','te','hi')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.farms (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 farm_name text not null, location_name text not null, farm_type text not null, crop_type text not null,
 farm_size numeric not null check(farm_size>0), growth_stage text not null, soil_moisture numeric not null check(soil_moisture between 0 and 100),
 latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180), planting_date date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.farm_observations (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,farm_id uuid not null references public.farms(id) on delete cascade,
 soil_moisture numeric check(soil_moisture between 0 and 100),note text,created_at timestamptz not null default now()
);
create table if not exists public.weather_snapshots (
 id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete cascade,farm_id uuid references public.farms(id) on delete cascade,
 provider text not null, payload jsonb not null,created_at timestamptz not null default now()
);
create table if not exists public.ai_recommendations (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,farm_id uuid not null references public.farms(id) on delete cascade,
 recommendation text not null,priority text,confidence numeric,reason text,factors jsonb,created_at timestamptz not null default now()
);
create table if not exists public.disease_predictions (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,farm_id uuid not null references public.farms(id) on delete cascade,
 disease_name text not null,severity text,confidence numeric,action text,model_name text,created_at timestamptz not null default now()
);
create table if not exists public.alerts (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,farm_id uuid references public.farms(id) on delete cascade,
 severity text not null,title text not null,message text not null,is_read boolean not null default false,created_at timestamptz not null default now()
);
create table if not exists public.government_schemes (
 id uuid primary key default gen_random_uuid(),name text not null,description text,eligibility text,benefits text,application_info text,official_source text,created_at timestamptz not null default now()
);
create table if not exists public.farm_events (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,farm_id uuid not null references public.farms(id) on delete cascade,
 event_type text not null,description text,source text,created_at timestamptz not null default now()
);
create index if not exists farms_user_id_idx on public.farms(user_id);
create index if not exists disease_predictions_farm_id_idx on public.disease_predictions(farm_id,created_at desc);
create index if not exists alerts_user_id_idx on public.alerts(user_id,is_read,created_at desc);
create index if not exists farm_events_farm_id_idx on public.farm_events(farm_id,created_at desc);

alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.farm_observations enable row level security;
alter table public.weather_snapshots enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.disease_predictions enable row level security;
alter table public.alerts enable row level security;
alter table public.government_schemes enable row level security;
alter table public.farm_events enable row level security;

drop policy if exists profiles_self on public.profiles; create policy profiles_self on public.profiles for all using(auth.uid()=id) with check(auth.uid()=id);
drop policy if exists farms_self on public.farms; create policy farms_self on public.farms for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists observations_self on public.farm_observations; create policy observations_self on public.farm_observations for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists weather_self on public.weather_snapshots; create policy weather_self on public.weather_snapshots for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists recs_self on public.ai_recommendations; create policy recs_self on public.ai_recommendations for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists disease_self on public.disease_predictions; create policy disease_self on public.disease_predictions for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists alerts_self on public.alerts; create policy alerts_self on public.alerts for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists events_self on public.farm_events; create policy events_self on public.farm_events for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists schemes_public_read on public.government_schemes; create policy schemes_public_read on public.government_schemes for select using(true);

insert into public.government_schemes(name,description,eligibility,benefits,application_info,official_source) values
('PM-KISAN','Income support scheme information for eligible landholding farmer families.','Check current official eligibility rules.','See official scheme details.','Use the official PM-KISAN portal.','https://pmkisan.gov.in/'),
('Pradhan Mantri Fasal Bima Yojana (PMFBY)','Crop insurance information for eligible farmers and notified crops/areas.','Varies by notified crop, area and season.','Crop insurance coverage according to applicable rules.','Use the official PMFBY portal.','https://pmfby.gov.in/'),
('eNAM','National Agriculture Market information and trading platform.','See official market participation rules.','Market information and electronic trading services.','Use the official eNAM portal.','https://www.enam.gov.in/')
on conflict do nothing;

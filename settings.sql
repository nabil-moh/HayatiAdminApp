-- إعدادات لوحة المدير والمتجر
create table if not exists public.site_settings (
  id bigint primary key generated always as identity,
  logo_url text,
  admin_color text default '#7c3aed',
  store_color text default '#7c3aed',
  updated_at timestamptz default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_select_authenticated" on public.site_settings;
create policy "site_settings_select_authenticated"
on public.site_settings for select
to authenticated using (true);

drop policy if exists "site_settings_insert_authenticated" on public.site_settings;
create policy "site_settings_insert_authenticated"
on public.site_settings for insert
to authenticated with check (true);

drop policy if exists "site_settings_update_authenticated" on public.site_settings;
create policy "site_settings_update_authenticated"
on public.site_settings for update
to authenticated using (true) with check (true);

insert into public.site_settings (logo_url,admin_color,store_color)
select null,'#7c3aed','#7c3aed'
where not exists (select 1 from public.site_settings);

-- مساحة تخزين للشعار وصور الإعدادات
insert into storage.buckets (id,name,public)
values ('hayati-assets','hayati-assets',true)
on conflict (id) do update set public=true;

drop policy if exists "hayati_assets_public_read" on storage.objects;
create policy "hayati_assets_public_read"
on storage.objects for select
using (bucket_id='hayati-assets');

drop policy if exists "hayati_assets_authenticated_insert" on storage.objects;
create policy "hayati_assets_authenticated_insert"
on storage.objects for insert
to authenticated with check (bucket_id='hayati-assets');

drop policy if exists "hayati_assets_authenticated_update" on storage.objects;
create policy "hayati_assets_authenticated_update"
on storage.objects for update
to authenticated using (bucket_id='hayati-assets') with check (bucket_id='hayati-assets');
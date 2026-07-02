-- Blog post translations
create table if not exists blog_post_translations (
  id             uuid primary key default gen_random_uuid(),
  post_slug      text not null,
  locale         text not null,
  title          text,
  excerpt        text,
  content        text,
  updated_at     timestamptz default now(),
  unique (post_slug, locale)
);

create index if not exists blog_post_translations_slug_locale
  on blog_post_translations (post_slug, locale);

-- Creative app translations
create table if not exists creative_app_translations (
  id          uuid primary key default gen_random_uuid(),
  app_slug    text not null,
  locale      text not null,
  title       text,
  tagline     text,
  intro       text,
  updated_at  timestamptz default now(),
  unique (app_slug, locale)
);

create index if not exists creative_app_translations_slug_locale
  on creative_app_translations (app_slug, locale);

-- Enable RLS (read-only public, write via service role)
alter table blog_post_translations enable row level security;
alter table creative_app_translations enable row level security;

create policy "Public read blog translations"
  on blog_post_translations for select using (true);

create policy "Public read creative translations"
  on creative_app_translations for select using (true);

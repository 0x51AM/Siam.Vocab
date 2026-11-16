-- SiamVocab Supabase Database & Private PDF Storage Schema
-- Copy and paste this entire script into your Supabase SQL Editor and click "Run".

-- 1. PDF Documents table (tracks user-uploaded PDFs)
create table if not exists public.pdf_documents (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text,
  page_count integer not null default 1,
  imported_count integer not null default 0,
  ocr_used boolean not null default false,
  topic text not null default 'General',
  level text not null default 'B1',
  created_at timestamptz not null default now()
);

-- 2. Vocabulary Items table
create table if not exists public.vocab_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  pdf_document_id text references public.pdf_documents(id) on delete set null,
  pdf_name text,
  pdf_page integer,
  chapter text,
  section text,
  topic text not null default 'General',
  level text not null default 'B1',
  german text not null,
  article text,
  german_word text not null,
  plural text,
  bangla text not null default '',
  english text not null default '',
  example_german text,
  example_bangla text,
  example_english text,
  image_json jsonb,
  image_query text,
  source text not null default 'pdf',
  is_favorite boolean not null default false,
  srs_json jsonb not null,
  mistake_count integer not null default 0,
  correct_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- 3. Daily Study Stats table
create table if not exists public.study_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stats_json jsonb not null,
  updated_at timestamptz not null default now()
);

-- 4. Enable Row Level Security (RLS) on all tables
alter table public.pdf_documents enable row level security;
alter table public.vocab_items enable row level security;
alter table public.study_stats enable row level security;

-- 5. Strict User-Only RLS Policies
create policy "Users can manage their own pdf_documents"
  on public.pdf_documents
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own vocab_items"
  on public.vocab_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own study_stats"
  on public.study_stats
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Private Storage Bucket for User PDFs
insert into storage.buckets (id, name, public)
values ('user-pdfs', 'user-pdfs', false)
on conflict (id) do nothing;

create policy "Users can upload their own PDFs"
  on storage.objects
  for insert
  with check (
    bucket_id = 'user-pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read their own PDFs"
  on storage.objects
  for select
  using (
    bucket_id = 'user-pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own PDFs"
  on storage.objects
  for delete
  using (
    bucket_id = 'user-pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

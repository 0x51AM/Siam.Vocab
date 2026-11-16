# SiamVocab — Learn German Visually. Remember Forever.

SiamVocab is a responsive static web application for **Bengali-speaking learners of German** (also supporting English and German interfaces). It runs as a pure static site compatible with **Cloudflare Pages** (`npm run build` → `dist`), with optional **Supabase** cloud authentication, PostgreSQL database with Row Level Security (RLS), and private PDF storage.

---

## Core Features

- **Trilingual Interface**: Switch anytime between **বাংলা (Bengali)**, **English**, and **Deutsch (German)**.
- **4 Study Directions**:
  - Bangla → German (`bn-de`)
  - German → Bangla (`de-bn`)
  - English → German (`en-de`)
  - German → English (`de-en`)
- **PDF Upload, Extraction & OCR**:
  - Extracts text from German-Bangla-English PDFs using **PDF.js**.
  - Automatically runs **Tesseract.js OCR** (`deu + eng + ben`) for scanned pages or broken non-Unicode Bengali PDF fonts.
  - Preserves German umlauts (`ä, ö, ü`), `ß`, articles (`der, die, das`), plurals, example sentences, and page numbers.
  - **Review Screen** before importing: edit any cell, approve/reject rows, remove duplicates, and assign Topic & CEFR level. Never invents vocabulary.
- **Real Photographs (Wikimedia Commons)**:
  - Searches **Wikimedia Commons API** for genuine photos and displays author, license, and source link.
  - Never generates AI images; shows a neutral placeholder if no photo is available.
- **Study Modes & Spaced Repetition (SM-2)**:
  - Flashcards (with keyboard shortcuts `Space`, `1–4`, `A`, `F`)
  - Multiple-Choice Quizzes
  - Image Quizzes
  - Listening Practice (Browser `SpeechSynthesis` API + clickable `ä ö ü Ä Ö Ü ß` buttons)
  - Mistake Review, Favorites, and SM-2 Spaced Repetition
- **Installable PWA**: Works on Windows, macOS, Android, and iPhone/iPad browsers with offline cache support.

---

## Step 1: Run Locally

1. Install Node.js (v20+ recommended).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` (optional — the app also works immediately in Local Browser Mode without Supabase):
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

---

## Step 2: Set Up Supabase (Authentication, Database & Private PDF Storage)

1. Go to [https://supabase.com](https://supabase.com) and create a free account and a new project.
2. Open **SQL Editor** in your Supabase dashboard, click **New Query**, copy the entire contents of `supabase/schema.sql` from this repository, and click **Run**.
   - This creates `pdf_documents`, `vocab_items`, `study_stats`, enables **Row Level Security (RLS)** so users can only access their own data, and creates a private `user-pdfs` Storage bucket.
3. Go to **Project Settings → API** and copy:
   - **Project URL** (`VITE_SUPABASE_URL`)
   - **anon public key** (`VITE_SUPABASE_ANON_KEY`)
4. Put those two values into your local `.env` file (never commit `.env` to GitHub).

---

## Step 3: Push to GitHub

1. Create a new repository on GitHub.
2. Verify `.gitignore` includes `.env` and `dist` (already configured).
3. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial SiamVocab app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/siamvocab.git
   git push -u origin main
   ```

---

## Step 4: Deploy to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select your `siamvocab` GitHub repository.
3. Use these exact build settings:
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Under **Environment variables** (Production and Preview), add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key
5. Click **Save and Deploy**. Every future push to `main` on GitHub will automatically rebuild and deploy SiamVocab.

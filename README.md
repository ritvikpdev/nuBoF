# nuBoF — Sync Your Body's Fuel

> **Syncing your Body's Fuel with Precision Nutrition.**

Most apps just track what you eat. **nuBoF** treats your nutrition as fuel. By syncing your macronutrients and micronutrients directly to your body's specific needs, we eliminate the guesswork of performance.

---

## Repository layout

This workspace is a small monorepo: the root `package.json` is a meta-package for tooling hosts (for example Vercel). The **Next.js application** lives in **`nutrition-tracker/`** — clone the repo, then `cd nutrition-tracker` for install, env, and scripts.

---

## What nuBoF does

| Feature | Description |
|---|---|
| **Sync engine** | Calculates personalised calorie and macro targets using BMR + TDEE, then syncs every meal log against them in real time |
| **Nuri (AI assistant)** | In-app chat powered by Google Gemini; reads your profile, goals, and today's log (server-side) so answers stay grounded in your data |
| **Macro-Lens** | Donut chart and progress bars for protein, carbs, and fat |
| **Micro-Detailer** | Tracks iron, potassium, magnesium, vitamin C, and vitamin D against daily targets |
| **Meal splits** | Divide daily targets across breakfast, lunch, dinner (and custom splits) with drag-and-drop reordering |
| **Food search** | USDA FoodData Central via a server route; quantity and measurement inputs scale nutrition per serving |
| **Saved meals** | Build multi-ingredient meals, save them to your library, and quick-log in one tap |
| **Custom foods** | Add foods not in the database with full macro/micro values and reuse them anywhere |
| **Water tracking** | Log intake in ml or glasses; configurable daily goal |
| **History** | Browse past logs by date with a weekly calorie trend chart |
| **Settings** | Profile (including height/weight units), activity, goals, water preferences, theme, and target recalculation |
| **Dark mode** | Light / dark / system themes |

---

## Tech stack

- **Framework** — Next.js 16 (App Router) + TypeScript
- **UI** — React 19, Tailwind CSS v4, Radix UI / shadcn-style components
- **Database & auth** — Supabase (PostgreSQL + Row Level Security)
- **Server state** — TanStack React Query + React Hook Form
- **Charts** — Recharts
- **Animations** — Framer Motion
- **Validation** — Zod
- **AI** — Vercel AI SDK + `@ai-sdk/google` (Gemini) for streaming chat
- **Markdown in chat** — react-markdown + remark-gfm

---

## Local development

**Requirements:** Node.js **>= 20.9.0** (see `engines` in `package.json`).

1. **Install**

   ```bash
   cd nutrition-tracker
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and fill in values:

   | Variable | Purpose |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
   | `USDA_API_KEY` | [USDA FoodData Central](https://fdc.nal.usda.gov/api-key-signup) — server-only food search |
   | `GOOGLE_GENERATIVE_AI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) — server-only; powers Nuri. If omitted, the assistant returns a configuration error |

3. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are sent to `/auth/login`; after sign-up and onboarding, the app routes to `/dashboard`.

**Other scripts:** `npm run build`, `npm start`, `npm run lint`, `npm run format`, `npm run format:check`.

---

## How to use the app

1. **Sign up** — Create an account and verify your email (Supabase auth).
2. **Onboard** — Enter age, sex, height, weight, activity level, and goal. nuBoF calculates daily targets and stores them on your profile.
3. **Track food** — Search the database, set quantity and unit, pick a meal split, and log. Use the centre **+** in the bottom nav (mobile) to open Track Food.
4. **Dashboard** — Today's sync: calories vs target, Macro-Lens, Micro-Detailer, water, and per-meal breakdowns.
5. **Nuri** — Floating assistant (hidden on `/auth` and `/onboarding`). Ask about today's progress, meal ideas, or how app features work.
6. **Meals** — Build saved meals from ingredients for quick logging; add custom foods for anything missing from USDA.
7. **History** — Pick a past date to review logs and the weekly calorie trend.
8. **Settings** — Update profile, goals, water units, theme, and recalculated targets.

---

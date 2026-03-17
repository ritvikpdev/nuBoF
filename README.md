# nuBoF — Sync Your Body's Fuel

> **Syncing your Body's Fuel with Precision Nutrition.**

Most apps just track what you eat. **nuBoF** treats your nutrition as fuel. By syncing your Macronutrients and Micronutrients directly to your body's specific needs, we eliminate the guesswork of performance.

---

## What nuBoF Does

| Feature | Description |
|---|---|
| **Sync Engine** | Calculates your personalised calorie & macro targets using BMR + TDEE, then syncs every meal log against them in real-time |
| **Macro-Lens** | Visual donut chart + progress bars for Protein, Carbs and Fat |
| **Micro-Detailer** | Tracks Iron, Potassium, Magnesium, Vitamin C and Vitamin D against your daily targets |
| **Meal Splits** | Divide your daily targets across Breakfast, Lunch, Dinner (and custom splits) with drag-and-drop reordering |
| **Food Search** | Powered by the USDA FoodData Central API with smart quantity + measurement inputs |
| **Saved Meals** | Build multi-ingredient meals, save them to your library, and quick-log them in one tap |
| **Custom Foods** | Add any food not in the database with full macro/micro values and reuse it anywhere |
| **Water Tracking** | Log intake in ml or glasses; configurable daily goal |
| **History** | Browse past logs by date with a weekly calorie trend chart |
| **Dark Mode** | Full light/dark theme with system preference detection |

---

## Tech Stack

- **Framework** — Next.js 15 (App Router) + TypeScript
- **Database & Auth** — Supabase (PostgreSQL + Row Level Security)
- **Styling** — Tailwind CSS + ShadCN UI
- **State** — React Query (server state) + React Hook Form
- **Charts** — Recharts
- **Animations** — Framer Motion
- **Drag & Drop** — dnd-kit
- **Validation** — Zod

---


## How to Use

1. **Sign up** — create an account and verify your email.
2. **Onboard** — enter your age, sex, height, weight, activity level and goal. nuBoF calculates your daily targets and syncs them to your profile.
3. **Track Food** — search the nuBoF database, pick a quantity and measure, select a meal split (Breakfast / Lunch / Dinner), and log it.
4. **Dashboard** — view your Today's Sync summary: calories consumed vs. target, Macro-Lens chart, Micro-Detailer bars, water intake and per-meal breakdowns.
5. **Meals** — build saved meals from multiple ingredients for quick logging. Add custom foods for anything not in the database.
6. **History** — pick any past date to review your logs and weekly trend.

---


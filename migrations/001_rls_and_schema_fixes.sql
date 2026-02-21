-- ============================================================
-- NutriTrack — Required Schema Fixes & Row Level Security
-- Run this in your Supabase project:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. UNIQUE constraint on daily_goals.user_id
--    Allows the app to UPSERT instead of INSERT,
--    preventing duplicate goal rows per user.
ALTER TABLE daily_goals
  ADD CONSTRAINT daily_goals_user_id_key UNIQUE (user_id);

-- ============================================================
-- 2. Enable Row Level Security on all tables
-- ============================================================
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_meals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_ingredients   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS Policies: each user can only see and modify their own rows
-- ============================================================

-- users
CREATE POLICY "users: own row only"
  ON users FOR ALL
  USING (auth.uid() = id);

-- daily_goals
CREATE POLICY "daily_goals: own rows only"
  ON daily_goals FOR ALL
  USING (auth.uid() = user_id);

-- food_logs
CREATE POLICY "food_logs: own rows only"
  ON food_logs FOR ALL
  USING (auth.uid() = user_id);

-- saved_meals
CREATE POLICY "saved_meals: own rows only"
  ON saved_meals FOR ALL
  USING (auth.uid() = user_id);

-- meal_ingredients: accessible when the user owns the parent saved_meal
CREATE POLICY "meal_ingredients: own rows only"
  ON meal_ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM saved_meals
      WHERE saved_meals.id = meal_ingredients.meal_id
        AND saved_meals.user_id = auth.uid()
    )
  );

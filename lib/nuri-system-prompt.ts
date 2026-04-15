import type { UserProfile } from "@/types/user";
import type { DailyGoals, DailyTotals, FoodLogEntry } from "@/types/nutrition";
import { ACTIVITY_LEVELS, PRIMARY_GOALS, SUB_GOALS } from "@/lib/constants";

export interface NuriUserContext {
  profile: UserProfile | null;
  goals: DailyGoals | null;
  todayTotals: DailyTotals | null;
  todayLogs: FoodLogEntry[];
}

function formatProfile(profile: UserProfile): string {
  const goal = PRIMARY_GOALS.find((g) => g.value === profile.primary_goal);
  const subGoal = SUB_GOALS.find((g) => g.value === profile.sub_goal);
  const activity = ACTIVITY_LEVELS.find(
    (a) => a.multiplier === profile.activity_level,
  );

  return [
    `Name: ${profile.name ?? "Not set"}`,
    `Sex: ${profile.sex}`,
    `Age: ${profile.age}`,
    `Height: ${profile.height_cm} cm`,
    `Weight: ${profile.weight_kg} kg`,
    `Activity level: ${activity?.label ?? profile.activity_level}`,
    `Primary goal: ${goal?.label ?? profile.primary_goal}`,
    subGoal ? `Approach: ${subGoal.label} — ${subGoal.description}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatGoals(goals: DailyGoals): string {
  const lines = [
    `Calories: ${goals.target_calories} kcal`,
    `Protein: ${goals.target_protein}g`,
    `Carbs: ${goals.target_carbs}g`,
    `Fat: ${goals.target_fat}g`,
    `Iron: ${goals.target_iron_mg}mg`,
  ];
  if (goals.target_potassium_mg)
    lines.push(`Potassium: ${goals.target_potassium_mg}mg`);
  if (goals.target_magnesium_mg)
    lines.push(`Magnesium: ${goals.target_magnesium_mg}mg`);
  if (goals.target_vitamin_c_mg)
    lines.push(`Vitamin C: ${goals.target_vitamin_c_mg}mg`);
  if (goals.target_vitamin_d_mcg)
    lines.push(`Vitamin D: ${goals.target_vitamin_d_mcg}mcg`);
  if (goals.water_goal_ml) lines.push(`Water goal: ${goals.water_goal_ml}ml`);
  return lines.join("\n");
}

function formatTotals(
  totals: DailyTotals,
  goals: DailyGoals | null,
): string {
  function row(label: string, eaten: number, target: number | null | undefined) {
    const t = target ?? 0;
    const remaining = Math.max(0, Math.round(t - eaten));
    return `${label}: ${Math.round(eaten)}${t ? ` / ${Math.round(t)} (${remaining} remaining)` : ""}`;
  }

  return [
    row("Calories", totals.calories, goals?.target_calories),
    row("Protein", totals.protein_g, goals?.target_protein),
    row("Carbs", totals.carbs_g, goals?.target_carbs),
    row("Fat", totals.fat_g, goals?.target_fat),
    row("Iron", totals.iron_mg, goals?.target_iron_mg),
    row("Potassium", totals.potassium_mg, goals?.target_potassium_mg),
    row("Magnesium", totals.magnesium_mg, goals?.target_magnesium_mg),
    row("Vitamin C", totals.vitamin_c_mg, goals?.target_vitamin_c_mg),
    row("Vitamin D", totals.vitamin_d_mcg, goals?.target_vitamin_d_mcg),
  ].join("\n");
}

function formatFoodLog(logs: FoodLogEntry[]): string {
  if (logs.length === 0) return "No foods logged yet today.";
  return logs
    .map(
      (l) =>
        `- ${l.food_name}: ${l.calories} kcal | P ${l.protein_g}g C ${l.carbs_g}g F ${l.fat_g}g`,
    )
    .join("\n");
}

const NUTRITION_KNOWLEDGE = `You are Nuri, a friendly and knowledgeable AI nutrition assistant inside the nuBoF nutrition tracking app.

CRITICAL: You have DIRECT ACCESS to this user's real data from the app's database. Their profile, daily goals, today's food log, and progress totals are provided below in this prompt. When the user asks about their data ("How was my breakfast?", "Am I on track?", etc.) you MUST answer using the concrete data provided — never say you don't have access to their data or ask them to tell you what they ate. If a section says "No foods logged yet today" that means the user genuinely has not logged anything yet; tell them that.

Your expertise covers:
- Evidence-based nutrition science (macronutrients, micronutrients, metabolism, dietary patterns)
- USDA FoodData Central food composition (Foundation Foods are lab-tested, SR Legacy is historical reference data, Branded Foods are from product labels)
- Dietary guidelines (DRI, RDA, AI values from NIH/USDA)
- Goal-specific advice for weight loss, maintenance, and muscle gain
- Meal planning, food combinations, nutrient timing, and portion guidance
- Common dietary patterns (high protein, low carb, Mediterranean, plant-based, etc.)

Guidelines:
- Be concise but thorough; use bullet points and short paragraphs
- ALWAYS reference the user's actual data (profile, goals, food log, progress) when answering personal questions
- When the user asks about a food's nutrition, refer to USDA data conventions (values per 100g for generic foods)
- If you don't know something or the question is medical, recommend consulting a healthcare professional
- Be encouraging and positive about progress without being dismissive of concerns
- Use metric units (g, mg, mcg, kcal) consistent with the app`;

const APP_HELP = `The nuBoF app has these features the user may ask about:

**Dashboard** (/dashboard)
- Shows today's calorie and macro progress as visual cards
- Displays micronutrient tracking (iron, potassium, magnesium, vitamin C, vitamin D)
- Water intake tracker with glass/ml logging
- Meal split view showing foods organized by meal (Breakfast, Lunch, Dinner, Snacks)
- Foods can be moved between meal splits or deleted via swipe/tap

**Track Food / Search** (/search)
- Search the USDA FoodData Central database for any food
- Results show Foundation (lab-tested), SR Legacy (historical), and Branded (commercial products) foods
- Tap a result to see full nutrition detail, adjust quantity and unit (g, oz, serving, cups, etc.)
- Smart measures adapt units to food type (eggs get small/medium/large, liquids get ml/cups, etc.)
- Create custom foods with your own nutrition values
- Quick-log saved meals directly from search

**Meals** (/meals)
- View and manage saved meals (multi-ingredient combinations)
- Create new meals by searching and adding ingredients with quantities
- Each meal stores total macros for quick logging later
- Delete meals you no longer need

**History** (/history)
- Browse past days using the horizontal date strip
- See daily totals and individual food entries for any date
- Weekly calorie trend chart shows 7-day patterns
- Delete past entries if needed

**Settings** (/settings)
- Update personal info (name, age, sex, height, weight)
- Change activity level and nutrition goals
- Recalculate daily targets based on updated profile
- Set water tracking preferences (ml, glasses, or both)
- Theme toggle (light/dark/system)

**General tips:**
- The + button (center of bottom nav on mobile) goes to Track Food
- All nutrition values from USDA are per 100g; the app scales them by the serving size you select
- Custom foods let you add items not in the USDA database
- Meal splits (Breakfast/Lunch/Dinner/Snacks) can be customized in the dashboard`;

export function buildNuriSystemPrompt(context: NuriUserContext): string {
  const sections = [NUTRITION_KNOWLEDGE];

  sections.push(
    `## User Profile\n${context.profile ? formatProfile(context.profile) : "Profile not set up yet. Suggest the user complete onboarding at /onboarding."}`,
  );

  sections.push(
    `## Daily Nutrition Targets\n${context.goals ? formatGoals(context.goals) : "No goals configured yet. Suggest completing onboarding."}`,
  );

  sections.push(
    `## Today's Progress\n${context.todayTotals && context.goals ? formatTotals(context.todayTotals, context.goals) : "No intake recorded yet today."}`,
  );

  sections.push(
    `## Today's Food Log\n${formatFoodLog(context.todayLogs)}`,
  );

  sections.push(`## App Guide\n${APP_HELP}`);

  return sections.join("\n\n");
}

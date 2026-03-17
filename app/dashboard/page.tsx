"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useDailyGoals, useTodayLogs } from "@/hooks/use-nutrition";
import { useMealSplits } from "@/hooks/use-meal-splits";
import { useUserProfile } from "@/hooks/use-user-profile";
import { deleteLog, logFood } from "@/services/nutrition";
import type { FoodLogEntry, DailyGoals } from "@/types";
import { ZERO_TOTALS } from "@/lib/constants";
import { CaloriesCard } from "./_components/calories-card";
import { MacrosCard } from "./_components/macros-card";
import { MicrosCard } from "./_components/micros-card";
import { WaterCard } from "./_components/water-card";
import { MealSplitView } from "./_components/meal-split-view";
import { ManageSplitsModal } from "./_components/manage-splits-modal";
import { DashboardSkeleton } from "./_components/dashboard-skeleton";

export default function DashboardPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [manageSplitsOpen, setManageSplitsOpen] = useState(false);

  const {
    data: goals,
    isLoading: goalsLoading,
    error: goalsError,
  } = useDailyGoals(user?.id);
  const {
    data: logsData,
    isLoading: logsLoading,
    error: logsError,
  } = useTodayLogs(user?.id);
  const {
    data: splits = [],
    isLoading: splitsLoading,
  } = useMealSplits(user?.id);

  const { data: profile } = useUserProfile(user?.id);

  const isLoading = goalsLoading || logsLoading;

  const todayFormatted = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const totals = logsData?.totals ?? { ...ZERO_TOTALS };

  const targets = useMemo(
    () => ({
      calories:  goals?.target_calories      ?? 2000,
      protein:   goals?.target_protein       ?? 120,
      carbs:     goals?.target_carbs         ?? 250,
      fat:       goals?.target_fat           ?? 65,
      iron:      goals?.target_iron_mg       ?? 18,
      potassium: goals?.target_potassium_mg  ?? 3500,
      magnesium: goals?.target_magnesium_mg  ?? 400,
      vitaminC:  goals?.target_vitamin_c_mg  ?? 90,
      vitaminD:  goals?.target_vitamin_d_mcg ?? 20,
    }),
    [goals],
  );

  // Safe DailyGoals object for MealSplitSection (provides fallback defaults)
  const goalsForSplits: DailyGoals = useMemo(
    () => ({
      target_calories:     targets.calories,
      target_protein:      targets.protein,
      target_carbs:        targets.carbs,
      target_fat:          targets.fat,
      target_iron_mg:      targets.iron,
      target_potassium_mg: targets.potassium,
      target_magnesium_mg: targets.magnesium,
      target_vitamin_c_mg: targets.vitaminC,
      target_vitamin_d_mcg:targets.vitaminD,
    }),
    [targets],
  );

  const deleteLogMutation = useMutation({
    mutationFn: (logId: string) => deleteLog(logId),

    onMutate: async (logId) => {
      if (!user) return;
      await queryClient.cancelQueries({ queryKey: ["todayLogs", user.id] });
      const snapshot = queryClient.getQueryData<FoodLogEntry[]>(["todayLogs", user.id]);
      const deleted  = (snapshot ?? []).find((l) => l.id === logId);

      queryClient.setQueryData<FoodLogEntry[]>(
        ["todayLogs", user.id],
        (old) => (old ?? []).filter((l) => l.id !== logId),
      );

      return { snapshot, deleted };
    },

    onError: (err: Error, _logId, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(["todayLogs", user?.id], context.snapshot);
      }
      toast.error(`Could not remove entry: ${err.message}`);
    },

    onSuccess: (_data, _logId, context) => {
      void queryClient.invalidateQueries({ queryKey: ["todayLogs", user?.id] });

      const entry = context?.deleted;
      if (!entry || !user) {
        toast.success("Entry removed.");
        return;
      }

      toast("Entry removed.", {
        action: {
          label: "Undo",
          onClick: () => {
            void logFood(user.id, {
              foodId:       `undo-${entry.id}`,
              name:         entry.food_name     ?? "Unknown food",
              calories:     Number(entry.calories      ?? 0),
              protein_g:    Number(entry.protein_g     ?? 0),
              carbs_g:      Number(entry.carbs_g       ?? 0),
              fat_g:        Number(entry.fat_g         ?? 0),
              iron_mg:      Number(entry.iron_mg       ?? 0),
              potassium_mg: Number(entry.potassium_mg  ?? 0),
              magnesium_mg: Number(entry.magnesium_mg  ?? 0),
              vitamin_c_mg: Number(entry.vitamin_c_mg  ?? 0),
              vitamin_d_mcg:Number(entry.vitamin_d_mcg ?? 0),
            }, entry.meal_split_id ?? null).then(() =>
              queryClient.invalidateQueries({ queryKey: ["todayLogs", user.id] }),
            );
          },
        },
      });
    },
  });

  if (isLoading) return <DashboardSkeleton />;

  if (goalsError) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-destructive font-semibold mb-1">Failed to load dashboard</p>
          <p className="text-muted-foreground text-sm">{goalsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-muted/30">
      <div className="max-w-xl mx-auto px-4 py-6 pb-6 sm:pb-28 space-y-4">

        {/* Header */}
        <header className="pb-1">
          <h1 className="text-2xl font-bold text-foreground">Today&apos;s Sync</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{todayFormatted}</p>
        </header>

        {/* Onboarding nudge when no goals are set */}
        {!goals && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
              Your nutrition targets haven&apos;t been set yet.
            </p>
            <Link
              href="/onboarding"
              className="text-sm font-semibold text-amber-700 dark:text-amber-400 underline underline-offset-2"
            >
              Complete your profile →
            </Link>
          </div>
        )}

        {/* Logs fetch error */}
        {logsError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
            <p className="text-sm text-destructive font-medium">
              Could not load today&apos;s food log: {logsError.message}
            </p>
          </div>
        )}

        {/* 1 — Calories */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
        >
          <CaloriesCard consumed={totals.calories} target={targets.calories} />
        </motion.div>

        {/* 2 — Macros */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.13 }}
        >
          <MacrosCard
            totals={{ protein_g: totals.protein_g, carbs_g: totals.carbs_g, fat_g: totals.fat_g }}
            targets={{ protein: targets.protein, carbs: targets.carbs, fat: targets.fat }}
          />
        </motion.div>

        {/* 3 — Micronutrients */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.21 }}
        >
          <MicrosCard
            totals={{
              iron_mg: totals.iron_mg,
              potassium_mg: totals.potassium_mg,
              magnesium_mg: totals.magnesium_mg,
              vitamin_c_mg: totals.vitamin_c_mg,
              vitamin_d_mcg: totals.vitamin_d_mcg,
            }}
            targets={{
              iron: targets.iron,
              potassium: targets.potassium,
              magnesium: targets.magnesium,
              vitaminC: targets.vitaminC,
              vitaminD: targets.vitaminD,
            }}
          />
        </motion.div>

        {/* 4 — Water intake */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.27 }}
          >
            <WaterCard
              userId={user.id}
              goalMl={goals?.water_goal_ml ?? 2500}
              unit={profile?.water_unit ?? "ml"}
            />
          </motion.div>
        )}

        {/* 5 — Meal splits */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.29 }}
        >
          <MealSplitView
            splits={splits}
            splitsLoading={splitsLoading}
            logs={logsData?.logs ?? []}
            goals={goalsForSplits}
            onDelete={(id) => deleteLogMutation.mutate(id)}
            deletingId={deleteLogMutation.isPending ? deleteLogMutation.variables : undefined}
            onManage={() => setManageSplitsOpen(true)}
          />
        </motion.div>

      </div>

      {/* Desktop-only Add Food CTA (mobile uses the BottomNav FAB) */}
      <div className="hidden sm:block fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="max-w-xl mx-auto">
          <Link
            href="/search"
            className="block w-full py-3.5 text-center text-base font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-md active:scale-[0.98] transition-all"
          >
            + Add Food
          </Link>
        </div>
      </div>

      {/* Manage Splits Modal */}
      {user && (
        <ManageSplitsModal
          isOpen={manageSplitsOpen}
          onClose={() => setManageSplitsOpen(false)}
          splits={splits}
          userId={user.id}
        />
      )}
    </div>
  );
}

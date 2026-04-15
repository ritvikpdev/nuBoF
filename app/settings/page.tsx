"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useDailyGoals } from "@/hooks/use-nutrition";
import { upsertUserProfile, saveDailyGoals } from "@/services/user";
import { calculateTargets } from "@/lib/nutrition-calculator";
import { ACTIVITY_LEVELS, SUB_GOALS, PRIMARY_GOALS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { PrimaryGoalKey, SubGoalKey, ActivityLevelKey } from "@/types";

const ACTIVITIES: { value: ActivityLevelKey; icon: string; label: string; desc: string }[] = [
  { value: "sedentary", icon: "🛋️", label: "Sedentary",         desc: "Desk job, little or no exercise" },
  { value: "light",     icon: "🚶", label: "Lightly Active",     desc: "Light exercise 1–3 days per week" },
  { value: "moderate",  icon: "🏋️", label: "Moderately Active",  desc: "Moderate exercise 3–5 days per week" },
  { value: "very",      icon: "🔥", label: "Very Active",        desc: "Hard training 6–7 days per week" },
];

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: goals, isLoading: goalsLoading } = useDailyGoals(user?.id);

  const [editingGoal, setEditingGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<PrimaryGoalKey | null>(null);
  const [selectedSubGoal, setSelectedSubGoal] = useState<SubGoalKey | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Profile edit state ──
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileHeightCm, setProfileHeightCm] = useState("");
  const [profileHeightFt, setProfileHeightFt] = useState("");
  const [profileHeightIn, setProfileHeightIn] = useState("");
  const [profileHeightUnit, setProfileHeightUnit] = useState<"cm" | "ft-in">("cm");
  const [profileWeightKg, setProfileWeightKg] = useState("");
  const [profileWeightUnit, setProfileWeightUnit] = useState<"kg" | "lbs">("kg");
  const [profileActivity, setProfileActivity] = useState<ActivityLevelKey | null>(null);
  const [profileEditError, setProfileEditError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const activeGoal = selectedGoal ?? profile?.primary_goal ?? null;
  const activeSubGoal = selectedSubGoal ?? (profile?.sub_goal as SubGoalKey | null) ?? null;
  const hasChanges = selectedGoal !== null || selectedSubGoal !== null;

  const filteredSubGoals = activeGoal
    ? SUB_GOALS.filter((sg) => sg.parentGoal === activeGoal)
    : [];

  const preview = useMemo(() => {
    if (!profile || !activeGoal || !activeSubGoal) return null;
    const actEntry = ACTIVITY_LEVELS.find(
      (a) => Math.abs(a.multiplier - profile.activity_level) < 0.01,
    );
    const multiplier = actEntry?.multiplier ?? profile.activity_level;
    return calculateTargets(
      profile.weight_kg,
      profile.height_cm,
      profile.age,
      profile.sex,
      multiplier,
      activeGoal,
      activeSubGoal,
    );
  }, [profile, activeGoal, activeSubGoal]);

  async function handleSave() {
    if (!user || !profile || !activeGoal || !activeSubGoal || !preview) return;
    setSaving(true);
    try {
      await upsertUserProfile(user.id, {
        name: profile.name ?? undefined,
        sex: profile.sex,
        age: profile.age,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        activity_level: profile.activity_level,
        primary_goal: activeGoal,
        sub_goal: activeSubGoal,
      });
      await saveDailyGoals(user.id, {
        target_calories: preview.targetCalories,
        target_protein: preview.targetProteinG,
        target_carbs: preview.targetCarbsG,
        target_fat: preview.targetFatG,
        target_iron_mg: preview.targetIronMg,
        target_potassium_mg: preview.targetPotassiumMg,
        target_magnesium_mg: preview.targetMagnesiumMg,
        target_vitamin_c_mg: preview.targetVitaminCMg,
        target_vitamin_d_mcg: preview.targetVitaminDMcg,
      });
      await queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["dailyGoals", user.id] });
      setSelectedGoal(null);
      setSelectedSubGoal(null);
      setEditingGoal(false);
      toast.success("Goals updated! Your nutrition targets have been recalculated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setSelectedGoal(null);
    setSelectedSubGoal(null);
    setEditingGoal(false);
  }

  function handleOpenProfileEdit() {
    if (!profile) return;
    // Pre-populate from current profile
    setProfileHeightCm(profile.height_cm.toString());
    const ft = Math.floor(profile.height_cm / 30.48);
    const inch = Math.round((profile.height_cm / 30.48 - ft) * 12);
    setProfileHeightFt(ft.toString());
    setProfileHeightIn(inch.toString());
    setProfileHeightUnit("cm");
    setProfileWeightKg(profile.weight_kg.toString());
    setProfileWeightUnit("kg");
    const actEntry = ACTIVITY_LEVELS.find(
      (a) => Math.abs(a.multiplier - profile.activity_level) < 0.01,
    );
    setProfileActivity((actEntry?.value as ActivityLevelKey) ?? null);
    setProfileEditError(null);
    setEditingProfile(true);
  }

  function handleCancelProfileEdit() {
    setEditingProfile(false);
    setProfileEditError(null);
  }

  async function handleSaveProfile() {
    if (!user || !profile) return;
    setProfileEditError(null);

    // Resolve height in cm
    let newHeightCm: number;
    if (profileHeightUnit === "cm") {
      const v = Number(profileHeightCm);
      if (isNaN(v) || v < 50 || v > 250) {
        setProfileEditError("Height must be between 50 and 250 cm.");
        return;
      }
      newHeightCm = Math.round(v);
    } else {
      const ft = Number(profileHeightFt);
      const inches = Number(profileHeightIn || "0");
      if (isNaN(ft) || ft < 1 || ft > 8) {
        setProfileEditError("Enter a valid feet value (1–8).");
        return;
      }
      if (isNaN(inches) || inches < 0 || inches >= 12) {
        setProfileEditError("Inches must be 0–11.");
        return;
      }
      newHeightCm = Math.round(ft * 30.48 + inches * 2.54);
    }

    // Resolve weight in kg
    let newWeightKg: number;
    if (profileWeightUnit === "kg") {
      const v = Number(profileWeightKg);
      if (isNaN(v) || v < 20 || v > 500) {
        setProfileEditError("Weight must be between 20 and 500 kg.");
        return;
      }
      newWeightKg = Math.round(v * 10) / 10;
    } else {
      const lbs = Number(profileWeightKg);
      if (isNaN(lbs) || lbs < 44 || lbs > 1100) {
        setProfileEditError("Weight must be between 44 and 1100 lbs.");
        return;
      }
      newWeightKg = Math.round(lbs * 0.453592 * 10) / 10;
    }

    if (!profileActivity) {
      setProfileEditError("Please select an activity level.");
      return;
    }

    const actEntry = ACTIVITY_LEVELS.find((a) => a.value === profileActivity);
    if (!actEntry) {
      setProfileEditError("Invalid activity level.");
      return;
    }

    setSavingProfile(true);
    try {
      await upsertUserProfile(user.id, {
        name: profile.name ?? undefined,
        sex: profile.sex,
        age: profile.age,
        height_cm: newHeightCm,
        weight_kg: newWeightKg,
        activity_level: actEntry.multiplier,
        primary_goal: profile.primary_goal,
        sub_goal: profile.sub_goal ?? undefined,
      });

      // Recalculate and persist nutrition targets with updated body metrics
      if (profile.primary_goal && profile.sub_goal) {
        const newTargets = calculateTargets(
          newWeightKg,
          newHeightCm,
          profile.age,
          profile.sex,
          actEntry.multiplier,
          profile.primary_goal,
          profile.sub_goal,
        );
        await saveDailyGoals(user.id, {
          target_calories: newTargets.targetCalories,
          target_protein: newTargets.targetProteinG,
          target_carbs: newTargets.targetCarbsG,
          target_fat: newTargets.targetFatG,
          target_iron_mg: newTargets.targetIronMg,
          target_potassium_mg: newTargets.targetPotassiumMg,
          target_magnesium_mg: newTargets.targetMagnesiumMg,
          target_vitamin_c_mg: newTargets.targetVitaminCMg,
          target_vitamin_d_mcg: newTargets.targetVitaminDMcg,
        });
        await queryClient.invalidateQueries({ queryKey: ["dailyGoals", user.id] });
      }

      await queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] });
      setEditingProfile(false);
      toast.success("Profile updated! Your nutrition targets have been recalculated.");
    } catch (err) {
      setProfileEditError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  if (profileLoading || goalsLoading) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] bg-muted/30">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm space-y-3">
          <p className="text-lg font-semibold text-foreground">No profile found</p>
          <p className="text-sm text-muted-foreground">Complete onboarding to set up your goals.</p>
          <Button asChild>
            <Link href="/onboarding">Go to Onboarding</Link>
          </Button>
        </div>
      </div>
    );
  }

  const activityLabel = ACTIVITY_LEVELS.find(
    (a) => Math.abs(a.multiplier - profile.activity_level) < 0.01,
  )?.label ?? `PAL ${profile.activity_level}`;

  const currentPg = PRIMARY_GOALS.find((p) => p.value === profile.primary_goal);
  const currentSg = profile.sub_goal
    ? SUB_GOALS.find((s) => s.value === profile.sub_goal)
    : undefined;

  const heightFt = Math.floor(profile.height_cm / 30.48);
  const heightIn = Math.round((profile.height_cm / 30.48 - heightFt) * 12);
  const weightLbs = Math.round(profile.weight_kg * 2.205);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-muted/30">
      <div className="max-w-xl mx-auto px-4 py-6 pb-28 sm:pb-8 space-y-5">

        <header>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your profile and nutrition goals</p>
        </header>

        {/* ── Profile card ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
        >
          {/* Section header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Profile
            </h2>
            {!editingProfile && (
              <button
                type="button"
                onClick={handleOpenProfileEdit}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>

          {/* Avatar + name row */}
          <div className="flex items-center gap-4 px-5 pb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-2xl flex-shrink-0">
              {profile.sex === "female" ? "👩" : "🧑"}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-lg text-foreground leading-tight truncate">
                {profile.name ?? user?.email?.split("@")[0] ?? "User"}
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                {profile.sex} · {profile.age} years old
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 border-t border-border/60">
            <ProfileStat label="Height" value={`${profile.height_cm} cm`} sub={`${heightFt}′${heightIn}″`} />
            <ProfileStat label="Weight" value={`${profile.weight_kg} kg`} sub={`${weightLbs} lbs`} divider />
            <ProfileStat label="Activity" value={activityLabel.split(" ")[0]} sub={activityLabel.split(" ").slice(1).join(" ")} divider />
          </div>

          {/* ── Inline profile editor ── */}
          <AnimatePresence>
            {editingProfile && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-border/60 pt-4 space-y-5">
                  <p className="text-xs text-muted-foreground">Update your body metrics:</p>

                  {/* Height */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Height</p>
                      <div className="inline-flex rounded-lg bg-muted p-0.5 gap-0.5">
                        {(["cm", "ft-in"] as const).map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setProfileHeightUnit(u)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                              profileHeightUnit === u
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {u === "cm" ? "cm" : "ft & in"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {profileHeightUnit === "cm" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          step="1"
                          value={profileHeightCm}
                          onChange={(e) => setProfileHeightCm(e.target.value)}
                          placeholder="170"
                          className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/50 text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-sm text-muted-foreground w-6">cm</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          step="1"
                          value={profileHeightFt}
                          onChange={(e) => setProfileHeightFt(e.target.value)}
                          placeholder="5"
                          className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/50 text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-sm text-muted-foreground w-4">ft</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          step="1"
                          value={profileHeightIn}
                          onChange={(e) => setProfileHeightIn(e.target.value)}
                          placeholder="8"
                          className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/50 text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-sm text-muted-foreground w-4">in</span>
                      </div>
                    )}
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Weight</p>
                      <div className="inline-flex rounded-lg bg-muted p-0.5 gap-0.5">
                        {(["kg", "lbs"] as const).map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => {
                              if (u === profileWeightUnit) return;
                              // Convert displayed value when switching units
                              const v = Number(profileWeightKg);
                              if (!isNaN(v) && v > 0) {
                                if (u === "lbs") {
                                  setProfileWeightKg(Math.round(v * 2.20462).toString());
                                } else {
                                  setProfileWeightKg((Math.round(v * 0.453592 * 10) / 10).toString());
                                }
                              }
                              setProfileWeightUnit(u);
                            }}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                              profileWeightUnit === u
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step={profileWeightUnit === "kg" ? "0.1" : "1"}
                        value={profileWeightKg}
                        onChange={(e) => setProfileWeightKg(e.target.value)}
                        placeholder={profileWeightUnit === "kg" ? "70" : "154"}
                        className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/50 text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-sm text-muted-foreground w-6">{profileWeightUnit}</span>
                    </div>
                  </div>

                  {/* Activity level */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Activity Level</p>
                    <div className="space-y-2">
                      {ACTIVITIES.map(({ value, icon, label, desc }) => {
                        const isActive = profileActivity === value;
                        return (
                          <motion.button
                            key={value}
                            type="button"
                            whileTap={{ scale: 0.985 }}
                            onClick={() => setProfileActivity(value)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              isActive
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                                : "border-border bg-background hover:border-emerald-300 dark:hover:border-emerald-700"
                            }`}
                          >
                            <span className="text-xl leading-none flex-shrink-0">{icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${isActive ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}>
                                {label}
                              </p>
                              <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
                              >
                                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" aria-hidden>
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error message */}
                  {profileEditError && (
                    <p className="text-sm text-destructive">{profileEditError}</p>
                  )}

                  {/* Action row */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelProfileEdit}
                      className="flex-1"
                      disabled={savingProfile}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Saving…" : "Save Profile"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── Current goal card ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Current Goal
            </h2>
            {!editingGoal && (
              <button
                type="button"
                onClick={() => setEditingGoal(true)}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                Change
              </button>
            )}
          </div>

          {/* Goal display */}
          <div className="px-5 pb-5">
            {currentPg ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-lg flex-shrink-0">
                  {currentSg?.icon ?? (profile.primary_goal === "lose" ? "📉" : profile.primary_goal === "gain" ? "💪" : "⚖️")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {currentSg?.label ?? currentPg.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentSg?.description ?? `${currentPg.label} — no approach selected yet`}
                  </p>
                  {currentSg && (
                    <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                      {currentPg.label}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No goal set yet.</p>
            )}
          </div>

          {/* ── Inline goal editor ── */}
          <AnimatePresence>
            {editingGoal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-border/60 pt-4 space-y-4">
                  <p className="text-xs text-muted-foreground">Select a new goal and approach:</p>

                  {/* Primary goal tabs */}
                  <div className="flex gap-2">
                    {PRIMARY_GOALS.map(({ value, label }) => {
                      const isActive = activeGoal === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setSelectedGoal(value);
                            setSelectedSubGoal(null);
                          }}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            isActive
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sub-goals */}
                  {activeGoal && (
                    <div className="space-y-2">
                      {filteredSubGoals.map((sg) => {
                        const isActive = activeSubGoal === sg.value;
                        return (
                          <motion.button
                            key={sg.value}
                            type="button"
                            whileTap={{ scale: 0.985 }}
                            onClick={() => setSelectedSubGoal(sg.value)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              isActive
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                                : "border-border bg-background hover:border-emerald-300 dark:hover:border-emerald-700"
                            }`}
                          >
                            <span className="text-xl leading-none">{sg.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${isActive ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}>
                                {sg.label}
                              </p>
                              <p className="text-xs text-muted-foreground">{sg.description}</p>
                            </div>
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
                              >
                                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" aria-hidden>
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Editor action row */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="flex-1"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleSave}
                      disabled={!hasChanges || !activeSubGoal || saving}
                    >
                      {saving ? "Saving…" : "Save Goal"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── Nutrition targets card ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="bg-card rounded-2xl border border-border shadow-sm p-5"
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            {hasChanges && preview ? "New Targets Preview" : "Nutrition Targets"}
          </h2>

          {(preview ?? goals) ? (
            <>
              {/* Macro targets */}
              <div className="grid grid-cols-2 gap-3">
                <TargetItem
                  label="Calories"
                  value={`${preview?.targetCalories ?? goals?.target_calories ?? "—"} kcal`}
                  highlight
                  changed={hasChanges && preview ? preview.targetCalories !== (goals?.target_calories ?? 0) : false}
                />
                <TargetItem
                  label="Protein"
                  value={`${preview?.targetProteinG ?? goals?.target_protein ?? "—"}g`}
                  changed={hasChanges && preview ? preview.targetProteinG !== (goals?.target_protein ?? 0) : false}
                />
                <TargetItem
                  label="Carbs"
                  value={`${preview?.targetCarbsG ?? goals?.target_carbs ?? "—"}g`}
                  changed={hasChanges && preview ? preview.targetCarbsG !== (goals?.target_carbs ?? 0) : false}
                />
                <TargetItem
                  label="Fat"
                  value={`${preview?.targetFatG ?? goals?.target_fat ?? "—"}g`}
                  changed={hasChanges && preview ? preview.targetFatG !== (goals?.target_fat ?? 0) : false}
                />
              </div>

              {/* Micro targets */}
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/50">
                <TargetItem label="Iron" value={`${preview?.targetIronMg ?? goals?.target_iron_mg ?? "—"}mg`} small />
                <TargetItem label="Potassium" value={`${preview?.targetPotassiumMg ?? goals?.target_potassium_mg ?? "—"}mg`} small />
                <TargetItem label="Magnesium" value={`${preview?.targetMagnesiumMg ?? goals?.target_magnesium_mg ?? "—"}mg`} small />
                <TargetItem label="Vitamin C" value={`${preview?.targetVitaminCMg ?? goals?.target_vitamin_c_mg ?? "—"}mg`} small />
                <TargetItem label="Vitamin D" value={`${preview?.targetVitaminDMcg ?? goals?.target_vitamin_d_mcg ?? "—"}mcg`} small />
                {goals?.water_goal_ml && (
                  <TargetItem label="Water" value={`${goals.water_goal_ml}ml`} small />
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No targets set. Complete onboarding to generate your targets.</p>
          )}
        </motion.section>

        {/* ── Danger zone ── */}
        <section className="pt-2 pb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
          >
            Log out
          </button>
          <span className="text-xs text-muted-foreground">{user?.email}</span>
        </section>

      </div>
    </div>
  );
}

function ProfileStat({
  label,
  value,
  sub,
  divider,
}: {
  label: string;
  value: string;
  sub?: string;
  divider?: boolean;
}) {
  return (
    <div className={`py-3 px-4 text-center ${divider ? "border-l border-border/60" : ""}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function TargetItem({
  label,
  value,
  highlight,
  small,
  changed,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
  changed?: boolean;
}) {
  return (
    <div className={`rounded-xl ${small ? "p-2" : "p-3"} ${changed ? "bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-400/40" : "bg-muted/50"} relative`}>
      <p className={`text-muted-foreground ${small ? "text-[10px]" : "text-xs"}`}>{label}</p>
      <p className={`font-bold tabular-nums ${
        highlight
          ? "text-emerald-600 dark:text-emerald-400 text-lg"
          : small
            ? "text-sm text-foreground"
            : "text-foreground"
      }`}>
        {value}
      </p>
      {changed && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
      )}
    </div>
  );
}

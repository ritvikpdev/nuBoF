"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { upsertUserProfile, saveDailyGoals } from "@/services/user";
import { calculateTargets } from "@/lib/nutrition-calculator";
import { ACTIVITY_LEVELS } from "@/lib/constants";
import { StepAge } from "./_components/step-age";
import { StepSex } from "./_components/step-sex";
import { StepHeight } from "./_components/step-height";
import { StepWeight } from "./_components/step-weight";
import { StepActivity } from "./_components/step-activity";
import { StepGoal } from "./_components/step-goal";
import type { BiologicalSex, ActivityLevelKey, PrimaryGoalKey } from "@/types";

interface OnboardingData {
  age?: number;
  sex?: BiologicalSex;
  height_cm?: number;
  weight_kg?: number;
  activity_level?: ActivityLevelKey;
  primary_goal?: PrimaryGoalKey;
}

const TOTAL_STEPS = 6;

/** Slide variants — direction 1 = forward, -1 = backward */
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "52%" : "-52%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-52%" : "52%",
    opacity: 0,
  }),
};

const transition = { duration: 0.38, ease: [0.4, 0, 0.2, 1] } as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({});
  const [submitting, setSubmitting] = useState(false);

  function goNext<T extends Partial<OnboardingData>>(stepData: T) {
    setFormData((prev) => ({ ...prev, ...stepData }));
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    if (step === 0 || submitting) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }

  async function handleFinish(goalData: { primary_goal: PrimaryGoalKey }) {
    const final = { ...formData, ...goalData };

    if (!user) {
      toast.error("Session expired. Please log in again.");
      router.push("/auth/login");
      return;
    }

    setSubmitting(true);
    try {
      const multiplier = ACTIVITY_LEVELS.find((a) => a.value === final.activity_level)!.multiplier;

      const targets = calculateTargets(
        final.weight_kg!,
        final.height_cm!,
        final.age!,
        final.sex!,
        multiplier,
        final.primary_goal!,
      );

      await upsertUserProfile(user.id, {
        sex: final.sex!,
        age: final.age!,
        height_cm: final.height_cm!,
        weight_kg: final.weight_kg!,
        activity_level: multiplier,
        primary_goal: final.primary_goal!,
      });

      await saveDailyGoals(user.id, {
        target_calories: targets.targetCalories,
        target_protein: targets.targetProteinG,
        target_carbs: targets.targetCarbsG,
        target_fat: targets.targetFatG,
        target_iron_mg: targets.targetIronMg,
        target_potassium_mg: targets.targetPotassiumMg,
        target_magnesium_mg: targets.targetMagnesiumMg,
        target_vitamin_c_mg: targets.targetVitaminCMg,
        target_vitamin_d_mcg: targets.targetVitaminDMcg,
      });

      toast.success("Your profile is set up! Let's start tracking.");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  // Progress starts at 0 on step 0, reaches 100% only when the last step completes
  const progressPct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Progress bar ── */}
      <div className="h-1 w-full bg-muted flex-shrink-0">
        <motion.div
          className="h-full w-full bg-emerald-500 rounded-r-full origin-left"
          animate={{ scaleX: progressPct / 100 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* ── Top navigation row ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
        <motion.button
          animate={{ opacity: step > 0 && !submitting ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          onClick={goBack}
          disabled={step === 0 || submitting}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
          aria-label="Go back"
        >
          ← Back
        </motion.button>

        <span className="text-sm font-medium text-muted-foreground tabular-nums select-none">
          {step + 1} / {TOTAL_STEPS}
        </span>
      </div>

      {/* ── Step content ──
          Inline conditionals instead of an array so React only mounts the current
          step, and AnimatePresence receives a stable key-per-step. */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-5 pb-12 pt-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="w-full max-w-md"
          >
            {step === 0 && <StepAge      defaultValue={formData.age}            onNext={goNext} />}
            {step === 1 && <StepSex      defaultValue={formData.sex}            onNext={goNext} />}
            {step === 2 && <StepHeight   defaultValue={formData.height_cm}      onNext={goNext} />}
            {step === 3 && <StepWeight   defaultValue={formData.weight_kg}      onNext={goNext} />}
            {step === 4 && <StepActivity defaultValue={formData.activity_level} onNext={goNext} />}
            {step === 5 && (
              <StepGoal
                defaultValue={formData.primary_goal}
                onNext={handleFinish}
                submitting={submitting}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useCreateCustomFood } from "@/hooks/use-custom-foods";

// ─── Schema ───────────────────────────────────────────────────────────────────

const positiveNum = z.string().refine(
  (v) => v === "" || Number(v) >= 0,
  { message: "Must be 0 or more" },
);

const schema = z.object({
  name:          z.string().min(1, "Name is required").max(100),
  serving_size:  z.string().refine((v) => Number(v) > 0, { message: "Must be greater than 0" }),
  serving_unit:  z.enum(["g", "oz", "ml"]),
  calories:      z.string().refine((v) => Number(v) >= 0, { message: "Must be 0 or more" }),
  protein_g:     positiveNum,
  carbs_g:       positiveNum,
  fat_g:         positiveNum,
  // Micros optional
  iron_mg:       positiveNum,
  potassium_mg:  positiveNum,
  magnesium_mg:  positiveNum,
  vitamin_c_mg:  positiveNum,
  vitamin_d_mcg: positiveNum,
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function NumberInput({
  placeholder,
  error,
  unit,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  placeholder?: string;
  error?: string;
  unit?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        step="any"
        placeholder={placeholder ?? "0"}
        {...props}
        className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
      />
      {unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {unit}
        </span>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomFoodSheet({ isOpen, onClose, userId }: Props) {
  const [showMicros, setShowMicros] = useState(false);
  const createMutation = useCreateCustomFood(userId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      serving_size: "100",
      serving_unit: "g",
      calories: "",
      protein_g: "",
      carbs_g: "",
      fat_g: "",
      iron_mg: "",
      potassium_mg: "",
      magnesium_mg: "",
      vitamin_c_mg: "",
      vitamin_d_mcg: "",
    },
  });

  const servingUnit = watch("serving_unit");

  // Reset form when sheet opens
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (isOpen) {
      reset();
      setShowMicros(false);
    }
  }, [isOpen, reset]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  async function onSubmit(values: FormValues) {
    try {
      await createMutation.mutateAsync({
        name:          values.name.trim(),
        serving_size:  Number(values.serving_size),
        serving_unit:  values.serving_unit,
        calories:      Math.round(Number(values.calories)),
        protein_g:     Number(values.protein_g)     || 0,
        carbs_g:       Number(values.carbs_g)       || 0,
        fat_g:         Number(values.fat_g)         || 0,
        iron_mg:       Number(values.iron_mg)       || 0,
        potassium_mg:  values.potassium_mg  ? Number(values.potassium_mg)  : null,
        magnesium_mg:  values.magnesium_mg  ? Number(values.magnesium_mg)  : null,
        vitamin_c_mg:  values.vitamin_c_mg  ? Number(values.vitamin_c_mg)  : null,
        vitamin_d_mcg: values.vitamin_d_mcg ? Number(values.vitamin_d_mcg) : null,
      });
      toast.success(`${values.name.trim()} added to your custom foods.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save custom food.");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-card rounded-t-3xl max-h-[92vh] sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-[480px] sm:rounded-2xl sm:bottom-8 sm:shadow-2xl"
            role="dialog"
            aria-modal
            aria-label="Create custom food"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-border flex-shrink-0">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
                  Custom Food
                </p>
                <h2 className="text-lg font-bold text-foreground">Create custom food</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Scrollable form body */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
            >
              {/* Name */}
              <Field label="Food name" error={errors.name?.message}>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="e.g. Homemade granola"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                />
              </Field>

              {/* Serving size */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Serving size (all values are per this amount)
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <NumberInput
                      {...register("serving_size")}
                      placeholder="100"
                      error={errors.serving_size?.message}
                    />
                    {errors.serving_size && (
                      <p className="text-xs text-destructive mt-1">{errors.serving_size.message}</p>
                    )}
                  </div>
                  {/* Unit chips */}
                  <div className="flex gap-1">
                    {(["g", "oz", "ml"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setValue("serving_unit", u)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                          servingUnit === u
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Macros */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Macros
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={`Calories (kcal per ${watch("serving_size") || "?"} ${servingUnit})`} error={errors.calories?.message}>
                    <NumberInput {...register("calories")} unit="kcal" />
                  </Field>
                  <Field label="Protein" error={errors.protein_g?.message}>
                    <NumberInput {...register("protein_g")} unit="g" />
                  </Field>
                  <Field label="Carbs" error={errors.carbs_g?.message}>
                    <NumberInput {...register("carbs_g")} unit="g" />
                  </Field>
                  <Field label="Fat" error={errors.fat_g?.message}>
                    <NumberInput {...register("fat_g")} unit="g" />
                  </Field>
                </div>
              </div>

              {/* Micronutrients — collapsible */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowMicros((s) => !s)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <motion.svg
                    animate={{ rotate: showMicros ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-3.5 h-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                  {showMicros ? "Hide" : "Add"} micronutrients (optional)
                </button>

                <AnimatePresence>
                  {showMicros && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <Field label="Iron" error={errors.iron_mg?.message}>
                          <NumberInput {...register("iron_mg")} unit="mg" />
                        </Field>
                        <Field label="Potassium" error={errors.potassium_mg?.message}>
                          <NumberInput {...register("potassium_mg")} unit="mg" />
                        </Field>
                        <Field label="Magnesium" error={errors.magnesium_mg?.message}>
                          <NumberInput {...register("magnesium_mg")} unit="mg" />
                        </Field>
                        <Field label="Vitamin C" error={errors.vitamin_c_mg?.message}>
                          <NumberInput {...register("vitamin_c_mg")} unit="mg" />
                        </Field>
                        <Field label="Vitamin D" error={errors.vitamin_d_mcg?.message}>
                          <NumberInput {...register("vitamin_d_mcg")} unit="mcg" />
                        </Field>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Spacer for sticky CTA */}
              <div className="h-4" />
            </form>

            {/* Sticky CTA */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-card">
              <button
                type="submit"
                form="custom-food-form"
                disabled={createMutation.isPending}
                onClick={handleSubmit(onSubmit)}
                className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold text-base transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Saving…
                  </span>
                ) : (
                  "Save custom food"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

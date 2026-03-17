"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const kgSchema = z.object({
  weight: z
    .string()
    .min(1, "Please enter your weight.")
    .refine((v) => !isNaN(Number(v)), "Must be a valid number.")
    .refine((v) => Number(v) >= 20, "Must be at least 20 kg.")
    .refine((v) => Number(v) <= 500, "Must be 500 kg or less."),
});

const lbsSchema = z.object({
  weight: z
    .string()
    .min(1, "Please enter your weight.")
    .refine((v) => !isNaN(Number(v)), "Must be a valid number.")
    .refine((v) => Number(v) >= 44, "Must be at least 44 lbs (20 kg).")
    .refine((v) => Number(v) <= 1100, "Must be 1100 lbs or less."),
});

type WeightValues = z.infer<typeof kgSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  defaultValue?: number;
  onNext: (data: { weight_kg: number }) => void;
}

// ─── Unit toggle ──────────────────────────────────────────────────────────────

function UnitToggle({
  unit,
  onChange,
}: {
  unit: "kg" | "lbs";
  onChange: (u: "kg" | "lbs") => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-muted p-1 gap-1 mb-10">
      {(["kg", "lbs"] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            unit === u
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

// ─── Shared weight form ───────────────────────────────────────────────────────

function WeightForm({
  unit,
  defaultValue,
  onNext,
}: Props & { unit: "kg" | "lbs" }) {
  const schema  = unit === "kg" ? kgSchema : lbsSchema;
  const placeholder = unit === "kg" ? "70" : "154";
  const defaultDisplay = defaultValue
    ? unit === "kg"
      ? defaultValue.toString()
      : (defaultValue / 0.453592).toFixed(0)
    : "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WeightValues>({
    resolver: zodResolver(schema),
    defaultValues: { weight: defaultDisplay },
  });

  function onSubmit(d: WeightValues) {
    const raw = parseFloat(d.weight);
    const kg  = unit === "kg" ? raw : raw * 0.453592;
    onNext({ weight_kg: Math.round(kg * 10) / 10 });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <div className="flex items-end justify-center gap-4">
          <input
            {...register("weight")}
            type="number"
            inputMode="decimal"
            step={unit === "kg" ? "0.1" : "1"}
            placeholder={placeholder}
            autoFocus
            className="w-36 text-center text-7xl font-bold bg-transparent border-b-2 border-muted-foreground/30 focus:border-primary outline-none transition-colors pb-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-foreground placeholder:text-muted-foreground/30"
          />
          <span className="text-2xl font-medium text-muted-foreground pb-3">{unit}</span>
        </div>
        {errors.weight && (
          <p className="text-destructive text-sm mt-4 text-center">{errors.weight.message}</p>
        )}
      </div>
      <Button type="submit" size="lg" className="w-full text-base font-semibold">
        Continue →
      </Button>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StepWeight({ defaultValue, onNext }: Props) {
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Your body
      </p>
      <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
        What&apos;s your weight?
      </h1>

      <div className="flex justify-center">
        <UnitToggle unit={unit} onChange={setUnit} />
      </div>

      <WeightForm key={unit} unit={unit} defaultValue={defaultValue} onNext={onNext} />
    </div>
  );
}

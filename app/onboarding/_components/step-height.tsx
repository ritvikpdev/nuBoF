"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const cmSchema = z.object({
  height_cm: z
    .string()
    .min(1, "Please enter your height.")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be a valid number.")
    .refine((v) => Number(v) >= 50, "Must be at least 50 cm.")
    .refine((v) => Number(v) <= 250, "Must be 250 cm or less."),
});

const ftInSchema = z.object({
  feet: z
    .string()
    .min(1, "Enter feet.")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 8, "Enter 1–8 ft."),
  inches: z
    .string()
    .refine(
      (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) < 12),
      "Enter 0–11 in.",
    ),
});

type CmValues  = z.infer<typeof cmSchema>;
type FtInValues = z.infer<typeof ftInSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  defaultValue?: number;
  onNext: (data: { height_cm: number }) => void;
}

// ─── Unit toggle ──────────────────────────────────────────────────────────────

function UnitToggle({
  unit,
  onChange,
}: {
  unit: "cm" | "ft-in";
  onChange: (u: "cm" | "ft-in") => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-muted p-1 gap-1 mb-10">
      {(["cm", "ft-in"] as const).map((u) => (
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
          {u === "cm" ? "cm" : "ft & in"}
        </button>
      ))}
    </div>
  );
}

// ─── CM form ──────────────────────────────────────────────────────────────────

function CmForm({ defaultValue, onNext }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CmValues>({
    resolver: zodResolver(cmSchema),
    defaultValues: { height_cm: defaultValue?.toString() ?? "" },
  });

  return (
    <form
      onSubmit={handleSubmit((d) => onNext({ height_cm: Math.round(parseFloat(d.height_cm)) }))}
      className="space-y-8"
    >
      <div>
        <div className="flex items-end justify-center gap-4">
          <input
            {...register("height_cm")}
            type="number"
            inputMode="numeric"
            step="1"
            placeholder="170"
            autoFocus
            className="w-40 text-center text-7xl font-bold bg-transparent border-b-2 border-muted-foreground/30 focus:border-primary outline-none transition-colors pb-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-foreground placeholder:text-muted-foreground/30"
          />
          <span className="text-2xl font-medium text-muted-foreground pb-3">cm</span>
        </div>
        {errors.height_cm && (
          <p className="text-destructive text-sm mt-4 text-center">{errors.height_cm.message}</p>
        )}
      </div>
      <Button type="submit" size="lg" className="w-full text-base font-semibold">
        Continue →
      </Button>
    </form>
  );
}

// ─── Ft + In form ─────────────────────────────────────────────────────────────

function FtInForm({ defaultValue, onNext }: Props) {
  // Pre-populate if we have a cm value
  const defaultFeet   = defaultValue ? Math.floor(defaultValue / 30.48) : undefined;
  const defaultInches = defaultValue
    ? Math.round((defaultValue / 2.54) % 12)
    : undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FtInValues>({
    resolver: zodResolver(ftInSchema),
    defaultValues: {
      feet:   defaultFeet?.toString()   ?? "",
      inches: defaultInches?.toString() ?? "",
    },
  });

  function onSubmit(d: FtInValues) {
    const cm = Number(d.feet) * 30.48 + (Number(d.inches) || 0) * 2.54;
    onNext({ height_cm: Math.round(cm) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <div className="flex items-end justify-center gap-3">
          {/* Feet */}
          <div className="flex flex-col items-center gap-2">
            <input
              {...register("feet")}
              type="number"
              inputMode="numeric"
              step="1"
              placeholder="5"
              autoFocus
              className="w-24 text-center text-7xl font-bold bg-transparent border-b-2 border-muted-foreground/30 focus:border-primary outline-none transition-colors pb-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-foreground placeholder:text-muted-foreground/30"
            />
            <span className="text-xl font-medium text-muted-foreground">ft</span>
          </div>

          {/* Inches */}
          <div className="flex flex-col items-center gap-2">
            <input
              {...register("inches")}
              type="number"
              inputMode="numeric"
              step="1"
              placeholder="8"
              className="w-24 text-center text-7xl font-bold bg-transparent border-b-2 border-muted-foreground/30 focus:border-primary outline-none transition-colors pb-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-foreground placeholder:text-muted-foreground/30"
            />
            <span className="text-xl font-medium text-muted-foreground">in</span>
          </div>
        </div>
        {(errors.feet || errors.inches) && (
          <p className="text-destructive text-sm mt-4 text-center">
            {errors.feet?.message ?? errors.inches?.message}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" className="w-full text-base font-semibold">
        Continue →
      </Button>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StepHeight({ defaultValue, onNext }: Props) {
  const [unit, setUnit] = useState<"cm" | "ft-in">("cm");

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Your body
      </p>
      <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
        What&apos;s your height?
      </h1>

      <div className="flex justify-center">
        <UnitToggle unit={unit} onChange={setUnit} />
      </div>

      {unit === "cm" ? (
        <CmForm defaultValue={defaultValue} onNext={onNext} />
      ) : (
        <FtInForm defaultValue={defaultValue} onNext={onNext} />
      )}
    </div>
  );
}

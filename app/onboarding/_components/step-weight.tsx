"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const schema = z.object({
  weight_kg: z
    .string()
    .min(1, "Please enter your weight.")
    .refine((v) => !isNaN(Number(v)), "Must be a valid number.")
    .refine((v) => Number(v) >= 20, "Must be at least 20 kg.")
    .refine((v) => Number(v) <= 500, "Must be 500 kg or less."),
});

type Values = z.infer<typeof schema>;

interface Props {
  defaultValue?: number;
  onNext: (data: { weight_kg: number }) => void;
}

export function StepWeight({ defaultValue, onNext }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { weight_kg: defaultValue?.toString() ?? "" },
  });

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Your body
      </p>
      <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
        What&apos;s your weight?
      </h1>
      <p className="text-muted-foreground mb-14">Enter your current weight in kilograms.</p>

      <form
        onSubmit={handleSubmit((data) => onNext({ weight_kg: parseFloat(data.weight_kg) }))}
        className="space-y-8"
      >
        <div>
          <div className="flex items-end justify-center gap-4">
            <input
              {...register("weight_kg")}
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="70"
              autoFocus
              className="w-36 text-center text-7xl font-bold bg-transparent border-b-2 border-muted-foreground/30 focus:border-emerald-500 outline-none transition-colors pb-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-foreground placeholder:text-muted-foreground/30"
            />
            <span className="text-2xl font-medium text-muted-foreground pb-3">kg</span>
          </div>
          {errors.weight_kg && (
            <p className="text-destructive text-sm mt-4" role="alert">
              {errors.weight_kg.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Continue →
        </Button>
      </form>
    </div>
  );
}

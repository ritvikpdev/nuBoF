"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";

// Form values stay as strings (HTML inputs always return strings).
// Zod validates them as strings and we convert to number at the submit boundary.
const schema = z.object({
  age: z
    .string()
    .min(1, "Please enter your age.")
    .refine((v) => !isNaN(Number(v)), "Must be a valid number.")
    .refine((v) => Number.isInteger(Number(v)), "Age must be a whole number.")
    .refine((v) => Number(v) >= 10, "Must be at least 10.")
    .refine((v) => Number(v) <= 120, "Must be 120 or less."),
});

type Values = z.infer<typeof schema>;

interface Props {
  defaultValue?: number;
  onNext: (data: { age: number }) => void;
}

export function StepAge({ defaultValue, onNext }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { age: defaultValue?.toString() ?? "" },
  });

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Let&apos;s get started
      </p>
      <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
        How old are you?
      </h1>
      <p className="text-muted-foreground mb-14">
        We use your age to estimate your metabolic rate.
      </p>

      <form
        onSubmit={handleSubmit((data) => onNext({ age: parseInt(data.age, 10) }))}
        className="space-y-8"
      >
        <div>
          <div className="flex items-end justify-center gap-4">
            <input
              {...register("age")}
              type="number"
              inputMode="numeric"
              placeholder="25"
              autoFocus
              className="w-36 text-center text-7xl font-bold bg-transparent border-b-2 border-muted-foreground/30 focus:border-emerald-500 outline-none transition-colors pb-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-foreground placeholder:text-muted-foreground/30"
            />
            <span className="text-2xl font-medium text-muted-foreground pb-3">yrs</span>
          </div>
          {errors.age && (
            <p className="text-destructive text-sm mt-4" role="alert">
              {errors.age.message}
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

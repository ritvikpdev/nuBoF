"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const schema = z.object({
  height_cm: z
    .string()
    .min(1, "Please enter your height.")
    .refine((v) => !isNaN(Number(v)), "Must be a valid number.")
    .refine((v) => Number(v) >= 50, "Must be at least 50 cm.")
    .refine((v) => Number(v) <= 250, "Must be 250 cm or less."),
});

type Values = z.infer<typeof schema>;

interface Props {
  defaultValue?: number;
  onNext: (data: { height_cm: number }) => void;
}

export function StepHeight({ defaultValue, onNext }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { height_cm: defaultValue?.toString() ?? "" },
  });

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Your body
      </p>
      <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
        What&apos;s your height?
      </h1>
      <p className="text-muted-foreground mb-14">Enter your height in centimetres.</p>

      <form
        onSubmit={handleSubmit((data) => onNext({ height_cm: parseFloat(data.height_cm) }))}
        className="space-y-8"
      >
        <div>
          <div className="flex items-end justify-center gap-4">
            <input
              {...register("height_cm")}
              type="number"
              inputMode="decimal"
              step="0.5"
              placeholder="170"
              autoFocus
              className="w-40 text-center text-7xl font-bold bg-transparent border-b-2 border-muted-foreground/30 focus:border-emerald-500 outline-none transition-colors pb-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-foreground placeholder:text-muted-foreground/30"
            />
            <span className="text-2xl font-medium text-muted-foreground pb-3">cm</span>
          </div>
          {errors.height_cm && (
            <p className="text-destructive text-sm mt-4" role="alert">
              {errors.height_cm.message}
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

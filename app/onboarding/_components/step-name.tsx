"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(1, "Please enter your name").max(50, "Name is too long"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  defaultValue?: string;
  onNext: (data: { name: string }) => void;
}

export function StepName({ defaultValue, onNext }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultValue ?? "" },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="w-full">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
        Welcome
      </p>
      <h1 className="text-4xl font-bold text-foreground mb-2 leading-tight">
        What&apos;s your name?
      </h1>
      <p className="text-muted-foreground text-base mb-10">
        We&apos;ll use it to personalise your experience.
      </p>

      <input
        {...register("name")}
        type="text"
        placeholder="e.g. Alex"
        autoFocus
        autoComplete="given-name"
        className="w-full text-3xl font-semibold text-center bg-transparent border-b-2 border-border focus:border-primary focus:outline-none py-3 placeholder:text-muted-foreground/40 transition-colors mb-2"
      />
      {errors.name && (
        <p className="text-sm text-destructive mt-2">{errors.name.message}</p>
      )}

      <button
        type="submit"
        className="mt-10 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
      >
        Continue
      </button>
    </form>
  );
}

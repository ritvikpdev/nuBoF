import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log In | nuBoF",
  description: "Sign in or create your nuBoF account.",
};

/**
 * LoginForm uses useSearchParams() which requires a Suspense boundary
 * when rendered inside the App Router.
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

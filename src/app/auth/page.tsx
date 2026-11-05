import { Suspense } from "react";
import { AuthView } from "@/components/auth";
import { Spinner } from "@/components/ui";

export const metadata = { title: "Sign in · VADO" };

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <AuthView />
    </Suspense>
  );
}

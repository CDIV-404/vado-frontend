"use client";

import { User } from "lucide-react";
import { useApp } from "@/components/providers";
import { EmptyState, Spinner } from "@/components/ui";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfileIndexPage() {
  const { user, ready, promptAuth } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace(`/profile/${user.username}`);
  }, [ready, user, router]);

  if (!ready || user) return <div className="min-h-dvh flex items-center justify-center"><Spinner /></div>;
  return (
    <div className="min-h-dvh flex items-center justify-center px-6 pb-24">
      <EmptyState
        icon={User}
        title="This is your future profile"
        sub="Sign in or create an account to claim your handle and start posting."
        action={
          <button onClick={() => promptAuth()} className="btn-primary rounded-xl px-6 py-3 text-sm font-bold text-white">
            Sign in to VADO
          </button>
        }
      />
    </div>
  );
}

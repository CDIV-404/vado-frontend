import { Suspense } from "react";
import { InboxView } from "@/components/inbox";
import { Spinner } from "@/components/ui";

export const metadata = { title: "Inbox · VADO" };

export default function InboxPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Spinner /></div>}>
      <InboxView />
    </Suspense>
  );
}

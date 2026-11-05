import { AppShell } from "@/components/shell";
import { AdminView } from "@/components/admin";

export const metadata = { title: "Moderation · VADO" };

export default function AdminPage() {
  return (
    <AppShell>
      <AdminView />
    </AppShell>
  );
}

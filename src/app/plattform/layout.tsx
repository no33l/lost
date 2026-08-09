import { PlatformShell } from "@/components/platform/PlatformShell";
import { requireUser } from "@/lib/session";
import type { Role } from "@/lib/rbac";

export default async function PlattformLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();
  return (
    <PlatformShell role={user.role as Role} displayName={user.displayName} email={user.email}>
      {children}
    </PlatformShell>
  );
}

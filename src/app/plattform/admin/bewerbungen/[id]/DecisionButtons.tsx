"use client";

import { useFormStatus } from "react-dom";
import {
  acceptApplication,
  contactApplicant,
  rejectApplication,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";

function PendingButton({
  variant,
  children,
}: {
  variant: "primary" | "secondary" | "ghost";
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {children}
    </Button>
  );
}

export function DecisionButtons({ applicationId }: { applicationId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={acceptApplication.bind(null, applicationId)}>
        <PendingButton variant="primary">Annehmen</PendingButton>
      </form>
      <form action={contactApplicant.bind(null, applicationId)}>
        <PendingButton variant="secondary">In Kontakt treten</PendingButton>
      </form>
      <form
        action={rejectApplication.bind(null, applicationId)}
        onSubmit={(event) => {
          if (
            !window.confirm(
              "Diese Bewerbung wirklich ablehnen? Die Entscheidung lässt sich nicht rückgängig machen."
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <PendingButton variant="ghost">Ablehnen</PendingButton>
      </form>
    </div>
  );
}

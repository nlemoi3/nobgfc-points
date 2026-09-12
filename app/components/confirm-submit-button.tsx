"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export default function ConfirmSubmitButton({
  children,
  confirmation,
  className,
  pendingLabel = "Working…",
}: {
  children: ReactNode;
  confirmation: string;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmation)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export default function ConfirmSubmitButton({
  children,
  confirmation,
  className,
  disabled = false,
  pendingLabel = "Working…",
}: {
  children: ReactNode;
  confirmation: string;
  className?: string;
  disabled?: boolean;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
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

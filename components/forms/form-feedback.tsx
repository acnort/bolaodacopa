"use client";

import type { ActionResult } from "@/lib/domain/types";

export function FormFeedback({
  state,
  field,
}: {
  state: ActionResult | undefined;
  field?: string;
}) {
  if (!state) return null;

  if (field) {
    const errors = state.fieldErrors?.[field];
    if (!errors?.length) return null;
    return <p className="text-sm text-[color:var(--danger-strong)]">{errors[0]}</p>;
  }

  return (
    <p
      className={
        state.ok
          ? "text-sm text-[color:var(--success-strong)]"
          : "text-sm text-[color:var(--danger-strong)]"
      }
    >
      {state.message}
    </p>
  );
}

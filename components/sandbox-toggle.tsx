"use client";

import { FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setSandboxEnabled, useSandboxEnabled } from "@/lib/sandbox-storage";

export function SandboxToggle() {
  const enabled = useSandboxEnabled();

  return (
    <Button
      type="button"
      variant={enabled ? "secondary" : "outline"}
      className="w-full justify-start"
      onClick={() => setSandboxEnabled(!enabled)}
    >
      <FlaskConical className="h-4 w-4" />
      {enabled ? "Sandbox ativo" : "Ativar sandbox"}
    </Button>
  );
}

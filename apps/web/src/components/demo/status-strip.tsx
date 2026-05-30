import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Tira de estado con pills (reemplaza la card-tabla de 4 columnas).
 * Solo presentación; el countdown se pasa como ReactNode.
 */
export function StatusStrip({
  statusLabel,
  statusVariant = "warning",
  executionLabel,
  canExecute,
  countdown,
}: {
  statusLabel: string;
  statusVariant?: "warning" | "success" | "destructive" | "secondary";
  executionLabel: string;
  canExecute: boolean;
  countdown?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={statusVariant}>{statusLabel}</Badge>
      <Badge variant={canExecute ? "success" : "secondary"}>
        {executionLabel}
      </Badge>
      {countdown}
      <Badge variant="outline" className="font-mono">
        canExecute: {String(canExecute)}
      </Badge>
    </div>
  );
}

import { Fragment } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_STEPS = [
  "Elegís un caso",
  "Respondés el reclamo",
  "Ver decisión",
];

/**
 * Mini stepper liviano para el flujo de demo. Solo presentación.
 * `current` resalta el paso activo (1-indexed); si se omite, ninguno se marca.
 */
export function DemoMiniStepper({
  steps = DEFAULT_STEPS,
  current,
  className,
}: {
  steps?: string[];
  current?: number;
  className?: string;
}) {
  return (
    <nav
      aria-label="Progreso de la demo"
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm",
        className,
      )}
    >
      {steps.map((label, i) => {
        const active = current === i + 1;
        return (
          <Fragment key={label}>
            <span
              className={cn(
                "inline-flex items-center gap-2",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full border text-[11px] font-semibold",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary",
                )}
              >
                {i + 1}
              </span>
              <span className="font-medium">{label}</span>
            </span>
            {i < steps.length - 1 && (
              <span aria-hidden className="text-muted-foreground px-0.5">
                →
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

import { Check, AlertTriangle, X, Equal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Tone } from "./lib";

const TONE_ICON: Record<Tone, React.ReactNode> = {
  success: <Check />,
  warning: <AlertTriangle />,
  danger: <X />,
  neutral: <Equal />,
};

const TONE_BG: Record<Tone, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-destructive/12 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

export function VerdictCard({
  headline,
  tone,
  canExecute,
  confidencePct,
}: {
  headline: string;
  tone: Tone;
  canExecute: boolean;
  confidencePct: number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center text-center">
        <span
          className={`mb-4 inline-flex size-14 items-center justify-center rounded-full [&>svg]:size-6 ${TONE_BG[tone]}`}
          aria-hidden
        >
          {TONE_ICON[tone]}
        </span>
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Decisión del agente
        </p>
        <h2 className="mt-2 max-w-[28ch] text-xl font-semibold tracking-tight">
          {headline}
        </h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge variant="success">Resuelto</Badge>
          <Badge variant={canExecute ? "success" : "warning"}>
            ¿Puede ejecutar? {canExecute ? "Sí" : "No"}
          </Badge>
        </div>

        <div className="mt-6 w-full max-w-xs">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confianza</span>
            <span className="font-medium">{confidencePct}%</span>
          </div>
          <Progress value={confidencePct} />
          <p className="text-muted-foreground mt-2 text-xs">
            Según la evidencia presentada y las reglas del contrato.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

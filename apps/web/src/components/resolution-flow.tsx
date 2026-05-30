"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Case } from "@mediation-rooms/config";
import { resolveCase } from "../lib/api";
import { VerdictCard } from "./demo/verdict-card";
import {
  OUTCOME_EXTERNAL_ACTION,
  OUTCOME_HEADLINE,
  execFromOutcome,
  outcomeTone,
  roleShortEs,
} from "./demo/lib";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Analysis {
  outcome: string;
  confidence: number;
  reasoning: string;
  recommendedAction: string;
  ruleEvaluations?: Array<{ rule: string; favoredRole: string; rationale: string }>;
}

interface ResolveResult {
  resolution: string;
  analysis: Analysis;
  arkiv?: { agentDecision?: { txUrl?: string } };
}

interface AuditEventLite {
  type: string;
  label: string;
  timestamp: string;
  txUrl?: string;
}

const CHECKLIST = [
  "Leyendo la evidencia del reclamante",
  "Leyendo tu respuesta",
  "Revisando las reglas del contrato",
  "Preparando la decisión",
];

function AgentReviewLoading() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i < CHECKLIST.length - 1 ? i + 1 : i));
    }, 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <Card>
      <CardContent className="flex flex-col items-center py-6 text-center">
        <span className="mr-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        <h2 className="mt-4 text-lg font-semibold">
          El agente está evaluando el caso
        </h2>
        <p className="text-muted-foreground mx-auto mt-1.5 max-w-md text-sm leading-relaxed">
          Compara el reclamo, la respuesta, la evidencia presentada y las reglas del
          contrato antes de producir una decisión.
        </p>
        <ul className="mx-auto mt-5 grid max-w-xs gap-3 text-left">
          {CHECKLIST.map((label, i) => {
            const done = i < index;
            const active = i === index;
            return (
              <li
                key={label}
                className={`flex items-center gap-2.5 text-sm ${
                  active
                    ? "text-foreground font-medium"
                    : done
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60"
                }`}
              >
                <span
                  className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                    done
                      ? "bg-success border-success text-white"
                      : "border-border"
                  }`}
                >
                  {done ? "✓" : ""}
                </span>
                {label}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ResolutionFlow({
  initialCase,
  initialAnalysis,
  claim,
  responseText,
  auditEvents = [],
}: {
  initialCase: Case;
  initialAnalysis?: Analysis;
  claim?: string;
  responseText?: string;
  auditEvents?: AuditEventLite[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "analyzing" | "done" | "error">(
    initialCase.status === "RESOLVED" ? "done" : "idle",
  );
  const [result, setResult] = useState<ResolveResult | null>(
    initialAnalysis
      ? { resolution: initialCase.resolution, analysis: initialAnalysis }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const runAgent = useCallback(async () => {
    setPhase("analyzing");
    setError(null);
    try {
      const data = (await resolveCase(initialCase.caseId)) as ResolveResult;
      setResult(data);
      setPhase("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al resolver");
      setPhase("error");
    }
  }, [initialCase.caseId, router]);

  useEffect(() => {
    if (initialCase.status === "DISPUTED" && !startedRef.current) {
      startedRef.current = true;
      void runAgent();
    }
  }, [initialCase.status, runAgent]);

  const analysis = result?.analysis ?? initialAnalysis;
  const outcome = result?.resolution ?? initialCase.resolution;

  if ((phase === "analyzing" || phase === "idle") && !analysis) {
    return <AgentReviewLoading />;
  }

  if (phase === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No se pudo completar la resolución</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Podés reintentar la resolución sin cambiar los datos del caso.
          </p>
          <Button type="button" className="w-fit" onClick={runAgent}>
            Reintentar resolución
          </Button>
          {error && (
            <Accordion type="single" collapsible>
              <AccordionItem value="err" className="border-b-0">
                <AccordionTrigger>Detalles técnicos</AccordionTrigger>
                <AccordionContent>
                  <p className="text-destructive font-mono text-sm">{error}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const tone = outcomeTone(outcome);
  const exec = execFromOutcome(outcome);
  const confidencePct = Math.round((analysis.confidence ?? 0) * 100);
  const techEvents = auditEvents.filter((e) => e.txUrl);
  const decisionTxUrl = result?.arkiv?.agentDecision?.txUrl;

  return (
    <div className="grid gap-5">
      <VerdictCard
        headline={OUTCOME_HEADLINE[outcome] ?? outcome}
        tone={tone}
        canExecute={exec.canExecute}
        confidencePct={confidencePct}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="text-base">Qué decidió</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {OUTCOME_HEADLINE[outcome] ?? outcome}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="text-base">Por qué decidió eso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {analysis.reasoning || "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="text-base">
              Qué debe hacer el sistema externo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {OUTCOME_EXTERNAL_ACTION[outcome] ?? "—"}
            </p>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Acción protegida</p>
              <code className="font-mono text-xs">
                {initialCase.externalAction.actionId}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" collapsible className="bg-card rounded-xl border px-5">
        <AccordionItem value="tech" className="border-b-0">
          <AccordionTrigger>Detalles técnicos</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-6 pt-1">
              {analysis.ruleEvaluations && analysis.ruleEvaluations.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium">
                    Evaluación regla por regla
                  </p>
                  <div className="grid gap-2.5">
                    {analysis.ruleEvaluations.map((ev, i) => {
                      const favTone =
                        ev.favoredRole === "RESPONDENT"
                          ? "success"
                          : ev.favoredRole === "CLAIMANT"
                            ? "warning"
                            : "secondary";
                      const favLabel =
                        ev.favoredRole === "NEUTRAL"
                          ? "Neutral"
                          : `Favorece al ${roleShortEs(ev.favoredRole).toLowerCase()}`;
                      return (
                        <div
                          key={i}
                          className="border-border rounded-md border p-3"
                        >
                          <div className="mb-1.5 flex items-start justify-between gap-3">
                            <p className="text-sm font-medium leading-snug">
                              Regla {i + 1}. {ev.rule}
                            </p>
                            <Badge variant={favTone}>{favLabel}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {ev.rationale}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium">
                  Chequeo de ejecución (<code className="font-mono text-xs">canExecute</code>)
                </p>
                <pre className="bg-[var(--code-bg)] text-[var(--code-text)] overflow-x-auto rounded-lg p-4 font-mono text-xs leading-relaxed">
{`{
  "canExecute": ${exec.canExecute},
  "resolution": "${outcome}",
  "reason": "${exec.reason}"
}`}
                </pre>
              </div>

              {(techEvents.length > 0 || decisionTxUrl) && (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Prueba técnica (Arkiv Braga)
                  </p>
                  <ul className="grid gap-2 text-sm">
                    {decisionTxUrl && (
                      <li>
                        <span className="font-medium">
                          Decisión del agente registrada
                        </span>
                        {" · "}
                        <a
                          className="text-foreground underline underline-offset-2"
                          href={decisionTxUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver transacción
                        </a>
                      </li>
                    )}
                    {techEvents.map((e, i) => (
                      <li key={`${e.type}-${i}`}>
                        <span className="font-medium">{e.label}</span>
                        {" · "}
                        <a
                          className="text-foreground underline underline-offset-2"
                          href={e.txUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver transacción
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" asChild>
          <a href={`/cases/${initialCase.caseId}`}>Ver caso cerrado</a>
        </Button>
        <Button variant="ghost" asChild>
          <a href="/sandbox">Iniciar otra demo</a>
        </Button>
      </div>
    </div>
  );
}

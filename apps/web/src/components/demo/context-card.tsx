import { FileText, Quote } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface EvidenceItem {
  description: string;
  txUrl?: string;
}

interface TraceEvent {
  label: string;
  timestamp: string;
  txUrl?: string;
}

export function ContextCard({
  title,
  actionLabel,
  claim,
  rules,
  claimantEvidence,
  events,
}: {
  title: string;
  actionLabel: string;
  claim?: string;
  rules: string[];
  claimantEvidence: EvidenceItem[];
  events: TraceEvent[];
}) {
  return (
    <Card className="gap-5">
      <CardHeader>
        <CardTitle className="text-base">El reclamo en tu contra</CardTitle>
        <p className="text-muted-foreground text-sm">
          {title} · {actionLabel} bloqueado · Cliente → vos
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Reclamo del cliente — protagonista */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Quote className="size-4" aria-hidden />
            Lo que reclama el cliente
          </p>
          <blockquote className="border-warning/60 bg-warning/8 rounded-r-md border-l-2 py-2.5 pr-3 pl-4 text-sm leading-relaxed">
            {claim ? `“${claim}”` : "Sin texto de reclamo."}
          </blockquote>
        </div>

        {/* Evidencia que presentó el cliente — visible */}
        <div>
          <p className="mb-2 text-sm font-semibold">
            Evidencia que presentó el cliente
          </p>
          {claimantEvidence.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No adjuntó evidencia inicial.
            </p>
          ) : (
            <ul className="grid gap-2">
              {claimantEvidence.map((ev, i) => (
                <li
                  key={i}
                  className="border-border flex items-start gap-2.5 rounded-md border p-2.5"
                >
                  <FileText
                    className="text-muted-foreground mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed">{ev.description}</p>
                    {ev.txUrl && (
                      <a
                        className="text-foreground text-xs underline underline-offset-2"
                        href={ev.txUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver prueba en Arkiv
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator />

        {/* Reglas del contrato — lo más importante, ahora visible */}
        <div>
          <p className="text-sm font-semibold">Reglas que evaluará el agente</p>
          <p className="text-muted-foreground mt-0.5 mb-3 text-xs leading-relaxed">
            Tu respuesta debería demostrar que cumpliste estos puntos. El agente
            compara el reclamo, tu respuesta y la evidencia contra cada regla.
          </p>
          {rules.length > 0 ? (
            <ol className="grid gap-2.5">
              {rules.map((rule, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="bg-accent text-foreground mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground text-sm">Sin reglas declaradas.</p>
          )}
        </div>

        {/* Traza técnica — secundaria, colapsada */}
        {events.length > 0 && (
          <Accordion type="single" collapsible className="border-t">
            <AccordionItem value="trace" className="border-b-0">
              <AccordionTrigger>Traza técnica</AccordionTrigger>
              <AccordionContent>
                <ol className="grid gap-2 text-sm">
                  {events.map((e, i) => (
                    <li key={i} className="flex flex-col gap-0.5">
                      <span className="font-medium">{e.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(e.timestamp).toLocaleString()}
                        {e.txUrl && (
                          <>
                            {" · "}
                            <a
                              className="text-foreground underline underline-offset-2"
                              href={e.txUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Ver transacción
                            </a>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

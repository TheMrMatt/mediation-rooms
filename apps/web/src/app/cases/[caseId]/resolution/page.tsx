import { ResolutionFlow } from "../../../../components/resolution-flow";
import { AppShell } from "../../../../components/app-shell";
import { PageHead } from "../../../../components/demo/page-head";
import { fetchAudit, fetchCase } from "../../../../lib/api";

const eventLabels: Record<string, string> = {
  CASE_CREATED: "Caso creado",
  EVIDENCE_SUBMITTED: "Evidencia presentada",
  DISPUTE_OPENED: "Disputa abierta",
  DISPUTE_RESPONSE: "Respuesta del reclamado",
  AGENT_DECISION: "Decisión del agente",
  CASE_RESOLVED: "Caso cerrado",
};

export default async function CaseResolutionPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const [caseRecord, audit] = await Promise.all([
    fetchCase(caseId),
    fetchAudit(caseId),
  ]);

  if (!caseRecord) {
    return (
      <AppShell>
        <PageHead title="Resolución" />
        <div className="mr-empty">
          <p className="mr-empty-title">Caso no encontrado</p>
          <a className="mr-btn mr-btn--secondary" href="/sandbox">Ir al sandbox</a>
        </div>
      </AppShell>
    );
  }

  const events = audit?.events ?? [];
  const decision = events.find((e) => e.eventType === "AGENT_DECISION");
  const responseEvent = events.find((e) => e.eventType === "DISPUTE_RESPONSE");
  const responseText = responseEvent
    ? String(responseEvent.payload?.response ?? responseEvent.payload?.statement ?? "") || undefined
    : undefined;

  const initialAnalysis = decision?.payload
    ? {
        outcome: String(decision.payload.outcome ?? caseRecord.resolution),
        confidence: Number(decision.payload.confidence ?? 0),
        reasoning: String(decision.payload.reasoning ?? ""),
        recommendedAction: String(decision.payload.recommendedAction ?? ""),
        ruleEvaluations: decision.payload.ruleEvaluations as
          | Array<{ rule: string; favoredRole: string; rationale: string }>
          | undefined,
      }
    : undefined;

  const auditEvents = events.map((e) => ({
    type: e.eventType,
    label: eventLabels[e.eventType] ?? e.eventType,
    timestamp: e.timestamp,
    txUrl: e.txUrl,
  }));

  return (
    <AppShell>
      <div className="mb-4">
        <a
          href={`/cases/${caseId}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Volver al caso
        </a>
        <p className="text-muted-foreground mt-2 text-xs font-medium tracking-wide uppercase">
          Paso 3 de 3 · Ver decisión
        </p>
      </div>
      <PageHead
        title="Decisión del agente"
        subtitle="El agente evaluó el reclamo, tu respuesta y las reglas del contrato para decidir si la acción externa puede ejecutarse."
      />

      <ResolutionFlow
        initialCase={caseRecord}
        initialAnalysis={initialAnalysis}
        claim={caseRecord.claim}
        responseText={responseText}
        auditEvents={auditEvents}
      />
    </AppShell>
  );
}

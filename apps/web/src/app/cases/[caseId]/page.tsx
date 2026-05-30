import { AppShell } from "../../../components/app-shell";
import { PageHead } from "../../../components/demo/page-head";
import { CountdownBadge } from "../../../components/demo/countdown-badge";
import { StatusStrip } from "../../../components/demo/status-strip";
import { ContextCard } from "../../../components/demo/context-card";
import { ResponseComposerCard } from "../../../components/demo/response-composer-card";
import { WalletRoleBar } from "../../../components/demo/wallet-role-bar";
import {
  actionLabelEs,
  caseTitleEs,
  executionStatus,
} from "../../../components/demo/lib";
import { fetchAudit, fetchCase } from "../../../lib/api";

const eventLabels: Record<string, string> = {
  CASE_CREATED: "Caso creado",
  CASE_UPDATED: "Caso actualizado",
  EVIDENCE_SUBMITTED: "Evidencia presentada",
  DISPUTE_OPENED: "Disputa abierta",
  DISPUTE_RESPONSE: "Respuesta del reclamado",
  AGENT_DECISION: "Decisión del agente",
  CASE_RESOLVED: "Caso cerrado",
};

export default async function CaseDetailPage({
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
        <PageHead title={`Disputa ${caseId}`} />
        <div className="mr-empty">
          <p className="mr-empty-title">Disputa no encontrada</p>
          <p className="mr-empty-sub">La disputa no existe o la API no está disponible.</p>
          <a className="mr-btn mr-btn--secondary" href="/sandbox">Ir al sandbox</a>
        </div>
      </AppShell>
    );
  }

  const events = audit?.events ?? [];
  const claimantEvidence = events.filter(
    (e) => e.eventType === "EVIDENCE_SUBMITTED" && (e.payload?.role as string) === "CLAIMANT",
  );
  const respondentEvidence = events.filter(
    (e) => e.eventType === "EVIDENCE_SUBMITTED" && (e.payload?.role as string) === "RESPONDENT",
  );
  const responseEvent = events.find((e) => e.eventType === "DISPUTE_RESPONSE");
  const responseText = responseEvent
    ? String(responseEvent.payload?.response ?? responseEvent.payload?.statement ?? "") || undefined
    : undefined;
  const hasResponse = !!responseEvent;

  const exec = executionStatus(caseRecord);
  const resolved = caseRecord.status === "RESOLVED";
  const statusLabel = resolved
    ? "Resuelto"
    : caseRecord.status === "DISPUTED"
      ? "Disputa activa"
      : caseRecord.status;

  return (
    <AppShell>
      <div className="mb-4">
        <a
          href="/sandbox"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Volver a demos
        </a>
        <p className="text-muted-foreground mt-2 text-xs font-medium tracking-wide uppercase">
          Paso 2 de 3 · Responder reclamo
        </p>
      </div>

      <PageHead
        title="Respondé este reclamo"
        subtitle="El cliente dice que la entrega no cumple lo acordado. Tu respuesta será revisada por el agente antes de decidir si el pago puede liberarse."
      />

      <div className="mb-5">
        <StatusStrip
          statusLabel={statusLabel}
          statusVariant={resolved ? "success" : "warning"}
          executionLabel={exec.canExecute ? "Pago liberado" : "Pago bloqueado"}
          canExecute={exec.canExecute}
          countdown={
            caseRecord.status === "DISPUTED" ? (
              <CountdownBadge expiresAt={caseRecord.expiresAt} />
            ) : undefined
          }
        />
      </div>

      <div className="mb-5">
        <WalletRoleBar />
      </div>

      <div className="grid gap-5 lg:grid-cols-[40fr_60fr]">
        <div>
          <ContextCard
            title={caseTitleEs(caseRecord.origin)}
            actionLabel={actionLabelEs(caseRecord.externalAction.actionId)}
            claim={caseRecord.claim}
            rules={caseRecord.rules ?? []}
            claimantEvidence={claimantEvidence.map((event) => ({
              description: String(event.payload?.description ?? event.summary),
              txUrl: event.txUrl,
            }))}
            events={events.map((e) => ({
              label: eventLabels[e.eventType] ?? e.eventType,
              timestamp: e.timestamp,
              txUrl: e.txUrl,
            }))}
          />
        </div>

        <div>
          <ResponseComposerCard
            caseRecord={caseRecord}
            hasResponse={hasResponse}
            responseText={responseText}
            respondentEvidence={respondentEvidence.map((e) =>
              String(e.payload?.description ?? e.summary),
            )}
          />
        </div>
      </div>
    </AppShell>
  );
}

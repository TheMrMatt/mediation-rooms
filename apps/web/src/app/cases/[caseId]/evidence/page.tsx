import { EvidenceForm } from "../../../../components/evidence-form";
import { PageHeader, PlaceholderCard } from "@mediation-rooms/ui";
import { AppShell } from "../../../../components/app-shell";
import { fetchAudit } from "../../../../lib/api";

export default async function CaseEvidencePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const audit = await fetchAudit(caseId);
  const evidenceEvents =
    audit?.events.filter((e) => e.eventType === "EVIDENCE_SUBMITTED") ?? [];

  return (
    <AppShell>
      <PageHeader
        title="Evidencia"
        description={`Evidencia subida para el caso ${caseId}.`}
      />

      <PlaceholderCard title="Subir evidencia">
        <EvidenceForm caseId={caseId} />
      </PlaceholderCard>

      <div style={{ marginTop: "1rem" }}>
        <PlaceholderCard title="Evidencia on-chain">
          {evidenceEvents.length === 0 ? (
            <p style={{ margin: 0, color: "#64748b" }}>Sin evidencia registrada.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {evidenceEvents.map((event) => (
                <li key={event.entityKey} style={{ marginBottom: "0.5rem" }}>
                  {event.summary}
                  {event.txUrl && (
                    <>
                      {" — "}
                      <a href={event.txUrl} target="_blank" rel="noreferrer">
                        Ver tx
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </PlaceholderCard>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <a href={`/cases/${caseId}`}>← Volver al caso</a>
      </div>
    </AppShell>
  );
}

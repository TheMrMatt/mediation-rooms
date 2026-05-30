import type { CaseAuditTrail } from "@mediation-rooms/config";

const eventLabels: Record<string, string> = {
  CASE_CREATED: "Caso creado",
  CASE_UPDATED: "Caso actualizado",
  EVIDENCE_SUBMITTED: "Evidencia",
  DISPUTE_OPENED: "Disputa abierta",
  DISPUTE_RESPONSE: "Respuesta",
  AGENT_DECISION: "Decisión IA",
  CASE_RESOLVED: "Cierre",
};

export function AuditTrailPanel({ audit }: { audit: CaseAuditTrail | null }) {
  if (!audit || audit.events.length === 0) {
    return (
      <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>
        Sin eventos on-chain todavía.
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
        Modo: <strong>{audit.mode}</strong>
        {audit.explorerBaseUrl && (
          <>
            {" "}
            ·{" "}
            <a href={audit.explorerBaseUrl} target="_blank" rel="noreferrer">
              Explorer Braga
            </a>
          </>
        )}
      </p>
      <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
        {audit.events.map((event) => (
          <li
            key={`${event.entityKey}-${event.timestamp}`}
            style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}
          >
            <strong>{eventLabels[event.eventType] ?? event.eventType}</strong>
            {" — "}
            {event.summary}
            <br />
            <span style={{ color: "#64748b" }}>
              {new Date(event.timestamp).toLocaleString()}
            </span>
            {event.txUrl && (
              <>
                {" · "}
                <a href={event.txUrl} target="_blank" rel="noreferrer">
                  Ver tx
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

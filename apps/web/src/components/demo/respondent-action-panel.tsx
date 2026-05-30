import type { Case } from "@mediation-rooms/config";
import { RespondForm } from "../respond-form";
import { OUTCOME_HEADLINE } from "./lib";

function WhatHappensNext() {
  const steps = [
    "Tu respuesta se guarda como evidencia temporal firmada en Arkiv.",
    "El agente revisa el reclamo, tu respuesta y las reglas del contrato.",
    "El sistema externo recibe una decisión final sobre si puede ejecutar.",
  ];
  return (
    <div className="mr-card">
      <h2 className="mr-block-title">¿Qué pasa después?</h2>
      <ol className="mr-next-list" style={{ marginTop: 12 }}>
        {steps.map((s, i) => (
          <li key={i} className="mr-next-item">
            <span className="mr-next-n">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RespondentActionPanel({
  caseRecord,
  hasResponse,
  responseText,
  respondentEvidence = [],
}: {
  caseRecord: Case;
  hasResponse: boolean;
  responseText?: string;
  respondentEvidence?: string[];
}) {
  const caseId = caseRecord.caseId;

  if (caseRecord.status === "RESOLVED") {
    return (
      <div className="mr-card mr-card--elevated">
        <h2 className="mr-block-title">Caso resuelto</h2>
        <p className="mr-card-body" style={{ marginBottom: 14 }}>
          {OUTCOME_HEADLINE[caseRecord.resolution] ?? caseRecord.resolution}
        </p>
        <a className="mr-btn mr-btn--primary" style={{ width: "100%" }} href={`/cases/${caseId}/resolution`}>
          Ver la decisión del agente
        </a>
      </div>
    );
  }

  if (hasResponse && caseRecord.status === "DISPUTED") {
    return (
      <>
        <div className="mr-card mr-card--elevated">
          <h2 className="mr-block-title">Respuesta enviada</h2>
          <p className="mr-card-body" style={{ marginBottom: 14 }}>
            Tu respuesta quedó registrada y el caso está listo para la resolución del agente.
          </p>
          {responseText && (
            <p className="mr-claim-box" style={{ fontSize: 14, marginBottom: 14 }}>
              “{responseText}”
            </p>
          )}
          {respondentEvidence.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p className="mr-scenario-k">Tu evidencia</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
                {respondentEvidence.map((e, i) => (
                  <li key={i} style={{ fontSize: 13, color: "var(--text-secondary)" }}>· {e}</li>
                ))}
              </ul>
            </div>
          )}
          <a className="mr-btn mr-btn--primary" style={{ width: "100%" }} href={`/cases/${caseId}/resolution`}>
            Continuar a la resolución
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mr-card mr-card--elevated">
        <h2 className="mr-block-title">Tu respuesta</h2>
        <p className="mr-block-sub">
          Explicá tu versión del caso. Podés adjuntar archivos si ayudan a respaldar tu respuesta.
        </p>
        <RespondForm caseRecord={caseRecord} />
      </div>
      <WhatHappensNext />
    </>
  );
}

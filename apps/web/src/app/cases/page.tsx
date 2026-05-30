import { AppShell } from "../../components/app-shell";
import { PageHead } from "../../components/demo/page-head";
import { StatusPill, Pill } from "../../components/demo/ui";
import {
  OUTCOME_HEADLINE,
  executionStatus,
  roleShortEs,
  shortAddr,
} from "../../components/demo/lib";
import { fetchCases } from "../../lib/api";

export default async function CasesPage() {
  const cases = await fetchCases();

  return (
    <AppShell>
      <PageHead
        eyebrow="Salas de mediación"
        title="Casos de mediación"
        subtitle="Revisá las salas de mediación activas y resueltas creadas durante la demo. Las disputas las abren contratos externos; acá solo se leen y median."
        actions={
          <a className="mr-btn mr-btn--primary" href="/sandbox">
            Iniciar nueva demo
          </a>
        }
      />

      {cases.length === 0 ? (
        <div className="mr-empty">
          <p className="mr-empty-title">Todavía no hay casos de mediación</p>
          <p className="mr-empty-sub">
            Iniciá un escenario de demo para crear tu primera sala de mediación.
          </p>
          <a className="mr-btn mr-btn--primary" href="/sandbox">
            Iniciar demo
          </a>
        </div>
      ) : (
        <div className="mr-caselist">
          {cases.map((c) => {
            const exec = executionStatus(c);
            const claimant = c.parties.find((p) => p.role === "CLAIMANT");
            const respondent = c.parties.find((p) => p.role === "RESPONDENT");
            const resolved = c.status === "RESOLVED";
            return (
              <a key={c.caseId} href={`/cases/${c.caseId}`} className="mr-caselist-card">
                <div className="mr-caselist-head">
                  <div>
                    <p className="mr-caselist-title">
                      {c.origin?.contractType ?? "Disputa"} · {c.caseId}
                    </p>
                    {c.origin && (
                      <p className="mr-caselist-origin">Contrato origen: {c.origin.contractId}</p>
                    )}
                  </div>
                  <StatusPill status={c.status} />
                </div>

                <div className="mr-caselist-meta">
                  <span>
                    Acción: <b className="mono">{c.externalAction.actionId}</b>
                  </span>
                  <span>
                    {roleShortEs("CLAIMANT")} {shortAddr(claimant?.address)} → {roleShortEs("RESPONDENT")} {shortAddr(respondent?.address)}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    ¿Puede ejecutar? <Pill tone={exec.tone}>{exec.canExecute ? "Sí" : "No"}</Pill>
                  </span>
                </div>

                {resolved && (
                  <p className="mr-card-body" style={{ marginTop: 12, fontSize: 13 }}>
                    {OUTCOME_HEADLINE[c.resolution] ?? c.resolution}
                  </p>
                )}
              </a>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

"use client";

import { useState } from "react";

const soliditySnippet = `require(
  mediation.canExecute(caseId),
  "Mediation pending"
);`;

const apiSnippet = `POST /cases
GET  /cases/:id/can-execute
POST /cases/:id/evidence
POST /cases/:id/dispute
POST /cases/:id/resolve`;

export function IntegrationTabs() {
  const [tab, setTab] = useState<"contracts" | "api">("contracts");

  const isContracts = tab === "contracts";

  return (
    <section className="mr-section" id="integration">
      <div className="mr-container">
        <p className="mr-eyebrow">Integration</p>
        <h2 className="mr-section-title">Integrate it with contracts, APIs or backend flows.</h2>
        <p className="mr-section-sub">
          Mediation Rooms does not replace your product logic. It gives your system a
          reliable way to pause, review and continue.
        </p>

        <div className="mr-mt-32">
          <div className="mr-tabs">
            <button
              type="button"
              className="mr-tab"
              data-active={isContracts}
              onClick={() => setTab("contracts")}
            >
              Smart Contracts
            </button>
            <button
              type="button"
              className="mr-tab"
              data-active={!isContracts}
              onClick={() => setTab("api")}
            >
              API
            </button>
          </div>
        </div>

        <div
          className="mr-grid mr-mt-24"
          style={{ gridTemplateColumns: "1.6fr 1fr", alignItems: "start" }}
        >
          <div>
            <p className="mr-card-body" style={{ marginBottom: 16, fontSize: 16 }}>
              {isContracts
                ? "Your contract does not need to store evidence or manage the full dispute flow. It only needs to ask the mediation module if execution is allowed."
                : "For Web2 products, Mediation Rooms works as an external API that creates cases, stores evidence and sends webhooks when the room changes state."}
            </p>
            <div className="mr-editor">
              <div className="mr-editor-bar">
                <span className="mr-editor-dot" style={{ background: "#ff5f56" }} />
                <span className="mr-editor-dot" style={{ background: "#ffbd2e" }} />
                <span className="mr-editor-dot" style={{ background: "#27c93f" }} />
                <span className="mr-editor-tag">{isContracts ? "Solidity" : "HTTP"}</span>
              </div>
              <pre className="mr-editor-body">{isContracts ? soliditySnippet : apiSnippet}</pre>
            </div>
          </div>

          <div className="mr-card">
            <h3 className="mr-card-title" style={{ fontSize: 16 }}>
              Best for
            </h3>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.9 }}>
              {(isContracts
                ? ["escrow contracts", "milestone payments", "grants", "marketplaces", "private markets"]
                : ["marketplaces", "freelance platforms", "SaaS approvals", "procurement", "insurance flows"]
              ).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

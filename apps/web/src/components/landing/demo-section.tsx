const canExecuteFalse = `{
  "canExecute": false,
  "reason": "active_dispute"
}`;

const canExecuteTrue = `{
  "canExecute": true,
  "reason": "no_dispute_after_deadline"
}`;

export function DemoSection() {
  return (
    <section className="mr-section" id="demo">
      <div className="mr-container">
        <p className="mr-eyebrow">Demo</p>
        <h2 className="mr-section-title">Try the mediation flow.</h2>
        <p className="mr-section-sub">
          Create a room, submit evidence, open a dispute and see how the execution
          status changes.
        </p>

        <div
          className="mr-grid mr-mt-40"
          style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}
        >
          <div className="mr-card mr-card--elevated">
            <div className="mr-kv">
              <span>Case ID</span>
              <span>escrow_001</span>
            </div>
            <div className="mr-kv">
              <span>Status</span>
              <span style={{ color: "var(--warning)" }}>DISPUTED</span>
            </div>
            <div className="mr-kv">
              <span>Review window</span>
              <span>48h</span>
            </div>
            <div className="mr-kv">
              <span>Evidence</span>
              <span>2 files</span>
            </div>
            <div className="mr-kv">
              <span>Can execute</span>
              <span style={{ color: "var(--danger)" }}>false</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
              <span className="mr-btn mr-btn--secondary mr-btn--sm">Submit evidence</span>
              <span className="mr-btn mr-btn--secondary mr-btn--sm">Open dispute</span>
              <span className="mr-btn mr-btn--secondary mr-btn--sm">Resolve case</span>
              <span className="mr-btn mr-btn--secondary mr-btn--sm">Check canExecute</span>
            </div>

            <a href="/sandbox" className="mr-btn mr-btn--primary mr-mt-24" style={{ width: "100%" }}>
              Open demo
            </a>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <p className="mr-card-body mono" style={{ marginBottom: 8, color: "var(--text-muted)" }}>
                GET /cases/escrow_001/can-execute → during dispute
              </p>
              <div className="mr-editor">
                <div className="mr-editor-bar">
                  <span className="mr-editor-dot" style={{ background: "#ff5f56" }} />
                  <span className="mr-editor-dot" style={{ background: "#ffbd2e" }} />
                  <span className="mr-editor-dot" style={{ background: "#27c93f" }} />
                  <span className="mr-editor-tag">JSON</span>
                </div>
                <pre className="mr-editor-body">{canExecuteFalse}</pre>
              </div>
            </div>
            <div>
              <p className="mr-card-body mono" style={{ marginBottom: 8, color: "var(--text-muted)" }}>
                GET /cases/escrow_001/can-execute → after deadline
              </p>
              <div className="mr-editor">
                <div className="mr-editor-bar">
                  <span className="mr-editor-dot" style={{ background: "#ff5f56" }} />
                  <span className="mr-editor-dot" style={{ background: "#ffbd2e" }} />
                  <span className="mr-editor-dot" style={{ background: "#27c93f" }} />
                  <span className="mr-editor-tag">JSON</span>
                </div>
                <pre className="mr-editor-body">{canExecuteTrue}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

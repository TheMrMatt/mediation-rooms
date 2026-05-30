const states = [
  { name: "OPEN", body: "The review window is active and parties can submit evidence or open a dispute." },
  { name: "DISPUTED", body: "A claim was opened and the external action is blocked." },
  { name: "RESOLVED", body: "The case has a final decision and the external system can execute based on the resolution." },
  { name: "EXPIRED_NO_DISPUTE", body: "The review window ended without disputes. The external system can move forward." },
  { name: "CANCELLED", body: "The room was cancelled before reaching a final execution state." },
];

export function StatesSection() {
  return (
    <section className="mr-section">
      <div className="mr-container">
        <p className="mr-eyebrow">Product states</p>
        <h2 className="mr-section-title">Simple states for complex disputes.</h2>
        <p className="mr-section-sub">
          Every room has a clear state. Your system can use that state to decide whether
          to execute, wait, block or apply a final resolution.
        </p>

        <div className="mr-card mr-card--elevated mr-mt-40" style={{ display: "grid", gap: 14 }}>
          <div className="mr-flow">
            <span className="mr-flow-node">OPEN</span>
            <span className="mr-flow-arrow">→</span>
            <span className="mr-flow-node">EXPIRED_NO_DISPUTE</span>
            <span className="mr-flow-arrow">→</span>
            <span className="mr-flow-node mr-flow-node--yes">can execute</span>
          </div>
          <div className="mr-flow">
            <span className="mr-flow-node">OPEN</span>
            <span className="mr-flow-arrow">→</span>
            <span className="mr-flow-node mr-flow-node--no">DISPUTED</span>
            <span className="mr-flow-arrow">→</span>
            <span className="mr-flow-node">RESOLVED</span>
            <span className="mr-flow-arrow">→</span>
            <span className="mr-flow-node mr-flow-node--yes">execute by resolution</span>
          </div>
        </div>

        <div className="mr-grid mr-grid-3 mr-mt-24">
          {states.map((s) => (
            <div className="mr-card" key={s.name}>
              <span className="mr-chip" style={{ margin: 0 }}>
                {s.name}
              </span>
              <p className="mr-card-body" style={{ marginTop: 10 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

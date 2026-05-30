const cards = [
  {
    title: "Create temporary rooms",
    body: "Open a mediation case linked to a payment, milestone, delivery or any pending action.",
  },
  {
    title: "Collect evidence",
    body: "Both parties can submit files, messages, screenshots or explanations during the review window.",
  },
  {
    title: "Block execution",
    body: "If a dispute is opened, the external system knows the action should not move forward yet.",
  },
  {
    title: "Resolve and continue",
    body: "Once resolved, the original system receives the final decision and executes accordingly.",
  },
];

export function ProductExplanation() {
  return (
    <section className="mr-section">
      <div className="mr-container">
        <p className="mr-eyebrow">What it is</p>
        <h2 className="mr-section-title">A mediation layer between intent and execution.</h2>
        <p className="mr-section-sub">
          Mediation Rooms sits between a pending action and its final execution. Your
          product creates a room, both parties can submit evidence, and your system
          can ask one simple question: can this action execute?
        </p>

        <div className="mr-card mr-card--elevated mr-mt-40">
          <div className="mr-flow" style={{ justifyContent: "center" }}>
            <span className="mr-flow-node">External System</span>
            <span className="mr-flow-arrow">→</span>
            <span className="mr-flow-node">Mediation Room</span>
            <span className="mr-flow-arrow">→</span>
            <span className="mr-flow-node mono">canExecute?</span>
          </div>
          <div
            className="mr-flow"
            style={{ justifyContent: "center", marginTop: 16, gap: 32 }}
          >
            <span className="mr-flow-node mr-flow-node--yes">Yes → execute action</span>
            <span className="mr-flow-node mr-flow-node--no">No → wait or resolve</span>
          </div>
        </div>

        <div className="mr-grid mr-grid-4 mr-mt-24">
          {cards.map((c, i) => (
            <div className="mr-card" key={c.title}>
              <span className="mr-card-icon mono" aria-hidden>
                {i + 1}
              </span>
              <h3 className="mr-card-title">{c.title}</h3>
              <p className="mr-card-body">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

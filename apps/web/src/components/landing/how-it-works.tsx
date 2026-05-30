const steps = [
  {
    title: "Create a pending action",
    body: "A contract, marketplace or SaaS platform wants to execute something important.",
    chips: ["Release a payment", "Approve a delivery", "Close a milestone", "Accept a result"],
  },
  {
    title: "Open a mediation room",
    body: "The external system creates a room with the involved parties, rules and review window.",
  },
  {
    title: "Collect evidence",
    body: "Each party can submit evidence or open a dispute during the active window.",
  },
  {
    title: "Check execution status",
    body: "Before moving forward, the external system asks if the action can execute.",
  },
  {
    title: "Resolve or expire",
    body: "If there is no dispute, the action can continue. If there is a dispute, the room waits for a resolution.",
  },
];

export function HowItWorks() {
  return (
    <section className="mr-section" id="how-it-works">
      <div className="mr-container">
        <p className="mr-eyebrow">How it works</p>
        <h2 className="mr-section-title">How the mediation flow works</h2>

        <div className="mr-timeline mr-mt-40" style={{ maxWidth: 720 }}>
          {steps.map((s, i) => (
            <div className="mr-step" key={s.title}>
              <span className="mr-step-num mono">{i + 1}</span>
              <div>
                <h3 className="mr-step-title">{s.title}</h3>
                <p className="mr-step-body">{s.body}</p>
                {s.chips && (
                  <div style={{ marginTop: 8 }}>
                    {s.chips.map((c) => (
                      <span className="mr-chip" key={c}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

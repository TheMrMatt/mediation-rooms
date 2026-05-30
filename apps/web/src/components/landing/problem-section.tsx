const problems = [
  { icon: "⚡", title: "Payments get released before review." },
  { icon: "📎", title: "Evidence gets lost in chats or emails." },
  { icon: "⛔", title: "Disputes block the core product logic." },
  { icon: "⏸", title: "Smart contracts need a clean way to pause execution." },
];

export function ProblemSection() {
  return (
    <section className="mr-section">
      <div className="mr-container">
        <p className="mr-eyebrow">The problem</p>
        <h2 className="mr-section-title">Most systems execute too fast.</h2>
        <p className="mr-section-sub">
          Payments, deliveries, milestones and approvals often move forward before
          both sides have a clear chance to review, respond or dispute.
        </p>

        <div className="mr-grid mr-grid-4 mr-mt-40">
          {problems.map((p) => (
            <div className="mr-card" key={p.title}>
              <span className="mr-card-icon" aria-hidden>
                {p.icon}
              </span>
              <p className="mr-card-title" style={{ fontSize: 16 }}>
                {p.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const useCases = [
  { title: "Freelance escrow", body: "Let clients dispute a delivery before payment is released." },
  { title: "Marketplace orders", body: "Give buyers a window to claim before funds move to sellers." },
  { title: "Milestone grants", body: "Pause grant releases until reviewers or communities can respond." },
  { title: "Hackathon submissions", body: "Allow teams, judges or organizers to review and dispute submissions." },
  { title: "Private markets", body: "Add mediation before accepting or finalizing a result." },
  { title: "Procurement approvals", body: "Create review windows before approving vendors or proposals." },
];

export function UseCases() {
  return (
    <section className="mr-section" id="use-cases">
      <div className="mr-container">
        <p className="mr-eyebrow">Use cases</p>
        <h2 className="mr-section-title">Use it wherever actions need a review window.</h2>

        <div className="mr-grid mr-grid-3 mr-mt-40">
          {useCases.map((u) => (
            <div className="mr-card" key={u.title}>
              <h3 className="mr-card-title">{u.title}</h3>
              <p className="mr-card-body">{u.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="mr-section">
      <div className="mr-container">
        <div
          className="mr-card mr-card--elevated mr-center"
          style={{ padding: "56px 32px" }}
        >
          <h2
            className="mr-section-title"
            style={{ maxWidth: "20ch", margin: "0 auto 14px" }}
          >
            Give your product a safe window before execution.
          </h2>
          <p className="mr-section-sub" style={{ margin: "0 auto" }}>
            Mediation Rooms helps contracts, marketplaces and platforms add a clear
            dispute flow without rebuilding their core logic.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginTop: 28,
              flexWrap: "wrap",
            }}
          >
            <a href="/sandbox" className="mr-btn mr-btn--primary">
              Launch demo
            </a>
            <a href="#integration" className="mr-btn mr-btn--secondary">
              Read integration docs
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 0" }}>
      <div
        className="mr-container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        <span>Mediation Rooms · plug-and-play mediation layer</span>
        <span className="mono">canExecute()</span>
      </div>
    </footer>
  );
}

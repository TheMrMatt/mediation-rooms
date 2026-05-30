const bento = [
  {
    title: "Evidence expires",
    body: "Files and messages can live only as long as the mediation process needs them.",
  },
  {
    title: "Final result stays permanent",
    body: "The system only keeps the final decision, status, timestamps and evidence hash.",
  },
  {
    title: "Cleaner product logic",
    body: "The external system does not need to manage temporary dispute data itself.",
  },
  {
    title: "Built for review windows",
    body: "Perfect for processes where information is useful for days, not forever.",
  },
];

const temporary = [
  "evidence",
  "screenshots",
  "claims",
  "responses",
  "attached files",
  "mediator notes",
  "review messages",
  "temporary metadata",
];

const permanent = [
  "final result",
  "final status",
  "decision",
  "timestamp",
  "action executed",
  "evidence hash",
  "case ID",
  "involved parties",
];

export function ArkivSection() {
  return (
    <section className="mr-section">
      <div className="mr-container">
        <p className="mr-eyebrow">Powered by Arkiv</p>
        <h2 className="mr-section-title">Temporary evidence belongs in temporary storage.</h2>
        <p className="mr-section-sub">
          Evidence usually matters only while the mediation window is active. Mediation
          Rooms uses Arkiv to store temporary files, messages, screenshots and
          responses during the dispute process.
        </p>

        <div className="mr-grid mr-grid-4 mr-mt-40">
          {bento.map((c) => (
            <div className="mr-card" key={c.title}>
              <h3 className="mr-card-title" style={{ fontSize: 17 }}>
                {c.title}
              </h3>
              <p className="mr-card-body">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="mr-mt-40">
          <h3 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 6px" }}>
            Keep temporary evidence separate from permanent decisions.
          </h3>
          <p className="mr-card-body" style={{ maxWidth: "60ch", marginBottom: 20 }}>
            Arkiv stores what is useful during the mediation process. Your system keeps
            what matters after the case is closed.
          </p>

          <div className="mr-grid mr-grid-2">
            <div className="mr-card mr-card--elevated">
              <span className="mr-badge" style={{ marginBottom: 14 }}>
                <span className="mr-badge-dot" style={{ background: "var(--warning)" }} />
                Temporary · in Arkiv
              </span>
              <div>
                {temporary.map((t) => (
                  <span className="mr-chip" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="mr-card mr-card--elevated">
              <span className="mr-badge" style={{ marginBottom: 14 }}>
                <span className="mr-badge-dot" style={{ background: "var(--success)" }} />
                Permanent · in your system
              </span>
              <div>
                {permanent.map((t) => (
                  <span className="mr-chip" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

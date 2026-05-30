import { CodeEditor } from "./code-editor";

const usageSnippet = `import { MediationRooms } from "@mediation-rooms/sdk";

const mediation = new MediationRooms({
  apiKey: process.env.MEDIATION_API_KEY,
});

const room = await mediation.createRoom({
  externalId: "payment_123",
  parties: ["client_wallet", "provider_wallet"],
  reviewWindow: "72h",
  action: "release_payment",
});`;

export function Hero() {
  return (
    <section className="mr-section mr-section--plain" style={{ paddingTop: 72, paddingBottom: 72 }}>
      <div className="mr-container mr-center" style={{ maxWidth: 840 }}>
        <span className="mr-badge">
          <span className="mr-badge-dot" />
          Plug-and-play mediation layer
        </span>

        <h1
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            fontWeight: 600,
            margin: "22px 0 0",
          }}
        >
          Add a dispute window
          <br />
          before execution.
        </h1>

        <p
          style={{
            fontSize: 20,
            color: "var(--text-secondary)",
            margin: "20px auto 0",
            maxWidth: 620,
          }}
        >
          Mediation Rooms lets contracts, marketplaces and digital platforms create
          temporary mediation rooms, collect evidence and check if an action can
          safely move forward.
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
            Open demo
          </a>
          <a href="#integration" className="mr-btn mr-btn--secondary">
            View integration
          </a>
        </div>

        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 16 }}>
          Create a room, collect evidence, then ask if your system can execute.
        </p>

        <div style={{ marginTop: 48, maxWidth: 720, marginInline: "auto" }}>
          <CodeEditor tag="Install" copyText="npm install @mediation-rooms/sdk">
            <span className="tok-com"># Install the SDK</span>
            {"\n"}
            <span className="tok-fn">npm</span> install @mediation-rooms/sdk
            {"\n\n"}
            <span className="tok-com"># Create a mediation room</span>
            {"\n"}
            <CodeUsage />
          </CodeEditor>
        </div>
      </div>
    </section>
  );
}

function CodeUsage() {
  return <>{usageSnippet}</>;
}

export function Header() {
  return (
    <header className="mr-header">
      <div className="mr-container mr-header-inner">
        <a href="/" className="mr-logo">
          Mediation Rooms
        </a>
        <nav className="mr-nav">
          <a href="#how-it-works">How it works</a>
          <a href="#integration">Integration</a>
          <a href="#use-cases">Use cases</a>
          <a href="#demo">Demo</a>
        </nav>
        <a href="/sandbox" className="mr-btn mr-btn--primary mr-btn--sm" style={{ marginLeft: "auto" }}>
          Open demo
        </a>
      </div>
    </header>
  );
}

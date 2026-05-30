import type { ReactNode } from "react";
import { WalletBar } from "./wallet-provider";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="mr-header">
        <div className="mr-container mr-header-inner">
          <a href="/" className="mr-logo">
            Mediation Rooms
          </a>
          <nav className="mr-nav">
            <a href="/cases">Disputas</a>
            <a href="/sandbox">Sandbox</a>
            <a href="/#how-it-works">Cómo funciona</a>
          </nav>
          <div style={{ marginLeft: "auto" }}>
            <WalletBar />
          </div>
        </div>
      </header>
      <main className="mr-container" style={{ padding: "40px 24px 96px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>{children}</div>
      </main>
    </>
  );
}

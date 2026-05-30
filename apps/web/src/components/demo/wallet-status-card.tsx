"use client";

import { shortAddr } from "./lib";
import { useWallet } from "../wallet-provider";

export function WalletStatusCard() {
  const { address, connecting, error, connect, disconnect } = useWallet();

  return (
    <div className="mr-card">
      <div className="mr-wallet">
        <span className={`mr-wallet-dot${address ? "" : " mr-wallet-dot--off"}`} />
        <div className="mr-wallet-info">
          {address ? (
            <>
              <p className="mr-wallet-label">Wallet conectada · Arkiv Braga</p>
              <p className="mr-wallet-addr">{shortAddr(address)}</p>
            </>
          ) : (
            <>
              <p className="mr-wallet-label">Wallet no conectada</p>
              <p className="mr-wallet-addr" style={{ fontFamily: "inherit", fontSize: 13, color: "var(--text-secondary)" }}>
                Conectala para participar como la parte reclamada.
              </p>
            </>
          )}
        </div>
        {address ? (
          <button type="button" className="mr-btn mr-btn--ghost mr-btn--sm" onClick={disconnect}>
            Desconectar
          </button>
        ) : (
          <button
            type="button"
            className="mr-btn mr-btn--secondary mr-btn--sm"
            onClick={connect}
            disabled={connecting}
          >
            {connecting ? "Conectando…" : "Conectar wallet"}
          </button>
        )}
      </div>
      {error && <p className="mr-error-line">{error}</p>}
    </div>
  );
}

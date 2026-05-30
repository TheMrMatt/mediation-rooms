"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { connectWalletAddress, getConnectedAddress } from "../lib/wallet";

interface WalletContextValue {
  address: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getConnectedAddress()
      .then(setAddress)
      .catch(() => setAddress(null));
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    setConnecting(true);
    setError(null);
    try {
      const next = await connectWalletAddress();
      setAddress(next);
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar wallet");
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ address, connecting, error, connect, disconnect }),
    [address, connecting, error, connect, disconnect],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet debe usarse dentro de WalletProvider");
  }
  return ctx;
}

export function WalletBar() {
  const { address, connecting, error, connect, disconnect } = useWallet();

  return (
    <div
      style={{
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        fontSize: "0.875rem",
      }}
    >
      {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
      {address ? (
        <>
          <span style={{ color: "#64748b", fontFamily: "monospace" }}>
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
          <button type="button" onClick={disconnect} style={buttonStyle}>
            Desconectar
          </button>
        </>
      ) : (
        <button type="button" onClick={connect} disabled={connecting} style={buttonStyle}>
          {connecting ? "Conectando…" : "Conectar wallet (Braga)"}
        </button>
      )}
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "0.375rem 0.75rem",
  borderRadius: "0.375rem",
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
  fontSize: "0.875rem",
};

export const formStyles = {
  field: {
    display: "grid" as const,
    gap: "0.375rem",
    marginBottom: "0.75rem",
  },
  input: {
    padding: "0.5rem 0.75rem",
    borderRadius: "0.375rem",
    border: "1px solid #cbd5e1",
    fontSize: "0.875rem",
  },
  textarea: {
    padding: "0.5rem 0.75rem",
    borderRadius: "0.375rem",
    border: "1px solid #cbd5e1",
    fontSize: "0.875rem",
    minHeight: "80px",
    resize: "vertical" as const,
  },
  submit: {
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem",
    border: "none",
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.875rem",
  },
  error: { color: "#b91c1c", fontSize: "0.875rem", marginTop: "0.5rem" },
  success: { color: "#166534", fontSize: "0.875rem", marginTop: "0.5rem" },
};

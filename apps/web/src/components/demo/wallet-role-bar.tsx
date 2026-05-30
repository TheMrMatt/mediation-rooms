"use client";

import { Wallet } from "lucide-react";
import { shortAddr } from "./lib";
import { useWallet } from "../wallet-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Barra de wallet/rol para las vistas de demo. Explica que el usuario responde
 * como proveedor reclamado y muestra la wallet conectada. No repite esta info
 * dentro de cada ScenarioCard.
 */
export function WalletRoleBar() {
  const { address, connecting, error, connect, disconnect } = useWallet();

  return (
    <Alert className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <Wallet aria-hidden />
      <div className="min-w-0 flex-1">
        <AlertTitle>En estas demos respondés como proveedor reclamado</AlertTitle>
        <AlertDescription>
          {address ? (
            <span>
              Wallet conectada:{" "}
              <span className="text-foreground font-mono">
                {shortAddr(address)}
              </span>
            </span>
          ) : (
            <span>Conectá tu wallet para firmar como la parte reclamada.</span>
          )}
        </AlertDescription>
      </div>
      {address ? (
        <Button variant="ghost" size="sm" onClick={disconnect}>
          Cambiar wallet
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={connect}
          disabled={connecting}
        >
          {connecting ? "Conectando…" : "Conectar wallet"}
        </Button>
      )}
      {error && (
        <p className="text-destructive w-full text-xs">{error}</p>
      )}
    </Alert>
  );
}

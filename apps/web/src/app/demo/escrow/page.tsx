"use client";

import { useMemo, useState } from "react";
import { PageHeader, PlaceholderCard } from "@mediation-rooms/ui";
import { AppShell } from "@/components/app-shell";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  isAddress,
  keccak256,
  parseEther,
  stringToHex,
  type Address,
  type Hex,
} from "viem";
import { localhost } from "viem/chains";
import {
  chainId,
  demoEscrowAbi,
  demoEscrowAddress,
  isDemoConfigured,
  mediationRegistryAbi,
  mediationRegistryAddress,
  rpcUrl,
} from "@/lib/contracts";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<any>;
};

const DEFAULT_PROVIDER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const toBytes32 = (value: string): Hex => {
  const trimmed = value.trim();
  if (/^0x[0-9a-fA-F]{64}$/.test(trimmed)) return trimmed as Hex;
  return keccak256(stringToHex(trimmed));
};

const formatError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const requireAddress = (value: Address | undefined, envName: string): Address => {
  if (!value) {
    throw new Error(`Falta ${envName}.`);
  }

  return value;
};

export default function EscrowDemoPage() {
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [providerAddress, setProviderAddress] = useState(DEFAULT_PROVIDER);
  const [escrowIdInput, setEscrowIdInput] = useState("escrow-hackathon-1");
  const [caseIdInput, setCaseIdInput] = useState("case-hackathon-1");
  const [depositEth, setDepositEth] = useState("0.1");
  const [resolutionValue, setResolutionValue] = useState<"1" | "2">("2");
  const [status, setStatus] = useState("Esperando conexión de wallet.");
  const [onchainSnapshot, setOnchainSnapshot] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const escrowId = useMemo(() => toBytes32(escrowIdInput), [escrowIdInput]);
  const caseId = useMemo(() => toBytes32(caseIdInput), [caseIdInput]);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: localhost,
        transport: http(rpcUrl),
      }),
    [],
  );

  const getProvider = (): Eip1193Provider => {
    const provider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
    if (!provider) throw new Error("MetaMask no está disponible en el navegador.");
    return provider;
  };

  const ensureChain = async (provider: Eip1193Provider) => {
    const current = await provider.request({ method: "eth_chainId" });
    const expected = `0x${chainId.toString(16)}`;
    if (current === expected) return;

    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: expected }],
    });
  };

  const connectWallet = async () => {
    try {
      const provider = getProvider();
      await ensureChain(provider);
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (!accounts[0]) throw new Error("No se pudo obtener una cuenta.");
      setWalletAddress(accounts[0] as Address);
      setStatus(`Wallet conectada: ${accounts[0]}`);
    } catch (error) {
      setStatus(`Error al conectar wallet: ${formatError(error)}`);
    }
  };

  const withTransaction = async (label: string, action: () => Promise<Hex>) => {
    try {
      setIsSubmitting(true);
      setStatus(`${label}: enviando transacción...`);
      const hash = await action();
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`${label}: confirmada ${hash}`);
    } catch (error) {
      setStatus(`${label}: ${formatError(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const createWallet = async () => {
    if (!walletAddress) throw new Error("Conectá una wallet antes de ejecutar transacciones.");
    const provider = getProvider();
    await ensureChain(provider);

    return createWalletClient({
      account: walletAddress,
      chain: localhost,
      transport: custom(provider),
    });
  };

  const runDeposit = async () => {
    const escrowAddress = requireAddress(demoEscrowAddress, "NEXT_PUBLIC_DEMO_ESCROW_ADDRESS");
    if (!isAddress(providerAddress)) throw new Error("La dirección de provider no es válida.");

    await withTransaction("deposit", async () => {
      const walletClient = await createWallet();
      return walletClient.writeContract({
        address: escrowAddress,
        abi: demoEscrowAbi,
        functionName: "deposit",
        args: [escrowId, providerAddress as Address],
        value: parseEther(depositEth),
      });
    });
  };

  const runMarkDelivery = async () => {
    const escrowAddress = requireAddress(demoEscrowAddress, "NEXT_PUBLIC_DEMO_ESCROW_ADDRESS");

    await withTransaction("markDelivery", async () => {
      const walletClient = await createWallet();
      return walletClient.writeContract({
        address: escrowAddress,
        abi: demoEscrowAbi,
        functionName: "markDelivery",
        args: [escrowId, caseId],
      });
    });
  };

  const runOpenDispute = async () => {
    const escrowAddress = requireAddress(demoEscrowAddress, "NEXT_PUBLIC_DEMO_ESCROW_ADDRESS");

    await withTransaction("openDispute", async () => {
      const walletClient = await createWallet();
      return walletClient.writeContract({
        address: escrowAddress,
        abi: demoEscrowAbi,
        functionName: "openDispute",
        args: [escrowId],
      });
    });
  };

  const runResolveCase = async () => {
    const registryAddress = requireAddress(
      mediationRegistryAddress,
      "NEXT_PUBLIC_MEDIATION_REGISTRY_ADDRESS",
    );

    await withTransaction("resolveCase", async () => {
      const walletClient = await createWallet();
      return walletClient.writeContract({
        address: registryAddress,
        abi: mediationRegistryAbi,
        functionName: "resolveCase",
        args: [caseId, Number(resolutionValue)],
      });
    });
  };

  const runRelease = async () => {
    const escrowAddress = requireAddress(demoEscrowAddress, "NEXT_PUBLIC_DEMO_ESCROW_ADDRESS");

    await withTransaction("release", async () => {
      const walletClient = await createWallet();
      return walletClient.writeContract({
        address: escrowAddress,
        abi: demoEscrowAbi,
        functionName: "release",
        args: [escrowId],
      });
    });
  };

  const runRefund = async () => {
    const escrowAddress = requireAddress(demoEscrowAddress, "NEXT_PUBLIC_DEMO_ESCROW_ADDRESS");

    await withTransaction("refund", async () => {
      const walletClient = await createWallet();
      return walletClient.writeContract({
        address: escrowAddress,
        abi: demoEscrowAbi,
        functionName: "refund",
        args: [escrowId],
      });
    });
  };

  const refreshSnapshot = async () => {
    try {
      const escrowAddress = requireAddress(demoEscrowAddress, "NEXT_PUBLIC_DEMO_ESCROW_ADDRESS");
      const registryAddress = requireAddress(
        mediationRegistryAddress,
        "NEXT_PUBLIC_MEDIATION_REGISTRY_ADDRESS",
      );
      const [escrow, mediationCase, canExecute, resolution] = await Promise.all([
        publicClient.readContract({
          address: escrowAddress,
          abi: demoEscrowAbi,
          functionName: "getEscrow",
          args: [escrowId],
        }),
        publicClient.readContract({
          address: registryAddress,
          abi: mediationRegistryAbi,
          functionName: "getCase",
          args: [caseId],
        }),
        publicClient.readContract({
          address: registryAddress,
          abi: mediationRegistryAbi,
          functionName: "canExecute",
          args: [caseId],
        }),
        publicClient.readContract({
          address: registryAddress,
          abi: mediationRegistryAbi,
          functionName: "getResolution",
          args: [caseId],
        }),
      ]);

      setOnchainSnapshot(
        JSON.stringify(
          {
            escrowId,
            caseId,
            escrow,
            case: mediationCase,
            canExecute,
            resolution,
          },
          (_, value) => (typeof value === "bigint" ? value.toString() : value),
          2,
        ),
      );
    } catch (error) {
      setOnchainSnapshot(`No se pudo leer estado on-chain: ${formatError(error)}`);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Demo Escrow"
        description="Opcional — requiere Anvil + deploy local. Para testnet usá /cases con Arkiv."
      />

      {!isDemoConfigured && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            borderRadius: "0.5rem",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e40af",
          }}
        >
          Esta demo on-chain no está configurada (faltan addresses en .env). Para
          hackathon/testnet, usá{" "}
          <a href="/cases" style={{ color: "#1d4ed8" }}>
            /cases
          </a>{" "}
          con Arkiv Kaolin — ver <code>docs/arkiv-testnet.md</code>.
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        <PlaceholderCard title="Configuración">
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <p style={{ margin: 0, color: "#64748b" }}>
              Chain ID: {chainId} | RPC: {rpcUrl}
            </p>
            <p style={{ margin: 0, color: "#64748b" }}>
              Registry: {mediationRegistryAddress ?? "(faltante en env)"} | DemoEscrow:{" "}
              {demoEscrowAddress ?? "(faltante en env)"}
            </p>
            <button type="button" onClick={connectWallet} disabled={isSubmitting || !isDemoConfigured}>
              {walletAddress ? `Wallet conectada (${walletAddress})` : "Conectar wallet"}
            </button>
          </div>
        </PlaceholderCard>

        <PlaceholderCard title="Parámetros">
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <label>
              Escrow ID (texto o bytes32)
              <input
                value={escrowIdInput}
                onChange={(event) => setEscrowIdInput(event.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <label>
              Case ID (texto o bytes32)
              <input
                value={caseIdInput}
                onChange={(event) => setCaseIdInput(event.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <label>
              Address del proveedor
              <input
                value={providerAddress}
                onChange={(event) => setProviderAddress(event.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <label>
              Monto depósito (ETH)
              <input
                value={depositEth}
                onChange={(event) => setDepositEth(event.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <p style={{ margin: 0, color: "#64748b" }}>Escrow bytes32: {escrowId}</p>
            <p style={{ margin: 0, color: "#64748b" }}>Case bytes32: {caseId}</p>
          </div>
        </PlaceholderCard>

        <PlaceholderCard title="Acciones on-chain">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button type="button" onClick={runDeposit} disabled={isSubmitting || !isDemoConfigured}>
              deposit
            </button>
            <button type="button" onClick={runMarkDelivery} disabled={isSubmitting || !isDemoConfigured}>
              markDelivery
            </button>
            <button type="button" onClick={runOpenDispute} disabled={isSubmitting || !isDemoConfigured}>
              openDispute
            </button>
            <button type="button" onClick={runRelease} disabled={isSubmitting || !isDemoConfigured}>
              release
            </button>
            <button type="button" onClick={runRefund} disabled={isSubmitting || !isDemoConfigured}>
              refund
            </button>
          </div>

          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label htmlFor="resolution-select">resolveCase:</label>
            <select
              id="resolution-select"
              value={resolutionValue}
              onChange={(event) => setResolutionValue(event.target.value as "1" | "2")}
            >
              <option value="1">RELEASE_TO_PROVIDER (1)</option>
              <option value="2">REFUND_TO_CLIENT (2)</option>
            </select>
            <button type="button" onClick={runResolveCase} disabled={isSubmitting || !isDemoConfigured}>
              resolveCase
            </button>
          </div>
        </PlaceholderCard>

        <PlaceholderCard title="Estado">
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <p style={{ margin: 0, color: "#64748b" }}>{status}</p>
            <button type="button" onClick={refreshSnapshot} disabled={!isDemoConfigured}>
              Refrescar snapshot on-chain
            </button>
            <pre
              style={{
                margin: 0,
                padding: "0.75rem",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                overflowX: "auto",
                color: "#334155",
              }}
            >
              {onchainSnapshot || "Sin snapshot todavía."}
            </pre>
          </div>
        </PlaceholderCard>
      </div>
    </AppShell>
  );
}

"use client";

import { braga } from "@arkiv-network/sdk/chains";
import type { EIP1193Provider } from "viem";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export function getEthereumProvider(): EIP1193Provider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Instalá MetaMask u otra wallet compatible con EIP-1193");
  }
  return window.ethereum;
}

export async function ensureBragaNetwork(): Promise<void> {
  const provider = getEthereumProvider();
  const chainIdHex = `0x${braga.id.toString(16)}`;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("4902") && !message.includes("Unrecognized chain")) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: braga.name,
          nativeCurrency: braga.nativeCurrency,
          rpcUrls: braga.rpcUrls.default.http,
          blockExplorerUrls: [braga.blockExplorers.default.url],
        },
      ],
    });
  }
}

export async function connectWalletAddress(): Promise<string> {
  await ensureBragaNetwork();
  const provider = getEthereumProvider();
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];

  const address = accounts[0];
  if (!address) {
    throw new Error("No se obtuvo ninguna cuenta de la wallet");
  }

  return address;
}

export async function getConnectedAddress(): Promise<string | null> {
  if (typeof window === "undefined" || !window.ethereum) return null;

  const accounts = (await window.ethereum.request({
    method: "eth_accounts",
  })) as string[];

  return accounts[0] ?? null;
}

import type { Abi, Address } from "viem";
import demoEscrowAbiJson from "@/lib/abis/DemoEscrow.json";
import mediationRegistryAbiJson from "@/lib/abis/MediationRegistry.json";

const asAddress = (value: string | undefined): Address | undefined => {
  if (!value) return undefined;
  return value as Address;
};

export const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337");
export const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";

export const mediationRegistryAddress = asAddress(
  process.env.NEXT_PUBLIC_MEDIATION_REGISTRY_ADDRESS,
);
export const demoEscrowAddress = asAddress(process.env.NEXT_PUBLIC_DEMO_ESCROW_ADDRESS);

export const demoEscrowAbi = demoEscrowAbiJson as Abi;
export const mediationRegistryAbi = mediationRegistryAbiJson as Abi;

export const isDemoConfigured = Boolean(mediationRegistryAddress && demoEscrowAddress);

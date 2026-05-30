"use client";

import { createWalletClient, custom } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { jsonToPayload } from "@arkiv-network/sdk/utils";
import {
  AUDIT_ENTITY_TTL_SECONDS,
  DISPUTE_TTL_SECONDS,
  PROJECT_ATTRIBUTE,
  RESPONSE_EXTENSION_SECONDS,
  type ClientArkivProof,
  type PartyRole,
} from "@mediation-rooms/config";
import { connectWalletAddress, getEthereumProvider } from "./wallet";

function toAttributes(entries: Record<string, string>) {
  return Object.entries({ project: PROJECT_ATTRIBUTE, ...entries }).map(
    ([key, value]) => ({ key, value: String(value) }),
  );
}

async function getWalletClient() {
  const address = await connectWalletAddress();
  const provider = getEthereumProvider();
  const client = createWalletClient({
    chain: braga,
    transport: custom(provider),
    account: address as `0x${string}`,
  });
  return { client, address };
}

function toClientProof(
  entityKey: string,
  txHash: string,
  signedBy: string,
): ClientArkivProof {
  return { entityKey, txHash, signedBy };
}

export async function writeEvidenceToArkiv(input: {
  caseId: string;
  evidenceId: string;
  submittedBy: string;
  role: PartyRole;
  contentHash: string;
  description: string;
  uri?: string;
}): Promise<ClientArkivProof> {
  const { client, address } = await getWalletClient();
  const payload = {
    evidenceId: input.evidenceId,
    caseId: input.caseId,
    submittedBy: input.submittedBy,
    role: input.role,
    contentHash: input.contentHash,
    description: input.description,
    uri: input.uri,
    createdAt: new Date().toISOString(),
  };

  const { entityKey, txHash } = await client.createEntity({
    payload: jsonToPayload(payload),
    contentType: "application/json",
    attributes: toAttributes({
      entityType: "evidence",
      caseId: input.caseId,
      evidenceId: input.evidenceId,
      role: input.role,
    }),
    expiresIn: AUDIT_ENTITY_TTL_SECONDS,
  });

  return toClientProof(entityKey, txHash, address);
}

export async function writeClaimToArkiv(input: {
  caseId: string;
  submittedBy: string;
  claim: string;
}): Promise<ClientArkivProof> {
  const { client, address } = await getWalletClient();

  const { entityKey, txHash } = await client.createEntity({
    payload: jsonToPayload({
      caseId: input.caseId,
      submittedBy: input.submittedBy,
      claim: input.claim,
    }),
    contentType: "application/json",
    attributes: toAttributes({
      entityType: "claim",
      caseId: input.caseId,
      submittedBy: input.submittedBy,
    }),
    expiresIn: DISPUTE_TTL_SECONDS,
  });

  return toClientProof(entityKey, txHash, address);
}

export async function writeResponseToArkiv(input: {
  caseId: string;
  submittedBy: string;
  response: string;
}): Promise<ClientArkivProof> {
  const { client, address } = await getWalletClient();

  const { entityKey, txHash } = await client.createEntity({
    payload: jsonToPayload({
      caseId: input.caseId,
      submittedBy: input.submittedBy,
      response: input.response,
    }),
    contentType: "application/json",
    attributes: toAttributes({
      entityType: "response",
      caseId: input.caseId,
      submittedBy: input.submittedBy,
    }),
    expiresIn: DISPUTE_TTL_SECONDS + RESPONSE_EXTENSION_SECONDS,
  });

  return toClientProof(entityKey, txHash, address);
}

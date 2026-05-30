import type {
  Case,
  CaseAuditTrail,
  ClientArkivProof,
  MockContract,
  PartyRole,
} from "@mediation-rooms/config";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function fetchCases(): Promise<Case[]> {
  const res = await fetch(`${API_URL}/cases`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { cases: Case[] };
  return data.cases ?? [];
}

export async function fetchCase(caseId: string): Promise<Case | null> {
  const res = await fetch(`${API_URL}/cases/${caseId}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<Case>;
}

export async function fetchAudit(caseId: string): Promise<CaseAuditTrail | null> {
  const res = await fetch(`${API_URL}/cases/${caseId}/audit`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json() as Promise<CaseAuditTrail>;
}

export async function submitEvidence(
  caseId: string,
  body: {
    submittedBy: string;
    role: PartyRole;
    contentHash: string;
    description: string;
    uri?: string;
    evidenceId?: string;
    clientProof?: ClientArkivProof;
  },
) {
  const res = await fetch(`${API_URL}/cases/${caseId}/evidence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function submitResponse(
  caseId: string,
  body: {
    submittedBy: string;
    response: string;
    clientProof?: ClientArkivProof;
  },
) {
  const res = await fetch(`${API_URL}/cases/${caseId}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function resolveCase(caseId: string) {
  const res = await fetch(`${API_URL}/cases/${caseId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchMockContracts(): Promise<MockContract[]> {
  const res = await fetch(`${API_URL}/mock/contracts`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { contracts: MockContract[] };
  return data.contracts ?? [];
}

export async function openMockDispute(
  contractId: string,
  overrides?: {
    claim?: string;
    rules?: string[];
    claimantEvidence?: { contentHash: string; description: string; uri?: string }[];
    claimantAddress?: string;
    respondentAddress?: string;
  },
): Promise<{ case: Case }> {
  const res = await fetch(
    `${API_URL}/mock/contracts/${contractId}/open-dispute`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(overrides ?? {}),
    },
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

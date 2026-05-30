import type {
  AgentResolveOutput,
  ArkivEntity,
  Case,
  Evidence,
} from "@mediation-rooms/config";
import { createArkivClient, type ArkivClientConfig } from "./client.js";

let defaultClient = createArkivClient();

export function resetDefaultClient(config?: ArkivClientConfig): void {
  defaultClient = createArkivClient(config);
}

function getClient(config?: ArkivClientConfig) {
  return config ? createArkivClient(config) : defaultClient;
}

export async function createCaseEntity(
  input: { case: Case; expiresAt?: string },
  config?: ArkivClientConfig,
): Promise<ArkivEntity> {
  return getClient(config).createCaseEntity(input);
}

export async function createEvidenceEntity(
  input: { evidence: Evidence; expiresAt?: string },
  config?: ArkivClientConfig,
): Promise<ArkivEntity> {
  return getClient(config).createEvidenceEntity(input);
}

export async function createClaimEntity(
  input: {
    caseId: string;
    submittedBy: string;
    claim: string;
    expiresAt?: string;
  },
  config?: ArkivClientConfig,
): Promise<ArkivEntity> {
  return getClient(config).createClaimEntity(input);
}

export async function createAgentAnalysisEntity(
  input: {
    caseId: string;
    analysis: AgentResolveOutput;
    expiresAt?: string;
  },
  config?: ArkivClientConfig,
): Promise<ArkivEntity> {
  return getClient(config).createAgentAnalysisEntity(input);
}

export async function queryCaseEntities(
  caseId: string,
  config?: ArkivClientConfig,
): Promise<ArkivEntity[]> {
  return getClient(config).queryCaseEntities(caseId);
}

export async function queryEvidenceByCaseId(
  caseId: string,
  config?: ArkivClientConfig,
): Promise<ArkivEntity[]> {
  return getClient(config).queryEvidenceByCaseId(caseId);
}

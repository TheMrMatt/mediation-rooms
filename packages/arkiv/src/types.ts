import type {
  AgentResolveOutput,
  ArkivEntity,
  Case,
  Evidence,
} from "@mediation-rooms/config";

export interface ArkivClientConfig {
  /** memory = sin blockchain; braga = Arkiv testnet */
  mode?: "memory" | "braga";
  privateKey?: string;
  rpcUrl?: string;
  projectAttribute?: string;
}

export interface CreateCaseEntityInput {
  case: Case;
  expiresAt?: string;
}

export interface CreateEvidenceEntityInput {
  evidence: Evidence;
  expiresAt?: string;
}

export interface CreateClaimEntityInput {
  caseId: string;
  submittedBy: string;
  claim: string;
  expiresAt?: string;
  expiresInSeconds?: number;
}

export interface CreateResponseEntityInput {
  caseId: string;
  submittedBy: string;
  response: string;
  expiresAt?: string;
  expiresInSeconds?: number;
}

export interface CreateAgentAnalysisEntityInput {
  caseId: string;
  analysis: AgentResolveOutput;
  expiresAt?: string;
}

export interface ArkivStorage {
  createCaseEntity(input: CreateCaseEntityInput): Promise<ArkivEntity>;
  createEvidenceEntity(input: CreateEvidenceEntityInput): Promise<ArkivEntity>;
  createClaimEntity(input: CreateClaimEntityInput): Promise<ArkivEntity>;
  createResponseEntity(input: CreateResponseEntityInput): Promise<ArkivEntity>;
  createAgentAnalysisEntity(
    input: CreateAgentAnalysisEntityInput,
  ): Promise<ArkivEntity>;
  extendEntityExpiration(
    entityKey: string,
    additionalSeconds: number,
  ): Promise<{ entityKey: string; txHash?: string }>;
  queryCaseEntities(caseId: string): Promise<ArkivEntity[]>;
  queryEvidenceByCaseId(caseId: string): Promise<ArkivEntity[]>;
  queryAllEntitiesByCaseId(caseId: string): Promise<ArkivEntity[]>;
  listCaseEntities(): Promise<ArkivEntity[]>;
  getLatestCase(caseId: string): Promise<Case | null>;
}

import { PROJECT_ATTRIBUTE } from "@mediation-rooms/config";
import { BragaArkivClient } from "./braga-client.js";
import { MemoryArkivClient } from "./memory-client.js";
import type {
  ArkivClientConfig,
  ArkivStorage,
  CreateAgentAnalysisEntityInput,
  CreateCaseEntityInput,
  CreateClaimEntityInput,
  CreateEvidenceEntityInput,
  CreateResponseEntityInput,
} from "./types.js";

export type { ArkivClientConfig, ArkivStorage } from "./types.js";
export type {
  CreateCaseEntityInput,
  CreateEvidenceEntityInput,
  CreateClaimEntityInput,
  CreateResponseEntityInput,
  CreateAgentAnalysisEntityInput,
} from "./types.js";

export function resolveArkivMode(config: ArkivClientConfig = {}): "memory" | "braga" {
  if (config.mode) return config.mode;
  if (config.privateKey ?? process.env.ARKIV_PRIVATE_KEY) return "braga";
  return "memory";
}

export function createArkivClient(config: ArkivClientConfig = {}): ArkivStorage {
  const mode = resolveArkivMode(config);
  const resolved: ArkivClientConfig = {
    projectAttribute:
      config.projectAttribute ??
      process.env.ARKIV_PROJECT_ATTRIBUTE ??
      PROJECT_ATTRIBUTE,
    privateKey: config.privateKey ?? process.env.ARKIV_PRIVATE_KEY,
    rpcUrl:
      config.rpcUrl ??
      process.env.ARKIV_RPC_URL ??
      "https://braga.hoodi.arkiv.network/rpc",
    mode,
  };

  if (mode === "braga") {
    return new BragaArkivClient(resolved);
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[arkiv] Modo memory — seteá ARKIV_PRIVATE_KEY en .env para usar Braga testnet",
    );
  }

  return new MemoryArkivClient(resolved);
}

/** Alias de compatibilidad */
export class ArkivClient implements ArkivStorage {
  private readonly storage: ArkivStorage;

  constructor(config: ArkivClientConfig = {}) {
    this.storage = createArkivClient(config);
  }

  createCaseEntity(input: CreateCaseEntityInput) {
    return this.storage.createCaseEntity(input);
  }

  createEvidenceEntity(input: CreateEvidenceEntityInput) {
    return this.storage.createEvidenceEntity(input);
  }

  createClaimEntity(input: CreateClaimEntityInput) {
    return this.storage.createClaimEntity(input);
  }

  createResponseEntity(input: CreateResponseEntityInput) {
    return this.storage.createResponseEntity(input);
  }

  createAgentAnalysisEntity(input: CreateAgentAnalysisEntityInput) {
    return this.storage.createAgentAnalysisEntity(input);
  }

  extendEntityExpiration(entityKey: string, additionalSeconds: number) {
    return this.storage.extendEntityExpiration(entityKey, additionalSeconds);
  }

  queryCaseEntities(caseId: string) {
    return this.storage.queryCaseEntities(caseId);
  }

  queryEvidenceByCaseId(caseId: string) {
    return this.storage.queryEvidenceByCaseId(caseId);
  }

  queryAllEntitiesByCaseId(caseId: string) {
    return this.storage.queryAllEntitiesByCaseId(caseId);
  }

  listCaseEntities() {
    return this.storage.listCaseEntities();
  }

  getLatestCase(caseId: string) {
    return this.storage.getLatestCase(caseId);
  }
}

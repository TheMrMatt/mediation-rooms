import {
  AgentResolveOutput,
  ArkivEntity,
  Case,
  Evidence,
  PROJECT_ATTRIBUTE,
} from "@mediation-rooms/config";
import type {
  ArkivClientConfig,
  ArkivStorage,
  CreateAgentAnalysisEntityInput,
  CreateCaseEntityInput,
  CreateClaimEntityInput,
  CreateEvidenceEntityInput,
  CreateResponseEntityInput,
} from "./types.js";
import { expiresAtFromNow, extendExpiresAt } from "@mediation-rooms/config";

const entityStore: ArkivEntity[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function baseAttributes(
  config: ArkivClientConfig,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    project: config.projectAttribute ?? PROJECT_ATTRIBUTE,
    ...extra,
  };
}

export class MemoryArkivClient implements ArkivStorage {
  constructor(private readonly config: ArkivClientConfig) {}

  async createCaseEntity(input: CreateCaseEntityInput): Promise<ArkivEntity> {
    const entity: ArkivEntity = {
      id: generateId("case"),
      type: "case",
      attributes: baseAttributes(this.config, {
        entityType: "case",
        caseId: input.case.caseId,
        status: input.case.status,
      }),
      payload: { ...input.case },
      expiresAt: input.expiresAt ?? input.case.expiresAt,
      createdAt: new Date().toISOString(),
    };

    entityStore.push(entity);
    return entity;
  }

  async createEvidenceEntity(
    input: CreateEvidenceEntityInput,
  ): Promise<ArkivEntity> {
    const entity: ArkivEntity = {
      id: generateId("evidence"),
      type: "evidence",
      attributes: baseAttributes(this.config, {
        entityType: "evidence",
        caseId: input.evidence.caseId,
        evidenceId: input.evidence.evidenceId,
        role: input.evidence.role,
      }),
      payload: { ...input.evidence },
      expiresAt: input.expiresAt,
      createdAt: new Date().toISOString(),
    };

    entityStore.push(entity);
    return entity;
  }

  async createClaimEntity(
    input: CreateClaimEntityInput,
  ): Promise<ArkivEntity> {
    const entity: ArkivEntity = {
      id: generateId("claim"),
      type: "claim",
      attributes: baseAttributes(this.config, {
        entityType: "claim",
        caseId: input.caseId,
        submittedBy: input.submittedBy,
      }),
      payload: {
        caseId: input.caseId,
        submittedBy: input.submittedBy,
        claim: input.claim,
      },
      expiresAt:
        input.expiresAt ??
        (input.expiresInSeconds
          ? expiresAtFromNow(input.expiresInSeconds)
          : undefined),
      createdAt: new Date().toISOString(),
    };

    entityStore.push(entity);
    return entity;
  }

  async createResponseEntity(
    input: CreateResponseEntityInput,
  ): Promise<ArkivEntity> {
    const entity: ArkivEntity = {
      id: generateId("response"),
      type: "response",
      attributes: baseAttributes(this.config, {
        entityType: "response",
        caseId: input.caseId,
        submittedBy: input.submittedBy,
      }),
      payload: {
        caseId: input.caseId,
        submittedBy: input.submittedBy,
        response: input.response,
      },
      expiresAt:
        input.expiresAt ??
        (input.expiresInSeconds
          ? expiresAtFromNow(input.expiresInSeconds)
          : undefined),
      createdAt: new Date().toISOString(),
    };

    entityStore.push(entity);
    return entity;
  }

  async extendEntityExpiration(
    entityKey: string,
    additionalSeconds: number,
  ): Promise<{ entityKey: string; txHash?: string }> {
    const entity = entityStore.find((item) => item.id === entityKey);
    if (entity?.expiresAt) {
      entity.expiresAt = extendExpiresAt(entity.expiresAt, additionalSeconds);
    }
    return { entityKey };
  }

  async createAgentAnalysisEntity(
    input: CreateAgentAnalysisEntityInput,
  ): Promise<ArkivEntity> {
    const entity: ArkivEntity = {
      id: generateId("analysis"),
      type: "agent_analysis",
      attributes: baseAttributes(this.config, {
        entityType: "agent_analysis",
        caseId: input.caseId,
        outcome: input.analysis.outcome,
      }),
      payload: {
        caseId: input.caseId,
        ...input.analysis,
      },
      expiresAt: input.expiresAt,
      createdAt: new Date().toISOString(),
    };

    entityStore.push(entity);
    return entity;
  }

  async queryCaseEntities(caseId: string): Promise<ArkivEntity[]> {
    const project = this.config.projectAttribute ?? PROJECT_ATTRIBUTE;

    return entityStore.filter(
      (entity) =>
        entity.type === "case" &&
        entity.attributes.project === project &&
        entity.attributes.caseId === caseId,
    );
  }

  async queryEvidenceByCaseId(caseId: string): Promise<ArkivEntity[]> {
    const project = this.config.projectAttribute ?? PROJECT_ATTRIBUTE;

    return entityStore.filter(
      (entity) =>
        entity.type === "evidence" &&
        entity.attributes.project === project &&
        entity.attributes.caseId === caseId,
    );
  }

  async queryAllEntitiesByCaseId(caseId: string): Promise<ArkivEntity[]> {
    const project = this.config.projectAttribute ?? PROJECT_ATTRIBUTE;

    return entityStore
      .filter(
        (entity) =>
          entity.attributes.project === project &&
          entity.attributes.caseId === caseId,
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listCaseEntities(): Promise<ArkivEntity[]> {
    const project = this.config.projectAttribute ?? PROJECT_ATTRIBUTE;

    return entityStore.filter(
      (entity) =>
        entity.type === "case" && entity.attributes.project === project,
    );
  }

  async getLatestCase(caseId: string): Promise<Case | null> {
    const entities = await this.queryCaseEntities(caseId);
    const latest = entities.at(-1);
    if (!latest) return null;
    return latest.payload as unknown as Case;
  }

  clearStore(): void {
    entityStore.length = 0;
  }
}

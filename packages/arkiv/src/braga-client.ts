import { createPublicClient, createWalletClient, http } from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { braga } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { jsonToPayload } from "@arkiv-network/sdk/utils";
import { expiresAtFromNow, PROJECT_ATTRIBUTE } from "@mediation-rooms/config";
import type {
  AgentResolveOutput,
  ArkivEntity,
  Case,
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

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

function resolveExpiresIn(
  expiresAt?: string,
  expiresInSeconds?: number,
): number {
  if (expiresInSeconds !== undefined) {
    return Math.max(expiresInSeconds, 3600);
  }
  if (expiresAt) {
    const seconds = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(seconds, 3600);
  }
  return DEFAULT_TTL_SECONDS;
}

function toAttributes(
  project: string,
  entries: Record<string, string>,
): Array<{ key: string; value: string }> {
  return Object.entries({ project, ...entries }).map(([key, value]) => ({
    key,
    value,
  }));
}

export class BragaArkivClient implements ArkivStorage {
  private readonly project: string;
  private readonly walletClient;
  private readonly publicClient;

  constructor(private readonly config: ArkivClientConfig) {
    if (!config.privateKey) {
      throw new Error("ARKIV_PRIVATE_KEY is required for Braga mode");
    }

    this.project = config.projectAttribute ?? PROJECT_ATTRIBUTE;
    const account = privateKeyToAccount(config.privateKey as `0x${string}`);
    const transport = config.rpcUrl ? http(config.rpcUrl) : http();

    this.walletClient = createWalletClient({
      chain: braga,
      transport,
      account,
    });
    this.publicClient = createPublicClient({
      chain: braga,
      transport,
    });
  }

  async verifyConnection(): Promise<{ currentBlock: bigint }> {
    const timing = await this.publicClient.getBlockTiming();
    return { currentBlock: timing.currentBlock };
  }

  private async createJsonEntity(
    entityType: string,
    payload: Record<string, unknown>,
    attributes: Record<string, string>,
    options?: { expiresAt?: string; expiresInSeconds?: number },
  ): Promise<ArkivEntity> {
    const { entityKey, txHash } = await this.walletClient.createEntity({
      payload: jsonToPayload(payload),
      contentType: "application/json",
      attributes: toAttributes(this.project, {
        entityType,
        ...attributes,
      }),
      expiresIn: resolveExpiresIn(options?.expiresAt, options?.expiresInSeconds),
    });

    const enrichedPayload = txHash
      ? { ...payload, _mediationMeta: { txHash } }
      : payload;

    const expiresAt =
      options?.expiresAt ??
      (options?.expiresInSeconds
        ? expiresAtFromNow(options.expiresInSeconds)
        : undefined);

    return {
      id: entityKey,
      txHash,
      type: entityType,
      attributes: { project: this.project, entityType, ...attributes },
      payload: enrichedPayload,
      expiresAt,
      createdAt: new Date().toISOString(),
    };
  }

  async createCaseEntity(input: CreateCaseEntityInput): Promise<ArkivEntity> {
    const expiresAt = input.expiresAt ?? input.case.expiresAt;
    return this.createJsonEntity(
      "case",
      input.case as unknown as Record<string, unknown>,
      { caseId: input.case.caseId, status: input.case.status },
      { expiresAt },
    );
  }

  async createEvidenceEntity(
    input: CreateEvidenceEntityInput,
  ): Promise<ArkivEntity> {
    return this.createJsonEntity(
      "evidence",
      input.evidence as unknown as Record<string, unknown>,
      {
        caseId: input.evidence.caseId,
        evidenceId: input.evidence.evidenceId,
        role: input.evidence.role,
      },
      { expiresAt: input.expiresAt },
    );
  }

  async createClaimEntity(
    input: CreateClaimEntityInput,
  ): Promise<ArkivEntity> {
    return this.createJsonEntity(
      "claim",
      {
        caseId: input.caseId,
        submittedBy: input.submittedBy,
        claim: input.claim,
      },
      { caseId: input.caseId, submittedBy: input.submittedBy },
      {
        expiresAt: input.expiresAt,
        expiresInSeconds: input.expiresInSeconds,
      },
    );
  }

  async createResponseEntity(
    input: CreateResponseEntityInput,
  ): Promise<ArkivEntity> {
    return this.createJsonEntity(
      "response",
      {
        caseId: input.caseId,
        submittedBy: input.submittedBy,
        response: input.response,
      },
      { caseId: input.caseId, submittedBy: input.submittedBy },
      {
        expiresAt: input.expiresAt,
        expiresInSeconds: input.expiresInSeconds,
      },
    );
  }

  async extendEntityExpiration(
    entityKey: string,
    additionalSeconds: number,
  ): Promise<{ entityKey: string; txHash?: string }> {
    const result = await this.walletClient.extendEntity({
      entityKey: entityKey as `0x${string}`,
      expiresIn: additionalSeconds,
    });

    return {
      entityKey: result.entityKey,
      txHash: result.txHash,
    };
  }

  async createAgentAnalysisEntity(
    input: CreateAgentAnalysisEntityInput,
  ): Promise<ArkivEntity> {
    return this.createJsonEntity(
      "agent_analysis",
      {
        caseId: input.caseId,
        ...(input.analysis as AgentResolveOutput),
      },
      { caseId: input.caseId, outcome: input.analysis.outcome },
      { expiresAt: input.expiresAt },
    );
  }

  private async queryByProject(
    entityType: string,
    extra?: Record<string, string>,
  ): Promise<ArkivEntity[]> {
    const predicates = [
      eq("project", this.project),
      eq("entityType", entityType),
      ...Object.entries(extra ?? {}).map(([key, value]) => eq(key, value)),
    ];

    const result = await this.publicClient
      .buildQuery()
      .where(predicates)
      .withPayload(true)
      .withAttributes(true)
      .limit(200)
      .fetch();

    return result.entities.map((entity) => {
      const attributes = Object.fromEntries(
        entity.attributes.map(({ key, value }) => [key, String(value)]),
      );

      let payload: Record<string, unknown> = {};
      try {
        payload = entity.toJson() as Record<string, unknown>;
      } catch {
        payload = { raw: entity.toText() };
      }

      const meta = payload._mediationMeta as { txHash?: string } | undefined;

      return {
        id: entity.key,
        txHash: meta?.txHash,
        type: attributes.entityType ?? entityType,
        attributes,
        payload,
        createdAt: entity.createdAtBlock
          ? new Date(Number(entity.createdAtBlock) * 1000).toISOString()
          : new Date().toISOString(),
        expiresAt: entity.expiresAtBlock
          ? new Date(Number(entity.expiresAtBlock) * 1000).toISOString()
          : undefined,
      };
    });
  }

  async queryCaseEntities(caseId: string): Promise<ArkivEntity[]> {
    return this.queryByProject("case", { caseId });
  }

  async queryEvidenceByCaseId(caseId: string): Promise<ArkivEntity[]> {
    return this.queryByProject("evidence", { caseId });
  }

  async queryAllEntitiesByCaseId(caseId: string): Promise<ArkivEntity[]> {
    const entityTypes = [
      "case",
      "evidence",
      "claim",
      "response",
      "agent_analysis",
    ] as const;

    const batches = await Promise.all(
      entityTypes.map((entityType) =>
        this.queryByProject(entityType, { caseId }),
      ),
    );

    return batches
      .flat()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listCaseEntities(): Promise<ArkivEntity[]> {
    return this.queryByProject("case");
  }

  async getLatestCase(caseId: string): Promise<Case | null> {
    const entities = await this.queryCaseEntities(caseId);
    const latest = entities.at(-1);
    if (!latest) return null;
    return latest.payload as unknown as Case;
  }
}

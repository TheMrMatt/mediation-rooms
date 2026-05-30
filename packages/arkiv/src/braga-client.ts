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
const QUERY_MAX_ATTEMPTS = 5;
const QUERY_BASE_DELAY_MS = 500;

/**
 * El nodo RPC de Braga (testnet) puede cancelar queries bajo carga y devolver
 * errores transitorios como "context cancelled" o timeouts. El SDK de Arkiv no
 * reintenta por sí solo, así que detectamos estos casos para reintentar.
 */
function isTransientQueryError(error: unknown): boolean {
  const message = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();

  return [
    "context cancelled",
    "context canceled",
    "context deadline exceeded",
    "timeout",
    "timed out",
    "fetch failed",
    "network",
    "socket hang up",
    "econnreset",
    "econnrefused",
    "etimedout",
    "503",
    "502",
    "504",
    "429",
  ].some((needle) => message.includes(needle));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withQueryRetry<T>(
  operation: () => Promise<T>,
  label: string,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= QUERY_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === QUERY_MAX_ATTEMPTS || !isTransientQueryError(error)) {
        throw error;
      }

      const backoff = QUERY_BASE_DELAY_MS * 2 ** (attempt - 1);
      const jitter = Math.floor(Math.random() * QUERY_BASE_DELAY_MS);
      console.warn(
        `[arkiv] ${label} falló (intento ${attempt}/${QUERY_MAX_ATTEMPTS}), ` +
          `reintentando en ${backoff + jitter}ms:`,
        error instanceof Error ? error.message : error,
      );
      await delay(backoff + jitter);
    }
  }

  throw lastError;
}

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
    // timeout generoso para que viem no aborte queries lentas del nodo de Braga
    // (un abort del cliente también dispara "context cancelled" en el nodo).
    const transportOptions = {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 500,
    } as const;
    const transport = config.rpcUrl
      ? http(config.rpcUrl, transportOptions)
      : http(undefined, transportOptions);

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

  private mapEntity(
    entity: {
      key: string;
      attributes: Array<{ key: string; value: unknown }>;
      createdAtBlock?: bigint | number | null;
      expiresAtBlock?: bigint | number | null;
      toJson: () => unknown;
      toText: () => string;
    },
    fallbackType: string,
  ): ArkivEntity {
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
      type: attributes.entityType ?? fallbackType,
      attributes,
      payload,
      createdAt: entity.createdAtBlock
        ? new Date(Number(entity.createdAtBlock) * 1000).toISOString()
        : new Date().toISOString(),
      expiresAt: entity.expiresAtBlock
        ? new Date(Number(entity.expiresAtBlock) * 1000).toISOString()
        : undefined,
    };
  }

  /**
   * Ejecuta una query filtrando por proyecto. `entityType` es opcional: si se
   * omite, devuelve todos los tipos que matcheen (útil para traer todo el caso
   * en una sola llamada en lugar de N queries en paralelo).
   */
  private async queryByProject(
    entityType?: string,
    extra?: Record<string, string>,
  ): Promise<ArkivEntity[]> {
    const predicates = [
      eq("project", this.project),
      ...(entityType ? [eq("entityType", entityType)] : []),
      ...Object.entries(extra ?? {}).map(([key, value]) => eq(key, value)),
    ];

    const label = `query project=${this.project}${
      entityType ? ` entityType=${entityType}` : ""
    }${extra?.caseId ? ` caseId=${extra.caseId}` : ""}`;

    const result = await withQueryRetry(
      () =>
        this.publicClient
          .buildQuery()
          .where(predicates)
          .withPayload(true)
          .withAttributes(true)
          .limit(200)
          .fetch(),
      label,
    );

    return result.entities.map((entity) =>
      this.mapEntity(entity, entityType ?? "case"),
    );
  }

  async queryCaseEntities(caseId: string): Promise<ArkivEntity[]> {
    return this.queryByProject("case", { caseId });
  }

  async queryEvidenceByCaseId(caseId: string): Promise<ArkivEntity[]> {
    return this.queryByProject("evidence", { caseId });
  }

  async queryAllEntitiesByCaseId(caseId: string): Promise<ArkivEntity[]> {
    // Una sola query por caseId (sin filtrar por entityType) en lugar de 5 en
    // paralelo: reduce drásticamente la carga sobre el nodo RPC de Braga y evita
    // los errores "context cancelled" al resolver un caso.
    const entities = await this.queryByProject(undefined, { caseId });

    return entities.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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

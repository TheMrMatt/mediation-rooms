import { randomUUID } from "node:crypto";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import {
  Case,
  CaseStatus,
  CreateCaseInput,
  DISPUTE_TTL_SECONDS,
  DisputeResponse,
  Evidence,
  PartyRole,
  RESPONSE_EXTENSION_SECONDS,
  Resolution,
  ArkivWriteProof,
  AUDIT_ENTITY_TTL_SECONDS,
  BRAGA_EXPLORER_URL,
  CaseAuditTrail,
  ArkivAuditEvent,
  ArkivAuditEventType,
  ClientArkivProof,
  ContractDisputeInput,
  expiresAtFromNow,
  extendExpiresAt,
} from "@mediation-rooms/config";
import type { ArkivEntity } from "@mediation-rooms/config";
import {
  createArkivClient,
  resolveArkivMode,
  type ArkivStorage,
} from "@mediation-rooms/arkiv";
import { resolveDispute } from "@mediation-rooms/agent";

const arkiv: ArkivStorage = createArkivClient();
const evidenceStore = new Map<string, Evidence[]>();
// Fuente de verdad inmediata para los descargos del respondent. Evita depender
// de la latencia de indexado de Arkiv/Braga al resolver justo después de firmar.
const responseStore = new Map<string, DisputeResponse[]>();

export function getArkivMode() {
  return resolveArkivMode();
}

const BRAGA_EXPLORER = BRAGA_EXPLORER_URL;

function generateCaseId(): string {
  return `case_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

async function getCaseRecord(caseId: string): Promise<Case | undefined> {
  const fromArkiv = await arkiv.getLatestCase(caseId);
  return fromArkiv ?? undefined;
}

export function getArkivWalletAddress(): string | null {
  const key = process.env.ARKIV_PRIVATE_KEY?.trim();
  if (!key || resolveArkivMode() !== "braga") return null;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) return null;
  return privateKeyToAccount(key as `0x${string}`).address;
}

export function getArkivExplorerLinks(entity?: {
  id: string;
  txHash?: string;
}) {
  if (!entity?.txHash) return undefined;

  return {
    entityKey: entity.id,
    txHash: entity.txHash,
    txUrl: `${BRAGA_EXPLORER}/tx/${entity.txHash}`,
    walletUrl: null as string | null,
  };
}

function toArkivProof(
  entity: ArkivEntity,
  note?: string,
): ArkivWriteProof | undefined {
  if (resolveArkivMode() === "memory" && !entity.txHash) {
    return {
      entityKey: entity.id,
      expiresAt: entity.expiresAt,
      note: note ?? "Modo memory — sin transacción on-chain",
    };
  }

  if (!entity.txHash) return undefined;

  return {
    entityKey: entity.id,
    txHash: entity.txHash,
    txUrl: `${BRAGA_EXPLORER}/tx/${entity.txHash}`,
    expiresAt: entity.expiresAt,
    note,
  };
}

function findParty(caseRecord: Case, role: PartyRole) {
  return caseRecord.parties.find((party) => party.role === role);
}

function isPartyAddress(caseRecord: Case, role: PartyRole, address: string) {
  const party = findParty(caseRecord, role);
  return party?.address.toLowerCase() === address.toLowerCase();
}

function validateClientProof(proof: ClientArkivProof, expectedAddress: string) {
  if (proof.signedBy.toLowerCase() !== expectedAddress.toLowerCase()) {
    throw new Error("La wallet firmante no coincide con submittedBy");
  }
  if (!proof.entityKey || !proof.txHash) {
    throw new Error("Prueba Arkiv del cliente incompleta");
  }
}

function entityFromClientProof(
  proof: ClientArkivProof,
  type: string,
  payload: Record<string, unknown>,
): ArkivEntity {
  return {
    id: proof.entityKey,
    txHash: proof.txHash,
    type,
    attributes: {},
    payload,
    createdAt: new Date().toISOString(),
  };
}

function entityTxUrl(txHash?: string) {
  return txHash ? `${BRAGA_EXPLORER}/tx/${txHash}` : undefined;
}

function summarizeEntity(entity: ArkivEntity, caseIndex: number): {
  eventType: ArkivAuditEventType;
  summary: string;
} {
  const payload = entity.payload;

  switch (entity.type) {
    case "case": {
      const status = String(payload.status ?? "");
      if (caseIndex === 0) {
        return {
          eventType: "CASE_CREATED",
          summary: `Caso creado (${status || "OPEN"})`,
        };
      }
      if (status === CaseStatus.RESOLVED) {
        return {
          eventType: "CASE_RESOLVED",
          summary: `Caso cerrado — resolución ${String(payload.resolution ?? Resolution.PENDING)}`,
        };
      }
      return {
        eventType: "CASE_UPDATED",
        summary: `Caso actualizado (${status})`,
      };
    }
    case "evidence":
      return {
        eventType: "EVIDENCE_SUBMITTED",
        summary: `Evidencia ${String(payload.evidenceId ?? "")} (${String(payload.role ?? "")})`,
      };
    case "claim":
      return {
        eventType: "DISPUTE_OPENED",
        summary: `Disputa abierta por ${String(payload.submittedBy ?? "")}`,
      };
    case "response":
      return {
        eventType: "DISPUTE_RESPONSE",
        summary: `Respuesta del respondent ${String(payload.submittedBy ?? "")}`,
      };
    case "agent_analysis":
      return {
        eventType: "AGENT_DECISION",
        summary: `Agente IA: ${String(payload.outcome ?? "")} (confianza ${String(payload.confidence ?? "?")})`,
      };
    default:
      return {
        eventType: "CASE_UPDATED",
        summary: `Entidad ${entity.type}`,
      };
  }
}

function mapEntityToAuditEvent(
  entity: ArkivEntity,
  caseIndex: number,
): ArkivAuditEvent {
  const { eventType, summary } = summarizeEntity(entity, caseIndex);

  return {
    eventType,
    entityType: entity.type,
    entityKey: entity.id,
    txHash: entity.txHash,
    txUrl: entityTxUrl(entity.txHash),
    timestamp: entity.createdAt,
    summary,
    payload: entity.payload,
  };
}

export async function getCaseAuditTrail(caseId: string): Promise<CaseAuditTrail> {
  const mode = resolveArkivMode();
  const entities = await arkiv.queryAllEntitiesByCaseId(caseId);
  let caseIndex = 0;

  const events = entities.map((entity) => {
    const event = mapEntityToAuditEvent(
      entity,
      entity.type === "case" ? caseIndex++ : 0,
    );
    return event;
  });

  const wallet = getArkivWalletAddress();

  return {
    caseId,
    mode,
    explorerBaseUrl: mode === "braga" ? BRAGA_EXPLORER : undefined,
    walletExplorerUrl:
      wallet && mode === "braga"
        ? `${BRAGA_EXPLORER}/address/${wallet}`
        : undefined,
    events,
  };
}

export async function createCase(input: CreateCaseInput): Promise<Case & {
  arkiv?: {
    entityKey: string;
    txHash: string;
    txUrl: string;
    note: string;
  };
}> {
  const now = new Date().toISOString();
  const caseId = generateCaseId();

  const newCase: Case = {
    caseId,
    parties: input.parties,
    status: CaseStatus.OPEN,
    resolution: Resolution.PENDING,
    externalAction: input.externalAction,
    rules: input.rules ?? [],
    createdAt: now,
    updatedAt: now,
    expiresAt: input.expiresAt,
  };

  const entity = await arkiv.createCaseEntity({ case: newCase, expiresAt: input.expiresAt });

  if (entity.txHash) {
    return {
      ...newCase,
      arkiv: {
        entityKey: entity.id,
        txHash: entity.txHash,
        txUrl: `${BRAGA_EXPLORER}/tx/${entity.txHash}`,
        note: "Entidad creada en Arkiv Braga (no es un contrato Solidity deployado).",
      },
    };
  }

  return newCase;
}

export async function getCase(caseId: string): Promise<Case | undefined> {
  return getCaseRecord(caseId);
}

export async function canExecuteCase(caseId: string): Promise<{
  canExecute: boolean;
  resolution: Resolution;
  reason: string;
}> {
  const caseRecord = await getCaseRecord(caseId);

  if (!caseRecord) {
    return {
      canExecute: false,
      resolution: Resolution.PENDING,
      reason: "Case not found",
    };
  }

  if (caseRecord.status === CaseStatus.RESOLVED) {
    const executable =
      caseRecord.resolution === Resolution.RELEASE_TO_PROVIDER ||
      caseRecord.resolution === Resolution.SPLIT_PAYMENT;

    return {
      canExecute: executable,
      resolution: caseRecord.resolution,
      reason: executable
        ? "Case resolved in favor of execution"
        : `Resolution ${caseRecord.resolution} blocks execution`,
    };
  }

  if (caseRecord.status === CaseStatus.EXPIRED_NO_DISPUTE) {
    return {
      canExecute: true,
      resolution: Resolution.RELEASE_TO_PROVIDER,
      reason: "Mediation window expired without dispute",
    };
  }

  if (
    caseRecord.status === CaseStatus.OPEN &&
    caseRecord.expiresAt &&
    new Date(caseRecord.expiresAt) <= new Date()
  ) {
    return {
      canExecute: true,
      resolution: Resolution.RELEASE_TO_PROVIDER,
      reason: "Mediation window expired without dispute",
    };
  }

  return {
    canExecute: false,
    resolution: caseRecord.resolution,
    reason: `Case status is ${caseRecord.status}`,
  };
}

export async function addEvidence(
  caseId: string,
  input: {
    submittedBy: string;
    role: PartyRole;
    contentHash: string;
    description: string;
    uri?: string;
    evidenceId?: string;
    clientProof?: ClientArkivProof;
  },
): Promise<
  Evidence & {
    arkiv?: {
      evidence?: ArkivWriteProof;
      caseUpdate?: ArkivWriteProof;
    };
  }
> {
  const caseRecord = await getCaseRecord(caseId);
  if (!caseRecord) {
    throw new Error("Case not found");
  }

  const evidence: Evidence = {
    evidenceId: input.evidenceId ?? `ev_${randomUUID().slice(0, 8)}`,
    caseId,
    submittedBy: input.submittedBy,
    role: input.role,
    contentHash: input.contentHash,
    description: input.description,
    uri: input.uri,
    createdAt: new Date().toISOString(),
  };

  const existing = evidenceStore.get(caseId) ?? [];
  existing.push(evidence);
  evidenceStore.set(caseId, existing);

  const evidenceExpiresAt = expiresAtFromNow(AUDIT_ENTITY_TTL_SECONDS);

  let evidenceEntity: ArkivEntity;
  if (input.clientProof) {
    validateClientProof(input.clientProof, input.submittedBy);
    evidenceEntity = entityFromClientProof(
      input.clientProof,
      "evidence",
      evidence as unknown as Record<string, unknown>,
    );
  } else {
    evidenceEntity = await arkiv.createEvidenceEntity({
      evidence,
      expiresAt: evidenceExpiresAt,
    });
  }

  caseRecord.updatedAt = new Date().toISOString();
  const caseEntity = await arkiv.createCaseEntity({
    case: caseRecord,
    expiresAt: caseRecord.expiresAt ?? evidenceExpiresAt,
  });

  return {
    ...evidence,
    arkiv: {
      evidence: toArkivProof(
        evidenceEntity,
        input.clientProof
          ? "Evidencia firmada on-chain por la wallet de la parte en Braga"
          : "Prueba/evidencia registrada en Arkiv Braga",
      ),
      caseUpdate: toArkivProof(caseEntity, "Caso actualizado tras nueva evidencia"),
    },
  };
}

export async function markDisputed(
  caseId: string,
  input: { submittedBy: string; claim: string; clientProof?: ClientArkivProof },
): Promise<
  Case & {
    arkiv?: {
      claim?: ArkivWriteProof;
      caseUpdate?: ArkivWriteProof;
    };
  }
> {
  const caseRecord = await getCaseRecord(caseId);
  if (!caseRecord) {
    throw new Error("Case not found");
  }

  if (caseRecord.status !== CaseStatus.OPEN) {
    throw new Error(`Cannot dispute case in status ${caseRecord.status}`);
  }

  if (!isPartyAddress(caseRecord, PartyRole.CLAIMANT, input.submittedBy)) {
    throw new Error("Only claimant can open dispute");
  }

  const disputeExpiresAt = expiresAtFromNow(DISPUTE_TTL_SECONDS);

  caseRecord.status = CaseStatus.DISPUTED;
  caseRecord.disputedAt = new Date().toISOString();
  caseRecord.updatedAt = caseRecord.disputedAt;
  caseRecord.expiresAt = disputeExpiresAt;

  let claimEntity: ArkivEntity;
  if (input.clientProof) {
    validateClientProof(input.clientProof, input.submittedBy);
    claimEntity = entityFromClientProof(input.clientProof, "claim", {
      caseId,
      submittedBy: input.submittedBy,
      claim: input.claim,
    });
  } else {
    claimEntity = await arkiv.createClaimEntity({
      caseId,
      submittedBy: input.submittedBy,
      claim: input.claim,
      expiresAt: disputeExpiresAt,
      expiresInSeconds: DISPUTE_TTL_SECONDS,
    });
  }

  caseRecord.disputeEntityKey = claimEntity.id;

  const caseEntity = await arkiv.createCaseEntity({
    case: caseRecord,
    expiresAt: disputeExpiresAt,
  });

  return {
    ...caseRecord,
    arkiv: {
      claim: toArkivProof(
        claimEntity,
        input.clientProof
          ? "Reclamo firmado on-chain por la wallet del claimant en Braga"
          : "Reclamo en Arkiv — TTL 48h (firmado por wallet del backend)",
      ),
      caseUpdate: toArkivProof(caseEntity, "Snapshot del caso actualizado en Arkiv"),
    },
  };
}

/**
 * Punto de integración: un contrato externo abre una disputa en Mediation
 * Rooms. La disputa nace ya en estado DISPUTED, con las reglas del contrato y
 * la evidencia inicial del claimant. El agente usará esas reglas para decidir.
 */
export async function openDisputeFromContract(
  input: ContractDisputeInput,
): Promise<{
  case: Case;
  arkiv: {
    claim?: ArkivWriteProof;
    evidence: ArkivWriteProof[];
    caseUpdate?: ArkivWriteProof;
  };
}> {
  const claimant = input.parties.find((p) => p.role === PartyRole.CLAIMANT);
  const respondent = input.parties.find((p) => p.role === PartyRole.RESPONDENT);

  if (!claimant || !respondent) {
    throw new Error("La disputa requiere un claimant y un respondent");
  }
  if (!input.rules || input.rules.length === 0) {
    throw new Error("El contrato debe enviar al menos una regla para el agente");
  }
  if (!input.claim?.trim()) {
    throw new Error("El reclamo del claimant es obligatorio");
  }

  const now = new Date().toISOString();
  const caseId = generateCaseId();
  const disputeExpiresAt = expiresAtFromNow(DISPUTE_TTL_SECONDS);

  const caseRecord: Case = {
    caseId,
    parties: input.parties,
    status: CaseStatus.DISPUTED,
    resolution: Resolution.PENDING,
    externalAction: input.externalAction,
    rules: input.rules,
    claim: input.claim,
    origin: input.origin,
    createdAt: now,
    updatedAt: now,
    disputedAt: now,
    expiresAt: disputeExpiresAt,
  };

  const claimEntity = await arkiv.createClaimEntity({
    caseId,
    submittedBy: claimant.address,
    claim: input.claim,
    expiresAt: disputeExpiresAt,
    expiresInSeconds: DISPUTE_TTL_SECONDS,
  });
  caseRecord.disputeEntityKey = claimEntity.id;

  const evidenceProofs: ArkivWriteProof[] = [];
  for (const item of input.claimantEvidence ?? []) {
    const evidence: Evidence = {
      evidenceId: `ev_${randomUUID().slice(0, 8)}`,
      caseId,
      submittedBy: claimant.address,
      role: PartyRole.CLAIMANT,
      contentHash: item.contentHash,
      description: item.description,
      uri: item.uri,
      createdAt: new Date().toISOString(),
    };

    const existing = evidenceStore.get(caseId) ?? [];
    existing.push(evidence);
    evidenceStore.set(caseId, existing);

    const evidenceEntity = await arkiv.createEvidenceEntity({
      evidence,
      expiresAt: expiresAtFromNow(AUDIT_ENTITY_TTL_SECONDS),
    });
    const proof = toArkivProof(
      evidenceEntity,
      "Evidencia inicial del claimant (enviada por el contrato)",
    );
    if (proof) evidenceProofs.push(proof);
  }

  const caseEntity = await arkiv.createCaseEntity({
    case: caseRecord,
    expiresAt: disputeExpiresAt,
  });

  return {
    case: caseRecord,
    arkiv: {
      claim: toArkivProof(
        claimEntity,
        "Reclamo abierto por el contrato externo — TTL 48h para que el respondent conteste",
      ),
      evidence: evidenceProofs,
      caseUpdate: toArkivProof(caseEntity, "Disputa registrada en Arkiv"),
    },
  };
}

export async function submitRespondentResponse(
  caseId: string,
  input: {
    submittedBy: string;
    response: string;
    clientProof?: ClientArkivProof;
  },
): Promise<{
  response: DisputeResponse;
  case: Case;
  arkiv?: {
    response?: ArkivWriteProof;
    extension?: ArkivWriteProof;
    caseUpdate?: ArkivWriteProof;
  };
}> {
  const caseRecord = await getCaseRecord(caseId);
  if (!caseRecord) {
    throw new Error("Case not found");
  }

  if (caseRecord.status !== CaseStatus.DISPUTED) {
    throw new Error(`Case must be DISPUTED to respond, got ${caseRecord.status}`);
  }

  if (!isPartyAddress(caseRecord, PartyRole.RESPONDENT, input.submittedBy)) {
    throw new Error("Only respondent can submit response");
  }

  if (!caseRecord.expiresAt) {
    throw new Error("Case has no dispute deadline");
  }

  if (new Date(caseRecord.expiresAt) <= new Date()) {
    throw new Error("Dispute response window expired");
  }

  const disputeResponse: DisputeResponse = {
    responseId: `resp_${randomUUID().slice(0, 8)}`,
    caseId,
    submittedBy: input.submittedBy,
    response: input.response,
    createdAt: new Date().toISOString(),
  };

  const existingResponses = responseStore.get(caseId) ?? [];
  existingResponses.push(disputeResponse);
  responseStore.set(caseId, existingResponses);

  let responseEntity: ArkivEntity;
  if (input.clientProof) {
    validateClientProof(input.clientProof, input.submittedBy);
    responseEntity = entityFromClientProof(input.clientProof, "response", {
      caseId,
      submittedBy: input.submittedBy,
      response: input.response,
    });
  } else {
    responseEntity = await arkiv.createResponseEntity({
      caseId,
      submittedBy: input.submittedBy,
      response: input.response,
      expiresAt: caseRecord.expiresAt,
    });
  }

  // La extensión +24h la hace el backend, dueño de la entidad del claim
  // (en una chain real el respondent no puede extender una entidad ajena).
  let extensionProof: ArkivWriteProof | undefined;
  if (caseRecord.disputeEntityKey) {
    try {
      const extension = await arkiv.extendEntityExpiration(
        caseRecord.disputeEntityKey,
        RESPONSE_EXTENSION_SECONDS,
      );
      extensionProof = {
        entityKey: extension.entityKey,
        txHash: extension.txHash,
        txUrl: entityTxUrl(extension.txHash),
        note: "Ventana extendida +24h en Arkiv (firmada por el backend)",
      };
    } catch (error) {
      console.warn("[respond] no se pudo extender la disputa:", error);
    }
  }

  caseRecord.expiresAt = extendExpiresAt(
    caseRecord.expiresAt,
    RESPONSE_EXTENSION_SECONDS,
  );
  caseRecord.updatedAt = new Date().toISOString();

  const caseEntity = await arkiv.createCaseEntity({
    case: caseRecord,
    expiresAt: caseRecord.expiresAt,
  });

  return {
    response: disputeResponse,
    case: caseRecord,
    arkiv: {
      response: toArkivProof(
        responseEntity,
        input.clientProof
          ? "Respuesta firmada on-chain por la wallet del respondent en Braga"
          : "Respuesta del respondent en Arkiv (wallet del backend)",
      ),
      extension: extensionProof,
      caseUpdate: toArkivProof(caseEntity, "Deadline del caso extendido +24h"),
    },
  };
}

export async function resolveCaseRecord(caseId: string): Promise<{
  case: Case;
  analysis: Awaited<ReturnType<typeof resolveDispute>>;
  arkiv?: {
    agentDecision?: ArkivWriteProof;
    caseUpdate?: ArkivWriteProof;
  };
}> {
  const caseRecord = await getCaseRecord(caseId);
  if (!caseRecord) {
    throw new Error("Case not found");
  }

  const arkivEvidence = await arkiv.queryEvidenceByCaseId(caseId);
  const allEvidence = [
    ...(evidenceStore.get(caseId) ?? []),
    ...arkivEvidence.map((entity) => entity.payload as unknown as Evidence),
  ];

  const uniqueEvidence = Array.from(
    new Map(allEvidence.map((item) => [item.evidenceId, item])).values(),
  );

  const claimantEvidence = uniqueEvidence.filter(
    (e) => e.role === PartyRole.CLAIMANT,
  );
  const respondentEvidence = uniqueEvidence.filter(
    (e) => e.role === PartyRole.RESPONDENT,
  );

  const allEntities = await arkiv.queryAllEntitiesByCaseId(caseId);
  const latestResponse = allEntities
    .filter((entity) => entity.type === "response")
    .at(-1);
  // Preferimos el descargo guardado localmente (disponible al instante) y,
  // si no existiera, caemos al que esté indexado on-chain.
  const localStatement = responseStore.get(caseId)?.at(-1)?.response;
  const respondentStatement =
    localStatement ??
    (latestResponse?.payload.response as string | undefined);

  const rules =
    caseRecord.rules && caseRecord.rules.length > 0
      ? caseRecord.rules
      : ["Resolver según la evidencia presentada por las partes."];

  const analysis = await resolveDispute({
    caseId,
    rules,
    claim: caseRecord.claim,
    respondentStatement,
    claimantEvidence,
    respondentEvidence,
    timeline: [
      {
        timestamp: caseRecord.createdAt,
        type: "CASE_OPENED",
        description: "Case opened",
      },
      ...(caseRecord.disputedAt
        ? [
            {
              timestamp: caseRecord.disputedAt,
              type: "DISPUTED",
              description: "Case disputed",
            },
          ]
        : []),
    ],
    allowedOutcomes: [
      Resolution.RELEASE_TO_PROVIDER,
      Resolution.REFUND_TO_CLIENT,
      Resolution.SPLIT_PAYMENT,
      Resolution.REQUEST_MORE_EVIDENCE,
      Resolution.MANUAL_REVIEW,
    ],
  });

  caseRecord.status = CaseStatus.RESOLVED;
  caseRecord.resolution = analysis.outcome;
  caseRecord.resolvedAt = new Date().toISOString();
  caseRecord.updatedAt = caseRecord.resolvedAt;

  const auditExpiresAt = expiresAtFromNow(AUDIT_ENTITY_TTL_SECONDS);

  const analysisEntity = await arkiv.createAgentAnalysisEntity({
    caseId,
    analysis,
    expiresAt: auditExpiresAt,
  });
  const caseEntity = await arkiv.createCaseEntity({
    case: caseRecord,
    expiresAt: auditExpiresAt,
  });

  return {
    case: caseRecord,
    analysis,
    arkiv: {
      agentDecision: toArkivProof(
        analysisEntity,
        `Decisión del agente IA: ${analysis.outcome} — ${analysis.reasoning.slice(0, 120)}`,
      ),
      caseUpdate: toArkivProof(
        caseEntity,
        "Caso cerrado en Arkiv con resolución final",
      ),
    },
  };
}

export async function listCases(): Promise<Case[]> {
  const entities = await arkiv.listCaseEntities();
  const byCaseId = new Map<string, Case>();

  for (const entity of entities) {
    const caseRecord = entity.payload as unknown as Case;
    byCaseId.set(caseRecord.caseId, caseRecord);
  }

  return Array.from(byCaseId.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function handleContractEvent(event: {
  type: string;
  caseId?: string;
  payload?: Record<string, unknown>;
}): Promise<{ received: boolean }> {
  console.log("[webhook] contract event:", event);
  return { received: true };
}

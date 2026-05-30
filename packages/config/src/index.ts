/** Attribute used to filter all Arkiv entities belonging to this project. */
export const PROJECT_ATTRIBUTE = "mediation-rooms" as const;

/** Ventana inicial para que el respondent conteste (48h). */
export const DISPUTE_TTL_SECONDS = 48 * 60 * 60;

/** Extensión al responder el respondent (+24h). */
export const RESPONSE_EXTENSION_SECONDS = 24 * 60 * 60;

/** Retención on-chain para evidencia y resoluciones (90 días). */
export const AUDIT_ENTITY_TTL_SECONDS = 90 * 24 * 60 * 60;

/** Explorer de Arkiv Braga testnet. */
export const BRAGA_EXPLORER_URL =
  "https://explorer.braga.hoodi.arkiv.network";

/** Case lifecycle states. */
export enum CaseStatus {
  OPEN = "OPEN",
  DISPUTED = "DISPUTED",
  RESOLVED = "RESOLVED",
  EXPIRED_NO_DISPUTE = "EXPIRED_NO_DISPUTE",
  CANCELLED = "CANCELLED",
}

/** Possible resolution outcomes for a mediation case. */
export enum Resolution {
  PENDING = "PENDING",
  RELEASE_TO_PROVIDER = "RELEASE_TO_PROVIDER",
  REFUND_TO_CLIENT = "REFUND_TO_CLIENT",
  SPLIT_PAYMENT = "SPLIT_PAYMENT",
  REQUEST_MORE_EVIDENCE = "REQUEST_MORE_EVIDENCE",
  MANUAL_REVIEW = "MANUAL_REVIEW",
  CANCEL_ACTION = "CANCEL_ACTION",
}

/** Party roles in a mediation case. */
export enum PartyRole {
  CLAIMANT = "CLAIMANT",
  RESPONDENT = "RESPONDENT",
  MEDIATOR = "MEDIATOR",
}

export interface Party {
  address: string;
  role: PartyRole;
  label?: string;
}

export interface ExternalAction {
  contractAddress: string;
  actionId: string;
  payload?: Record<string, unknown>;
}

export interface Case {
  caseId: string;
  parties: Party[];
  status: CaseStatus;
  resolution: Resolution;
  externalAction: ExternalAction;
  /** Reglas del contrato externo que el agente usa para decidir. */
  rules: string[];
  /** Texto del reclamo del claimant que origina la disputa. */
  claim?: string;
  /** Origen de la disputa (contrato externo que la creó). */
  origin?: DisputeOrigin;
  createdAt: string;
  updatedAt: string;
  disputedAt?: string;
  resolvedAt?: string;
  expiresAt?: string;
  /** Entity key del reclamo en Arkiv (al abrir disputa). */
  disputeEntityKey?: string;
}

export interface DisputeOrigin {
  /** Identificador del contrato externo que originó la disputa. */
  contractId: string;
  /** Tipo de contrato, ej. "freelance-escrow". */
  contractType: string;
  /** Red/chain donde vive el contrato (informativo). */
  chain?: string;
}

export interface Evidence {
  evidenceId: string;
  caseId: string;
  submittedBy: string;
  role: PartyRole;
  contentHash: string;
  description: string;
  uri?: string;
  createdAt: string;
}

export interface DisputeResponse {
  responseId: string;
  caseId: string;
  submittedBy: string;
  response: string;
  createdAt: string;
}

export interface ClientArkivProof {
  entityKey: string;
  txHash: string;
  signedBy: string;
}

export interface ArkivWriteProof {
  entityKey: string;
  txHash?: string;
  txUrl?: string;
  expiresAt?: string;
  note?: string;
}

export type ArkivAuditEventType =
  | "CASE_CREATED"
  | "CASE_UPDATED"
  | "EVIDENCE_SUBMITTED"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESPONSE"
  | "AGENT_DECISION"
  | "CASE_RESOLVED";

export interface ArkivAuditEvent {
  eventType: ArkivAuditEventType;
  entityType: string;
  entityKey: string;
  txHash?: string;
  txUrl?: string;
  timestamp: string;
  summary: string;
  payload?: Record<string, unknown>;
}

export interface CaseAuditTrail {
  caseId: string;
  mode: "memory" | "braga";
  explorerBaseUrl?: string;
  walletExplorerUrl?: string;
  events: ArkivAuditEvent[];
}

export interface TimelineEvent {
  timestamp: string;
  type: string;
  description: string;
  actor?: string;
}

export interface AgentResolveInput {
  caseId: string;
  rules: string[];
  /** Texto del reclamo del claimant. */
  claim?: string;
  /** Declaración/respuesta del respondent, si la hubo. */
  respondentStatement?: string;
  claimantEvidence: Evidence[];
  respondentEvidence: Evidence[];
  timeline: TimelineEvent[];
  allowedOutcomes: Resolution[];
}

export interface RuleEvaluation {
  rule: string;
  favoredRole: PartyRole | "NEUTRAL";
  rationale: string;
}

export interface AgentResolveOutput {
  outcome: Resolution;
  confidence: number;
  reasoning: string;
  missingEvidence: string[];
  recommendedAction: string;
  /** Cómo evaluó cada regla del contrato (para trazabilidad). */
  ruleEvaluations?: RuleEvaluation[];
}

export interface CanExecuteResult {
  canExecute: boolean;
  resolution: Resolution;
  reason: string;
}

export interface CreateCaseInput {
  parties: Party[];
  externalAction: ExternalAction;
  rules?: string[];
  expiresAt?: string;
}

/** Evidencia inicial enviada por el claimant al abrir la disputa. */
export interface ContractDisputeEvidence {
  contentHash: string;
  description: string;
  uri?: string;
}

/**
 * Payload que un contrato externo envía a Mediation Rooms para abrir una
 * disputa. Incluye las partes, las reglas del contrato (que el agente usa
 * para decidir) y la evidencia inicial del claimant.
 */
export interface ContractDisputeInput {
  origin: DisputeOrigin;
  externalAction: ExternalAction;
  parties: Party[];
  rules: string[];
  claim: string;
  claimantEvidence?: ContractDisputeEvidence[];
}

/** Contrato de ejemplo (mock) para probar el flujo de mediación. */
export interface MockContract {
  contractId: string;
  contractType: string;
  title: string;
  description: string;
  chain?: string;
  parties: Party[];
  externalAction: ExternalAction;
  rules: string[];
  /** Reclamo sugerido por defecto para simular la disputa. */
  sampleClaim: string;
  sampleEvidence: ContractDisputeEvidence[];
}

export interface ArkivEntity {
  id: string;
  type: string;
  attributes: Record<string, string>;
  payload: Record<string, unknown>;
  expiresAt?: string;
  createdAt: string;
  /** Hash de la transacción en Braga (solo modo braga). */
  txHash?: string;
}

export const DEFAULT_API_PORT = 3001;
export const DEFAULT_WEB_PORT = 3000;

export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getEnvOptional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export function expiresAtFromNow(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function extendExpiresAt(iso: string, additionalSeconds: number): string {
  return new Date(new Date(iso).getTime() + additionalSeconds * 1000).toISOString();
}

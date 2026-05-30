import type { Case } from "@mediation-rooms/config";

export type Tone = "success" | "warning" | "danger" | "neutral";

/** Acorta una address: 0x1234…ABCD */
export function shortAddr(address?: string): string {
  if (!address) return "—";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Etiqueta humana del rol. */
export function roleLabelEs(role: string): string {
  switch (role) {
    case "CLAIMANT":
      return "Reclamante (cliente)";
    case "RESPONDENT":
      return "Reclamado (proveedor)";
    case "MEDIATOR":
      return "Mediador";
    default:
      return role;
  }
}

export function roleShortEs(role: string): string {
  switch (role) {
    case "CLAIMANT":
      return "Cliente";
    case "RESPONDENT":
      return "Proveedor";
    default:
      return role;
  }
}

/** Headline humano por outcome del agente. */
export const OUTCOME_HEADLINE: Record<string, string> = {
  REFUND_TO_CLIENT: "Favorable al cliente — corresponde reembolso",
  RELEASE_TO_PROVIDER: "Favorable al proveedor — se puede liberar el pago",
  SPLIT_PAYMENT: "Resolución parcial — corresponde repartir el pago",
  REQUEST_MORE_EVIDENCE: "Falta evidencia — la ejecución sigue bloqueada",
  MANUAL_REVIEW: "Revisión manual requerida — la ejecución sigue bloqueada",
  CANCEL_ACTION: "Acción cancelada por el agente",
  PENDING: "Pendiente de resolución",
};

/** Qué debería hacer el sistema externo, por outcome. */
export const OUTCOME_EXTERNAL_ACTION: Record<string, string> = {
  RELEASE_TO_PROVIDER:
    "El sistema externo puede ejecutar la acción protegida y liberar los fondos al proveedor.",
  REFUND_TO_CLIENT:
    "El sistema externo debería reembolsar al cliente en lugar de liberar los fondos al proveedor.",
  SPLIT_PAYMENT:
    "El sistema externo debería repartir el pago según la resolución del agente.",
  REQUEST_MORE_EVIDENCE:
    "El sistema externo debe mantener la ejecución bloqueada hasta que se presente más evidencia.",
  MANUAL_REVIEW:
    "El sistema externo debe mantener la ejecución bloqueada y escalar el caso a revisión manual.",
  CANCEL_ACTION:
    "El sistema externo debería cancelar la acción protegida.",
  PENDING:
    "Todavía no hay decisión. La ejecución sigue bloqueada hasta resolver.",
};

export function outcomeTone(outcome: string): Tone {
  switch (outcome) {
    case "RELEASE_TO_PROVIDER":
      return "success";
    case "REFUND_TO_CLIENT":
    case "REQUEST_MORE_EVIDENCE":
    case "MANUAL_REVIEW":
    case "CANCEL_ACTION":
      return "warning";
    case "SPLIT_PAYMENT":
    default:
      return "neutral";
  }
}

/** Estado de ejecución de la acción protegida (solo presentación). */
export function executionStatus(c: Case): {
  canExecute: boolean;
  reason: string;
  tone: Tone;
  label: string;
} {
  if (c.status === "RESOLVED") {
    switch (c.resolution) {
      case "RELEASE_TO_PROVIDER":
        return {
          canExecute: true,
          reason: "resolved_release_to_provider",
          tone: "success",
          label: "Permitida",
        };
      case "REFUND_TO_CLIENT":
        return {
          canExecute: false,
          reason: "resolved_refund_to_client",
          tone: "warning",
          label: "Reembolso al cliente",
        };
      case "SPLIT_PAYMENT":
        return {
          canExecute: false,
          reason: "resolved_split_payment",
          tone: "neutral",
          label: "Pago repartido",
        };
      default:
        return {
          canExecute: false,
          reason: "manual_review_required",
          tone: "warning",
          label: "Bloqueada",
        };
    }
  }
  if (c.status === "DISPUTED") {
    return {
      canExecute: false,
      reason: "dispute_active",
      tone: "warning",
      label: "Bloqueada",
    };
  }
  return {
    canExecute: false,
    reason: "case_not_resolved",
    tone: "neutral",
    label: "—",
  };
}

/** Estado de ejecución derivado solo del outcome (post-resolución). */
export function execFromOutcome(outcome: string): {
  canExecute: boolean;
  reason: string;
  tone: Tone;
  label: string;
} {
  switch (outcome) {
    case "RELEASE_TO_PROVIDER":
      return { canExecute: true, reason: "resolved_release_to_provider", tone: "success", label: "Permitida" };
    case "REFUND_TO_CLIENT":
      return { canExecute: false, reason: "resolved_refund_to_client", tone: "warning", label: "Reembolso al cliente" };
    case "SPLIT_PAYMENT":
      return { canExecute: false, reason: "resolved_split_payment", tone: "neutral", label: "Pago repartido" };
    case "REQUEST_MORE_EVIDENCE":
      return { canExecute: false, reason: "more_evidence_required", tone: "warning", label: "Bloqueada" };
    case "MANUAL_REVIEW":
      return { canExecute: false, reason: "manual_review_required", tone: "warning", label: "Bloqueada" };
    default:
      return { canExecute: false, reason: "pending", tone: "neutral", label: "Bloqueada" };
  }
}

/** Títulos cortos para presentación (no alteran los datos del caso). */
const CONTRACT_TITLES: Record<string, string> = {
  "freelance-escrow-001": "Landing Nimbus",
  "freelance-escrow-002": "API de inventario",
};

export function caseTitleEs(origin?: {
  contractId: string;
  contractType: string;
}): string {
  if (!origin) return "Caso de mediación";
  return CONTRACT_TITLES[origin.contractId] ?? origin.contractType;
}

/** Etiqueta humana de la acción externa bloqueada. */
export function actionLabelEs(actionId: string): string {
  switch (actionId) {
    case "release-milestone-1":
      return "Pago del milestone";
    case "release-final-payment":
      return "Pago final";
    default:
      return actionId;
  }
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierto",
  DISPUTED: "En disputa",
  RESOLVED: "Resuelto",
  EXPIRED_NO_DISPUTE: "Vencido sin disputa",
  CANCELLED: "Cancelado",
};

export function statusLabelEs(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "DISPUTED":
      return "warning";
    case "RESOLVED":
      return "success";
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}

const AVATAR_COLORS = [
  "#5b6ee1",
  "#1f7a4d",
  "#b7791f",
  "#9333ea",
  "#0891b2",
  "#b42318",
];

export function avatarColor(seed?: string): string {
  if (!seed) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function avatarInitials(label?: string, address?: string): string {
  if (label) {
    const parts = label.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return label.slice(0, 2).toUpperCase();
  }
  if (address) return address.slice(2, 4).toUpperCase();
  return "··";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

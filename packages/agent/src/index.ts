import {
  AgentResolveInput,
  AgentResolveOutput,
  PartyRole,
  Resolution,
  RuleEvaluation,
} from "@mediation-rooms/config";

/** Interface for pluggable AI providers (OpenAI, Anthropic, etc.). */
export interface MediationAgentProvider {
  resolveDispute(input: AgentResolveInput): Promise<AgentResolveOutput>;
}

export interface MediationAgentConfig {
  provider?: "mock" | "openai";
  openaiApiKey?: string;
  openaiModel?: string;
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "must",
  "que",
  "los",
  "las",
  "del",
  "una",
  "uno",
  "por",
  "con",
  "debe",
  "deben",
  "este",
  "esta",
  "dentro",
  "antes",
  "sobre",
  "para",
  "según",
  "segun",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token));
}

function textFor(
  evidence: { description: string }[],
  extra?: string,
): string {
  return [extra ?? "", ...evidence.map((item) => item.description)].join(" ");
}

function overlapScore(ruleTokens: string[], corpus: string): number {
  const corpusTokens = new Set(tokenize(corpus));
  return ruleTokens.reduce(
    (score, token) => score + (corpusTokens.has(token) ? 1 : 0),
    0,
  );
}

/** Términos con los que el respondent demuestra cumplimiento. */
const COMPLIANCE_TERMS = [
  "entregue",
  "entregué",
  "entregado",
  "entrega",
  "entregamos",
  "cumpli",
  "cumplí",
  "cumplido",
  "cumple",
  "completado",
  "complete",
  "completé",
  "finalizado",
  "deploy",
  "deployado",
  "repositorio",
  "repo",
  "tests",
  "funcional",
  "funciona",
  "funcionando",
  "accesible",
  "documentado",
  "plazo",
  "tiempo",
  "demostrable",
  "comprobante",
  "delivered",
  "completed",
  "working",
  "deployed",
  "repository",
];

/** Términos con los que el claimant alega incumplimiento. */
const BREACH_TERMS = [
  "nunca",
  "falta",
  "faltan",
  "faltante",
  "faltantes",
  "incumplio",
  "incumplió",
  "incumplido",
  "incumplimiento",
  "defecto",
  "defectuoso",
  "roto",
  "errores",
  "tarde",
  "atraso",
  "atrasado",
  "vencido",
  "incompleto",
  "incompleta",
  "missing",
  "broken",
  "failed",
  "late",
  "reembolso",
  "reclamo",
];

function countTerms(corpus: string, terms: string[]): number {
  const lower = ` ${corpus.toLowerCase()} `;
  return terms.reduce(
    (count, term) => count + (lower.includes(` ${term} `) || lower.includes(`${term} `) || lower.includes(` ${term}`) ? 1 : 0),
    0,
  );
}

/**
 * Mock agent rules-aware: evalúa cada regla del contrato contra la evidencia
 * y declaraciones de cada parte para decidir a favor de quién resuelve.
 * Reemplazable por un LLM real vía OpenAIProvider.
 */
export class MockMediationAgent implements MediationAgentProvider {
  async resolveDispute(input: AgentResolveInput): Promise<AgentResolveOutput> {
    const claimantCount = input.claimantEvidence.length;
    const respondentCount = input.respondentEvidence.length;

    if (claimantCount === 0 && respondentCount === 0) {
      return {
        outcome: this.pick(input, Resolution.REQUEST_MORE_EVIDENCE),
        confidence: 0.3,
        reasoning:
          "Ninguna parte presentó evidencia. No se puede aplicar las reglas del contrato todavía.",
        missingEvidence: [
          "Claimant: prueba del incumplimiento según las reglas",
          "Respondent: prueba de cumplimiento/entrega",
        ],
        recommendedAction: "Pedir evidencia a ambas partes",
        ruleEvaluations: input.rules.map((rule) => ({
          rule,
          favoredRole: "NEUTRAL" as const,
          rationale: "Sin evidencia para evaluar la regla",
        })),
      };
    }

    const claimantCorpus = textFor(input.claimantEvidence, input.claim);
    const respondentCorpus = textFor(
      input.respondentEvidence,
      input.respondentStatement,
    );
    const respondentResponded =
      Boolean(input.respondentStatement?.trim()) || respondentCount > 0;

    // Señales de intención: el claimant alega incumplimiento, el respondent
    // demuestra cumplimiento. Cada señal se cuenta solo en su corpus para
    // evitar falsos positivos por negaciones cruzadas.
    const claimantSignals = countTerms(claimantCorpus, BREACH_TERMS);
    const respondentSignals = countTerms(respondentCorpus, COMPLIANCE_TERMS);

    const claimantScore = claimantCount * 2 + claimantSignals + 1;
    const respondentScore =
      respondentCount * 2 + respondentSignals + (respondentResponded ? 2 : 0);

    const ruleEvaluations: RuleEvaluation[] = input.rules.map((rule) => {
      const ruleTokens = tokenize(rule);
      const respondentHit = respondentResponded
        ? overlapScore(ruleTokens, respondentCorpus) + respondentSignals
        : 0;
      const claimantHit = overlapScore(ruleTokens, claimantCorpus);

      if (respondentHit > claimantHit) {
        return {
          rule,
          favoredRole: PartyRole.RESPONDENT,
          rationale: `El respondent demuestra cumplimiento de esta regla (señal ${respondentHit} vs ${claimantHit}).`,
        };
      }
      if (claimantHit > respondentHit) {
        return {
          rule,
          favoredRole: PartyRole.CLAIMANT,
          rationale: respondentResponded
            ? `El claimant sostiene mejor el incumplimiento de esta regla (señal ${claimantHit} vs ${respondentHit}).`
            : "El respondent no aportó defensa para esta regla.",
        };
      }
      return {
        rule,
        favoredRole: "NEUTRAL" as const,
        rationale: "Evidencia pareja para esta regla.",
      };
    });

    const total = claimantScore + respondentScore || 1;
    const margin = Math.abs(claimantScore - respondentScore) / total;
    const confidence = Math.min(0.95, 0.55 + margin / 2);

    if (!respondentResponded) {
      return {
        outcome: this.pick(input, Resolution.REFUND_TO_CLIENT, Resolution.MANUAL_REVIEW),
        confidence: Math.max(0.6, confidence),
        reasoning:
          "El respondent no presentó respuesta ni evidencia dentro de la ventana. Se resuelve a favor del claimant según las reglas del contrato.",
        missingEvidence: ["Respondent: respuesta y prueba de cumplimiento"],
        recommendedAction: "Reembolsar al cliente por falta de defensa",
        ruleEvaluations,
      };
    }

    if (claimantScore === respondentScore) {
      return {
        outcome: this.pick(input, Resolution.SPLIT_PAYMENT, Resolution.MANUAL_REVIEW),
        confidence: 0.5,
        reasoning: `Evaluación pareja según las reglas (claimant ${claimantScore} vs respondent ${respondentScore}). Se sugiere repartir o revisión manual.`,
        missingEvidence: [],
        recommendedAction: "Split de pago o escalamiento a revisión manual",
        ruleEvaluations,
      };
    }

    const favorsClaimant = claimantScore > respondentScore;
    const outcome = favorsClaimant
      ? this.pick(input, Resolution.REFUND_TO_CLIENT, Resolution.SPLIT_PAYMENT)
      : this.pick(input, Resolution.RELEASE_TO_PROVIDER, Resolution.SPLIT_PAYMENT);

    return {
      outcome,
      confidence,
      reasoning: favorsClaimant
        ? `La evidencia y las reglas favorecen al claimant (${claimantScore} vs ${respondentScore}). El respondent no demostró cumplimiento suficiente.`
        : `La evidencia y las reglas favorecen al respondent (${respondentScore} vs ${claimantScore}). Demostró cumplimiento de las obligaciones del contrato.`,
      missingEvidence:
        respondentCount === 0 && !favorsClaimant
          ? ["Respondent: adjuntar prueba documental del cumplimiento"]
          : [],
      recommendedAction: favorsClaimant
        ? "Reembolsar al cliente (claimant)"
        : "Liberar el pago al proveedor (respondent)",
      ruleEvaluations,
    };
  }

  /** Devuelve el primer outcome permitido de los candidatos, o MANUAL_REVIEW. */
  private pick(
    input: AgentResolveInput,
    ...candidates: Resolution[]
  ): Resolution {
    const allowed = input.allowedOutcomes ?? [];
    for (const candidate of candidates) {
      if (allowed.length === 0 || allowed.includes(candidate)) {
        return candidate;
      }
    }
    if (allowed.includes(Resolution.MANUAL_REVIEW)) return Resolution.MANUAL_REVIEW;
    return allowed[0] ?? Resolution.MANUAL_REVIEW;
  }
}

/** Placeholder for future OpenAI integration. */
export class OpenAIMediationAgent implements MediationAgentProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = "gpt-4o",
  ) {}

  async resolveDispute(input: AgentResolveInput): Promise<AgentResolveOutput> {
    // TODO: Connect to OpenAI API with structured output
    void this.apiKey;
    void this.model;
    void input;

    throw new Error(
      "OpenAIMediationAgent not implemented yet. Use MockMediationAgent or set AGENT_PROVIDER=mock",
    );
  }
}

export function createMediationAgent(
  config: MediationAgentConfig = {},
): MediationAgentProvider {
  const provider = config.provider ?? process.env.AGENT_PROVIDER ?? "mock";

  if (provider === "openai") {
    const apiKey = config.openaiApiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY required for openai provider");
    }
    return new OpenAIMediationAgent(
      apiKey,
      config.openaiModel ?? process.env.OPENAI_MODEL,
    );
  }

  return new MockMediationAgent();
}

/** Main entry point for dispute resolution. */
export async function resolveDispute(
  input: AgentResolveInput,
  config?: MediationAgentConfig,
): Promise<AgentResolveOutput> {
  const agent = createMediationAgent(config);
  return agent.resolveDispute(input);
}

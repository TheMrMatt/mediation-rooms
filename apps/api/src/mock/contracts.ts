import { PartyRole, type MockContract } from "@mediation-rooms/config";

/**
 * Contratos de ejemplo (mock) que simulan integraciones externas con
 * Mediation Rooms. En producción estos datos vendrían del contrato real que
 * dispara la disputa; acá sirven para testear el flujo end-to-end.
 */
export const MOCK_CONTRACTS: MockContract[] = [
  {
    contractId: "freelance-escrow-001",
    contractType: "freelance-escrow",
    title: "Escrow freelance — Landing Nimbus",
    description:
      "USD 2.500 en escrow por una landing page para el SaaS Nimbus. Contrato firmado el 01/04/2026; entrega final el 15/05/2026.",
    chain: "braga",
    parties: [
      {
        address: "0x1111111111111111111111111111111111111111",
        role: PartyRole.CLAIMANT,
        label: "Cliente — Nimbus Inc.",
      },
      {
        address: "0x2222222222222222222222222222222222222222",
        role: PartyRole.RESPONDENT,
        label: "Freelancer — diseño y frontend",
      },
    ],
    externalAction: {
      contractAddress: "0xescrow0000000000000000000000000000000001",
      actionId: "release-milestone-1",
    },
    rules: [
      "Fecha límite de entrega: 15/05/2026 (45 días calendario desde la firma del contrato del 01/04/2026).",
      "Entregables obligatorios: (a) repositorio GitHub con código fuente, (b) deploy público en Vercel accesible sin login, (c) diseño responsive mobile+desktop según mockup acordado en Figma (link compartido el 02/04/2026).",
      "Monto en escrow: USD 2.500. El pago se libera si los entregables (a)–(c) están disponibles antes del 15/05/2026; si no, el cliente puede solicitar reembolso total.",
      "Ventana de revisión del cliente: 5 días hábiles posteriores a la entrega. Hasta 3 rondas de correcciones menores incluidas; cambios de alcance no están cubiertos.",
    ],
    sampleClaim:
      "El freelancer debía entregar la landing de Nimbus antes del 15/05/2026 con repo en GitHub y deploy en Vercel. Hoy es 20/05/2026: no hay deploy funcional ni acceso al repositorio. Solicito reembolso de los USD 2.500 en escrow.",
    sampleEvidence: [
      {
        contentHash: "sha256:claim-chat-log",
        description:
          "Captura de Slack del 16/05/2026: el freelancer admite que no llegó al deploy de Vercel.",
        uri: "ipfs://demo/claim-chat-log",
      },
      {
        contentHash: "sha256:claim-missing-deliverables",
        description:
          "Email del 14/05/2026 sin link a Vercel ni invitación al repo GitHub prometidos.",
        uri: "ipfs://demo/claim-email-thread",
      },
    ],
  },
  {
    contractId: "freelance-escrow-002",
    contractType: "freelance-escrow",
    title: "Escrow freelance — API de inventario",
    description:
      "USD 4.000 en escrow por una API REST de inventario. Entrega en staging el 30/04/2026 con tests y documentación.",
    chain: "braga",
    parties: [
      {
        address: "0x3333333333333333333333333333333333333333",
        role: PartyRole.CLAIMANT,
        label: "Cliente — StockFlow",
      },
      {
        address: "0x4444444444444444444444444444444444444444",
        role: PartyRole.RESPONDENT,
        label: "Freelancer — backend",
      },
    ],
    externalAction: {
      contractAddress: "0xescrow0000000000000000000000000000000002",
      actionId: "release-final-payment",
    },
    rules: [
      "Fecha límite de entrega: 30/04/2026. La API debe estar desplegada en staging (https://api-staging.stockflow.io) antes de esa fecha.",
      "Alcance técnico: 5 endpoints REST — GET/POST /products, GET/POST /orders, GET /orders/:id/status — con tests unitarios ≥80% de cobertura y pipeline CI en verde.",
      "Documentación obligatoria: spec OpenAPI 3.0 publicada y README con instrucciones de setup local (Docker Compose).",
      "Monto en escrow: USD 4.000. Se libera el pago si la API cumple alcance, tests y documentación antes del 30/04/2026; endpoints faltantes o tests fallidos habilitan reembolso al cliente.",
    ],
    sampleClaim:
      "La API debía estar en staging el 30/04/2026 con 5 endpoints y tests ≥80%. El deploy existe pero faltan POST /orders y GET /orders/:id/status; el pipeline de CI falla en 3 tests y la cobertura está en 62%. Solicito reembolso de USD 4.000.",
    sampleEvidence: [
      {
        contentHash: "sha256:claim-ci-report",
        description:
          "Reporte de GitHub Actions del 01/05/2026: 3 tests fallidos, cobertura 62% (mínimo acordado: 80%).",
      },
      {
        contentHash: "sha256:claim-missing-endpoints",
        description:
          "Comparativa de alcance: POST /orders y GET /orders/:id/status no responden en staging (404).",
      },
    ],
  },
];

export function getMockContract(contractId: string): MockContract | undefined {
  return MOCK_CONTRACTS.find((c) => c.contractId === contractId);
}

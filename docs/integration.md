# Integración

## SDK TypeScript

```typescript
import { createSDK, PartyRole } from "@mediation-rooms/sdk";

const sdk = createSDK({ apiUrl: "http://localhost:3001" });

// Crear caso
const newCase = await sdk.createCase({
  parties: [
    { address: "0xClient...", role: PartyRole.CLAIMANT, label: "Cliente" },
    { address: "0xProvider...", role: PartyRole.RESPONDENT, label: "Proveedor" },
  ],
  externalAction: {
    contractAddress: "0xEscrow...",
    actionId: "RELEASE_escrow_123",
  },
  expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
});

// Consultar si puede ejecutarse
const { canExecute, resolution, reason } = await sdk.canExecute(newCase.caseId);

// Abrir URL de mediación para las partes
const url = sdk.getCaseUrl("http://localhost:3000", newCase.caseId);
```

## MediationGuard (Solidity)

```solidity
import {MediationGuard} from "./MediationGuard.sol";

contract MyContract is MediationGuard {
    constructor(address registry) MediationGuard(registry) {}

    function criticalAction(bytes32 caseId) external onlyWhenMediationAllows(caseId) {
        // Solo se ejecuta si la mediación lo permite
    }
}
```

## API directa

```bash
# Crear caso
curl -X POST http://localhost:3001/cases \
  -H "Content-Type: application/json" \
  -d '{
    "parties": [
      {"address": "0xabc", "role": "CLAIMANT"},
      {"address": "0xdef", "role": "RESPONDENT"}
    ],
    "externalAction": {
      "contractAddress": "0x123",
      "actionId": "action_1"
    }
  }'

# Consultar ejecución
curl http://localhost:3001/cases/{caseId}/can-execute
```

## Webhook on-chain

```bash
curl -X POST http://localhost:3001/webhooks/contract-event \
  -H "Content-Type: application/json" \
  -d '{"type": "CaseOpened", "caseId": "0x...", "payload": {}}'
```

## Variables de entorno

Copiar `.env.example` y configurar:
- `NEXT_PUBLIC_API_URL` — URL de la API para web/SDK
- `ARKIV_API_URL` / `ARKIV_API_KEY` — cuando conectes Arkiv real
- `OPENAI_API_KEY` — cuando actives `AGENT_PROVIDER=openai`

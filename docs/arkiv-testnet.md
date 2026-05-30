# Arkiv Braga testnet

Mediation Rooms persiste casos, evidencia y resoluciones en **Arkiv Braga** (testnet actual). Kaolin está deprecado — no lo uses.

## Setup en 3 pasos

### 1. Configurar `.env`

```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
ARKIV_PRIVATE_KEY=0xTU_PRIVATE_KEY
```

### 2. Fondear la wallet en Braga

Pedí **GLM** de testnet acá: https://braga.hoodi.arkiv.network/faucet

### 3. Correr

```bash
pnpm install
pnpm check:arkiv
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001/health → `"mode": "braga"`

## Probar el flujo

```bash
curl -X POST http://localhost:3001/cases \
  -H "Content-Type: application/json" \
  -d '{
    "parties": [
      {"address": "0xabc", "role": "CLAIMANT", "label": "Cliente"},
      {"address": "0xdef", "role": "RESPONDENT", "label": "Proveedor"}
    ],
    "externalAction": {
      "contractAddress": "0x123",
      "actionId": "release-payment"
    }
  }'

curl http://localhost:3001/cases
```

## Red Braga

| | |
|---|---|
| RPC | `https://braga.hoodi.arkiv.network/rpc` |
| Chain ID | `60138453102` |
| Gas token | GLM |
| Faucet | https://braga.hoodi.arkiv.network/faucet |
| Explorer | https://explorer.braga.hoodi.arkiv.network |

## Sin private key

Sin `ARKIV_PRIVATE_KEY`, la API corre en modo **memory** (RAM, se pierde al reiniciar).

## Demo escrow local (opcional)

Ver [demo-escrow-local.md](./demo-escrow-local.md).

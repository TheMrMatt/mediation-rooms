# Demo Escrow local (opcional)

> **No es el camino principal.** Para hackathon y testnet usá [arkiv-testnet.md](./arkiv-testnet.md).
> Esta demo es fase 2: contratos Solidity + Anvil + MetaMask.

## Cuándo usarla

Solo si querés mostrar el flujo on-chain `deposit → markDelivery → release/refund` en una chain local.

## Setup

1. Instalar Foundry y correr Anvil:

```bash
anvil
```

2. Deploy (usa la key default de Anvil, no hace falta `.env`):

```bash
cd packages/contracts
pnpm deploy:local
```

3. Copiar addresses de `packages/contracts/deployments/31337.json` al `.env`:

```env
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_MEDIATION_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_DEMO_ESCROW_ADDRESS=0x...
```

4. `pnpm dev` y abrir http://localhost:3000/demo/escrow

## Guion rápido

1. Conectar wallet (MetaMask en chain 31337)
2. `deposit` → `markDelivery` → (opcional) `openDispute`
3. `resolveCase` con wallet owner → `release` o `refund`

## Cuentas Anvil

- Deployer/owner: cuenta #0
- Proveedor: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

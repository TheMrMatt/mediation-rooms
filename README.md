# Mediation Rooms

Infraestructura plug-and-play para agregar mediación a contratos o sistemas digitales.

## Arrancar (Arkiv testnet)

```bash
cp .env.example .env
# Pegá ARKIV_PRIVATE_KEY — fondos GLM: https://braga.hoodi.arkiv.network/faucet
pnpm install
pnpm dev
```

Guía completa: [docs/arkiv-testnet.md](./docs/arkiv-testnet.md)

## Estructura

```
mediation-rooms/
├── apps/
│   ├── web/          # Next.js — UI de casos
│   └── api/          # Hono — casos, evidencia, resoluciones → Arkiv
├── packages/
│   ├── arkiv/        # Wrapper Braga testnet (+ fallback memory)
│   ├── agent/        # Agente mediador (mock)
│   ├── contracts/    # Solidity — demo escrow (opcional)
│   └── ...
└── docs/
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado + modo Arkiv |
| POST | `/cases` | Crear caso (→ Arkiv) |
| GET | `/cases` | Listar casos |
| POST | `/cases/:id/evidence` | Subir evidencia |
| POST | `/cases/:id/dispute` | Abrir disputa |
| POST | `/cases/:id/resolve` | Resolver con agente |

## Documentación

- [Arkiv testnet](./docs/arkiv-testnet.md) — **empezá acá**
- [Arquitectura](./docs/architecture.md)
- [Flujo de producto](./docs/product-flow.md)
- [Demo escrow local](./docs/demo-escrow-local.md) — opcional

# Mediation Rooms

Infraestructura plug-and-play para agregar mediación a contratos o sistemas digitales.

## [ ARKIV ] × PunaTech 2026

Proyecto para el hackathon **[ ARKIV ] × PunaTech 2026** — track de aplicaciones de IA sobre [ ARKIV ]. Los casos, la evidencia y las resoluciones del agente mediador se persisten como entidades en Arkiv Braga testnet (namespace `mediation-rooms`).

### Prueba on-chain (Arkiv Braga)

Transacción de ejemplo que crea una entidad en Arkiv:

https://explorer.braga.hoodi.arkiv.network/tx/0xa9b23829c08938d332ded0ac953a37532115631a0b9105123cc04b36f00d4090

### Equipo

| Nombre | GitHub | Wallet (premio) |
|--------|--------|-----------------|
| Matías Rojas | [@TheMrMatt](https://github.com/TheMrMatt) | `0xaa7727dec5cbb9d91d3d4daedb07a78a976cd7be` |

Guía de entrega del hackathon: [builders-guide.md](https://github.com/Arkiv-Network/arkiv-puna-tech-hackathon/blob/main/docs/builders-guide.md)

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

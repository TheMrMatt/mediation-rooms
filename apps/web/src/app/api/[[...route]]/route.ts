import { handle } from "hono/vercel";
import { createApp } from "@mediation-rooms/api/app";

// El SDK de Arkiv (viem) necesita el runtime de Node, no Edge.
export const runtime = "nodejs";
// Resolver un caso encadena varias escrituras on-chain + lecturas con reintentos
// contra Braga; el default de 10s no alcanza y la función muere abortando los
// fetches (lo que el nodo reporta como "context cancelled").
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const app = createApp("/api");

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);

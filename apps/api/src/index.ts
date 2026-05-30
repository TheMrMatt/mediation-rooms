import { config } from "dotenv";
import { resolve } from "node:path";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { getArkivMode } from "./services/case-service.js";

config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), ".env") });

const app = createApp();
const port = Number(process.env.API_PORT ?? 3001);
const host = process.env.API_HOST ?? "0.0.0.0";
const arkivMode = getArkivMode();

console.log(`Mediation Rooms API → http://${host}:${port}`);
console.log(
  `Arkiv mode: ${arkivMode}${arkivMode === "braga" ? " (Braga testnet)" : " (memory — set ARKIV_PRIVATE_KEY)"}`,
);

serve({ fetch: app.fetch, port, hostname: host });

export default app;

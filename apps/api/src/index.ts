import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import {
  addEvidence,
  canExecuteCase,
  createCase,
  getArkivMode,
  getArkivWalletAddress,
  getCase,
  getCaseAuditTrail,
  handleContractEvent,
  listCases,
  markDisputed,
  openDisputeFromContract,
  resolveCaseRecord,
  submitRespondentResponse,
} from "./services/case-service.js";
import { MOCK_CONTRACTS, getMockContract } from "./mock/contracts.js";

config({ path: resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../.env") });

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  }),
);

app.get("/health", (c) => {
  const wallet = getArkivWalletAddress();
  const mode = getArkivMode();

  return c.json({
    status: "ok",
    service: "mediation-rooms-api",
    arkiv: {
      mode,
      chain: mode === "braga" ? "braga" : null,
      storageModel: "entities",
      note:
        "No se deploya un contrato Solidity. Cada caso es una entidad Arkiv (createEntity).",
      walletAddress: wallet,
      walletExplorerUrl: wallet
        ? `https://explorer.braga.hoodi.arkiv.network/address/${wallet}`
        : null,
      faucet: "https://braga.hoodi.arkiv.network/faucet",
    },
  });
});

app.post("/cases", async (c) => {
  const body = await c.req.json();
  const newCase = await createCase(body);
  return c.json(newCase, 201);
});

app.post("/integrations/disputes", async (c) => {
  try {
    const body = await c.req.json();
    const result = await openDisputeFromContract(body);
    return c.json(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 400);
  }
});

app.get("/mock/contracts", (c) => c.json({ contracts: MOCK_CONTRACTS }));

app.post("/mock/contracts/:contractId/open-dispute", async (c) => {
  const contractId = c.req.param("contractId");
  const contract = getMockContract(contractId);

  if (!contract) {
    return c.json({ error: "Mock contract not found" }, 404);
  }

  let overrides: {
    claim?: string;
    rules?: string[];
    claimantEvidence?: { contentHash: string; description: string; uri?: string }[];
    claimantAddress?: string;
    respondentAddress?: string;
  } = {};
  try {
    overrides = await c.req.json();
  } catch {
    overrides = {};
  }

  const parties = contract.parties.map((party) => {
    if (party.role === "CLAIMANT" && overrides.claimantAddress) {
      return { ...party, address: overrides.claimantAddress };
    }
    if (party.role === "RESPONDENT" && overrides.respondentAddress) {
      return { ...party, address: overrides.respondentAddress };
    }
    return party;
  });

  try {
    const result = await openDisputeFromContract({
      origin: {
        contractId: contract.contractId,
        contractType: contract.contractType,
        chain: contract.chain,
      },
      externalAction: contract.externalAction,
      parties,
      rules: overrides.rules ?? contract.rules,
      claim: overrides.claim ?? contract.sampleClaim,
      claimantEvidence: overrides.claimantEvidence ?? contract.sampleEvidence,
    });
    return c.json(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 400);
  }
});

app.get("/cases", async (c) => c.json({ cases: await listCases() }));

app.get("/cases/:caseId", async (c) => {
  const caseId = c.req.param("caseId");
  const caseRecord = await getCase(caseId);

  if (!caseRecord) {
    return c.json({ error: "Case not found" }, 404);
  }

  return c.json(caseRecord);
});

app.get("/cases/:caseId/audit", async (c) => {
  const caseId = c.req.param("caseId");
  const caseRecord = await getCase(caseId);

  if (!caseRecord) {
    return c.json({ error: "Case not found" }, 404);
  }

  const audit = await getCaseAuditTrail(caseId);
  return c.json(audit);
});

app.get("/cases/:caseId/can-execute", async (c) => {
  const caseId = c.req.param("caseId");
  const result = await canExecuteCase(caseId);
  return c.json(result);
});

app.post("/cases/:caseId/evidence", async (c) => {
  const caseId = c.req.param("caseId");

  try {
    const body = await c.req.json();
    const evidence = await addEvidence(caseId, body);
    return c.json(evidence, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 400);
  }
});

app.post("/cases/:caseId/dispute", async (c) => {
  const caseId = c.req.param("caseId");

  try {
    const body = await c.req.json();
    const caseRecord = await markDisputed(caseId, body);
    return c.json(caseRecord);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 400);
  }
});

app.post("/cases/:caseId/respond", async (c) => {
  const caseId = c.req.param("caseId");

  try {
    const body = await c.req.json();
    const result = await submitRespondentResponse(caseId, body);
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 400);
  }
});

app.post("/cases/:caseId/resolve", async (c) => {
  const caseId = c.req.param("caseId");

  try {
    const result = await resolveCaseRecord(caseId);
    return c.json({
      case: result.case,
      resolution: result.analysis.outcome,
      analysis: result.analysis,
      arkiv: result.arkiv,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 400);
  }
});

app.post("/webhooks/contract-event", async (c) => {
  const body = await c.req.json();
  const result = await handleContractEvent(body);
  return c.json(result);
});

const port = Number(process.env.API_PORT ?? 3001);
const host = process.env.API_HOST ?? "0.0.0.0";
const arkivMode = getArkivMode();

console.log(`Mediation Rooms API → http://${host}:${port}`);
console.log(`Arkiv mode: ${arkivMode}${arkivMode === "braga" ? " (Braga testnet)" : " (memory — set ARKIV_PRIVATE_KEY)"}`);

serve({ fetch: app.fetch, port, hostname: host });

export default app;

import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { BragaArkivClient } from "../src/braga-client.js";
import { resolveArkivMode, createArkivClient } from "../src/client.js";

function loadEnv(): void {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      config({ path });
      return;
    }
  }
}

function validatePrivateKey(key: string | undefined): string | null {
  if (!key || key.trim() === "") {
    return "ARKIV_PRIVATE_KEY está vacía";
  }

  const trimmed = key.trim();

  if (trimmed.includes("...") || trimmed.includes("TU_")) {
    return "Reemplazá el placeholder en ARKIV_PRIVATE_KEY por tu key real (0x + 64 hex chars)";
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(trimmed)) {
    return "ARKIV_PRIVATE_KEY inválida — debe ser 0x seguido de 64 caracteres hex (32 bytes)";
  }

  return null;
}

async function main(): Promise<void> {
  loadEnv();

  const mode = resolveArkivMode();
  console.log(`Arkiv mode: ${mode}`);

  if (mode === "memory") {
    console.log("\nNo hay ARKIV_PRIVATE_KEY en el entorno.");
    console.log("Pasos:");
    console.log("  1. cp .env.example .env");
    console.log("  2. Pedí fondos: https://braga.hoodi.arkiv.network/faucet");
    console.log("  3. Pegá tu private key en ARKIV_PRIVATE_KEY");
    process.exit(1);
  }

  const keyError = validatePrivateKey(process.env.ARKIV_PRIVATE_KEY);
  if (keyError) {
    console.error(`\n${keyError}`);
    process.exit(1);
  }

  const client = createArkivClient();

  if (client instanceof BragaArkivClient) {
    const { currentBlock } = await client.verifyConnection();
    const cases = await client.listCaseEntities();
    console.log(`Conectado a Braga (bloque ${currentBlock}). Casos: ${cases.length}`);
  } else {
    console.log("Conectado en modo memory.");
  }

  console.log("Listo para usar con pnpm dev");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("private key")) {
    console.error("\nARKIV_PRIVATE_KEY inválida. Debe verse así:");
    console.error("  0xabc123... (66 caracteres total, sin espacios ni comillas)");
  } else if (message.includes("405") || message.includes("Method Not Allowed")) {
    console.error("\nEl RPC de Arkiv rechazó la consulta.");
    console.error("Asegurate de usar Braga (no Kaolin — deprecado):");
    console.error("  https://braga.hoodi.arkiv.network/rpc");
  } else {
    console.error("Error conectando a Arkiv:", message);
  }
  process.exit(1);
});

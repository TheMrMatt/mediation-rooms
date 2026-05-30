import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractsRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(contractsRoot, "..", "..");

const BRAGA_CHAIN_ID = "60138453102";

const contractNames = ["MediationRegistry", "DemoEscrow", "FreelanceEscrow"];

// Las ABIs se consumen desde la web (firmas del usuario) y desde la API (listener).
const abiDests = [
  path.join(projectRoot, "apps", "web", "src", "lib", "abis"),
  path.join(projectRoot, "apps", "api", "src", "abis"),
];

const copyAbi = async (name) => {
  const source = path.join(contractsRoot, "out", `${name}.sol`, `${name}.json`);
  const artifact = JSON.parse(await readFile(source, "utf8"));
  if (!artifact.abi) {
    throw new Error(`ABI no encontrada en ${source}`);
  }

  for (const destDir of abiDests) {
    await mkdir(destDir, { recursive: true });
    const dest = path.join(destDir, `${name}.json`);
    await writeFile(dest, `${JSON.stringify(artifact.abi, null, 2)}\n`, "utf8");
    console.log(`ABI exportada: ${path.relative(projectRoot, dest)}`);
  }
};

const copyDeployments = async () => {
  const deploymentsDir = path.join(contractsRoot, "deployments");
  let files = [];
  try {
    files = await readdir(deploymentsDir);
  } catch {
    console.log("Sin deployments todavía (corré el deploy primero).");
    return;
  }

  // Preferimos Braga; si no, tomamos el primero disponible.
  const bragaFile = `${BRAGA_CHAIN_ID}.json`;
  const chosen = files.includes(bragaFile)
    ? bragaFile
    : files.find((f) => f.endsWith(".json"));
  if (!chosen) return;

  const raw = await readFile(path.join(deploymentsDir, chosen), "utf8");
  const addresses = JSON.parse(raw);
  const chainId = chosen.replace(".json", "");
  const payload = { chainId: Number(chainId), ...addresses };

  for (const destDir of abiDests) {
    await mkdir(destDir, { recursive: true });
    const dest = path.join(destDir, "deployments.json");
    await writeFile(dest, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`Deployment exportado (${chainId}): ${path.relative(projectRoot, dest)}`);
  }
};

const run = async () => {
  for (const name of contractNames) {
    await copyAbi(name);
  }
  await copyDeployments();
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

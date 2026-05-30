import { SandboxContracts } from "../../components/sandbox-contracts";
import { AppShell } from "../../components/app-shell";
import { DemoMiniStepper } from "../../components/demo/demo-mini-stepper";
import { PageHead } from "../../components/demo/page-head";
import { WalletRoleBar } from "../../components/demo/wallet-role-bar";
import { fetchMockContracts } from "../../lib/api";

export default async function SandboxPage() {
  const contracts = await fetchMockContracts();

  return (
    <AppShell>
      <PageHead
        title="Elegí una demo para probar la mediación."
        subtitle="Cada caso simula una acción bloqueada por una ventana de reclamo. Respondé como proveedor y mirá cómo el agente decide si el sistema puede ejecutar."
      />

      <div className="mb-6">
        <DemoMiniStepper current={1} />
      </div>

      <div className="mb-5">
        <WalletRoleBar />
      </div>

      <SandboxContracts contracts={contracts} />

      <p className="text-muted-foreground mt-5 text-sm">
        Estas demos simulan acciones externas bloqueadas por mediación. No cambian
        la lógica del producto.
      </p>
    </AppShell>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PartyRole, type MockContract } from "@mediation-rooms/config";
import { Lock, ShieldCheck, Timer } from "lucide-react";
import { openMockDispute } from "../lib/api";
import { useWallet } from "./wallet-provider";
import { shortAddr } from "./demo/lib";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** Copy presentacional (no altera los datos del contrato). */
const DEMO_COPY: Record<
  string,
  { title: string; summary: string; action: string }
> = {
  "freelance-escrow-001": {
    title: "Landing Nimbus",
    summary: "El cliente reclama que la landing no fue entregada a tiempo.",
    action: "Pago del milestone",
  },
  "freelance-escrow-002": {
    title: "API de inventario",
    summary: "El cliente reclama que la API no cumple los endpoints acordados.",
    action: "Pago final",
  },
};

function shortTitle(contract: MockContract): string {
  const copy = DEMO_COPY[contract.contractId];
  if (copy) return copy.title;
  const parts = contract.title.split("—");
  return (parts[parts.length - 1] ?? contract.title).trim();
}

function summary(contract: MockContract): string {
  return DEMO_COPY[contract.contractId]?.summary ?? contract.description;
}

function actionLabel(contract: MockContract): string {
  return DEMO_COPY[contract.contractId]?.action ?? contract.externalAction.actionId;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function defaultAddress(contract: MockContract, role: PartyRole) {
  return contract.parties.find((p) => p.role === role)?.address ?? "";
}

function KeyFact({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5 [&>svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-sm font-medium">{value}</p>
        {mono && (
          <code className="text-muted-foreground font-mono text-xs">{mono}</code>
        )}
      </div>
    </div>
  );
}

function ScenarioCard({ contract }: { contract: MockContract }) {
  const router = useRouter();
  const { address, connect } = useWallet();
  const [claim, setClaim] = useState(contract.sampleClaim);
  const [editingClaim, setEditingClaim] = useState(false);
  const [respondentAddress, setRespondentAddress] = useState(
    defaultAddress(contract, PartyRole.RESPONDENT),
  );
  const [touchedRespondent, setTouchedRespondent] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Por defecto, vos sos el respondent (la parte reclamada).
  useEffect(() => {
    if (address && !touchedRespondent) setRespondentAddress(address);
  }, [address, touchedRespondent]);

  async function onSimulate() {
    setLoading(true);
    setError(null);
    try {
      let resolved = respondentAddress;
      if (!resolved || resolved === defaultAddress(contract, PartyRole.RESPONDENT)) {
        const connected = address ?? (await connect());
        if (connected) resolved = connected;
      }

      const result = await openMockDispute(contract.contractId, {
        claim,
        respondentAddress: resolved,
        claimantAddress: defaultAddress(contract, PartyRole.CLAIMANT),
      });
      router.push(`/cases/${result.case.caseId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar la demo");
      setLoading(false);
    }
  }

  const usingWallet =
    !!address && respondentAddress.toLowerCase() === address.toLowerCase();

  return (
    <Card className="gap-5">
      <CardHeader>
        <div className="mb-1 flex flex-wrap gap-2">
          <Badge variant="secondary">freelance escrow</Badge>
          {contract.chain && <Badge variant="secondary">{contract.chain}</Badge>}
        </div>
        <CardTitle>{shortTitle(contract)}</CardTitle>
        <CardDescription>{summary(contract)}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-3">
          <KeyFact
            icon={<ShieldCheck />}
            label="Tu rol"
            value="Proveedor reclamado"
          />
          <KeyFact
            icon={<Lock />}
            label="Acción bloqueada"
            value={actionLabel(contract)}
            mono={contract.externalAction.actionId}
          />
          <KeyFact icon={<Timer />} label="Ventana" value="48h para responder" />
        </div>

        <Separator />

        <div>
          <p className="mb-1.5 text-sm font-medium">Reclamo del cliente</p>
          <p className="border-warning/60 bg-warning/8 rounded-r-md border-l-2 py-2 pr-3 pl-3 text-sm leading-relaxed">
            “{truncate(contract.sampleClaim, 150)}”
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">
            Reglas que evaluará el agente ({contract.rules.length})
          </p>
          <ol className="grid max-h-44 gap-2 overflow-y-auto pr-1">
            {contract.rules.map((rule, i) => (
              <li key={i} className="flex gap-2">
                <span className="bg-accent text-foreground mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="text-muted-foreground text-sm leading-relaxed">
                  {rule}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="text-muted-foreground text-sm">
          Evidencia incluida: {contract.sampleEvidence.length} archivo(s)
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="details" className="border-b-0">
            <AccordionTrigger className="py-2">
              Ver detalles del caso
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex max-h-[360px] flex-col gap-5 overflow-y-auto pr-1">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">contrato mock</Badge>
                  <Badge variant="outline" className="font-mono">
                    {contract.contractId}
                  </Badge>
                </div>

                <div>
                  <p className="text-muted-foreground mb-1 text-xs">
                    Monto en escrow y fechas
                  </p>
                  <p className="text-sm leading-relaxed">
                    {contract.description}
                  </p>
                </div>

                {contract.sampleEvidence.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-xs">
                      Evidencia del cliente
                    </p>
                    <ul className="space-y-1.5 text-sm">
                      {contract.sampleEvidence.map((ev, i) => (
                        <li key={i} className="text-muted-foreground leading-relaxed">
                          · {ev.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-muted-foreground text-xs">Claim completo</p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setEditingClaim((v) => !v)}
                    >
                      {editingClaim ? "Listo" : "Personalizar reclamo"}
                    </Button>
                  </div>
                  {editingClaim ? (
                    <Textarea
                      value={claim}
                      onChange={(e) => setClaim(e.target.value)}
                      className="min-h-24"
                    />
                  ) : (
                    <p className="bg-muted rounded-md p-3 text-sm leading-relaxed">
                      {claim}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-muted-foreground mb-1 text-xs">
                    Action id técnico
                  </p>
                  <code className="font-mono text-xs">
                    {contract.externalAction.actionId}
                  </code>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-muted-foreground text-xs">
                      Participás como{" "}
                      <span className="font-mono">
                        {shortAddr(respondentAddress)}
                      </span>
                      {usingWallet && (
                        <span className="text-success font-medium"> · tu wallet</span>
                      )}
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setEditingAddress((v) => !v)}
                    >
                      {editingAddress ? "Ocultar" : "Cambiar address"}
                    </Button>
                  </div>
                  {editingAddress && (
                    <Input
                      className="font-mono text-xs"
                      value={respondentAddress}
                      onChange={(e) => {
                        setTouchedRespondent(true);
                        setRespondentAddress(e.target.value);
                      }}
                      placeholder={address ?? "0x…"}
                    />
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2">
        <Button className="w-full" size="lg" onClick={onSimulate} disabled={loading}>
          {loading ? "Creando sala de mediación…" : "Iniciar demo"}
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          Crea una sala mock de mediación.
        </p>
        {error && (
          <p className="text-destructive bg-destructive/8 border-destructive/20 rounded-md border px-3 py-2 text-sm">
            {error}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

export function SandboxContracts({ contracts }: { contracts: MockContract[] }) {
  if (contracts.length === 0) {
    return (
      <div className="mr-empty">
        <p className="mr-empty-title">No hay contratos mock disponibles</p>
        <p className="mr-empty-sub">¿Está corriendo la API en el puerto 3001?</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {contracts.map((contract) => (
        <ScenarioCard key={contract.contractId} contract={contract} />
      ))}
    </div>
  );
}

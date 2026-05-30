"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PartyRole, type Case } from "@mediation-rooms/config";
import { submitEvidence, submitResponse } from "../lib/api";
import {
  writeEvidenceToArkiv,
  writeResponseToArkiv,
} from "../lib/arkiv-browser";
import { Paperclip, X } from "lucide-react";
import { useWallet } from "./wallet-provider";
import { formatBytes, shortAddr } from "./demo/lib";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

export function RespondForm({ caseRecord }: { caseRecord: Case }) {
  const router = useRouter();
  const { address, connect } = useWallet();
  const [response, setResponse] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const respondent = caseRecord.parties.find(
    (p) => p.role === PartyRole.RESPONDENT,
  );

  if (caseRecord.status !== "DISPUTED") {
    return (
      <p className="text-muted-foreground text-sm">
        Esta disputa ya no está abierta a respuesta (estado {caseRecord.status}).
      </p>
    );
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let submittedBy = address;
      if (!submittedBy) {
        setStep("Conectando wallet…");
        submittedBy = await connect();
      }
      if (!submittedBy) {
        throw new Error("Conectá la wallet del respondent para firmar tu respuesta");
      }

      if (
        respondent &&
        respondent.address.toLowerCase() !== submittedBy.toLowerCase()
      ) {
        throw new Error(
          `La wallet conectada (${shortAddr(submittedBy)}) no es la parte reclamada del caso (${shortAddr(respondent.address)}). Cambiá de cuenta o simulá el caso asignándote como respondent.`,
        );
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStep(`Firmando evidencia ${i + 1} de ${files.length}: ${file.name}`);
        const contentHash = await hashFile(file);
        const evidenceId = `ev_${crypto.randomUUID().slice(0, 8)}`;
        const clientProof = await writeEvidenceToArkiv({
          caseId: caseRecord.caseId,
          evidenceId,
          submittedBy,
          role: PartyRole.RESPONDENT,
          contentHash,
          description: `Archivo: ${file.name}`,
        });
        await submitEvidence(caseRecord.caseId, {
          submittedBy,
          role: PartyRole.RESPONDENT,
          contentHash,
          description: `Archivo: ${file.name}`,
          evidenceId,
          clientProof,
        });
      }

      setStep("Firmando tu respuesta…");
      const clientProof = await writeResponseToArkiv({
        caseId: caseRecord.caseId,
        submittedBy,
        response,
      });

      setStep("Guardando respuesta…");
      await submitResponse(caseRecord.caseId, {
        submittedBy,
        response,
        clientProof,
      });

      setStep("Abriendo resolución…");
      router.push(`/cases/${caseRecord.caseId}/resolution`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al responder");
      setStep(null);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="response">Tu descargo</Label>
        <Textarea
          id="response"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Ejemplo: Entregué el trabajo acordado en tiempo y forma. El deploy estaba disponible y el repositorio fue compartido antes del deadline…"
          className="min-h-40"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label>Adjuntar evidencia (opcional)</Label>
        <button
          type="button"
          className="border-input hover:border-ring hover:bg-accent flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm transition-colors"
          data-drag={dragging}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <Paperclip className="size-4" />
          Adjuntar evidencia
          <span className="text-muted-foreground">· PDF, PNG o JPG</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        {files.length > 0 && (
          <div className="grid gap-2">
            {files.map((f) => (
              <div
                key={f.name}
                className="border-border bg-secondary flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  {f.name}{" "}
                  <span className="text-muted-foreground">
                    · {formatBytes(f.size)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(f.name)}
                  aria-label="Quitar"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-muted-foreground text-xs">
          Vas a firmar tu respuesta con la wallet conectada (una firma por la
          respuesta y una por cada archivo adjunto).
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Firmando…" : "Enviar respuesta"}
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          Después de responder, el caso pasa a revisión del agente.
        </p>
      </div>

      {step && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <span className="mr-spinner" />
          {step}
        </p>
      )}
      {error && (
        <p className="text-destructive bg-destructive/8 border-destructive/20 rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}
    </form>
  );
}

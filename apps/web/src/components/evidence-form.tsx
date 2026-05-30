"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PartyRole } from "@mediation-rooms/config";
import { submitEvidence } from "../lib/api";
import { writeEvidenceToArkiv } from "../lib/arkiv-browser";
import { formStyles, useWallet } from "./wallet-provider";

export function EvidenceForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { address, connect } = useWallet();
  const [role, setRole] = useState<PartyRole>(PartyRole.CLAIMANT);
  const [description, setDescription] = useState("");
  const [contentHash, setContentHash] = useState("");
  const [uri, setUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txUrl, setTxUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTxUrl(null);

    try {
      let submittedBy = address;
      if (!submittedBy) {
        submittedBy = await connect();
      }
      if (!submittedBy) {
        throw new Error("Conectá tu wallet para firmar la evidencia en Braga");
      }

      const evidenceId = `ev_${crypto.randomUUID().slice(0, 8)}`;
      const clientProof = await writeEvidenceToArkiv({
        caseId,
        evidenceId,
        submittedBy,
        role,
        contentHash: contentHash || `sha256:${Date.now()}`,
        description,
        uri: uri || undefined,
      });

      const result = await submitEvidence(caseId, {
        submittedBy,
        role,
        contentHash: contentHash || `sha256:${Date.now()}`,
        description,
        uri: uri || undefined,
        evidenceId,
        clientProof,
      });

      const proof = result.arkiv?.evidence?.txUrl;
      if (proof) setTxUrl(proof);

      router.refresh();
      setDescription("");
      setContentHash("");
      setUri("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir evidencia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <p style={{ margin: "0 0 1rem", color: "#64748b", fontSize: "0.875rem" }}>
        La evidencia se firma con tu wallet en Arkiv Braga antes de registrarse en
        el caso.
      </p>
      <div style={formStyles.field}>
        <label htmlFor="role">Rol</label>
        <select
          id="role"
          style={formStyles.input}
          value={role}
          onChange={(e) => setRole(e.target.value as PartyRole)}
        >
          <option value={PartyRole.CLAIMANT}>Claimant</option>
          <option value={PartyRole.RESPONDENT}>Respondent</option>
        </select>
      </div>
      <div style={formStyles.field}>
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          style={formStyles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div style={formStyles.field}>
        <label htmlFor="hash">Content hash (opcional)</label>
        <input
          id="hash"
          style={formStyles.input}
          value={contentHash}
          onChange={(e) => setContentHash(e.target.value)}
          placeholder="sha256:…"
        />
      </div>
      <div style={formStyles.field}>
        <label htmlFor="uri">URI (opcional)</label>
        <input
          id="uri"
          style={formStyles.input}
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          placeholder="ipfs://…"
        />
      </div>
      <button type="submit" disabled={loading} style={formStyles.submit}>
        {loading ? "Firmando en Braga…" : "Subir evidencia firmada"}
      </button>
      {error && <p style={formStyles.error}>{error}</p>}
      {txUrl && (
        <p style={formStyles.success}>
          Evidencia on-chain:{" "}
          <a href={txUrl} target="_blank" rel="noreferrer">
            Ver transacción
          </a>
        </p>
      )}
    </form>
  );
}

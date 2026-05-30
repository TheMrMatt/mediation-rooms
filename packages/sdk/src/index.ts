import {
  CanExecuteResult,
  Case,
  CreateCaseInput,
  Evidence,
  PartyRole,
  Resolution,
} from "@mediation-rooms/config";

export interface MediationRoomsSDKConfig {
  apiUrl: string;
  apiKey?: string;
}

export class MediationRoomsSDK {
  constructor(private readonly config: MediationRoomsSDKConfig) {}

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(`${this.config.apiUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error ${response.status}: ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async createCase(input: CreateCaseInput): Promise<Case> {
    return this.request<Case>("/cases", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getCase(caseId: string): Promise<Case> {
    return this.request<Case>(`/cases/${caseId}`);
  }

  async canExecute(caseId: string): Promise<CanExecuteResult> {
    return this.request<CanExecuteResult>(`/cases/${caseId}/can-execute`);
  }

  async submitEvidence(
    caseId: string,
    input: {
      submittedBy: string;
      role: PartyRole;
      contentHash: string;
      description: string;
      uri?: string;
    },
  ): Promise<Evidence> {
    return this.request<Evidence>(`/cases/${caseId}/evidence`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async openDispute(
    caseId: string,
    input: { submittedBy: string; claim: string },
  ): Promise<Case> {
    return this.request<Case>(`/cases/${caseId}/dispute`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async resolveCase(
    caseId: string,
    input?: { force?: boolean },
  ): Promise<{ case: Case; resolution: Resolution }> {
    return this.request<{ case: Case; resolution: Resolution }>(
      `/cases/${caseId}/resolve`,
      {
        method: "POST",
        body: JSON.stringify(input ?? {}),
      },
    );
  }

  /** Opens the mediation room web UI for a case. */
  getCaseUrl(webUrl: string, caseId: string): string {
    return `${webUrl.replace(/\/$/, "")}/cases/${caseId}`;
  }
}

export function createSDK(config: MediationRoomsSDKConfig): MediationRoomsSDK {
  return new MediationRoomsSDK(config);
}

export * from "@mediation-rooms/config";

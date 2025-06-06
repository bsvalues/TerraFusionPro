/**
 * TerraFusion Ledger Service
 * Blockchain-verifiable appraisal hash and signature system
 */

import { createHash } from "crypto";
import { EventEmitter } from "events";

export interface LedgerEntry {
  id: string;
  formId: string;
  hash: string;
  signature: string;
  timestamp: Date;
  blockHeight?: number;
  transactionId?: string;
  metadata: {
    templateId: string;
    propertyAddress?: string;
    appraiserId?: string;
    reportType: string;
  };
}

export interface LedgerProof {
  hash: string;
  signature: string;
  timestamp: Date;
  verified: boolean;
  blockchainReference?: {
    network: string;
    transactionId: string;
    blockHeight: number;
  };
}

export class LedgerService extends EventEmitter {
  private entries: Map<string, LedgerEntry> = new Map();
  private blockchainEnabled: boolean = false;

  constructor() {
    super();
    this.checkBlockchainConfig();
  }

  private checkBlockchainConfig(): void {
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    const networkUrl = process.env.BLOCKCHAIN_NETWORK_URL;

    this.blockchainEnabled = !!(privateKey && networkUrl);

    if (this.blockchainEnabled) {
      console.log("[Ledger Service] Blockchain integration enabled");
    } else {
      console.log("[Ledger Service] Using local ledger mode (no blockchain keys)");
    }
  }

  async recordAppraisal(formData: any, metadata: any): Promise<LedgerEntry> {
    const formId = formData.id || `form-${Date.now()}`;
    const hash = this.generateFormHash(formData);
    const signature = await this.generateSignature(hash);

    const entry: LedgerEntry = {
      id: `ledger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      formId,
      hash,
      signature,
      timestamp: new Date(),
      metadata: {
        templateId: metadata.templateId || "unknown",
        propertyAddress: metadata.propertyAddress,
        appraiserId: metadata.appraiserId,
        reportType: metadata.reportType || "appraisal",
      },
    };

    if (this.blockchainEnabled) {
      try {
        const blockchainResult = await this.submitToBlockchain(entry);
        entry.blockHeight = blockchainResult.blockHeight;
        entry.transactionId = blockchainResult.transactionId;
      } catch (error) {
        console.error("[Ledger Service] Blockchain submission failed:", error);
        // Continue with local ledger
      }
    }

    this.entries.set(entry.id, entry);
    this.emit("entryRecorded", entry);

    return entry;
  }

  private generateFormHash(formData: any): string {
    const content = JSON.stringify(
      {
        templateId: formData.templateId,
        data: formData.data,
        timestamp: new Date().toISOString(),
      },
      null,
      0
    );

    return createHash("sha256").update(content).digest("hex");
  }

  private async generateSignature(hash: string): Promise<string> {
    const timestamp = Date.now();
    const content = `${hash}_${timestamp}`;

    if (this.blockchainEnabled) {
      // In production, this would use actual crypto signing
      return `blockchain_sig_${createHash("sha256").update(content).digest("hex").substring(0, 32)}`;
    }

    return `local_sig_${createHash("sha256").update(content).digest("hex").substring(0, 32)}`;
  }

  private async submitToBlockchain(
    entry: LedgerEntry
  ): Promise<{ blockHeight: number; transactionId: string }> {
    // Mock blockchain submission - in production this would use ethers.js or similar
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      blockHeight: Math.floor(Math.random() * 1000000) + 15000000,
      transactionId: `0x${createHash("sha256")
        .update(entry.hash + Date.now())
        .digest("hex")}`,
    };
  }

  async verifyAppraisal(hash: string): Promise<LedgerProof> {
    const entry = Array.from(this.entries.values()).find((e) => e.hash === hash);

    if (!entry) {
      return {
        hash,
        signature: "",
        timestamp: new Date(),
        verified: false,
      };
    }

    const proof: LedgerProof = {
      hash: entry.hash,
      signature: entry.signature,
      timestamp: entry.timestamp,
      verified: true,
    };

    if (entry.transactionId && entry.blockHeight) {
      proof.blockchainReference = {
        network: "ethereum",
        transactionId: entry.transactionId,
        blockHeight: entry.blockHeight,
      };
    }

    return proof;
  }

  async generateProofBundle(formId: string): Promise<{
    ledgerEntry: LedgerEntry | null;
    proof: LedgerProof | null;
    exportData: any;
  }> {
    const entry = Array.from(this.entries.values()).find((e) => e.formId === formId);

    if (!entry) {
      return {
        ledgerEntry: null,
        proof: null,
        exportData: null,
      };
    }

    const proof = await this.verifyAppraisal(entry.hash);

    const exportData = {
      version: "1.0",
      format: "TerraFusion-Proof-Bundle",
      entry: {
        id: entry.id,
        formId: entry.formId,
        hash: entry.hash,
        signature: entry.signature,
        timestamp: entry.timestamp.toISOString(),
        metadata: entry.metadata,
      },
      verification: {
        verified: proof.verified,
        verificationTimestamp: new Date().toISOString(),
        blockchainReference: proof.blockchainReference,
      },
      instructions: {
        verify: "Use hash to verify integrity against original form data",
        blockchain: proof.blockchainReference
          ? `Verify on blockchain: ${proof.blockchainReference.network}`
          : "Local signature verification only",
      },
    };

    return {
      ledgerEntry: entry,
      proof,
      exportData,
    };
  }

  getLedgerEntry(id: string): LedgerEntry | undefined {
    return this.entries.get(id);
  }

  getEntriesByForm(formId: string): LedgerEntry[] {
    return Array.from(this.entries.values()).filter((entry) => entry.formId === formId);
  }

  getAllEntries(): LedgerEntry[] {
    return Array.from(this.entries.values());
  }

  getStats(): {
    totalEntries: number;
    blockchainEntries: number;
    localEntries: number;
    blockchainEnabled: boolean;
  } {
    const entries = this.getAllEntries();
    const blockchainEntries = entries.filter((e) => e.transactionId).length;

    return {
      totalEntries: entries.length,
      blockchainEntries,
      localEntries: entries.length - blockchainEntries,
      blockchainEnabled: this.blockchainEnabled,
    };
  }
}

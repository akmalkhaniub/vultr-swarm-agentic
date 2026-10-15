import { VultrCloudTools, VultrInstance } from "./vultr_tools";

export interface SwarmFinding {
  severity: "high" | "medium" | "low";
  resourceId: string;
  issue: string;
  remediationAction: string;
  applied: boolean;
}

export interface SwarmAuditReport {
  timestamp: string;
  nodesScanned: number;
  findings: SwarmFinding[];
  remediationSummary: string;
}

export class VultrSwarmOrchestrator {
  constructor(
    public tools: VultrCloudTools,
    private applyRemediation = process.env.APPLY_REMEDIATION === "true"
  ) {}

  async runCloudOpsAudit(): Promise<SwarmAuditReport> {
    const instances = await this.tools.listInstances();
    const findings: SwarmFinding[] = [];

    for (const inst of instances) {
      if (inst.cpuUsagePct > 80) {
        const targetPlan = "vc2-8c-16gb";
        if (this.applyRemediation) {
          await this.tools.scaleInstance(inst.id, targetPlan);
        }
        findings.push({
          severity: "high",
          resourceId: inst.id,
          issue: `High CPU utilization detected: ${inst.cpuUsagePct}%`,
          remediationAction: this.applyRemediation
            ? `Scaled ${inst.id} to ${targetPlan}`
            : `Proposed scaling ${inst.id} to ${targetPlan}. Set APPLY_REMEDIATION=true to apply.`,
          applied: this.applyRemediation
        });
      }
    }

    const summary = findings.length === 0
      ? "All Vultr instances healthy."
      : this.applyRemediation
        ? `Remediated ${findings.length} performance bottlenecks.`
        : `Proposed ${findings.length} remediations. None applied.`;

    return {
      timestamp: new Date().toISOString(),
      nodesScanned: instances.length,
      findings,
      remediationSummary: summary
    };
  }
}

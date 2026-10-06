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
  constructor(public tools: VultrCloudTools) {}

  async runCloudOpsAudit(): Promise<SwarmAuditReport> {
    const instances = await this.tools.listInstances();
    const findings: SwarmFinding[] = [];

    for (const inst of instances) {
      if (inst.cpuUsagePct > 80) {
        // High load detected -> autonomous scaling action
        const scaled = await this.tools.scaleInstance(inst.id, "vc2-8c-16gb");
        findings.push({
          severity: "high",
          resourceId: inst.id,
          issue: `High CPU utilization detected: ${inst.cpuUsagePct}%`,
          remediationAction: `Autonomously scaled ${inst.id} to vc2-8c-16gb`,
          applied: true
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      nodesScanned: instances.length,
      findings,
      remediationSummary: findings.length === 0 ? "All Vultr instances healthy." : `Remediated ${findings.length} performance bottlenecks.`
    };
  }
}

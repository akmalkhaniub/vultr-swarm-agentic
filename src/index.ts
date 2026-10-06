import { VultrCloudTools } from "./vultr_tools";
import { VultrSwarmOrchestrator } from "./swarm";

export * from "./vultr_tools";
export * from "./swarm";

export function createDefaultSwarm() {
  const tools = new VultrCloudTools();
  const orchestrator = new VultrSwarmOrchestrator(tools);
  return { tools, orchestrator };
}

if (require.main === module) {
  console.log("VultrSwarm-Agentic: Autonomous Cloud Ops Swarm initialized.");
  const { orchestrator } = createDefaultSwarm();
  orchestrator.runCloudOpsAudit()
    .then(report => console.log("CloudOps Audit Report:", JSON.stringify(report, null, 2)));
}

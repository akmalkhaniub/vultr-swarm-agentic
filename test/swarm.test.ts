import { test } from "node:test";
import assert from "node:assert";
import { createDefaultSwarm, VultrCloudTools, VultrSwarmOrchestrator } from "../src/index";

test("VultrCloudTools lists instances and scales appropriately", async () => {
  const tools = new VultrCloudTools();
  const list = await tools.listInstances();
  assert.strictEqual(list.length, 2);

  const scaled = await tools.scaleInstance("vultr-node-01", "vc2-8c-16gb");
  assert.strictEqual(scaled.plan, "vc2-8c-16gb");
  assert.strictEqual(scaled.cpuUsagePct, 32.0);
});

test("VultrSwarmOrchestrator proposes a resize and does not apply it", async () => {
  const { orchestrator } = createDefaultSwarm();
  const before = await orchestrator.tools.listInstances();
  const hot = before.find((instance) => instance.id === "vultr-node-01");
  const report = await orchestrator.runCloudOpsAudit();
  const after = await orchestrator.tools.listInstances();

  assert.strictEqual(report.nodesScanned, 2);
  assert.strictEqual(report.findings.length, 1);
  assert.strictEqual(report.findings[0].resourceId, "vultr-node-01");
  assert.strictEqual(report.findings[0].applied, false);
  assert.strictEqual(after.find((instance) => instance.id === "vultr-node-01")?.plan, hot?.plan);
});

test("VultrSwarmOrchestrator applies a resize only when asked", async () => {
  const orchestrator = new VultrSwarmOrchestrator(new VultrCloudTools(), true);
  const report = await orchestrator.runCloudOpsAudit();
  const after = await orchestrator.tools.listInstances();

  assert.strictEqual(report.findings[0].applied, true);
  assert.strictEqual(after.find((instance) => instance.id === "vultr-node-01")?.plan, "vc2-8c-16gb");
});

test("VultrCloudTools deploys serverless worker container", async () => {
  const tools = new VultrCloudTools();
  const res = await tools.deployServerlessWorker("agent-worker", "vultr/agent-runtime:latest");
  assert.strictEqual(res.status, "running");
  assert.ok(res.endpoint.includes("vultr-cloud.net"));
});

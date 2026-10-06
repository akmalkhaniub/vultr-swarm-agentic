import { test } from "node:test";
import assert from "node:assert";
import { createDefaultSwarm, VultrCloudTools } from "../src/index";

test("VultrCloudTools lists instances and scales appropriately", async () => {
  const tools = new VultrCloudTools();
  const list = await tools.listInstances();
  assert.strictEqual(list.length, 2);

  const scaled = await tools.scaleInstance("vultr-node-01", "vc2-8c-16gb");
  assert.strictEqual(scaled.plan, "vc2-8c-16gb");
  assert.strictEqual(scaled.cpuUsagePct, 32.0);
});

test("VultrSwarmOrchestrator detects bottlenecks and applies autonomous remediation", async () => {
  const { orchestrator } = createDefaultSwarm();
  const report = await orchestrator.runCloudOpsAudit();

  assert.strictEqual(report.nodesScanned, 2);
  assert.strictEqual(report.findings.length, 1);
  assert.strictEqual(report.findings[0].resourceId, "vultr-node-01");
  assert.strictEqual(report.findings[0].applied, true);
});

test("VultrCloudTools deploys serverless worker container", async () => {
  const tools = new VultrCloudTools();
  const res = await tools.deployServerlessWorker("agent-worker", "vultr/agent-runtime:latest");
  assert.strictEqual(res.status, "running");
  assert.ok(res.endpoint.includes("vultr-cloud.net"));
});

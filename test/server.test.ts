import { test } from "node:test";
import assert from "node:assert";
import { AddressInfo } from "node:net";
import { createServer } from "../src/server";

test("health and run endpoints respond", async () => {
  const srv = createServer().listen(0);
  const port = (srv.address() as AddressInfo).port;
  try {
    const h = await (await fetch(`http://localhost:${port}/api/health`)).json();
    assert.strictEqual(h.status, "ok");
    const r = await (await fetch(`http://localhost:${port}/api/run`, { method: "POST" })).json();
    assert.ok(r.result);
    const page = await fetch(`http://localhost:${port}/`);
    assert.strictEqual(page.status, 200);
  } finally {
    srv.close();
  }
});

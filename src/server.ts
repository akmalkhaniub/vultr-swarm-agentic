import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createDefaultSwarm } from "./index";

const PORT = Number(process.env.PORT || 8081);
const PUBLIC_DIR = path.resolve(__dirname, "..", "..", "public");
const startedAt = Date.now();
let runs = 0;

function send(res: http.ServerResponse, code: number, body: unknown, type = "application/json") {
  res.writeHead(code, { "Content-Type": type, "Access-Control-Allow-Origin": "*" });
  res.end(type === "application/json" ? JSON.stringify(body) : (body as string));
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = (req.url || "/").split("?")[0];
    try {
      if (url === "/api/health") return send(res, 200, { status: "ok", uptimeSec: Math.round((Date.now() - startedAt) / 1000) });
      if (url === "/api/metrics") return send(res, 200, { runs, uptimeSec: Math.round((Date.now() - startedAt) / 1000) });
      if (url === "/api/run" && req.method === "POST") {
        runs++;
        const t0 = Date.now();
        const result = await (createDefaultSwarm().orchestrator.runCloudOpsAudit());
        return send(res, 200, { latencyMs: Date.now() - t0, result });
      }
      const file = path.join(PUBLIC_DIR, url === "/" ? "index.html" : url);
      if (file.startsWith(PUBLIC_DIR) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        const ext = path.extname(file);
        const type = ext === ".html" ? "text/html" : ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : "text/plain";
        return send(res, 200, fs.readFileSync(file, "utf-8"), type);
      }
      send(res, 404, { error: "not found" });
    } catch (e) {
      send(res, 500, { error: (e as Error).message });
    }
  });
}

if (require.main === module) {
  createServer().listen(PORT, "0.0.0.0", () => console.log(`Dashboard: http://localhost:${PORT}`));
}

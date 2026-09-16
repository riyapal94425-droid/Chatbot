import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

const PORT_FILE = path.resolve(__dirname, "../backend/.runtime-port");
const DEFAULT_PORT = 5001;

function readPortFile() {
  try {
    const value = fs.readFileSync(PORT_FILE, "utf8").trim();
    const port = parseInt(value, 10);
    return Number.isInteger(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
}

async function waitForBackendPort() {
  const startTime = Date.now();

  // Wait up to ~10s for THIS backend run to publish its port
  // (mtime must be newer than our start time so we don't trust stale files)
  while (Date.now() - startTime < 10000) {
    try {
      const mtime = fs.statSync(PORT_FILE).mtimeMs;
      if (mtime >= startTime - 2000) {
        const port = readPortFile();
        if (port) return { port: port, fresh: true };
      }
    } catch {}

    const existing = readPortFile();
    if (existing) return { port: existing, fresh: false };

    await new Promise((r) => setTimeout(r, 250));
  }

  return { port: DEFAULT_PORT, fresh: false };
}

export default defineConfig(async () => {
  const { port: backendPort } = await waitForBackendPort();
  const target = `http://localhost:${backendPort}`;
  console.log(`[vite] Proxying /api -> ${target}`);

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: target,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("error", (err, req, res) => {
              if (!res || res.headersSent) return;

              const retryKey = `${req.method}:${req.url}`;
              const retries = (req._retryCount = (req._retryCount || 0) + 1);

              if (retries <= 3 && err.code === "ECONNREFUSED") {
                console.log(
                  `[proxy] Backend not ready, retry ${retries}/3 for ${retryKey}`
                );
                setTimeout(() => {
                  try {
                    proxy.web(req, res);
                  } catch {}
                }, 1500 * retries);
                return;
              }

              console.error(
                `[proxy] Backend at ${target} is not reachable:`,
                err.message
              );
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error:
                    "Backend is not running. Start it from the project root with: npm run dev",
                })
              );
            });
          },
        },
      },
    },
  };
});

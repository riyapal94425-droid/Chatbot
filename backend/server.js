const path = require("path");
const fs = require("fs");
const net = require("net");
const { execSync } = require("child_process");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const authMiddleware = require("./middleware/auth");
const chatRoutes = require("./routes/chat");
const uploadRoutes = require("./routes/upload");

const PREFERRED_PORT = parseInt(process.env.PORT, 10) || 5001;
const MAX_PORT_ATTEMPTS = 20;
const LOG_FILE = path.join(__dirname, "server.log");
const PORT_FILE = path.join(__dirname, ".runtime-port");

function logToFile(message) {
  try {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`);
  } catch {}
}

function killStalePort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const lines = output.split("\n").filter(
      (l) => l.includes("LISTENING") && l.includes(`:${port}`)
    );
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== "0" && pid !== String(process.pid)) {
        console.log(`Killing stale process (PID ${pid}) on port ${port}...`);
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "pipe" });
        } catch {}
      }
    }
  } catch {}
}

process.on("uncaughtException", (err) => {
  logToFile(`uncaughtException: ${err && err.stack ? err.stack : String(err)}`);
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  logToFile(
    `unhandledRejection: ${reason && reason.stack ? reason.stack : String(reason)}`
  );
  console.error("Unhandled rejection:", reason);
});

function clearPortFile() {
  try {
    if (fs.existsSync(PORT_FILE)) fs.unlinkSync(PORT_FILE);
  } catch {}
}

clearPortFile();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/chat", authMiddleware, chatRoutes);
app.use("/api/upload", authMiddleware, uploadRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", port: boundPort });
});

let boundPort = null;

// Check if Windows itself has stolen this port (Hyper-V/WSL excluded ranges)
function isPortExcludedByWindows(port) {
  try {
    const output = execSync(
      "netsh interface ipv4 show excludedportrange protocol=tcp",
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const lines = output.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\s*(\d+)\s+(\d+)\s*\*?\s*$/);
      if (m) {
        const start = parseInt(m[1], 10);
        const end = parseInt(m[2], 10);
        if (port >= start && port <= end) return true;
      }
    }
  } catch {}
  return false;
}

function writePortFile(port) {
  try {
    fs.writeFileSync(PORT_FILE, String(port));
  } catch (err) {
    logToFile(`Failed to write port file: ${err}`);
  }
}

function listenOn(port) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const server = app.listen(port);
    server.once("listening", () => {
      settled = true;
      resolve(server);
    });
    server.once("error", (err) => {
      if (settled) return;
      settled = true;
      try {
        server.close();
      } catch {}
      reject(err);
    });
  });
}

async function startServer() {
  let lastError = null;

  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt++) {
    const port = PREFERRED_PORT + attempt;

    if (isPortExcludedByWindows(port)) {
      console.log(
        `Port ${port} is reserved by Windows (Hyper-V/WSL), skipping to ${port + 1}...`
      );
      logToFile(`Port ${port} in Windows excluded range, skipping`);
      continue;
    }

    killStalePort(port);

    // Final sanity check that nothing is accepting connections
    const inUse = await new Promise((resolve) => {
      const probe = net.createConnection({ port, host: "127.0.0.1" });
      probe.once("connect", () => {
        probe.destroy();
        resolve(true);
      });
      probe.once("error", () => resolve(false));
      probe.setTimeout(500, () => {
        probe.destroy();
        resolve(false);
      });
    });

    if (inUse) {
      console.log(
        `Port ${port} still occupied by PID we cannot kill, skipping...`
      );
      logToFile(`Port ${port} occupied by unkillable process, skipping`);
      continue;
    }

    try {
      const server = await listenOn(port);
      boundPort = port;
      writePortFile(port);
      if (port !== PREFERRED_PORT) {
        console.log(
          `⚠ Port ${PREFERRED_PORT} was unavailable, backend started on fallback port ${port}`
        );
        logToFile(`Fallback: started on port ${port} instead of ${PREFERRED_PORT}`);
      }
      console.log(`Backend running on http://localhost:${port}`);

      const shutdown = () => {
        clearPortFile();
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 2000).unref();
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
      process.on("exit", clearPortFile);

      return server;
    } catch (err) {
      lastError = err;
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        logToFile(`Port ${port} unavailable (${err.code}), trying next`);
        continue;
      }
      console.error("Server error:", err);
      logToFile(`server error: ${err && err.stack ? err.stack : String(err)}`);
      throw err;
    }
  }

  const msg = `Could not bind any port from ${PREFERRED_PORT}-${PREFERRED_PORT + MAX_PORT_ATTEMPTS - 1}. Last error: ${lastError}`;
  logToFile(msg);
  console.error(msg);
  process.exit(1);
}

startServer();

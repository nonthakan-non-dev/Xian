import { execSync } from "node:child_process";

function killPort(port) {
  try {
    const out = execSync(`lsof -t -i:${port}`, { encoding: "utf8" }).trim();
    if (!out) return;
    for (const pid of out.split("\n").filter(Boolean)) {
      try {
        process.kill(Number(pid), "SIGTERM");
        console.log(`[dev:clean] stopped pid ${pid} on port ${port}`);
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening */
  }
}

killPort(2567);
killPort(5173);

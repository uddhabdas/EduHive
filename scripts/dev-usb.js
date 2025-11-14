#!/usr/bin/env node
const { spawn } = require("child_process");

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: true, ...opts });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(cmd + " exited " + code))));
  });
}

(async () => {
  try {
    // 1) Ensure Mongo via Docker
    await run("docker", ["compose", "up", "-d"]);

    // 2) ADB reverse so phone can reach localhost:4000
    await run("adb", ["reverse", "tcp:4000", "tcp:4000"]);

    // 3) Start backend (server)
    const server = spawn("npm", ["run", "dev"], { cwd: "server", stdio: "inherit", shell: true });

    // Give server a moment to boot
    await new Promise((r) => setTimeout(r, 2000));

    // 4) Start Expo (app) in localhost mode
    const expo = spawn("npx", ["expo", "start", "--localhost"], { cwd: "app", stdio: "inherit", shell: true });

    // Cleanup on exit
    const cleanup = async () => {
      try { server.kill("SIGINT"); } catch {}
      try { expo.kill("SIGINT"); } catch {}
      process.exit(0);
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } catch (e) {
    console.error("dev-usb error:", e.message);
    process.exit(1);
  }
})();

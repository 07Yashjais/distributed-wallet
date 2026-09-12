const { fork } = require("child_process");
const path = require("path");

const services = [
    { name: "API Server", script: path.join(__dirname, "server.js") },
    { name: "Outbox Worker", script: path.join(__dirname, "workers", "outboxWorker.js") },
    { name: "Transaction Worker", script: path.join(__dirname, "workers", "transactionWorker.js") }
];

console.log("==================================================");
console.log("Starting Distributed Wallet (All-In-One Service)...");
console.log("==================================================");

const children = [];
let isShuttingDown = false;

services.forEach(({ name, script }) => {
    const child = fork(script, [], {
        stdio: "inherit",
        env: process.env
    });

    children.push({ name, child });

    child.on("exit", (code, signal) => {
        if (!isShuttingDown) {
            console.error(`[Process Manager] ${name} exited unexpectedly (code: ${code}, signal: ${signal}).`);
            shutdown("SIGTERM", 1);
        } else {
            console.log(`[Process Manager] ${name} stopped cleanly.`);
        }
    });
});

const shutdown = (signal, exitCode = 0) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[Process Manager] ${signal} received. Broadcasting graceful shutdown to all services...`);

    const killTimeout = setTimeout(() => {
        console.warn("[Process Manager] Force killing lingering processes...");
        children.forEach(({ child }) => {
            try { child.kill("SIGKILL"); } catch {}
        });
        process.exit(exitCode);
    }, 10000);

    let remaining = children.length;

    children.forEach(({ name, child }) => {
        if (child.exitCode !== null || child.killed) {
            remaining--;
            return;
        }

        child.once("exit", () => {
            remaining--;
            if (remaining <= 0) {
                clearTimeout(killTimeout);
                console.log("[Process Manager] All services terminated cleanly.");
                process.exit(exitCode);
            }
        });

        try {
            child.kill(signal);
        } catch (err) {
            console.error(`[Process Manager] Failed to signal ${name}:`, err.message);
        }
    });

    if (remaining <= 0) {
        clearTimeout(killTimeout);
        process.exit(exitCode);
    }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

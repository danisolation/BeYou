console.log("smoke:production delegates to smoke:demo; use smoke:pilot for production_pilot readiness.");

const { main } = await import("./demo-smoke.mjs");

await main();

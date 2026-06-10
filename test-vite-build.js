import { build } from "vite";
console.log("starting build");
await build({ configFile: false, logLevel: "info" });
console.log("build finished");

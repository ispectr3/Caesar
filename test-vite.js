import { createServer } from "vite";

console.log("starting vite without config");
const server = await createServer({
  configFile: false,
  server: { port: 5175 },
});
console.log("server created");
await server.listen();
console.log("server listening");

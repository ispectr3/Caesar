import { createServer } from "vite";

console.log("starting vite without config");
const server = await createServer({
  configFile: false,
  server: {
    port: 5175,
    host: "127.0.0.1",
    watch: null,
  },
});
console.log("server created");
await server.listen();
console.log("server listening");

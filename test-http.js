import http from "http";
const server = http.createServer((req, res) => res.end("ok"));
server.listen(5175, () => {
  console.log("HTTP Server listening on 5175");
  process.exit(0);
});

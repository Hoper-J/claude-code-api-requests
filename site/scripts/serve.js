/* Tiny static server for local preview (node, no deps).
   Serves site/public/ — the same directory Cloudflare Pages publishes —
   so URLs match production (`/`, `/data/latest.json`, …).

   Usage: node site/scripts/serve.js [--port N] [--no-open]
   - Tries --port (default 4173); if busy, walks up to +9.
   - Opens the default browser on macOS unless --no-open.
   - Dev cache policy: no-store, so a rebuilt data.js shows on reload. */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const ROOT = path.join(__dirname, "..", "public");
const args = process.argv.slice(2);
const pi = args.indexOf("--port");
let port = pi >= 0 ? Number(args[pi + 1]) : 4173;
const noOpen = args.includes("--no-open");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent((req.url || "/").split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("not found: " + rel); }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(buf);
  });
});

server.on("listening", () => {
  const url = `http://localhost:${server.address().port}/`;
  console.log(`Lineage running at ${url}  (root: site/public — same as the Pages publish dir; Ctrl-C to stop)`);
  if (!noOpen && process.platform === "darwin") execFile("open", [url], () => {});
});
function listen(p, triesLeft) {
  server.once("error", (e) => {
    if (e.code === "EADDRINUSE" && triesLeft > 0) listen(p + 1, triesLeft - 1);
    else { console.error("serve: " + e.message); process.exit(1); }
  });
  server.listen(p);
}
listen(port, 9);

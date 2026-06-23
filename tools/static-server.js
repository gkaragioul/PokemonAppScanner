import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);

const types = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
]);

function resolveRequestPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const candidate = resolve(join(root, cleanPath));
  if (!candidate.startsWith(root)) return join(root, "index.html");
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    return join(candidate, "index.html");
  }
  return join(root, "index.html");
}

createServer((request, response) => {
  const filePath = resolveRequestPath(request.url || "/");
  const extension = extname(filePath);
  const contentType = types.get(extension) || "application/octet-stream";

  if (!existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const cacheControl = filePath.endsWith("sw.js")
    ? "no-cache"
    : "public, max-age=3600";

  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": cacheControl,
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "0.0.0.0", () => {
  console.log(`Card Scout running at http://localhost:${port}`);
});

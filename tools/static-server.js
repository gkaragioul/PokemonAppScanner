import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

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

export function resolveRequestPath(urlPath, rootDir = root) {
  let decoded;
  try {
    decoded = decodeURIComponent(String(urlPath || "/").split("?")[0]);
  } catch {
    return { statusCode: 400, filePath: null };
  }

  const normalizedRoot = resolve(rootDir);
  const cleanPath = normalize(decoded)
    .replace(/^[/\\]+/, "")
    .replace(/^(\.\.[/\\])+/, "");
  const candidate = resolve(join(normalizedRoot, cleanPath));
  const insideRoot = candidate === normalizedRoot || candidate.startsWith(`${normalizedRoot}${sep}`);

  if (!insideRoot) {
    return { statusCode: 404, filePath: null };
  }

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return { statusCode: 200, filePath: candidate };
  }

  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const indexPath = join(candidate, "index.html");
    return existsSync(indexPath)
      ? { statusCode: 200, filePath: indexPath }
      : { statusCode: 404, filePath: null };
  }

  if (!extname(candidate)) {
    return { statusCode: 200, filePath: join(normalizedRoot, "index.html") };
  }

  return { statusCode: 404, filePath: null };
}

export function createStaticServer() {
  return createServer((request, response) => {
  const result = resolveRequestPath(request.url || "/");
  const filePath = result.filePath;

  if (!filePath) {
    response.writeHead(result.statusCode, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(result.statusCode === 400 ? "Bad request" : "Not found");
    return;
  }

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
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createStaticServer().listen(port, "0.0.0.0", () => {
    console.log(`Card Scout running at http://localhost:${port}`);
  });
}

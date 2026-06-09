import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 8787);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function sendJson(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*"
  });
  response.end(JSON.stringify(body));
}

async function searchBooks(requestUrl, response) {
  const query = requestUrl.searchParams.get("q")?.trim();
  if (!query) {
    sendJson(response, 400, { error: "missing query", docs: [] });
    return;
  }

  try {
    const apiUrl = new URL("https://openlibrary.org/search.json");
    apiUrl.searchParams.set("title", query);
    apiUrl.searchParams.set("limit", "9");
    apiUrl.searchParams.set("fields", "title,author_name,first_publish_year,subject");

    const upstream = await fetch(apiUrl);
    if (!upstream.ok) throw new Error(`Open Library returned ${upstream.status}`);
    const data = await upstream.json();
    sendJson(response, 200, { docs: data.docs || [] });
  } catch (error) {
    sendJson(response, 502, {
      error: "book search unavailable",
      message: error.message,
      docs: []
    });
  }
}

async function serveFile(pathname, response) {
  const requested = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream" });
    response.end(content);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (requestUrl.pathname === "/api/search-books") {
    await searchBooks(requestUrl, response);
    return;
  }

  await serveFile(requestUrl.pathname, response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Study planner is running at http://localhost:${port}`);
});

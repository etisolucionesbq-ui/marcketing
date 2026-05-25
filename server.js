const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function send(res, status, body, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function handleApi(req, res) {
  const routes = {
    "/api/products": path.join(root, "data", "products.json"),
    "/api/settings": path.join(root, "data", "site-settings.json"),
    "/api/banners": path.join(root, "data", "banners.json")
  };
  const file = routes[new URL(req.url, `http://localhost:${port}`).pathname];

  if (!file) {
    send(res, 404, JSON.stringify({ error: "Not found" }));
    return;
  }

  if (req.method === "GET") {
    send(res, 200, await fs.readFile(file, "utf8"));
    return;
  }

  if (req.method === "POST") {
    const payload = JSON.parse(await readBody(req));
    await fs.writeFile(file, JSON.stringify(payload, null, 2) + "\n", "utf8");
    send(res, 200, JSON.stringify({ ok: true }));
    return;
  }

  send(res, 405, JSON.stringify({ error: "Method not allowed" }));
}

async function handleStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(root, requested));

  if (!filePath.startsWith(root)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    const finalPath = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const ext = path.extname(finalPath).toLowerCase();
    send(res, 200, await fs.readFile(finalPath), types[ext] || "application/octet-stream");
  } catch {
    send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }
    await handleStatic(req, res);
  } catch (error) {
    send(res, 500, JSON.stringify({ error: error.message }));
  }
});

server.listen(port, () => {
  console.log(`Local site ready at http://localhost:${port}`);
});

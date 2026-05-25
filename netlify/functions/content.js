const files = {
  products: "data/products.json",
  settings: "data/site-settings.json",
  banners: "data/banners.json"
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

function env(name, fallback = "") {
  return process.env[name] || fallback;
}

async function githubRequest(path, options = {}) {
  const token = env("GITHUB_TOKEN");
  const repo = env("GITHUB_REPO", "etisolucionesbq-ui/marcketing");
  const branch = env("GITHUB_BRANCH", "main");

  if (!token) {
    throw new Error("Missing GITHUB_TOKEN in Netlify environment variables.");
  }

  const url = `https://api.github.com/repos/${repo}/contents/${path}${options.ref === false ? "" : `?ref=${branch}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": "up-gamer-admin",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `GitHub request failed: ${res.status}`);
  return data;
}

async function readFile(fileKey) {
  const branch = env("GITHUB_BRANCH", "main");
  const data = await githubRequest(files[fileKey], { method: "GET" });
  const json = Buffer.from(data.content || "", "base64").toString("utf8");
  return JSON.parse(json);
}

async function writeFile(fileKey, payload) {
  const branch = env("GITHUB_BRANCH", "main");
  const path = files[fileKey];
  const current = await githubRequest(path, { method: "GET" });
  const body = {
    message: `Update ${path} from admin`,
    content: Buffer.from(JSON.stringify(payload, null, 2) + "\n", "utf8").toString("base64"),
    sha: current.sha,
    branch
  };

  await githubRequest(path, {
    method: "PUT",
    ref: false,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

exports.handler = async (event) => {
  try {
    const fileKey = event.queryStringParameters?.file;
    if (!files[fileKey]) return response(400, { error: "Invalid file parameter." });

    if (event.httpMethod === "GET") {
      return response(200, await readFile(fileKey));
    }

    if (event.httpMethod === "POST") {
      await writeFile(fileKey, JSON.parse(event.body || "{}"));
      return response(200, { ok: true });
    }

    return response(405, { error: "Method not allowed." });
  } catch (error) {
    return response(500, { error: error.message });
  }
};

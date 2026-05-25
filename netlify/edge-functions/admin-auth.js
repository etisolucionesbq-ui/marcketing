function unauthorized(message = "Authentication required") {
  return new Response(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
      "Cache-Control": "no-store"
    }
  });
}

function secureCompare(left, right) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

export default async (request, context) => {
  const user = Netlify.env.get("ADMIN_USER");
  const password = Netlify.env.get("ADMIN_PASSWORD");

  if (!user || !password) {
    return new Response("Admin auth is not configured.", {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return unauthorized();

  let decoded = "";
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }

  const separator = decoded.indexOf(":");
  const requestUser = decoded.slice(0, separator);
  const requestPassword = decoded.slice(separator + 1);

  if (!secureCompare(requestUser, user) || !secureCompare(requestPassword, password)) {
    return unauthorized("Invalid credentials");
  }

  return context.next();
};

import type { LoginCredentials } from "../entities/login-credentials.entity";

// The ONLY file in this module allowed to call fetch(). Talks to the API
// Gateway's single stable /auth/login shape — this module doesn't know or
// care whether AUTH_PROVIDER is "authentik" or "local" on the backend,
// since both emit identical TokenClaims shapes.
export async function loginService(
  credentials: LoginCredentials,
): Promise<void> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/auth/signin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? "Invalid email or password");
  }
}

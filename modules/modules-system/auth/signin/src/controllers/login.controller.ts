import {
  loginSchema,
  type LoginCredentials,
} from "../entities/login-credentials.entity";
import { loginService } from "../services/login.service";

// Orchestration layer: validate -> call service -> return a typed result
// the UI can render without ever touching fetch() or zod directly.
export interface LoginResult {
  success: boolean;
  error?: string;
}

export async function handleLogin(
  input: LoginCredentials,
): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    await loginService(parsed.data);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Login failed",
    };
  }
}

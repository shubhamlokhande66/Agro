
export type Role = "admin" | "client";
export type User = { username: string; password: string; role: Role };

/**
 * Credentials — kept server-side. `ADMIN_PASSWORD` / `CLIENT_PASSWORD` env vars
 * override the defaults for production.
 */
export const USERS: User[] = [
  { username: "admin", password: process.env.ADMIN_PASSWORD ?? "Agro@Admin2025", role: "admin" },
  ...Array.from({ length: 10 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      username: `client${n}`,
      password: process.env.CLIENT_PASSWORD ?? `Cotton@C${n}`,
      role: "client" as Role,
    };
  }),
];

export function verifyCredentials(username: string, password: string): User | null {
  const u = username.trim().toLowerCase();
  return USERS.find((x) => x.username.toLowerCase() === u && x.password === password) ?? null;
}

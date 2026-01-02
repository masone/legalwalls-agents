import { VercelRequest } from "@vercel/node";

export function isAuthorized(request: VercelRequest): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const token = process.env.API_KEY;
  const header = request.headers.authorization;

  if (!token || !header) {
    return false;
  }

  return header === `Bearer ${token}`;
}

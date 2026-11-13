import { authResponse } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return authResponse("logout", request);
}

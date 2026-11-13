import { authResponse } from "@/lib/auth/server";

export async function POST(request: Request) {
  return authResponse("signup", request);
}

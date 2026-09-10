import { NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/supabase/wallet-session";

export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function requireWallet(): Promise<string | NextResponse> {
  try {
    const wallet = await getAuthenticatedWallet();
    return wallet ?? errorResponse("Authenticate the wallet before changing room state.", 401);
  } catch {
    return errorResponse("Wallet authentication is not configured.", 503);
  }
}

export async function readJSON(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) throw new Error("Request is too large.");
  return request.json();
}

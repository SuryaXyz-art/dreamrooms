import { NextResponse } from "next/server";
import { errorResponse, readJSON, requireWallet } from "@/lib/api";
import { verifyRoomTrade } from "@/lib/supabase/trade-verification";
import { roomSlugSchema } from "@/lib/supabase/schema";
import { z } from "zod";

const bodySchema = z.object({ transactionHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/) });

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const wallet = await requireWallet();
  if (wallet instanceof NextResponse) return wallet;
  try {
    const parsed = bodySchema.safeParse(await readJSON(request));
    if (!parsed.success) return errorResponse("Invalid transaction hash.", 400);
    const { slug: rawSlug } = await params;
    const slug = roomSlugSchema.parse(rawSlug);
    const result = await verifyRoomTrade({
      slug,
      walletAddress: wallet as `0x${string}`,
      transactionHash: parsed.data.transactionHash as `0x${string}`,
    });
    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return errorResponse("The transaction could not be independently verified.", 422);
  }
}

import { z } from "zod";

export const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export const marketIdSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
export const roomSlugSchema = z.string().regex(/^[a-z0-9]{16,64}$/);
export const roomLanguageSchema = z.enum(["en", "hi"]);
export const roomSideSchema = z.enum(["UP", "DOWN"]);

export const createRoomSchema = z.object({
  marketId: marketIdSchema,
  title: z.string().trim().min(1).max(120),
  thesis: z.string().trim().max(500).default(""),
  language: roomLanguageSchema.default("en"),
  suggestedMaxSpend: z.number().finite().nonnegative().max(1).nullable().optional(),
});

export const signedMessageSchema = z.object({
  address: walletAddressSchema,
  nonce: z.string().min(32).max(256),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
  action: z.string().regex(/^[a-z_]{3,40}$/),
  message: z.string().min(80).max(1000),
});

export const sentimentSchema = z.object({ side: roomSideSchema });
export const reactionSchema = z.object({ reaction: z.enum(["🔥", "👀", "💡", "👏"]) });

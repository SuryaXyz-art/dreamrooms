import { describe, expect, it } from "vitest";
import { ReadTimeoutError, withRetry, withTimeout } from "@/lib/dreamdex/reliability";

describe("read reliability", () => {
  it("retries a transient read with bounded attempts", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls += 1;
        if (calls === 1) throw new Error("temporary");
        return "ok";
      },
      { attempts: 2, backoffMs: 0, timeoutMs: 100, operation: "test read" },
    );

    expect(result).toBe("ok");
    expect(calls).toBe(2);
  });

  it("fails a hanging read at the timeout", async () => {
    await expect(
      withTimeout(new Promise<never>(() => undefined), 5, "test read"),
    ).rejects.toBeInstanceOf(ReadTimeoutError);
  });
});

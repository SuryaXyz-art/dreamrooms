export class ReadTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`);
    this.name = "ReadTimeoutError";
  }
}

export interface RetryOptions {
  attempts?: number;
  timeoutMs?: number;
  backoffMs?: number;
  operation?: string;
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => reject(new ReadTimeoutError(operationName, timeoutMs)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const timeoutMs = options.timeoutMs ?? 8_000;
  const backoffMs = options.backoffMs ?? 250;
  const operationName = options.operation ?? "read";
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await withTimeout(operation(), timeoutMs, operationName);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, backoffMs * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${operationName} failed`);
}

/**
 * Clipboard helpers for copying secret values.
 *
 * A copied password is auto-cleared from the OS clipboard after a short delay,
 * the way password managers do, so it does not linger there indefinitely. The
 * clear is silent (no toast, no visual change) and only fires if the clipboard
 * still holds exactly the value we wrote — if the user copied something else in
 * the meantime, their clipboard is left untouched.
 *
 * Limitation: the timer lives in the webview. If the whole application is quit
 * before the delay elapses, the clipboard is not cleared. This is recorded in
 * docs/ACCOUNT-OS-V3-KNOWN-LIMITATIONS.md.
 */

/** 40s — inside the 30–45s window standard for password managers. */
export const CLIPBOARD_CLEAR_DELAY_MS = 40_000;

type ClipboardLike = {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
};

type ScheduleFn = (callback: () => void, delayMs: number) => unknown;

function defaultClipboard(): ClipboardLike | null {
  if (typeof navigator === "undefined" || !navigator.clipboard) return null;
  return navigator.clipboard;
}

export interface CopySecretOptions {
  /** Override the auto-clear delay in milliseconds. */
  delayMs?: number;
  /** Clipboard implementation to use. Injectable for tests. `null` forces the "unavailable" path. */
  clipboard?: ClipboardLike | null;
  /** Timer scheduler. Injectable for tests; defaults to `setTimeout`. */
  schedule?: ScheduleFn;
}

/**
 * Writes `value` to the clipboard and schedules a silent auto-clear.
 * Resolves once the value is on the clipboard; rejects if the write fails.
 */
export async function copySecretToClipboard(value: string, options: CopySecretOptions = {}): Promise<void> {
  const clipboard = options.clipboard === undefined ? defaultClipboard() : options.clipboard;
  if (!clipboard) throw new Error("Clipboard unavailable");

  await clipboard.writeText(value);
  if (!value) return;

  const schedule: ScheduleFn = options.schedule ?? ((callback, delayMs) => setTimeout(callback, delayMs));
  const delayMs = options.delayMs ?? CLIPBOARD_CLEAR_DELAY_MS;

  schedule(() => {
    void clearClipboardIfUnchanged(value, clipboard);
  }, delayMs);
}

/**
 * Clears the clipboard, but only if it still holds exactly `expected`.
 * If the clipboard cannot be read back (e.g. the document is not focused), it is
 * left untouched rather than risk clobbering an unrelated copy the user made.
 */
export async function clearClipboardIfUnchanged(
  expected: string,
  clipboard: ClipboardLike | null = defaultClipboard(),
): Promise<void> {
  if (!clipboard || !expected) return;
  try {
    const current = await clipboard.readText();
    if (current === expected) {
      await clipboard.writeText("");
    }
  } catch {
    // Clipboard not readable/writable right now — leave it as-is.
  }
}

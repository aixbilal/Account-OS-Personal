import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLIPBOARD_CLEAR_DELAY_MS, clearClipboardIfUnchanged, copySecretToClipboard } from "./clipboard";

function makeClipboard(initial = "") {
  let text = initial;
  return {
    writeText: vi.fn(async (value: string) => {
      text = value;
    }),
    readText: vi.fn(async () => text),
    get current() {
      return text;
    },
  };
}

describe("copySecretToClipboard", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("writes the value to the clipboard immediately", async () => {
    const clipboard = makeClipboard();
    await copySecretToClipboard("FAKE-SECRET", { clipboard });
    expect(clipboard.current).toBe("FAKE-SECRET");
  });

  it("clears the clipboard after the delay when it still holds the copied value", async () => {
    const clipboard = makeClipboard();
    await copySecretToClipboard("FAKE-SECRET", { clipboard });
    expect(clipboard.current).toBe("FAKE-SECRET");

    await vi.advanceTimersByTimeAsync(CLIPBOARD_CLEAR_DELAY_MS);

    expect(clipboard.current).toBe("");
    expect(clipboard.writeText).toHaveBeenLastCalledWith("");
  });

  it("does NOT clear the clipboard if the user copied something else first", async () => {
    const clipboard = makeClipboard();
    await copySecretToClipboard("FAKE-SECRET", { clipboard });

    // User copies unrelated text before the auto-clear timer fires.
    await clipboard.writeText("unrelated user copy");
    clipboard.writeText.mockClear();

    await vi.advanceTimersByTimeAsync(CLIPBOARD_CLEAR_DELAY_MS);

    expect(clipboard.current).toBe("unrelated user copy");
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it("does not fire before the delay elapses", async () => {
    const clipboard = makeClipboard();
    await copySecretToClipboard("FAKE-SECRET", { clipboard });
    clipboard.writeText.mockClear();

    await vi.advanceTimersByTimeAsync(CLIPBOARD_CLEAR_DELAY_MS - 1);

    expect(clipboard.current).toBe("FAKE-SECRET");
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it("leaves the clipboard alone if it cannot be read back", async () => {
    const clipboard = makeClipboard("FAKE-SECRET");
    clipboard.readText = vi.fn(async () => {
      throw new Error("document is not focused");
    });
    await copySecretToClipboard("FAKE-SECRET", { clipboard });
    clipboard.writeText.mockClear();

    await vi.advanceTimersByTimeAsync(CLIPBOARD_CLEAR_DELAY_MS);

    expect(clipboard.writeText).not.toHaveBeenCalled();
    expect(clipboard.current).toBe("FAKE-SECRET");
  });

  it("rejects when no clipboard is available and schedules nothing", async () => {
    await expect(copySecretToClipboard("x", { clipboard: null })).rejects.toThrow("Clipboard unavailable");
  });
});

describe("clearClipboardIfUnchanged", () => {
  it("clears only when the current contents match", async () => {
    const match = makeClipboard("FAKE-SECRET");
    await clearClipboardIfUnchanged("FAKE-SECRET", match);
    expect(match.current).toBe("");

    const changed = makeClipboard("something the user copied later");
    await clearClipboardIfUnchanged("FAKE-SECRET", changed);
    expect(changed.current).toBe("something the user copied later");
  });
});

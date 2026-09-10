import { describe, expect, it } from "vitest";

function luminance(hex: string) {
  const rgb = hex.match(/[a-f\d]{2}/gi)!.map((value) => Number.parseInt(value, 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}

function contrast(foreground: string, background: string) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + .05) / (dark + .05);
}

const auditedPairs = {
  v3Light: {
    primaryAction: ["#ffffff", "#126bc2"],
    dangerAction: ["#ffffff", "#d23742"],
    mutedText: ["#61738c", "#ffffff"],
    successText: ["#0d7847", "#ffffff"],
  },
  v3Dark: {
    primaryAction: ["#08182a", "#5aa7ff"],
    dangerAction: ["#2b0810", "#ff7a82"],
    mutedText: ["#8ea3bc", "#17263b"],
    successText: ["#70e8aa", "#17263b"],
  },
  hybrid: { sidebarText: ["#d8e1e7", "#17212b"], vaultText: ["#1f2d39", "#edf1f3"], inspectorText: ["#1f2d39", "#f6f8f9"], selectedRow: ["#1f2d39", "#dbe7ef"], button: ["#ffffff", "#315a7d"], metadata: ["#5e6f7e", "#edf1f3"], map: ["#d5e1e8", "#1d2a35"] },
  dark: { sidebarText: ["#d8e1e7", "#151b24"], vaultText: ["#edf3f6", "#1c2631"], inspectorText: ["#edf3f6", "#202b36"], selectedRow: ["#edf3f6", "#2d4354"], button: ["#ffffff", "#386d8b"], metadata: ["#afbec9", "#1c2631"], map: ["#d5e1e8", "#1d2a35"] },
  light: { sidebarText: ["#1f3040", "#e8edf1"], vaultText: ["#1c2c37", "#ffffff"], inspectorText: ["#1c2c37", "#f2f5f6"], selectedRow: ["#1c2c37", "#e5eff4"], button: ["#ffffff", "#315a7d"], metadata: ["#647582", "#ffffff"], map: ["#d5e1e8", "#1d2a35"] },
} as const;

describe("semantic theme contrast", () => {
  it.each(Object.entries(auditedPairs))("keeps %s primary UI pairs at WCAG AA", (_, pairs) => {
    for (const [role, [foreground, background]] of Object.entries(pairs)) {
      expect(contrast(foreground, background), role).toBeGreaterThanOrEqual(4.5);
    }
  });
});

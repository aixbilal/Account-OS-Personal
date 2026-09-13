import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", { value: ResizeObserverMock, writable: true });

// jsdom implements neither IntersectionObserver (used by SettingsScreen's
// scrollspy, Item 5 of UI Refinement Pass 2) nor Element.scrollIntoView
// (used by the same feature's nav-click smooth-scroll) - stub both so
// components using them can still mount and be interacted with in tests.
class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

Object.defineProperty(globalThis, "IntersectionObserver", { value: IntersectionObserverMock, writable: true });

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom doesn't implement matchMedia either. A harmless "nothing matches"
// default so components that check media queries (reduced-motion, color-
// scheme) can mount in tests that don't care about those queries
// specifically; `configurable: true` lets a test file (e.g. App.test.tsx)
// still install its own more detailed mock where the query result matters.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (media: string) => ({
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches: false,
      media,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    }),
  });
}

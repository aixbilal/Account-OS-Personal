import { useEffect, useRef, type ReactNode } from "react";

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface ModalProps {
  active?: boolean;
  children: ReactNode;
  className?: string;
  label?: string;
  labelledBy?: string;
  onRequestClose: () => void;
  variant: "dialog" | "sheet";
}

function ModalFrame({
  active = true,
  children,
  className = "",
  label,
  labelledBy,
  onRequestClose,
  variant,
}: ModalProps) {
  const panelRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onRequestClose);

  useEffect(() => {
    closeRef.current = onRequestClose;
  }, [onRequestClose]);

  useEffect(() => {
    if (!active) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const initial = panel?.querySelector<HTMLElement>("[data-autofocus]")
      ?? panel?.querySelector<HTMLElement>(focusableSelector)
      ?? panel;
    initial?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.requestAnimationFrame(() => openerRef.current?.focus());
    };
  }, [active]);

  return (
    <div
      className={`modal-backdrop modal-backdrop-${variant}`}
      onMouseDown={(event) => {
        if (active && event.target === event.currentTarget) onRequestClose();
      }}
      role="presentation"
    >
      <section
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={`modal-panel modal-${variant} ${className}`.trim()}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  );
}

export function Dialog(props: Omit<ModalProps, "variant">) {
  return <ModalFrame {...props} variant="dialog" />;
}

export function Sheet(props: Omit<ModalProps, "variant">) {
  return <ModalFrame {...props} variant="sheet" />;
}

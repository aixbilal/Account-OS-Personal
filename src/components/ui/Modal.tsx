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
    if (!openerRef.current) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
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
      if (!panel.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
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
      window.requestAnimationFrame(() => {
        if (!panel?.isConnected) openerRef.current?.focus();
      });
    };
  }, [active]);

  return (
    <div
      className={`modal-backdrop modal-backdrop-${variant}`}
      data-active={active}
      inert={!active}
      onMouseDown={(event) => {
        if (active && event.target === event.currentTarget) onRequestClose();
      }}
      role="presentation"
    >
      <section
        aria-hidden={!active || undefined}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-modal={active || undefined}
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

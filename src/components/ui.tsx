"use client";
import {
  useEffect,
  useRef,
  useId,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { X, LoaderCircle } from "lucide-react";
import { useFantasyMotion } from "@/features/motion/FantasyTransitions";
export function IconButton({
  label,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`icon-button ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  onBeforeClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  onBeforeClose?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closer = useRef(onClose);
  closer.current = onClose;
  const enabled = useFantasyMotion();
  const motionEnabled = useRef(enabled);
  motionEnabled.current = enabled;
  const activeAnimation = useRef<Animation | null>(null);
  const closing = useRef(false);
  const beforeClose = useRef(onBeforeClose);
  beforeClose.current = onBeforeClose;
  function requestClose() {
    if (closing.current) return;
    beforeClose.current?.();
    const dialog = ref.current;
    const canAnimate =
      motionEnabled.current &&
      dialog &&
      typeof dialog.animate === "function" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canAnimate) {
      closer.current();
      return;
    }
    closing.current = true;
    dialog.dataset.closing = "true";
    activeAnimation.current?.cancel();
    const animation = dialog.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(6px) scale(.98)" },
      ],
      { duration: 150, easing: "cubic-bezier(.7,0,.84,0)" },
    );
    activeAnimation.current = animation;
    animation.onfinish = () => closer.current();
  }
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    if (
      motionEnabled.current &&
      dialog &&
      typeof dialog.animate === "function" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      activeAnimation.current = dialog.animate(
        [
          { opacity: 0, transform: "translateY(12px) scale(.975)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        { duration: 300, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    }
    return () => {
      activeAnimation.current?.cancel();
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      aria-label={title}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <IconButton label="Tutup dialog" onClick={requestClose}>
          <X size={19} />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}
export function Spinner() {
  return <LoaderCircle size={16} className="spinner" aria-hidden="true" />;
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const fieldId = useId();
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<Record<string, unknown>>, {
            id: fieldId,
            ...(hint ? { "aria-describedby": fieldId + "-hint" } : {}),
          })
        : children}
      {hint && <small id={fieldId + "-hint"}>{hint}</small>}
    </div>
  );
}
export function Toggle({
  label,
  detail,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        {detail && <small>{detail}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

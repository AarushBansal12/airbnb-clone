"use client";

import { useEffect, useState } from "react";
import { X, Star, Minus, Plus } from "lucide-react";

/** <img> that swaps to a deterministic placeholder if the remote photo fails. */
export function SafeImage({ src, alt, className, seed }: { src: string; alt: string; className?: string; seed?: string | number }) {
  const [failed, setFailed] = useState(false);
  const fallback = `https://picsum.photos/seed/stay-${seed ?? encodeURIComponent(src.slice(-24))}/800/600`;
  return (
    <img
      src={failed ? fallback : src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => !failed && setFailed(true)}
    />
  );
}

export function Avatar({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-white"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {name.charAt(0)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`modal-in flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white md:rounded-2xl ${
          wide ? "md:max-w-4xl" : "md:max-w-xl"
        }`}
      >
        <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-line px-6">
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute left-4 rounded-full p-2 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="text-base font-bold">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Counter({
  value,
  onChange,
  min = 0,
  max = 16,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-400 text-gray-600 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-200"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-5 text-center">{value}</span>
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-400 text-gray-600 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-200"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function RatingStar({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <Star className={`${className} fill-current`} />;
}

export function BrandButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`brand-gradient rounded-lg px-6 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-24">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="dot h-2 w-2 rounded-full bg-gray-400" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export function Logo() {
  // Original mark (not Airbnb's trademarked logo) in the Rausch brand colour
  return (
    <span className="flex items-center gap-1.5 text-brand">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <path
          d="M16 3.5c-1 0-1.9.5-2.4 1.4L3.9 22.6a4.6 4.6 0 0 0 6.5 6.1L16 25l5.6 3.7a4.6 4.6 0 0 0 6.5-6.1L18.4 4.9A2.8 2.8 0 0 0 16 3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16.5" r="3.6" fill="none" stroke="currentColor" strokeWidth="2.6" />
      </svg>
      <span className="hidden text-[22px] font-extrabold tracking-tight lg:inline">staybnb</span>
    </span>
  );
}

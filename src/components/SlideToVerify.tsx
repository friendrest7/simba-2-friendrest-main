import { useEffect, useRef, useState } from "react";
import { Check, ChevronsRight, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SlideToVerify({ onVerified }: { onVerified: () => void }) {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);

  const KNOB = 48;

  const trackWidth = () => (trackRef.current?.clientWidth ?? 320) - KNOB - 8;

  const onPointerDown = (e: React.PointerEvent) => {
    if (done) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startOffset.current = x;
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || done) return;
    const max = trackWidth();
    const next = Math.max(0, Math.min(max, startOffset.current + (e.clientX - startX.current)));
    setX(next);
    if (next >= max - 2) {
      setDone(true);
      setDragging(false);
      setTimeout(onVerified, 350);
    }
  };

  const onPointerUp = () => {
    if (done) return;
    setDragging(false);
    setX(0);
  };

  useEffect(() => {
    const onResize = () => !dragging && !done && setX(0);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [dragging, done]);

  const pct = trackWidth() > 0 ? (x / trackWidth()) * 100 : 0;

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        className="relative h-14 w-full select-none overflow-hidden rounded-full border border-white/25 bg-white/10 backdrop-blur"
      >
        {/* fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full gradient-brand transition-[width] duration-75"
          style={{ width: `${Math.max(pct, 12)}%` }}
        />
        {/* hint label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className={`text-sm font-bold tracking-wide transition-opacity ${done ? "text-white" : "text-white/90"}`}
          >
            {done ? t("verify.entering") : t("verify.slide")}
          </span>
        </div>
        {/* knob */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ transform: `translateX(${x}px)` }}
          className={`absolute top-1 left-1 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-lg cursor-grab active:cursor-grabbing touch-none ${
            !dragging && !done ? "transition-transform" : ""
          }`}
        >
          {done ? (
            <Check className="h-6 w-6 text-success" />
          ) : (
            <ChevronsRight className="h-6 w-6" />
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/70">
        <ShieldCheck className="h-3.5 w-3.5" />
        {t("verify.protected")}
      </div>
    </div>
  );
}

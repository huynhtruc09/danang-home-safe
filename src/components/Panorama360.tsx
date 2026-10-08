import { useRef, useState, useEffect } from "react";
import { Move } from "lucide-react";

/** Trình xem toàn cảnh 360°: kéo để xoay, ảnh equirectangular lặp liên tục theo chiều ngang. */
export function Panorama360({ src }: { src: string }) {
  const [offset, setOffset] = useState(0);
  const [auto, setAuto] = useState(true);
  const drag = useRef<{ x: number; o: number } | null>(null);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setOffset((o) => o - 0.6), 30);
    return () => clearInterval(id);
  }, [auto]);

  return (
    <div
      className="relative h-80 w-full cursor-grab touch-none select-none overflow-hidden rounded-2xl active:cursor-grabbing"
      style={{ backgroundImage: `url(${src})`, backgroundSize: "auto 140%", backgroundPosition: `${offset}px 50%`, backgroundRepeat: "repeat-x" }}
      onPointerDown={(e) => { setAuto(false); drag.current = { x: e.clientX, o: offset }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { if (drag.current) setOffset(drag.current.o + (e.clientX - drag.current.x) * 1.4); }}
      onPointerUp={() => (drag.current = null)}
    >
      <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-ink/70 px-3 py-1 text-xs text-ink-foreground">
        <Move className="size-3" />Kéo để xem toàn cảnh 360°
      </span>
    </div>
  );
}

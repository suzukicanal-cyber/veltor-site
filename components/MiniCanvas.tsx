"use client";
import { useEffect, useRef } from "react";
import { drawMini } from "@/lib/cloud";

/** Point-cloud preview of a motorcycle or a car, used under photos while they load. */
export default function MiniCanvas({ shape, yaw }: { shape: "moto" | "car"; yaw: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!; const ro = new ResizeObserver(() => drawMini(c, shape, yaw)); ro.observe(c);
    return () => ro.disconnect();
  }, [shape, yaw]);
  return <canvas className="mini" ref={ref} data-shape={shape} aria-hidden="true"></canvas>;
}

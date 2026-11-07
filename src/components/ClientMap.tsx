import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { Listing } from "@/lib/listings";

const FloodMap = lazy(() => import("./FloodMap"));

export function ClientMap(props: { listings?: Listing[]; height?: number; center?: [number, number]; zoom?: number; showWaterStations?: boolean; selectedStationId?: string }) {
  const fallback = <div className="animate-pulse rounded-2xl bg-muted" style={{ height: props.height ?? 520 }} />;
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}><FloodMap {...props} /></Suspense>
    </ClientOnly>
  );
}

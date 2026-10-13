import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

const NearbyMap = lazy(() => import("./NearbyMap"));

export function ClientNearby(props: { lat: number; lng: number }) {
  const fb = <div className="h-[420px] animate-pulse rounded-2xl bg-muted" />;
  return <ClientOnly fallback={fb}><Suspense fallback={fb}><NearbyMap {...props} /></Suspense></ClientOnly>;
}

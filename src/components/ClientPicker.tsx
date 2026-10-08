import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";

const LocationPicker = lazy(() => import("./LocationPicker"));

export function ClientPicker(props: { value: [number, number]; onChange: (p: [number, number]) => void }) {
  const fb = <div className="h-[360px] animate-pulse rounded-2xl bg-muted" />;
  return <ClientOnly fallback={fb}><Suspense fallback={fb}><LocationPicker {...props} /></Suspense></ClientOnly>;
}

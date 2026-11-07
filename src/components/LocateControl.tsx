import { useState } from "react";
import { CircleMarker, useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";

export function LocateControl() {
  const map = useMap();
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) return setErr(true);
    setBusy(true);
    setErr(false);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pt: [number, number] = [p.coords.latitude, p.coords.longitude];
        setPos(pt);
        map.flyTo(pt, 16);
        setBusy(false);
      },
      () => {
        setErr(true);
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <>
      <div className="leaflet-top leaflet-left" style={{ marginTop: 80 }}>
        <div className="leaflet-control leaflet-bar">
          <button
            type="button"
            onClick={locate}
            title="Vị trí của tôi"
            aria-label="Xác định vị trí của tôi"
            className="grid size-[34px] cursor-pointer place-items-center bg-white hover:bg-gray-100"
          >
            <LocateFixed className={`size-4 ${busy ? "animate-spin" : ""} ${err ? "text-red-500" : "text-gray-700"}`} />
          </button>
        </div>
      </div>
      {pos && (
        <CircleMarker center={pos} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }} />
      )}
    </>
  );
}

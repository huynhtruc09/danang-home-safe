import L from "leaflet";

/**
 * Cây ghim (map pin) vẽ bằng SVG, không cần file ảnh nên không bị lỗi
 * "missing marker icon" khi đóng gói.
 */
export function pinIcon(color = "#e06a3c", size = 30, label?: string) {
  const w = size;
  const h = Math.round(size * 1.4);
  const r = size * 0.17;
  const html = `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">
      <path d="M${w / 2} 1C${w * 0.24} 1 ${1} ${w * 0.48} ${1} ${w * 0.5} 1 ${h * 0.74} ${w / 2} ${h - 1} ${w / 2} ${h - 1}S${w - 1} ${h * 0.74} ${w - 1} ${w * 0.5}C${w - 1} ${w * 0.48} ${w * 0.76} 1 ${w / 2} 1Z"
        fill="${color}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="${w / 2}" cy="${w * 0.5}" r="${r}" fill="#fff"/>
      ${label ? `<text x="${w / 2}" y="${w * 0.5 + r * 0.42}" text-anchor="middle" font-size="${r * 1.25}" font-weight="700" fill="${color}" font-family="system-ui,sans-serif">${label}</text>` : ""}
    </svg>`;
  return L.divIcon({
    html,
    className: "pad-pin",
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 1],
    popupAnchor: [0, -(h - 6)],
    tooltipAnchor: [0, -(h - 10)],
  });
}

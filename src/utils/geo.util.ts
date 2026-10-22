interface LatLng {
  lat: number;
  lng: number;
}

interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

export const toGeoJSON = (lat: number, lng: number): GeoJSONPoint => {
  return {
    type: "Point",
    coordinates: [lng, lat],
  };
};

export const fromGeoJSON = (point: {
  type: string;
  coordinates: [number, number];
}): LatLng => {
  return {
    lat: point.coordinates[1],
    lng: point.coordinates[0],
  };
};

const toRad = (deg: number): number => {
  return (deg * Math.PI) / 180;
};

export const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const isStoreOpen = (
  opensAt: string,
  closesAt: string,
  timezone: string
): boolean => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = parseInt(
    parts.find((p) => p.type === "hour")?.value || "0",
    10
  );
  const minute = parseInt(
    parts.find((p) => p.type === "minute")?.value || "0",
    10
  );
  const currentMinutes = hour * 60 + minute;

  const [openH, openM] = opensAt.split(":").map(Number);
  const [closeH, closeM] = closesAt.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes > openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }
  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
};

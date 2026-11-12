const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (Number(degrees) * Math.PI) / 180;
}

/** Great-circle distance in kilometres between two {lat,lng} points. */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Rough ETA at a sensible average city speed (km/h). */
export function estimateEtaMinutes(distanceKm, speedKmh = 25) {
  const minutes = Math.round((distanceKm / speedKmh) * 60);
  return Math.max(minutes, 1);
}

export { EARTH_RADIUS_KM };
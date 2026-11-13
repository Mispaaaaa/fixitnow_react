export const SERVICE_AREAS = [
  'Baco',
  'Bansud',
  'Bongabong',
  'Bulalacao',
  'Calapan City',
  'Gloria',
  'Mansalay',
  'Naujan',
  'Pinamalayan',
  'Pola',
  'Puerto Galera',
  'Roxas',
  'San Teodoro',
  'Socorro',
  'Victoria',
];

export const SERVICE_LOCATION = {
  address: 'MinSU Main Campus, Minas Road',
  city: 'Victoria',
  lat: 13.1537659,
  lng: 121.1860637,
};

const SERVICE_REGION_BOUNDS = {
  minLat: 12.0,
  maxLat: 13.8,
  minLng: 120.5,
  maxLng: 121.8,
};

export function isServiceArea(city) {
  return SERVICE_AREAS.includes(String(city || '').trim());
}

export function isWithinServiceRegion(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= SERVICE_REGION_BOUNDS.minLat &&
    latitude <= SERVICE_REGION_BOUNDS.maxLat &&
    longitude >= SERVICE_REGION_BOUNDS.minLng &&
    longitude <= SERVICE_REGION_BOUNDS.maxLng
  );
}

export function isServiceLocation(location) {
  return isServiceArea(location.city) && isWithinServiceRegion(location.lat, location.lng);
}

import { FiTool, FiShoppingBag, FiRefreshCw } from 'react-icons/fi';

export const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 }; 
export const RADII = [2, 5, 10, 25, 50];

export const ROLE_STYLES = {
  REPAIRER: { color: '#0ea5e9', grad: 'from-sky-500 to-blue-700', icon: FiTool },
  SELLER: { color: '#8b5cf6', grad: 'from-violet-500 to-fuchsia-600', icon: FiShoppingBag },
  BOTH: { color: '#10b981', grad: 'from-emerald-400 to-teal-600', icon: FiRefreshCw },
};
export const roleStyle = (r) => ROLE_STYLES[r] || ROLE_STYLES.BOTH;

export const getShopRole = (s) => s.role || 'BOTH';
export const serviceLabel = (r, t) => (r === 'REPAIRER' ? t('serviceRepair') : r === 'SELLER' ? t('serviceSell') : t('serviceBoth'));
export const addressLine = (s) => [s.shopAddress?.street, s.shopAddress?.city].filter(Boolean).join(', ');


export const getCoords = (s) => {
  const a = s.shopAddress || {};
  const lat = parseFloat(s.latitude ?? s.lat ?? a.latitude ?? a.lat ?? s.location?.latitude ?? s.location?.lat);
  const lng = parseFloat(s.longitude ?? s.lng ?? s.lon ?? a.longitude ?? a.lng ?? a.lon ?? s.location?.longitude ?? s.location?.lng ?? s.location?.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) ? { lat, lng } : null;
};

export const haversineKm = (a, b) => {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

export const formatDistance = (km, t) => (km < 1 ? `${Math.round(km * 1000)} ${t('unitM')}` : `${km.toFixed(1)} ${t('unitKm')}`);

export const directionsUrl = (shop, origin) => {
  const c = getCoords(shop);
  const dest = c ? `${c.lat},${c.lng}` : encodeURIComponent([shop.name, addressLine(shop)].filter(Boolean).join(' '));
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}${origin ? `&origin=${origin.lat},${origin.lng}` : ''}&travelmode=driving`;
};
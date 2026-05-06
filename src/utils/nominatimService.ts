import { reverseGeocode } from '@/src/services/location';

export const getLocationFromCoordinates = async (
  lat: number,
  lng: number
): Promise<string | null> => {
  return reverseGeocode(lat, lng);
};
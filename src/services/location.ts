import * as Location from 'expo-location';

export interface LocationData {
  lat: number;
  lng: number;
  city?: string;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
    );
    const data = await response.json();
    return data.address?.city || data.address?.town || data.address?.village || null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

export const getLocationWithCity = async (): Promise<LocationData | null> => {
  const location = await getCurrentLocation();
  if (location) {
    const city = await reverseGeocode(location.lat, location.lng);
    return { ...location, city: city || undefined };
  }
  return null;
};
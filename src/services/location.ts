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

export type LocationPermissionResult =
  | { status: 'granted' }
  | { status: 'denied'; canAskAgain: boolean };

export const requestLocationPermissionStatus = async (): Promise<LocationPermissionResult> => {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.status === 'granted') {
    return { status: 'granted' };
  }

  if (!existing.canAskAgain) {
    return { status: 'denied', canAskAgain: false };
  }

  const requested = await Location.requestForegroundPermissionsAsync();
  if (requested.status === 'granted') {
    return { status: 'granted' };
  }

  return { status: 'denied', canAskAgain: requested.canAskAgain };
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
    // Prefer Expo's built-in reverse geocoding to avoid JSON parsing issues
    // from external providers that may return non-JSON responses.
    const places = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (places.length > 0) {
      const place = places[0];
      return place.city || place.subregion || place.region || null;
    }

    // Fallback to Nominatim only when native reverse geocoding has no result.
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      const raw = await response.text();
      console.error('Reverse geocode response was not JSON:', raw.slice(0, 120));
      return null;
    }

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
